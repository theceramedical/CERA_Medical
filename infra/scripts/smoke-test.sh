#!/usr/bin/env bash
# Read-only public checks. Synthetic enquiry delivery belongs in staging QA.
set -euo pipefail
origin="${SMOKE_ORIGIN:?SMOKE_ORIGIN required}"
api="${SMOKE_API:?SMOKE_API required}"
curl_args=(--http1.1 --retry 3 --retry-all-errors --retry-delay 1 --max-time 15)
for path in / /services /enquiry; do
  curl --fail --silent --show-error "${curl_args[@]}" "${origin%/}$path" >/dev/null
  echo "OK $path"
done
curl --fail --silent --show-error "${curl_args[@]}" "${api%/}/health/ready" >/dev/null
code="$(curl --silent --show-error "${curl_args[@]}" -o /dev/null -w '%{http_code}' "${origin%/}/auth/signin")"
[[ "$code" == 302 || "$code" == 307 ]] || { echo "Sign-in failed: HTTP $code" >&2; exit 1; }
echo "Smoke passed: $origin"
