#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3007}"
EMAIL_PREFIX="tester"
RAND_SUFFIX=$(date +%s)
EMAIL="${EMAIL_PREFIX}+${RAND_SUFFIX}@example.com"
PASSWORD="P@ssw0rd123"
NEW_PASSWORD="N3wP@ssw0rd123"

json_post() {
  local url="$1"; shift
  local data="$1"; shift
  curl -sS -X POST -H 'Content-Type: application/json' -d "$data" "$url"
}

get_json_field() {
  local json="$1"; shift
  local field="$1"; shift
  node -e "const o=require('fs').readFileSync(0,'utf8'); try{const j=JSON.parse(o); console.log(j['$field']??'');}catch(e){process.exit(1)}"
}

log() { echo "[SMOKE] $*"; }

log "API_URL=$API_URL"
log "Registering user: $EMAIL"
REG_RES=$(json_post "$API_URL/auth/register" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
ACCESS_TOKEN=$(echo "$REG_RES" | get_json_field - accessToken)
if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Register failed: $REG_RES"; exit 1
fi
log "Registered and got access token"

# /auth/me
ME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ACCESS_TOKEN" "$API_URL/auth/me")
if [[ "$ME_STATUS" != "200" ]]; then
  echo "/auth/me failed status: $ME_STATUS"; exit 1
fi
log "/auth/me ok"

# login
LOGIN_RES=$(json_post "$API_URL/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
LOGIN_TOKEN=$(echo "$LOGIN_RES" | get_json_field - accessToken)
if [[ -z "$LOGIN_TOKEN" ]]; then
  echo "Login failed: $LOGIN_RES"; exit 1
fi
log "Login ok"

# forgot / reset
FORGOT_RES=$(json_post "$API_URL/auth/forgot-password" "{\"email\":\"$EMAIL\"}")
TOKEN=$(echo "$FORGOT_RES" | get_json_field - token)
if [[ -z "$TOKEN" ]]; then
  echo "Forgot did not return token in non-production: $FORGOT_RES"; exit 1
fi
VERIFY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/reset-password/verify?token=$TOKEN")
if [[ "$VERIFY_STATUS" != "200" ]]; then
  echo "Verify failed: $VERIFY_STATUS"; exit 1
fi
RESET_RES=$(json_post "$API_URL/auth/reset-password" "{\"token\":\"$TOKEN\",\"newPassword\":\"$NEW_PASSWORD\"}")
OK_MSG=$(echo "$RESET_RES" | get_json_field - message)
if [[ "$OK_MSG" != "Password reset successful"* ]]; then
  echo "Reset failed: $RESET_RES"; exit 1
fi
log "Password reset ok"

# old password should fail
OLD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "$API_URL/auth/login")
if [[ "$OLD_STATUS" == "200" ]]; then
  echo "Old password login unexpectedly succeeded"; exit 1
fi

# new password ok
NEW_LOGIN=$(json_post "$API_URL/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}")
NEW_TOKEN=$(echo "$NEW_LOGIN" | get_json_field - accessToken)
if [[ -z "$NEW_TOKEN" ]]; then
  echo "New password login failed: $NEW_LOGIN"; exit 1
fi
log "New password login ok"

echo "[SMOKE] All steps OK"