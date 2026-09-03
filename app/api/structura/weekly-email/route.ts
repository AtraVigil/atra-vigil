import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { evaluateDeliveryPreflight, idempotencyKey, parseRecipientList, verifyHmac } from "@/lib/structuraEmail";

export const dynamic="force-dynamic";
export const runtime="nodejs";

function json(body:Record<string,unknown>,status:number){return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});}
function esc(v:unknown){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function pct(v:unknown){const n=Number(v); return `${n>=0?"+":""}${n.toFixed(2)}%`;}
function clr(v:unknown){const n=Number(v); return n>0?"#14833b":n<0?"#c62828":"#555";}
function dmy(s:string){const [y,m,d]=s.split("-");return `${Number(m)}-${Number(d)}-${String(y).slice(-2)}`;}
function validate(p:any){
  const e:string[]=[];
  if(!["1.0","2.0"].includes(p?.schema_version))e.push("schema_version");
  if(p?.source!=="AtraVigilV3")e.push("source");
  if(p?.product!=="Atra Structura")e.push("product");
  if(p?.mode!=="PARALLEL")e.push("mode");
  if(p?.delivery_type!=="weekly_review")e.push("delivery_type");
  if(typeof p?.snapshot_id!=="string"||!p.snapshot_id.startsWith("AV3-PARALLEL-WEEKLY-"))e.push("snapshot_id");
  if(typeof p?.subject!=="string"||!p.subject)e.push("subject");
  if(p?.recipients!==undefined&&(!Array.isArray(p.recipients)||p.recipients.some((x:any)=>typeof x!=="string"||!x.includes("@"))))e.push("recipients");
  if(p?.recipient_mode!==undefined&&p.recipient_mode!=="PAYLOAD_ONLY_TEST")e.push("recipient_mode");
  if(p?.recipient_mode==="PAYLOAD_ONLY_TEST"&&(!Array.isArray(p.recipients)||p.recipients.length!==1))e.push("payload_only_test_recipient");
  if(p?.attachment!==undefined){
    if(!p.attachment||typeof p.attachment!=="object"||typeof p.attachment.filename!=="string"||typeof p.attachment.content_base64!=="string"||p.attachment.content_type!=="application/pdf")e.push("attachment");
  }
  const w=p?.weekly_review;
  if(!w||typeof w!=="object"){e.push("weekly_review");return e;}
  if(!Number.isInteger(w.observed_session_count)||w.observed_session_count<1||w.observed_session_count>5)e.push("observed_session_count");
  if(!Array.isArray(w.daily_readings)||w.daily_readings.length!==w.observed_session_count)e.push("daily_readings");
  if(!Array.isArray(w.sector_profile)||w.sector_profile.length!==11)e.push("sector_profile");
  if(p.schema_version==="2.0"){
    if(!w.spy_range||![w.spy_range.high,w.spy_range.low,w.spy_range.close].every((x:any)=>Number.isFinite(Number(x))))e.push("spy_range");
    if(w.correlation_window_sessions!==30)e.push("correlation_window_sessions");
    const fx=w.foreign_exchange;
    if(!fx||typeof fx!=="object"||!Array.isArray(fx.pairs)||fx.pairs.length!==7)e.push("foreign_exchange");
    const idx=w.index_profile;
    if(!idx||!["us","asia","europe"].every(k=>Array.isArray(idx[k])))e.push("index_profile");
    else {
      const required:any={us:new Set(["^GSPC","^IXIC","^DJI","^RUT"]),asia:new Set(["^N225","^HSI","^KS11","^TWII","^STI","^NSEI","^AXJO"]),europe:new Set(["^FTSE","^GDAXI","^FCHI","^STOXX50E","FTSEMIB.MI","^IBEX","^SSMI","^AEX"])};
      const seen=new Set<string>();
      for(const k of ["us","asia","europe"]){
        const symbols=idx[k].map((r:any)=>r?.symbol);
        if(symbols.some((x:any)=>typeof x!=="string"||!x||seen.has(x)))e.push("index_profile_identity");
        symbols.forEach((x:string)=>seen.add(x));
        for(const symbol of required[k]) if(!symbols.includes(symbol)) e.push(`index_profile_missing_${symbol}`);
      }
    }
    if(!w.fed_rates||typeof w.fed_rates!=="object")e.push("fed_rates");
    if(!w.next_week_calendar||typeof w.next_week_calendar!=="object")e.push("next_week_calendar");
    else if(!w.fed_rates.series||typeof w.fed_rates.series!=="object")e.push("fed_rates_series");
    if(typeof w.copyright!=="string"||!w.copyright)e.push("copyright");
  }
  if(typeof w.disclosure!=="string"||!w.disclosure)e.push("disclosure");
  return e;
}
function table(headers:string[],rows:string[][]){
  const th=headers.map(h=>`<th style="padding:7px 8px;border-bottom:1px solid #ccc;text-align:right;font-size:12px;white-space:nowrap">${esc(h)}</th>`).join("");
  const body=rows.map(r=>`<tr>${r.map((c,i)=>`<td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:${i===0?"left":"right"};font-size:13px;white-space:nowrap">${c}</td>`).join("")}</tr>`).join("");
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0 22px"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}
function publicIndexLabel(r:any){
  const bySymbol:Record<string,string>={
    "^N225":"Nikkei 225 (Japan)",
    "^HSI":"Hang Seng (Hong Kong)",
    "^KS11":"KOSPI (South Korea)",
    "^TWII":"TAIEX (Taiwan)",
    "^STI":"Straits Times Index (Singapore)",
    "^NSEI":"Nifty 50 (India)",
    "^AXJO":"ASX 200 (Australia)",
    "^FTSE":"FTSE 100 (United Kingdom)",
    "^GDAXI":"DAX (Germany)",
    "^FCHI":"CAC 40 (France)",
    "^STOXX50E":"EURO STOXX 50 (Eurozone)",
    "FTSEMIB.MI":"FTSE MIB (Italy)",
    "^IBEX":"IBEX 35 (Spain)",
    "^SSMI":"SMI (Switzerland)",
    "^AEX":"AEX (Netherlands)",
  };
  return bySymbol[String(r?.symbol??"")] ?? String(r?.name??"");
}
function renderV2(p:any){
  const w=p.weekly_review;
  const publicSp500=w.index_profile?.us?.find((r:any)=>r?.name==="S&P 500");
  if(!publicSp500||!Array.isArray(publicSp500.daily_changes)) throw new Error("public_sp500_missing");
  const publicSp500ByDate=Object.fromEntries(publicSp500.daily_changes.map((x:any)=>[x.session_date,x.change_percent]));
  const timeEt=(v:any)=>{const x=String(v??"").trim();const m=x.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);return m?`${m[1].padStart(2,"0")}:${m[2]} ${m[3].toUpperCase()}`:x;};
  const dates=w.daily_readings.map((r:any)=>r.session_date);
  const dailyRows=w.daily_readings.map((r:any)=>[
    esc(dmy(r.session_date)),
    esc(`${r.aligned_count}/${r.denominator}`),
    `<span style="color:${clr(publicSp500ByDate[r.session_date])};font-weight:600">${pct(publicSp500ByDate[r.session_date])}</span>`
  ]);
  const sectorRows=[
    ["<strong>S&P 500</strong>",...dates.map((d:string)=>`<span style="color:${clr(publicSp500ByDate[d])}">${pct(publicSp500ByDate[d])}</span>`),`<strong style="color:${clr(publicSp500.weekly_change_percent)}">${pct(publicSp500.weekly_change_percent)}</strong>`,"—"],
    ...w.sector_profile.map((r:any)=>{
      const by=Object.fromEntries(r.daily_changes.map((x:any)=>[x.session_date,x.change_percent]));
      return [esc(r.sector),...dates.map((d:string)=>by[d]===undefined?"—":`<span style="color:${clr(by[d])}">${pct(by[d])}</span>`),`<span style="color:${clr(r.weekly_change_percent)}">${pct(r.weekly_change_percent)}</span>`,Number(r.correlation_30_session).toFixed(2)];
    })
  ];
  const indexTable=(title:string,rows:any[])=>{
    const allDates=Array.from(new Set(rows.flatMap((r:any)=>r.daily_changes.map((x:any)=>x.session_date)))).sort() as string[];
    const rr=rows.map((r:any)=>{
      const by=Object.fromEntries(r.daily_changes.map((x:any)=>[x.session_date,x.change_percent]));
      const holidays=new Set((r.market_holidays??[]).map((x:any)=>x.session_date));
      return [esc(publicIndexLabel(r)),...allDates.map(d=>by[d]===undefined?(holidays.has(d)?'<span style="color:#666">Market Holiday</span>':"—"):`<span style="color:${clr(by[d])}">${pct(by[d])}</span>`),`<span style="color:${clr(r.weekly_change_percent)}">${pct(r.weekly_change_percent)}</span>`];
    });
    return `<h3 style="margin:16px 0 4px">${esc(title)}</h3>`+table(["Index",...allDates.map(dmy),"Weekly"],rr);
  };
  const cal=w.next_week_calendar;
  const fr=w.fed_rates;
  const fs=fr.series;
  const lm=fr.last_policy_move;
  const fedText=[
    `Policy Status: ${fr.policy_phase}`,
    `Last Policy Move: ${lm.type} ${Number(lm.change_bp)>=0?"+":""}${Number(lm.change_bp).toFixed(0)} bp on ${lm.date}`,
    `Effective Federal Funds Rate: ${Number(fs.effective_federal_funds_rate.latest_percent).toFixed(2)}% | Weekly ${Number(fs.effective_federal_funds_rate.weekly_change_bp)>=0?"+":""}${Number(fs.effective_federal_funds_rate.weekly_change_bp).toFixed(1)} bp | Observation ${fs.effective_federal_funds_rate.latest_observation_date}`,
    `2-Year Treasury: ${Number(fs["2_year_treasury"].latest_percent).toFixed(2)}% | Weekly ${Number(fs["2_year_treasury"].weekly_change_bp)>=0?"+":""}${Number(fs["2_year_treasury"].weekly_change_bp).toFixed(1)} bp | Observation ${fs["2_year_treasury"].latest_observation_date}`,
    `10-Year Treasury: ${Number(fs["10_year_treasury"].latest_percent).toFixed(2)}% | Weekly ${Number(fs["10_year_treasury"].weekly_change_bp)>=0?"+":""}${Number(fs["10_year_treasury"].weekly_change_bp).toFixed(1)} bp | Observation ${fs["10_year_treasury"].latest_observation_date}`,
    `2s10s Spread: ${Number(fs["2s10s_spread"].latest_bp)>=0?"+":""}${Number(fs["2s10s_spread"].latest_bp).toFixed(1)} bp | Weekly ${Number(fs["2s10s_spread"].weekly_change_bp)>=0?"+":""}${Number(fs["2s10s_spread"].weekly_change_bp).toFixed(1)} bp | Observation ${fs["2s10s_spread"].latest_observation_date}`
  ];
  const fedRows=[
    ["Effective Federal Funds Rate",`${Number(fs.effective_federal_funds_rate.latest_percent).toFixed(2)}%`,`${Number(fs.effective_federal_funds_rate.weekly_change_bp)>=0?"+":""}${Number(fs.effective_federal_funds_rate.weekly_change_bp).toFixed(1)} bp`,esc(fs.effective_federal_funds_rate.latest_observation_date)],
    ["2-Year Treasury",`${Number(fs["2_year_treasury"].latest_percent).toFixed(2)}%`,`${Number(fs["2_year_treasury"].weekly_change_bp)>=0?"+":""}${Number(fs["2_year_treasury"].weekly_change_bp).toFixed(1)} bp`,esc(fs["2_year_treasury"].latest_observation_date)],
    ["10-Year Treasury",`${Number(fs["10_year_treasury"].latest_percent).toFixed(2)}%`,`${Number(fs["10_year_treasury"].weekly_change_bp)>=0?"+":""}${Number(fs["10_year_treasury"].weekly_change_bp).toFixed(1)} bp`,esc(fs["10_year_treasury"].latest_observation_date)],
    ["2s10s Spread",`${Number(fs["2s10s_spread"].latest_bp)>=0?"+":""}${Number(fs["2s10s_spread"].latest_bp).toFixed(1)} bp`,`${Number(fs["2s10s_spread"].weekly_change_bp)>=0?"+":""}${Number(fs["2s10s_spread"].weekly_change_bp).toFixed(1)} bp`,esc(fs["2s10s_spread"].latest_observation_date)]
  ];
  const text=[
    "Atra Structura Weekly Review",
    `Week: ${w.week_start_session} through ${w.week_end_session}`,
    `Observed Sessions: ${w.observed_session_count}`,
    `S&P 500 Weekly Change: ${pct(publicSp500.weekly_change_percent)}`,
    "",
    "Daily Sector ETF Confirmation",
    ...w.daily_readings.map((r:any)=>`${dmy(r.session_date)} | ${r.aligned_count}/${r.denominator} | ${pct(publicSp500ByDate[r.session_date])}`),
    "",
    "Weekly Sector ETF Profile",
    ...w.sector_profile.map((r:any)=>`${r.sector} | Weekly ${pct(r.weekly_change_percent)} | 30-Session Correlation ${Number(r.correlation_30_session).toFixed(2)}`),
    "",
    "Weekly Index Profile",
    ...["us","asia","europe"].flatMap(k=>w.index_profile[k].flatMap((r:any)=>[
      `${publicIndexLabel(r)} | Weekly ${pct(r.weekly_change_percent)}`,
      ...(r.market_holidays??[]).map((h:any)=>`${publicIndexLabel(r)} | ${dmy(h.session_date)} | Market Holiday`)
    ])),
    "",
    "Foreign Exchange",
    `Observation Boundary: ${w.foreign_exchange.start_observation_date} -> ${w.foreign_exchange.end_observation_date}`,
    ...w.foreign_exchange.pairs.map((r:any)=>`${r.pair}: ${Number(r.start_rate).toPrecision(6)} -> ${Number(r.end_rate).toPrecision(6)} | ${pct(r.change_percent)}`),
    "",
    "Federal Reserve & Rates",
    ...fedText,
    "",
    "Next Week — Economic Calendar",
    ...cal.events.map((e:any)=>`${e.date} | ${timeEt(e.time_et)} ET | ${e.agency} | ${e.event}`),
    "",
    w.copyright,
    w.disclosure
  ].join("\n");
  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:920px;margin:auto">
    <h1 style="font-size:22px;margin-bottom:8px">Atra Structura Weekly Review</h1>
    <div style="font-size:14px;line-height:1.6;margin-bottom:18px">
      <strong>Week:</strong> ${esc(dmy(w.week_start_session))} through ${esc(dmy(w.week_end_session))}<br>
      <strong>Observed Sessions:</strong> ${esc(w.observed_session_count)}<br>
      <strong>S&P 500 Weekly Change:</strong> <span style="color:${clr(publicSp500.weekly_change_percent)};font-weight:600">${pct(publicSp500.weekly_change_percent)}</span><br>

    </div>
    <h2 style="font-size:17px;margin:20px 0 6px">Daily Sector ETF Confirmation</h2>
    ${table(["Session","Alignment","S&P 500 Daily Change"],dailyRows)}
    <h2 style="font-size:17px;margin:20px 0 6px">Weekly Sector ETF Profile</h2>
    ${table(["Sector ETF",...dates.map(dmy),"Weekly","30-Session Correlation"],sectorRows)}
    <h2 style="font-size:17px;margin:20px 0 6px">Weekly Index Profile</h2>
    ${indexTable("U.S. Indexes",w.index_profile.us)}
    ${indexTable("Asia-Pacific",w.index_profile.asia)}
    ${indexTable("Europe",w.index_profile.europe)}
    <h2 style="font-size:17px;margin:20px 0 6px">Foreign Exchange</h2>
    <div style="font-size:12px;color:#666;margin-bottom:8px">Observation Boundary: ${esc(w.foreign_exchange.start_observation_date)} -> ${esc(w.foreign_exchange.end_observation_date)}</div>
    ${table(["Pair","Start","End","Change"],w.foreign_exchange.pairs.map((r:any)=>[esc(r.pair),esc(Number(r.start_rate).toPrecision(6)),esc(Number(r.end_rate).toPrecision(6)),`<span style="color:${clr(r.change_percent)}">${pct(r.change_percent)}</span>`]))}
    <h2 style="font-size:17px;margin:20px 0 6px">Federal Reserve & Rates</h2>
    <div style="font-size:13px;line-height:1.6;margin:0 0 8px"><strong>Policy Status:</strong> ${esc(fr.policy_phase)}<br><strong>Last Policy Move:</strong> ${esc(lm.type)} ${Number(lm.change_bp)>=0?"+":""}${Number(lm.change_bp).toFixed(0)} bp on ${esc(lm.date)}</div>
    ${table(["Series","Latest","Weekly Change","Observation Date"],fedRows)}
    <div style="font-size:11px;color:#666;margin:-10px 0 18px">Sources: Federal Reserve Board H.15 / U.S. Treasury constant-maturity series and Federal Reserve Bank of New York, accessed via FRED. 2s10s calculated by Atra Structura.</div>
    <h2 style="font-size:17px;margin:20px 0 6px">Next Week — Economic Calendar</h2>
    ${table(["Date","Time ET","Agency","Official Release / Fed Event"],cal.events.map((e:any)=>[esc(e.date),esc(timeEt(e.time_et)),esc(e.agency),esc(e.event)]))}
    <div style="font-size:11px;color:#666;margin:-10px 0 18px">Official agency schedules only. No consensus forecasts or expected market-impact labels.</div>
    <div style="font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:14px;margin-top:22px">${esc(w.copyright)}<br>${esc(w.disclosure)}</div>
  </div>`;
  return {text,html};
}
function renderV1(p:any){
  const w=p.weekly_review;
  const text=["Atra Structura Weekly Review","",`Week: ${w.week_start_session} through ${w.week_end_session}`,`Observed sessions: ${w.observed_session_count}`,`S&P 500 weekly change: ${w.spy_weekly_change}`,"",w.disclosure].join("\n");
  const html=`<div style="font-family:Arial,sans-serif"><h1>Atra Structura Weekly Review</h1><p><b>Week:</b> ${esc(w.week_start_session)} through ${esc(w.week_end_session)}<br><b>Observed sessions:</b> ${esc(w.observed_session_count)}<br><b>S&P 500 weekly change:</b> ${esc(w.spy_weekly_change)}</p><p>${esc(w.disclosure)}</p></div>`;
  return {text,html};
}
function render(p:any){return p.schema_version==="2.0"?renderV2(p):renderV1(p);}
export async function POST(req:NextRequest){
  const raw=await req.text();
  const sig=req.headers.get("x-structura-signature")||"";
  const ts=req.headers.get("x-structura-timestamp")||"";
  const idem=req.headers.get("x-structura-idempotency-key")||"";
  const secret=process.env.STRUCTURA_EMAIL_AUTH_SECRET||"";
  const skew=Number(process.env.STRUCTURA_EMAIL_MAX_CLOCK_SKEW_SECONDS||"300");
  const auth=verifyHmac({secret,timestamp:ts,rawBody:raw,suppliedSignature:sig,maxClockSkewSeconds:skew});
  if(!auth)return json({ok:false,error:"unauthorized"},401);
  let p:any; try{p=JSON.parse(raw);}catch{return json({ok:false,error:"invalid_request"},400);}
  const pre=evaluateDeliveryPreflight({payloadMode:p?.mode,configuredMode:process.env.STRUCTURA_EMAIL_MODE,enabled:process.env.STRUCTURA_EMAIL_ENABLED,suppliedIdempotencyKey:idem,snapshotId:p?.snapshot_id});
  if(pre)return json(pre.body,pre.status);
  const errs=validate(p); if(errs.length)return json({ok:false,error:"invalid_request",validation_errors:errs},400);
  const apiKey=process.env.RESEND_API_KEY, from=process.env.STRUCTURA_EMAIL_FROM, to=process.env.STRUCTURA_WEEKLY_EMAIL_TO ?? process.env.STRUCTURA_EMAIL_TO, replyTo=process.env.STRUCTURA_EMAIL_REPLY_TO;
  const configuredRecipients=parseRecipientList(to);
  const payloadRecipients=Array.isArray(p.recipients)?p.recipients.map((x:any)=>String(x).trim()).filter(Boolean):[];
  const recipients=p.recipient_mode==="PAYLOAD_ONLY_TEST" ? Array.from(new Set(payloadRecipients)) : Array.from(new Set([...configuredRecipients,...payloadRecipients]));
  if(!apiKey||!from||recipients.length===0||!replyTo)return json({ok:false,error:"server_configuration_error"},500);
  const {text,html}=render(p); const resend=new Resend(apiKey);
  try{
    const attachments=p.attachment?[{filename:p.attachment.filename,content:Buffer.from(p.attachment.content_base64,"base64")}]:undefined;
    const {data,error}=await resend.emails.send({from,to:recipients,replyTo,subject:p.subject,text,html,attachments},{idempotencyKey:idempotencyKey(p.snapshot_id)});
    if(error||!data?.id)return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);
    return json({ok:true,accepted:true,duplicate:false,delivery_status:"sent",snapshot_id:p.snapshot_id,provider_message_id:data.id,accepted_at:new Date().toISOString()},202);
  }catch{return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);}
}
export function GET(){return json({ok:false,error:"method_not_allowed",weekly_route_version:"2026-08-15-weekly-v3"},405);}
export function PUT(){return json({ok:false,error:"method_not_allowed"},405);}
export function PATCH(){return json({ok:false,error:"method_not_allowed"},405);}
export function DELETE(){return json({ok:false,error:"method_not_allowed"},405);}
