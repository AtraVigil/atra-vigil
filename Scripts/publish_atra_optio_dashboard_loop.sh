#!/bin/bash
set -u

INTERVAL_SECONDS="${1:-600}"

echo "=== ATRA OPTIO DASHBOARD PUBLISH LOOP ==="
date
echo "interval_seconds=$INTERVAL_SECONDS"
echo

echo "Paste GitHub token; input hidden, then press Enter:"
stty -echo
read GITHUB_TOKEN
stty echo
echo
export GITHUB_TOKEN

cleanup() {
  unset GITHUB_TOKEN
}
trap cleanup EXIT

while true; do
  "$HOME/Documents/atra-vigil/Scripts/publish_atra_optio_dashboard_once.sh"
  EXIT_CODE=$?

  echo
  echo "publish_once_exit=$EXIT_CODE"
  echo "next_check_in_seconds=$INTERVAL_SECONDS"
  echo "timestamp=$(date)"
  echo

  sleep "$INTERVAL_SECONDS"
done
