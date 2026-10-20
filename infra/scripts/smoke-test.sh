#!/usr/bin/env bash
# Read-only public checks. Synthetic enquiry delivery belongs in staging QA.
set -euo pipefail
origin="${SMOKE_ORIGIN:?SMOKE_ORIGIN required}"
api="${SMOKE_API:?SMOKE_API required}"
curl_args=(--http1.1 --retry 3 --retry-all-errors --retry-delay 1 --max-time 15)
if [[ "${SMOKE_LOOPBACK:-}" == 1 ]]; then
  origin_host="${origin#*://}"
  origin_host="${origin_host%%/*}"
  origin_host="${origin_host%%:*}"
  api_host="${api#*://}"
  api_host="${api_host%%/*}"
  api_host="${api_host%%:*}"
  # The deploy host often cannot open its own public address. Hit the published
  # edge on loopback while still checking the real hostnames and certificates.
  curl_args+=(--resolve "${origin_host}:443:127.0.0.1" --resolve "${api_host}:443:127.0.0.1")
fi
for path in / /services /enquiry; do
  curl --fail --silent --show-error "${curl_args[@]}" "${origin%/}$path" >/dev/null
  echo "OK $path"
done
curl --fail --silent --show-error "${curl_args[@]}" "${api%/}/health/ready" >/dev/null
code="$(curl --silent --show-error "${curl_args[@]}" -o /dev/null -w '%{http_code}' "${origin%/}/auth/signin")"
[[ "$code" == 302 || "$code" == 307 ]] || { echo "Sign-in failed: HTTP $code" >&2; exit 1; }
echo "Smoke passed: $origin"
