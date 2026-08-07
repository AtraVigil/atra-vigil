import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { evaluateDeliveryPreflight, idempotencyKey, parseRecipientList, verifyHmac } from "@/lib/structuraEmail";

export const dynamic="force-dynamic";
export const runtime="nodejs";

function json(body:Record<string,unknown>,status:number){
  return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
}
function validate(p:any){
  const e:string[]=[];
  if(p?.schema_version!=="1.0")e.push("schema_version");
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
  if(typeof w.spy_weekly_change!=="string")e.push("spy_weekly_change");
  if(typeof w.disclosure!=="string"||!w.disclosure)e.push("disclosure");
  return e;
}
function esc(v:unknown){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function render(p:any){
  const w=p.weekly_review;
  const dailyText=w.daily_readings.map((r:any)=>`${r.session_date}: ${r.confirmation} (${r.aligned_count}/${r.denominator}), S&P 500 close ${r.spy_close}`).join("\n");
  const sectorText=w.sector_profile.map((r:any)=>`${r.sector}: ${r.aligned_sessions}/${r.observed_sessions}`).join("\n");
  const text=["Atra Structura Weekly Review","",`Week: ${w.week_start_session} through ${w.week_end_session}`,`Observed sessions: ${w.observed_session_count}`,`S&P 500 weekly change: ${w.spy_weekly_change}`,"","Daily sector-confirmation readings",dailyText,"","Weekly sector profile",sectorText,"",w.disclosure].join("\n");
  const dr=w.daily_readings.map((r:any)=>`<tr><td>${esc(r.session_date)}</td><td>${esc(r.confirmation)}</td><td>${esc(r.aligned_count)}/${esc(r.denominator)}</td><td>${esc(r.spy_close)}</td></tr>`).join("");
  const sr=w.sector_profile.map((r:any)=>`<tr><td>${esc(r.sector)}</td><td>${esc(r.aligned_sessions)}/${esc(r.observed_sessions)}</td></tr>`).join("");
  const html=`<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.45;color:#111"><h2>Atra Structura Weekly Review</h2><p><strong>Week:</strong> ${esc(w.week_start_session)} through ${esc(w.week_end_session)}<br><strong>Observed sessions:</strong> ${esc(w.observed_session_count)}<br><strong>S&amp;P 500 weekly change:</strong> ${esc(w.spy_weekly_change)}</p><h3>Daily sector-confirmation readings</h3><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Session</th><th>Confirmation</th><th>Alignment</th><th>S&amp;P 500 close</th></tr></thead><tbody>${dr}</tbody></table><h3>Weekly sector profile</h3><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Sector</th><th>Aligned sessions</th></tr></thead><tbody>${sr}</tbody></table><p style="font-size:12px">${esc(w.disclosure)}</p></body></html>`;
  return {text,html};
}

export async function POST(request:NextRequest){
  const raw=await request.text();
  const ts=request.headers.get("x-structura-timestamp")??"";
  const sig=request.headers.get("x-structura-signature")??"";
  const src=request.headers.get("x-structura-source")??"";
  const idem=request.headers.get("x-structura-idempotency-key")??"";
  const secret=process.env.STRUCTURA_EMAIL_AUTH_SECRET??"";
  const skew=Number(process.env.STRUCTURA_EMAIL_MAX_CLOCK_SKEW_SECONDS??"300");
  const auth=src==="AtraVigilV3"&&Number.isFinite(skew)&&verifyHmac({secret,timestamp:ts,rawBody:raw,suppliedSignature:sig,maxClockSkewSeconds:skew});
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
