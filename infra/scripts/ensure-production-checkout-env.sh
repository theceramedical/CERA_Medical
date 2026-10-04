#!/usr/bin/env bash
# Run on the production host (e.g. /opt/cera). Idempotently enables checkout env vars.
# Set SAFEPAY_MERCHANT_SECRET and SAFEPAY_MERCHANT_API_KEY before taking online payments.
set -euo pipefail
ENV_FILE="${1:-/opt/cera/.env}"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }

set_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

set_var CHECKOUT_ENABLED true
set_var NEXT_PUBLIC_CHECKOUT_ENABLED true

for key in SAFEPAY_MERCHANT_SECRET SAFEPAY_MERCHANT_API_KEY; do
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    printf '\n# Required for Safepay hosted checkout (cera-safepay handler)\n%s=\n' "$key" >> "$ENV_FILE"
    echo "Added ${key}= placeholder — set your Safepay credentials before go-live." >&2
  fi
done

if ! grep -q '^SAFEPAY_ENVIRONMENT=' "$ENV_FILE"; then
  printf '\nSAFEPAY_ENVIRONMENT=production\n' >> "$ENV_FILE"
fi

chmod 600 "$ENV_FILE"
echo "Checkout env updated in $ENV_FILE"
