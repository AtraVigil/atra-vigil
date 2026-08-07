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
  const w=p?.weekly_review;
  if(!w||typeof w!=="object"){e.push("weekly_review");return e;}
  if(!Number.isInteger(w.observed_session_count)||w.observed_session_count<1||w.observed_session_count>5)e.push("observed_session_count");
  if(!Array.isArray(w.daily_readings)||w.daily_readings.length!==w.observed_session_count)e.push("daily_readings");
  if(!Array.isArray(w.sector_profile)||w.sector_profile.length!==11)e.push("sector_profile");
  if(p.schema_version==="2.0"){
    if(!w.spy_range||![w.spy_range.high,w.spy_range.low,w.spy_range.close].every((x:any)=>Number.isFinite(Number(x))))e.push("spy_range");
    if(w.correlation_window_sessions!==30)e.push("correlation_window_sessions");
    const idx=w.index_profile;
    if(!idx||!["us","asia","europe"].every(k=>Array.isArray(idx[k])))e.push("index_profile");
    else if(idx.us.length+idx.asia.length+idx.europe.length!==10)e.push("index_profile_count");
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
function renderV2(p:any){
  const w=p.weekly_review;
  const dates=w.daily_readings.map((r:any)=>r.session_date);
  const dailyRows=w.daily_readings.map((r:any)=>[
    esc(dmy(r.session_date)),
    esc(`${r.aligned_count}/${r.denominator}`),
    esc(Number(r.spy_close).toFixed(2)),
    `<span style="color:${clr(r.spy_daily_change_percent)};font-weight:600">${pct(r.spy_daily_change_percent)}</span>`
  ]);
  const sectorRows=[
    ["<strong>S&P 500</strong>",...w.daily_readings.map((r:any)=>`<span style="color:${clr(r.spy_daily_change_percent)}">${pct(r.spy_daily_change_percent)}</span>`),`<strong style="color:${clr(w.spy_weekly_change_percent)}">${pct(w.spy_weekly_change_percent)}</strong>`,"—"],
    ...w.sector_profile.map((r:any)=>{
      const by=Object.fromEntries(r.daily_changes.map((x:any)=>[x.session_date,x.change_percent]));
      return [esc(r.sector),...dates.map((d:string)=>by[d]===undefined?"—":`<span style="color:${clr(by[d])}">${pct(by[d])}</span>`),`<span style="color:${clr(r.weekly_change_percent)}">${pct(r.weekly_change_percent)}</span>`,Number(r.correlation_30_session).toFixed(2)];
    })
  ];
  const indexTable=(title:string,rows:any[])=>{
    const allDates=Array.from(new Set(rows.flatMap((r:any)=>r.daily_changes.map((x:any)=>x.session_date)))).sort() as string[];
    const rr=rows.map((r:any)=>{
      const by=Object.fromEntries(r.daily_changes.map((x:any)=>[x.session_date,x.change_percent]));
      return [esc(r.name),...allDates.map(d=>by[d]===undefined?"—":`<span style="color:${clr(by[d])}">${pct(by[d])}</span>`),`<span style="color:${clr(r.weekly_change_percent)}">${pct(r.weekly_change_percent)}</span>`];
    });
    return `<h3 style="margin:16px 0 4px">${esc(title)}</h3>`+table(["Index",...allDates.map(dmy),"Weekly"],rr);
  };
  const text=[
    "Atra Structura Weekly Review",
    `Week: ${w.week_start_session} through ${w.week_end_session}`,
    `Observed Sessions: ${w.observed_session_count}`,
    `S&P 500 Weekly Change: ${pct(w.spy_weekly_change_percent)}`,
    `S&P 500 Range: High ${Number(w.spy_range.high).toFixed(2)} | Low ${Number(w.spy_range.low).toFixed(2)} | Close ${Number(w.spy_range.close).toFixed(2)}`,
    "",
    "Daily Sector-Confirmation Readings",
    ...w.daily_readings.map((r:any)=>`${dmy(r.session_date)} | ${r.aligned_count}/${r.denominator} | ${Number(r.spy_close).toFixed(2)} | ${pct(r.spy_daily_change_percent)}`),
    "",
    "Weekly Sector Profile",
    ...w.sector_profile.map((r:any)=>`${r.sector} | Weekly ${pct(r.weekly_change_percent)} | 30-Session Correlation ${Number(r.correlation_30_session).toFixed(2)}`),
    "",
    "Weekly Index Profile",
    ...["us","asia","europe"].flatMap(k=>w.index_profile[k].map((r:any)=>`${r.name} | Weekly ${pct(r.weekly_change_percent)}`)),
    "",
    w.copyright,
    w.disclosure
  ].join("\n");
  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:920px;margin:auto">
    <h1 style="font-size:22px;margin-bottom:8px">Atra Structura Weekly Review</h1>
    <div style="font-size:14px;line-height:1.6;margin-bottom:18px">
      <strong>Week:</strong> ${esc(dmy(w.week_start_session))} through ${esc(dmy(w.week_end_session))}<br>
      <strong>Observed Sessions:</strong> ${esc(w.observed_session_count)}<br>
      <strong>S&P 500 Weekly Change:</strong> <span style="color:${clr(w.spy_weekly_change_percent)};font-weight:600">${pct(w.spy_weekly_change_percent)}</span><br>
      <strong>S&P 500 Range:</strong> High ${Number(w.spy_range.high).toFixed(2)} | Low ${Number(w.spy_range.low).toFixed(2)} | Close ${Number(w.spy_range.close).toFixed(2)}
    </div>
    <h2 style="font-size:17px;margin:20px 0 6px">Daily Sector-Confirmation Readings</h2>
    ${table(["Session","Alignment","S&P 500 Close","Daily Change"],dailyRows)}
    <h2 style="font-size:17px;margin:20px 0 6px">Weekly Sector Profile</h2>
    ${table(["Sector",...dates.map(dmy),"Weekly","30-Session Correlation"],sectorRows)}
    <h2 style="font-size:17px;margin:20px 0 6px">Weekly Index Profile</h2>
    ${indexTable("U.S. Indexes",w.index_profile.us)}
    ${indexTable("Asia",w.index_profile.asia)}
    ${indexTable("Europe",w.index_profile.europe)}
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
  const secret=process.env.STRUCTURA_EMAIL_HMAC_SECRET||"";
  const skew=Number(process.env.STRUCTURA_EMAIL_MAX_CLOCK_SKEW_SECONDS||"300");
  const auth=verifyHmac({secret,timestamp:ts,rawBody:raw,suppliedSignature:sig,maxClockSkewSeconds:skew});
  if(!auth)return json({ok:false,error:"unauthorized"},401);
  let p:any; try{p=JSON.parse(raw);}catch{return json({ok:false,error:"invalid_request"},400);}
  const pre=evaluateDeliveryPreflight({payloadMode:p?.mode,configuredMode:process.env.STRUCTURA_EMAIL_MODE,enabled:process.env.STRUCTURA_EMAIL_ENABLED,suppliedIdempotencyKey:idem,snapshotId:p?.snapshot_id});
  if(pre)return json(pre.body,pre.status);
  const errs=validate(p); if(errs.length)return json({ok:false,error:"invalid_request",validation_errors:errs},400);
  const apiKey=process.env.RESEND_API_KEY, from=process.env.STRUCTURA_EMAIL_FROM, to=process.env.STRUCTURA_EMAIL_TO, replyTo=process.env.STRUCTURA_EMAIL_REPLY_TO;
  const recipients=parseRecipientList(to);
  if(!apiKey||!from||recipients.length===0||!replyTo)return json({ok:false,error:"server_configuration_error"},500);
  const {text,html}=render(p); const resend=new Resend(apiKey);
  try{
    const {data,error}=await resend.emails.send({from,to:recipients,replyTo,subject:p.subject,text,html},{idempotencyKey:idempotencyKey(p.snapshot_id)});
    if(error||!data?.id)return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);
    return json({ok:true,accepted:true,duplicate:false,delivery_status:"sent",snapshot_id:p.snapshot_id,provider_message_id:data.id,accepted_at:new Date().toISOString()},202);
  }catch{return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);}
}
export function GET(){return json({ok:false,error:"method_not_allowed"},405);}
export function PUT(){return json({ok:false,error:"method_not_allowed"},405);}
export function PATCH(){return json({ok:false,error:"method_not_allowed"},405);}
export function DELETE(){return json({ok:false,error:"method_not_allowed"},405);}
