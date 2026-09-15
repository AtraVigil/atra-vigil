#!/usr/bin/env python3
import argparse, json, math, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

MARKETS = [
{"key":"nikkei","name":"Nikkei 225","symbol":"^N225","region":"Japan","flag":"JP","tz":"Asia/Tokyo","wave":"wave1"},
{"key":"asx200","name":"ASX 200","symbol":"^AXJO","region":"Australia","flag":"AU","tz":"Australia/Sydney","wave":"wave1"},
{"key":"hangseng","name":"Hang Seng","symbol":"^HSI","region":"Hong Kong","flag":"HK","tz":"Asia/Hong_Kong","wave":"wave2"},
{"key":"kospi","name":"KOSPI","symbol":"^KS11","region":"South Korea","flag":"KR","tz":"Asia/Seoul","wave":"wave2"},
{"key":"taiex","name":"TAIEX","symbol":"^TWII","region":"Taiwan","flag":"TW","tz":"Asia/Taipei","wave":"wave2"},
{"key":"sti","name":"Straits Times Index","symbol":"^STI","region":"Singapore","flag":"SG","tz":"Asia/Singapore","wave":"wave2"},
{"key":"nifty50","name":"Nifty 50","symbol":"^NSEI","region":"India","flag":"IN","tz":"Asia/Kolkata","wave":"wave2"},
{"key":"ftse","name":"FTSE 100","symbol":"^FTSE","region":"United Kingdom","flag":"UK","tz":"Europe/London","wave":"wave3"},
{"key":"dax","name":"DAX","symbol":"^GDAXI","region":"Germany","flag":"DE","tz":"Europe/Berlin","wave":"wave3"},
{"key":"cac40","name":"CAC 40","symbol":"^FCHI","region":"France","flag":"FR","tz":"Europe/Paris","wave":"wave3"},
{"key":"eurostoxx50","name":"Euro Stoxx 50","symbol":"^STOXX50E","region":"Europe","flag":"EU","tz":"Europe/Zurich","wave":"wave3"},
{"key":"ftsemib","name":"FTSE MIB","symbol":"FTSEMIB.MI","region":"Italy","flag":"IT","tz":"Europe/Rome","wave":"wave3"},
{"key":"ibex35","name":"IBEX 35","symbol":"^IBEX","region":"Spain","flag":"ES","tz":"Europe/Madrid","wave":"wave3"},
{"key":"smi","name":"SMI","symbol":"^SSMI","region":"Switzerland","flag":"CH","tz":"Europe/Zurich","wave":"wave3"},
{"key":"aex","name":"AEX","symbol":"^AEX","region":"Netherlands","flag":"NL","tz":"Europe/Amsterdam","wave":"wave3"},
]

def num(v):
    return float(v) if isinstance(v,(int,float)) and math.isfinite(float(v)) else None

def fetch_market(m):
    enc=urllib.parse.quote(m["symbol"],safe="")
    url=f"https://query1.finance.yahoo.com/v8/finance/chart/{enc}?interval=1m&range=1d"
    req=urllib.request.Request(url,headers={"User-Agent":"AtraVigil/1.0","Accept":"application/json,text/plain,*/*"})
    with urllib.request.urlopen(req,timeout=25) as res:
        payload=json.load(res)
    result=((payload.get("chart") or {}).get("result") or [None])[0]
    if not result: raise RuntimeError(f"{m['symbol']}: no chart result")
    meta=result.get("meta") or {}
    timestamps=result.get("timestamp") or []
    quote=(((result.get("indicators") or {}).get("quote") or [{}])[0]) or {}
    closes=quote.get("close") or []; opens=quote.get("open") or []; highs=quote.get("high") or []; lows=quote.get("low") or []
    valid=[(i,num(v)) for i,v in enumerate(closes)]
    valid=[(i,v) for i,v in valid if v is not None and v>0]
    if not valid: raise RuntimeError(f"{m['symbol']}: no valid closes")
    last_i,last_close=valid[-1]; _,first_close=valid[0]
    valid_opens=[num(v) for v in opens if num(v) is not None and num(v)>0]
    valid_highs=[num(v) for v in highs if num(v) is not None and num(v)>0]
    valid_lows=[num(v) for v in lows if num(v) is not None and num(v)>0]
    previous_close=num(meta.get("chartPreviousClose"))
    market_open=valid_opens[0] if valid_opens else first_close
    change=(last_close-previous_close) if previous_close else (last_close-market_open if market_open else None)
    change_pct=((change/previous_close)*100) if previous_close and change is not None else ((change/market_open)*100 if market_open and change is not None else None)
    data_ts=num(timestamps[last_i]) if last_i<len(timestamps) else None
    if not data_ts: data_ts=num(meta.get("regularMarketTime"))
    quote_time=datetime.fromtimestamp(data_ts,timezone.utc).isoformat().replace("+00:00","Z") if data_ts else None
    exchange_time=datetime.fromtimestamp(data_ts,timezone.utc).astimezone(ZoneInfo(m["tz"])).isoformat() if data_ts else None
    age=max(0,round((time.time()-data_ts)/60)) if data_ts else None
    return {
      "key":m["key"],"name":m["name"],"symbol":m["symbol"],"region":m["region"],"flag":m["flag"],
      "ok":True,"error":None,"isMarketOpen":False,"marketStatusLabel":"Closed","marketTone":"red","holidayName":None,
      "localClock":datetime.now(ZoneInfo(m["tz"])).strftime("%b %-d, %-I:%M %p"),"price":last_close,"change":change,
      "changePercent":change_pct,"previousClose":previous_close,"high":max(valid_highs) if valid_highs else None,
      "low":min(valid_lows) if valid_lows else None,"open":market_open,"quoteTime":quote_time,"exchangeTime":exchange_time,
      "quoteAgeMinutes":age,"dataStatus":"closed","dataStatusLabel":"Snapshot","dataTone":"green",
      "capturedAt":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"captureWave":m["wave"]}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--wave",choices=["wave1","wave2","wave3","all"],required=True); ap.add_argument("--output",required=True); args=ap.parse_args()
    out=Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
    existing={"markets":[]}
    if out.exists(): existing=json.loads(out.read_text())
    by_symbol={row.get("symbol"):row for row in existing.get("markets",[])}
    selected=[m for m in MARKETS if args.wave=="all" or m["wave"]==args.wave]
    print(f"wave={args.wave}"); print(f"selected_count={len(selected)}")
    failures=[]
    for m in selected:
        try:
            row=fetch_market(m); by_symbol[m["symbol"]]=row
            print(f"captured={m['symbol']} price={row['price']} quoteTime={row['quoteTime']}")
        except Exception as exc:
            failures.append(f"{m['symbol']}: {exc}"); print(f"capture_error={m['symbol']} error={exc}",file=sys.stderr)
    if failures: raise SystemExit("capture failed: "+" | ".join(failures))
    ordered=[by_symbol.get(m["symbol"]) for m in MARKETS if by_symbol.get(m["symbol"]) is not None]
    if args.wave=="all" and len(ordered)!=len(MARKETS): raise SystemExit(f"expected {len(MARKETS)} rows, got {len(ordered)}")
    payload={"ok":len(ordered)==len(MARKETS),"updatedAt":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"captureScheduleCt":["01:45","05:40","11:45"],"lastCaptureWave":args.wave,"markets":ordered}
    tmp=out.with_suffix(out.suffix+".tmp"); tmp.write_text(json.dumps(payload,indent=2)+"\n"); tmp.replace(out)
    print(f"output={out}"); print(f"market_count={len(ordered)}"); print("capture_status=PASS")

if __name__=="__main__": main()
