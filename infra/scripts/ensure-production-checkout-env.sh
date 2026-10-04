#!/usr/bin/env bash
# Run on the production host (e.g. /opt/cera). Idempotently enables checkout env vars.
# Set STRIPE_SECRET_KEY manually before taking card payments in production.
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

if ! grep -q '^STRIPE_SECRET_KEY=' "$ENV_FILE"; then
  printf '\n# Required for production card payments (cera-stripe handler)\nSTRIPE_SECRET_KEY=\n' >> "$ENV_FILE"
  echo "Added STRIPE_SECRET_KEY= placeholder — set your Stripe secret before go-live." >&2
fi

chmod 600 "$ENV_FILE"
echo "Checkout env updated in $ENV_FILE"
