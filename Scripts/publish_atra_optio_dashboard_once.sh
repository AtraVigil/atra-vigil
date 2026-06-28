#!/bin/bash
set -u

WEBSITE_ROOT="$HOME/Documents/atra-vigil"
SOURCE_JSON="$HOME/Desktop/Atra Optio/data/web/atra_optio_dashboard.json"
TARGET_JSON="$WEBSITE_ROOT/data/web/atra_optio_dashboard.json"

cd "$WEBSITE_ROOT" || exit 1

echo "=== ATRA OPTIO DASHBOARD PUBLISH ONCE ==="
date
echo "website_root=$WEBSITE_ROOT"
echo "source_json=$SOURCE_JSON"
echo "target_json=$TARGET_JSON"
echo

if [ ! -f "$SOURCE_JSON" ]; then
  echo "STOP: source JSON missing"
  exit 1
fi

mkdir -p "$(dirname "$TARGET_JSON")"

echo "=== validate source JSON ==="
python3 - <<PY
import json
from pathlib import Path

p = Path("$SOURCE_JSON")
data = json.loads(p.read_text())

schema = data.get("schema_version")
if schema != "atra_optio_dashboard_v1":
    raise SystemExit(f"STOP: unsupported schema_version={schema!r}")

print("schema_version=", schema)
print("session_date=", data.get("session_date"))
print("generated_at_market=", data.get("generated_at_market"))
print("run_mode=", (data.get("runtime") or {}).get("run_mode"))
print("market_window_state=", (data.get("runtime") or {}).get("market_window_state"))
print("ranked_board_rows=", len(data.get("ranked_board") or []))
print("selected_contracts_rows=", len(data.get("selected_contracts") or []))
print("snapshot_tape_latest_rows=", len(data.get("snapshot_tape_latest") or []))
print("outcomes_rows=", len(data.get("outcomes") or []))
PY
VALIDATE_EXIT=$?
echo "validate_exit=$VALIDATE_EXIT"
echo

if [ "$VALIDATE_EXIT" -ne 0 ]; then
  echo "STOP: source JSON validation failed"
  exit "$VALIDATE_EXIT"
fi

echo "=== copy feed into website repo ==="
cp "$SOURCE_JSON" "$TARGET_JSON"
echo "copied=YES"
echo

echo "=== check for actual JSON change ==="
if git diff --quiet -- "$TARGET_JSON"; then
  echo "changed=NO"
  echo "publish_status=SKIPPED_NO_CHANGE"
  echo
  echo "=== DONE ==="
  exit 0
fi

echo "changed=YES"
echo

echo "=== commit dashboard JSON ==="
git add "$TARGET_JSON"

SESSION_DATE=$(python3 - <<PY
import json
from pathlib import Path
data = json.loads(Path("$TARGET_JSON").read_text())
print(data.get("session_date") or "unknown-session")
PY
)

GENERATED_MARKET=$(python3 - <<PY
import json
from pathlib import Path
data = json.loads(Path("$TARGET_JSON").read_text())
print(data.get("generated_at_market") or "unknown-time")
PY
)

git commit -m "Update Atra Optio dashboard feed ${SESSION_DATE} ${GENERATED_MARKET}"
COMMIT_EXIT=$?
echo "commit_exit=$COMMIT_EXIT"
echo

if [ "$COMMIT_EXIT" -ne 0 ]; then
  echo "STOP: commit failed"
  exit "$COMMIT_EXIT"
fi

echo "=== push feed update ==="
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "STOP: GITHUB_TOKEN is not set for push"
  exit 2
fi

ASKPASS_FILE="/tmp/atra_optio_publish_askpass_$$.sh"

cat > "$ASKPASS_FILE" <<EOF
#!/bin/sh
case "\$1" in
  *Username*) echo "x-access-token" ;;
  *Password*) echo "$GITHUB_TOKEN" ;;
esac
EOF

chmod 700 "$ASKPASS_FILE"

git config http.version HTTP/1.1
git config http.postBuffer 524288000
git config core.compression 0
git config pack.threads 1

GIT_ASKPASS="$ASKPASS_FILE" GIT_TERMINAL_PROMPT=0 git -c credential.helper= push origin HEAD:main --verbose 2>&1
PUSH_EXIT=$?
rm -f "$ASKPASS_FILE"

echo "push_exit=$PUSH_EXIT"
echo

if [ "$PUSH_EXIT" -ne 0 ]; then
  echo "STOP: push failed"
  exit "$PUSH_EXIT"
fi

echo "publish_status=PUSHED"
echo "local_head=$(git rev-parse --short HEAD)"
echo

echo "=== DONE ==="
