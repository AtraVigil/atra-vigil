#!/usr/bin/env python3
import json, hashlib, sys
from pathlib import Path

ALIASES={
"ticker":["ticker","underlying_ticker","symbol"],"rank":["rank","signal_rank","overall_rank"],
"group":["group","group_name","theme","category"],"percentile_score":["percentile_score","score","final_score","composite_score"],
"bucket":["bucket","signal_bucket","rank_bucket"],"options_activity_rank":["options_activity_rank","activity_rank","options_activity_percentile"],
"call_delta_favorable_rank":["call_delta_favorable_rank","call_delta_rank","delta_favorable_rank"],
"put_iv_range_favorable_rank":["put_iv_range_favorable_rank","put_iv_range_rank","iv_range_favorable_rank"],
"call_oi_total":["call_oi_total"],"put_oi_total":["put_oi_total"],"call_volume_total":["call_volume_total"],
"call_delta_median":["call_delta_median"],"put_iv_range_median":["put_iv_range_median"],
"return_h1":["return_h1"],"return_h3":["return_h3"],"return_h5":["return_h5"],
"h1_status":["h1_status"],"h3_status":["h3_status"],"h5_status":["h5_status"]}

def pick(d,keys):
    for k in keys:
        if k in d:return d[k]
def walk(o,t=()):
    yield t,o
    if isinstance(o,dict):
        for k,v in o.items(): yield from walk(v,t+(str(k),))
    elif isinstance(o,list):
        for i,v in enumerate(o): yield from walk(v,t+(str(i),))
def findv(o,keys):
    for _,n in walk(o):
        if isinstance(n,dict):
            for k in keys:
                if k in n and n[k] not in (None,""): return n[k]
def rows(o):
    c=[]
    for t,n in walk(o):
        if isinstance(n,list) and len(n)>=20:
            ds=[x for x in n if isinstance(x,dict)]
            hits=sum(1 for r in ds if any(k in r for k in ALIASES["ticker"]))
            if hits>=20:c.append((hits,t,ds))
    if not c:return None,None
    c.sort(reverse=True,key=lambda x:x[0]);return c[0][1],c[0][2]

src=Path(sys.argv[1]); out=Path(sys.argv[2]); expected=sys.argv[3]
raw=src.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
if sha!=expected: raise SystemExit("SHA mismatch")
data=json.loads(raw); trail,rs=rows(data)
if not rs: raise SystemExit("ranking rows not found")
norm=[]
for r in rs:
    x={k:pick(r,v) for k,v in ALIASES.items()}
    if x["ticker"] is not None:x["ticker"]=str(x["ticker"]).upper()
    norm.append(x)
norm=[r for r in norm if r["ticker"]]
if len(norm)!=35: raise SystemExit(f"expected 35 rows, found {len(norm)}")
if all(r["rank"] is not None for r in norm): norm.sort(key=lambda r:float(r["rank"]))
tick=[r["ticker"] for r in norm]
if tick[:7]!=["QBTS","QUBT","IONQ","RGTI","MU","RKLB","NVDA"]: raise SystemExit("top mismatch")
if tick[-7:]!=["AAON","ANET","DNN","GE","ETN","DRS","FIX"]: raise SystemExit("bottom mismatch")
session=str(findv(data,["signal_session","session_date","signal_date"]) or "2026-09-02")[:10]
formula=str(findv(data,["formula_version","formula","signal_formula_version"]) or "THREE_FACTOR_V1_FROZEN")
payload={"schema_version":"ATRA_OPTIO_FORWARD_VALIDATION_WEB_V1","source":{"authoritative_artifact":src.name,"sha256":sha,"ranking_path":"/".join(trail),"website_calculated_formula":False,"website_refit_formula":False},"signal_session":session,"formula_version":formula,"research_status":"FORWARD_VALIDATION_ONLY","production_signal":False,"ranking":norm}
text=json.dumps(payload,indent=2)+"\n"
(out/"history").mkdir(parents=True,exist_ok=True)
(out/"latest.json").write_text(text);(out/"history"/f"{session}.json").write_text(text)
print("ranking_rows=35")
