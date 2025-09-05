#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=3007}"
: "${NODE_ENV:=production}"

npm ci
npm run build

# Run DB migrations (compiled data source)
if [ -f ./dist/src/database/data-source.js ]; then
  node ./dist/src/database/data-source.js migration:run || true
else
  echo "dist/src/database/data-source.js not found; skipping migration:run"
fi

# Start app
node ./dist/src/main.js &
APP_PID=$!
trap 'kill -9 $APP_PID || true' EXIT

sleep 3

BASE="http://127.0.0.1:${PORT}"

set +e
curl -sf "${BASE}/health/live" > /dev/null
LIVE_RC=$?
curl -sf "${BASE}/health/ready" > /dev/null
READY_RC=$?
set -e

if [ $LIVE_RC -ne 0 ] || [ $READY_RC -ne 0 ]; then
  echo "Health checks failed: live=$LIVE_RC ready=$READY_RC"
  exit 1
fi

echo "Deployment checks passed."

# If running in CI gate mode, exit after successful health
if [ "${EXIT_AFTER_HEALTH:-}" = "true" ]; then
  echo "EXIT_AFTER_HEALTH=true, stopping app and exiting."
  kill -9 "$APP_PID" || true
  exit 0
fi

wait $APP_PID