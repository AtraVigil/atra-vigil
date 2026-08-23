#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB = Path.home() / "AtraVigilV3/data/singapore_sti_v1/singapore_sti_v1.sqlite"
OUT = Path.home() / "Documents/atra-vigil/public/data/structura/sti-latest.json"

if not DB.exists():
    raise SystemExit(f"STI database not found: {DB}")

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
rows = con.execute(
    "SELECT observation_date, close, source_timestamp, first_seen_batch, latest_raw_sha256 "
    "FROM sti_daily ORDER BY observation_date DESC LIMIT 2"
).fetchall()
con.close()

if len(rows) != 2:
    raise SystemExit("Need latest and prior STI observations")

latest, prior = rows[0], rows[1]
latest_close = float(latest["close"])
prior_close = float(prior["close"])
change = latest_close - prior_close
change_pct = (change / prior_close) * 100.0 if prior_close else None

payload = {
    "ok": True,
    "authority": "Atra Structura",
    "market": "Singapore",
    "region": "Asia",
    "name": "Straits Times Index",
    "symbol": "^STI",
    "currency": "SGD",
    "timeZone": "Asia/Singapore",
    "observationDate": latest["observation_date"],
    "price": latest_close,
    "previousObservationDate": prior["observation_date"],
    "previousClose": prior_close,
    "change": change,
    "changePercent": change_pct,
    "sourceTimestamp": int(latest["source_timestamp"]),
    "sourceTimestampIso": datetime.fromtimestamp(
        int(latest["source_timestamp"]), tz=timezone.utc
    ).isoformat().replace("+00:00", "Z"),
    "firstSeenBatch": latest["first_seen_batch"],
    "latestRawSha256": latest["latest_raw_sha256"],
    "publicationStatus": "validated_completed_session",
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")

print("publication_result=PASS")
print(f"output={OUT}")
print(f"observation_date={payload['observationDate']}")
print(f"price={payload['price']}")
print(f"previous_close={payload['previousClose']}")
print(f"change_percent={payload['changePercent']}")
print(f"source_timestamp={payload['sourceTimestamp']}")
