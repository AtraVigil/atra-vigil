#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

DEFAULT_SOURCE = Path.home() / "Desktop" / "Atra Optio Collection" / "Atra Optio" / "data" / "research_exports" / "stock_signal_forward_validation" / "website_export"
FILES = ("latest.json", "history.json", "summary.json")

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def validate_json(path: Path) -> None:
    with path.open("r", encoding="utf-8") as fh:
        json.load(fh)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument(
        "--destination",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "optio-stock-signal",
    )
    args = parser.parse_args()

    for name in FILES:
        src = args.source / name
        if not src.is_file():
            raise SystemExit(f"missing source export: {src}")
        validate_json(src)

    args.destination.mkdir(parents=True, exist_ok=True)

    for name in FILES:
        src = args.source / name
        dst = args.destination / name
        temp = args.destination / f".{name}.tmp"
        shutil.copy2(src, temp)
        validate_json(temp)
        temp.replace(dst)
        print(f"{name}: {sha256(dst)}")

    print("publisher_status=PASS")
    print("sqlite_read=NO")
    print("provider_calls=NO")
    print("scoring_execution=NO")
    print("outcome_inference=NO")
    return 0

if __name__ == "__main__":
    sys.exit(main())
