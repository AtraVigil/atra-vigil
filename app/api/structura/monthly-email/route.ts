import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { evaluateDeliveryPreflight, idempotencyKey, parseRecipientList, verifyHmac } from "@/lib/structuraEmail";

export const dynamic="force-dynamic";
export const runtime="nodejs";

function json(body:Record<string,unknown>,status:number){
  return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
}
function esc(v:unknown){
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function validate(p:any){
  const e:string[]=[];
  if(p?.schema_version!=="1.0") e.push("schema_version");
  if(p?.source!=="AtraVigilV3") e.push("source");
  if(p?.product!=="Atra Structura") e.push("product");
  if(p?.mode!=="PARALLEL") e.push("mode");
  if(p?.delivery_type!=="monthly_review") e.push("delivery_type");
  if(typeof p?.snapshot_id!=="string"||!p.snapshot_id.startsWith("AV3-PARALLEL-MONTHLY-")) e.push("snapshot_id");
  if(typeof p?.subject!=="string"||!p.subject) e.push("subject");
  if(typeof p?.month!=="string"||!/^\d{4}-\d{2}$/.test(p.month)) e.push("month");
  if(typeof p?.period_start!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(p.period_start)) e.push("period_start");
  if(typeof p?.period_end!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(p.period_end)) e.push("period_end");
  if(p?.recipients!==undefined&&(!Array.isArray(p.recipients)||p.recipients.some((x:any)=>typeof x!=="string"||!x.includes("@")))) e.push("recipients");
  if(p?.recipient_mode!==undefined&&p.recipient_mode!=="PAYLOAD_ONLY_TEST") e.push("recipient_mode");
  if(p?.recipient_mode==="PAYLOAD_ONLY_TEST"&&(!Array.isArray(p.recipients)||p.recipients.length!==1)) e.push("payload_only_test_recipient");
  const a=p?.attachment;
  if(!a||typeof a!=="object"||typeof a.filename!=="string"||typeof a.content_base64!=="string"||a.content_type!=="application/pdf") e.push("attachment");
  if(typeof p?.disclosure!=="string"||!p.disclosure) e.push("disclosure");
  return e;
}

export async function POST(req:NextRequest){
  const raw=await req.text();
  const sig=req.headers.get("x-structura-signature")||"";
  const ts=req.headers.get("x-structura-timestamp")||"";
  const idem=req.headers.get("x-structura-idempotency-key")||"";
  const secret=process.env.STRUCTURA_EMAIL_AUTH_SECRET||"";
  const skew=Number(process.env.STRUCTURA_EMAIL_MAX_CLOCK_SKEW_SECONDS||"300");
  const auth=verifyHmac({secret,timestamp:ts,rawBody:raw,suppliedSignature:sig,maxClockSkewSeconds:skew});
  if(!auth) return json({ok:false,error:"unauthorized"},401);

  let p:any;
  try{p=JSON.parse(raw);}catch{return json({ok:false,error:"invalid_request"},400);}

  const pre=evaluateDeliveryPreflight({
    payloadMode:p?.mode,
    configuredMode:process.env.STRUCTURA_EMAIL_MODE,
    enabled:process.env.STRUCTURA_EMAIL_ENABLED,
    suppliedIdempotencyKey:idem,
    snapshotId:p?.snapshot_id
  });
  if(pre) return json(pre.body,pre.status);

  const errs=validate(p);
  if(errs.length) return json({ok:false,error:"invalid_request",validation_errors:errs},400);

  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.STRUCTURA_EMAIL_FROM;
  const configuredTo=process.env.STRUCTURA_MONTHLY_EMAIL_TO ?? "";
  const replyTo=process.env.STRUCTURA_EMAIL_REPLY_TO;

  const configuredRecipients=parseRecipientList(configuredTo);
  const payloadRecipients=Array.isArray(p.recipients)?p.recipients.map((x:any)=>String(x).trim()).filter(Boolean):[];
  const recipients=p.recipient_mode==="PAYLOAD_ONLY_TEST"
    ? Array.from(new Set(payloadRecipients))
    : Array.from(new Set([...configuredRecipients,...payloadRecipients]));

  if(!apiKey||!from||recipients.length===0||!replyTo){
    return json({ok:false,error:"server_configuration_error"},500);
  }

  const text=[
    "Atra Structura Monthly Review",
    `Month: ${p.month}`,
    `Period: ${p.period_start} through ${p.period_end}`,
    "",
    "The completed monthly review is attached as a PDF.",
    "",
    p.disclosure
  ].join("\n");

  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:720px;margin:auto">
    <h1 style="font-size:22px;margin-bottom:8px">Atra Structura Monthly Review</h1>
    <p style="font-size:14px;line-height:1.6"><strong>Month:</strong> ${esc(p.month)}<br>
    <strong>Period:</strong> ${esc(p.period_start)} through ${esc(p.period_end)}</p>
    <p style="font-size:14px;line-height:1.6">The completed monthly review is attached as a PDF.</p>
    <div style="font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:14px;margin-top:22px">${esc(p.disclosure)}</div>
  </div>`;

  const resend=new Resend(apiKey);
  try{
    const attachments=[{
      filename:p.attachment.filename,
      content:Buffer.from(p.attachment.content_base64,"base64")
    }];
    const {data,error}=await resend.emails.send(
      {from,to:recipients,replyTo,subject:p.subject,text,html,attachments},
      {idempotencyKey:idempotencyKey(p.snapshot_id)}
    );
    if(error||!data?.id){
      return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);
    }
    return json({
      ok:true,accepted:true,duplicate:false,delivery_status:"sent",
      snapshot_id:p.snapshot_id,provider_message_id:data.id,
      accepted_at:new Date().toISOString()
    },202);
  }catch{
    return json({ok:false,error:"provider_failure",snapshot_id:p.snapshot_id,retryable:true},502);
  }
}

export function GET(){return json({ok:false,error:"method_not_allowed",monthly_route_version:"2026-09-05-monthly-v1"},405);}
export function PUT(){return json({ok:false,error:"method_not_allowed"},405);}
export function PATCH(){return json({ok:false,error:"method_not_allowed"},405);}
export function DELETE(){return json({ok:false,error:"method_not_allowed"},405);}
