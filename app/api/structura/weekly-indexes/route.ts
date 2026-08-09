import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MARKETS = [
  { group:"us", name:"S&P 500", symbol:"^GSPC", tz:"America/New_York" },
  { group:"us", name:"Nasdaq Composite", symbol:"^IXIC", tz:"America/New_York" },
  { group:"us", name:"Dow Jones Industrial Average", symbol:"^DJI", tz:"America/New_York" },
  { group:"us", name:"Russell 2000", symbol:"^RUT", tz:"America/New_York" },
  { group:"asia", name:"ASX 200", symbol:"^AXJO", tz:"Australia/Sydney" },
  { group:"asia", name:"Nikkei 225", symbol:"^N225", tz:"Asia/Tokyo" },
  { group:"europe", name:"FTSE 100", symbol:"^FTSE", tz:"Europe/London" },
  { group:"europe", name:"DAX", symbol:"^GDAXI", tz:"Europe/Berlin" },
  { group:"europe", name:"CAC 40", symbol:"^FCHI", tz:"Europe/Paris" },
  { group:"europe", name:"EURO STOXX 50", symbol:"^STOXX50E", tz:"Europe/Zurich" },
] as const;

function json(body:unknown,status=200){
  return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
}
function localDate(epoch:number,tz:string){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(epoch*1000));
  const g=(t:string)=>parts.find(p=>p.type===t)?.value||"";
  return `${g("year")}-${g("month")}-${g("day")}`;
}
async function fetchMarket(m:(typeof MARKETS)[number], requestedRange:"2mo"|"5y"|"2021_2026H1"|"2020Q4_2026H1"="2mo"){
  const historyQuery = requestedRange === "2020Q4_2026H1"
    ? `period1=${Math.floor(Date.UTC(2020,11,1)/1000)}&period2=${Math.floor(Date.UTC(2026,6,1)/1000)}`
    : requestedRange === "2021_2026H1"
    ? `period1=${Math.floor(Date.UTC(2021,0,1)/1000)}&period2=${Math.floor(Date.UTC(2026,6,1)/1000)}`
    : `range=${requestedRange}`;
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.symbol)}?interval=1d&${historyQuery}&events=history`;
  const r=await fetch(url,{cache:"no-store",headers:{"User-Agent":"Mozilla/5.0"}});
  if(!r.ok) throw new Error(`chart_http_${r.status}_${m.symbol}`);
  const j=await r.json();
  const result=j?.chart?.result?.[0];
  const ts:number[]=result?.timestamp||[];
  const q=result?.indicators?.quote?.[0]||{};
  if(!Array.isArray(ts)||!Array.isArray(q.close)) throw new Error(`chart_shape_${m.symbol}`);
  const rows=ts.map((t:number,i:number)=>({
    date:localDate(t,m.tz),
    open:q.open?.[i] ?? null,
    high:q.high?.[i] ?? null,
    low:q.low?.[i] ?? null,
    close:q.close?.[i] ?? null,
  })).filter((x:any)=>[x.open,x.high,x.low,x.close].every((v:any)=>typeof v==="number"&&Number.isFinite(v)));
  if(rows.length<10) throw new Error(`insufficient_rows_${m.symbol}`);
  const outputRows = requestedRange === "2020Q4_2026H1"
    ? rows.filter((row:any) => row.date >= "2020-12-01" && row.date <= "2026-06-30")
    : requestedRange === "2021_2026H1"
    ? rows.filter((row:any) => row.date >= "2021-01-01" && row.date <= "2026-06-30")
    : rows;
  return {group:m.group,name:m.name,symbol:m.symbol,exchange_timezone:m.tz,rows:outputRows};
}

export async function GET(req:NextRequest){
  const params = new URL(req.url).searchParams;
  const requestedRange:"2mo"|"5y"|"2021_2026H1"|"2020Q4_2026H1" =
    params.get("history_window") === "2020Q4_2026H1" ? "2020Q4_2026H1" :
    params.get("history_window") === "2021_2026H1" ? "2021_2026H1" :
    params.get("history_range") === "5y" ? "5y" : "2mo";
  if(req.nextUrl.searchParams.get("mode")!=="PARALLEL") return json({ok:false,error:"parallel_mode_required"},403);
  if(process.env.STRUCTURA_EMAIL_MODE && process.env.STRUCTURA_EMAIL_MODE!=="PARALLEL") return json({ok:false,error:"environment_not_parallel"},403);
  try{
    const markets=[];
    for(const m of MARKETS) markets.push(await fetchMarket(m, requestedRange));
    return json({
      ok:true,
      authoritative:false,
      production_eligible:false,
      predictive_claim:false,
      report_type:"WEEKLY_COMPLETED_INDEX_HISTORY_PARALLEL",
      generated_at:new Date().toISOString(),
      market_count:markets.length,
      markets
    },200);
  }catch(e:any){
    return json({ok:false,error:"index_history_unavailable",detail:String(e?.message||e)},502);
  }
}
export function POST(){return json({ok:false,error:"method_not_allowed"},405);}
export function PUT(){return json({ok:false,error:"method_not_allowed"},405);}
export function PATCH(){return json({ok:false,error:"method_not_allowed"},405);}
export function DELETE(){return json({ok:false,error:"method_not_allowed"},405);}
