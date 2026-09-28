#!/usr/bin/env bash
# Read-only public checks. Synthetic enquiry delivery belongs in staging QA.
set -euo pipefail
origin="${SMOKE_ORIGIN:?SMOKE_ORIGIN required}"
api="${SMOKE_API:?SMOKE_API required}"
for path in / /services /enquiry; do
  curl --fail --silent --show-error --max-time 15 "${origin%/}$path" >/dev/null
  echo "OK $path"
done
curl --fail --silent --show-error --max-time 15 "${api%/}/health/ready" >/dev/null
code="$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' "${origin%/}/auth/signin")"
[[ "$code" == 302 || "$code" == 307 ]] || { echo "Sign-in failed: HTTP $code" >&2; exit 1; }
echo "Smoke passed: $origin"
