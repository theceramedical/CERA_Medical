#!/usr/bin/env bash
# Post-deploy smoke: public pages, health, and enquiry create.
set -euo pipefail

ORIGIN="${SMOKE_ORIGIN:-http://127.0.0.1:3000}"
API="${SMOKE_API:-http://127.0.0.1:3003}"

fail() { echo "FAIL $1"; exit 1; }

curl -fsS "${ORIGIN}/" >/dev/null || fail "web home"
curl -fsS "${API}/health" >/dev/null || fail "api liveness"
curl -fsS "${ORIGIN}/enquiry" >/dev/null || fail "enquiry form"
echo "PASS smoke against ${ORIGIN} and ${API}"
