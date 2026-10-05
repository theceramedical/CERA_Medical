#!/usr/bin/env bash
# Print operator URLs, usernames, and secrets from the production host.
# Run ON THE VPS only. Do not commit output to git or paste into tickets.
#
#   bash /opt/cera/infra/scripts/export-operator-credentials.sh | tee ~/cera-operator-secrets.txt
#   chmod 600 ~/cera-operator-secrets.txt
#   scp root@YOUR_HOST:~/cera-operator-secrets.txt .
#   rm ~/cera-operator-secrets.txt   # on server after copy

set -euo pipefail

CERA_ENV_FILE="${CERA_ENV_FILE:-/opt/cera/.env}"
FRAPPE_DIR="${FRAPPE_DIR:-/opt/frappe_docker}"
ERPNEXT_CRED="${ERPNEXT_CRED:-/opt/cera/.erpnext-credentials}"

get_env() {
  local key="$1"
  [[ -f "$CERA_ENV_FILE" ]] || return 1
  local line
  line="$(grep -m1 "^${key}=" "$CERA_ENV_FILE" 2>/dev/null || true)"
  [[ -n "$line" ]] || return 0
  local val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  printf '%s' "$val"
}

domain="$(get_env CERA_DOMAIN)"
domain="${domain:-ceramedical.org}"

section() {
  printf '\n========== %s ==========\n' "$1"
}

section "PUBLIC URLS (no www on subdomains)"
cat <<EOF
Public website:     https://www.${domain}
Customer portal:    https://www.${domain}/account
Staff console:      https://www.${domain}/staff
Payload CMS:        https://admin.${domain}
Vendure catalogue:  https://catalogue.${domain}/dashboard
Authentik:          https://auth.${domain}
API:                https://api.${domain}
ERPNext CRM:        https://crm.${domain}
EOF

section "HUMAN LOGINS"
printf 'Payload CMS\n  URL:      https://admin.%s\n  Email:    %s\n  Password: %s\n\n' \
  "$domain" "$(get_env CMS_BOOTSTRAP_ADMIN_EMAIL)" "$(get_env CMS_BOOTSTRAP_ADMIN_PASSWORD)"

printf 'Vendure dashboard\n  URL:      https://catalogue.%s/dashboard\n  Username: %s\n  Password: %s\n\n' \
  "$domain" "$(get_env SUPERADMIN_USERNAME)" "$(get_env SUPERADMIN_PASSWORD)"

printf 'Authentik admin (bootstrap)\n  URL:      https://auth.%s\n  Email:    %s\n  Password: %s\n\n' \
  "$domain" "$(get_env AUTHENTIK_BOOTSTRAP_EMAIL)" "$(get_env AUTHENTIK_BOOTSTRAP_PASSWORD)"

printf 'Public site sign-in (customers / staff)\n  URL:      https://www.%s/auth/sign-in\n  Method:   Google or Authentik user (not CMS/Vendure passwords)\n  Google:   OIDC_GOOGLE_SOURCE_SLUG=%s\n\n' \
  "$domain" "$(get_env OIDC_GOOGLE_SOURCE_SLUG)"

printf 'ERPNext CRM web UI\n  URL:      https://crm.%s\n  Login ID: Administrator\n' "$domain"
if [[ -f "${FRAPPE_DIR}/.admin-initial" ]]; then
  printf '  Password: %s\n  (from %s/.admin-initial)\n\n' "$(cat "${FRAPPE_DIR}/.admin-initial")" "$FRAPPE_DIR"
else
  printf '  Password: <missing — reset with bench set-admin-password on site cera-production>\n\n'
fi

printf 'Staff enquiry email inbox (alerts, not a login)\n  EMAIL_STAFF_ALERT_TO=%s\n\n' "$(get_env EMAIL_STAFF_ALERT_TO)"

section "ERPNext API (CERA worker only — not CRM login)"
printf 'Integration user in ERPNext: cera-integration@cera.invalid (desk access off)\n'
if [[ -f "$ERPNEXT_CRED" ]]; then
  cat "$ERPNEXT_CRED"
  printf '\n'
else
  printf '(file %s not found)\n' "$ERPNEXT_CRED"
fi
printf 'ERPNEXT_URL (internal)=%s\n' "$(get_env ERPNEXT_URL)"

section "OIDC / RESEND / CHECKOUT"
printf 'OIDC_CLIENT_ID=%s\n' "$(get_env OIDC_CLIENT_ID)"
printf 'OIDC_CLIENT_SECRET=%s\n' "$(get_env OIDC_CLIENT_SECRET)"
printf 'OIDC_ISSUER=%s\n' "$(get_env OIDC_ISSUER)"
printf 'OIDC_REDIRECT_URI=%s\n' "$(get_env OIDC_REDIRECT_URI)"
printf 'EMAIL_DRIVER=%s\n' "$(get_env EMAIL_DRIVER)"
printf 'EMAIL_FROM=%s\n' "$(get_env EMAIL_FROM)"
printf 'RESEND_API_KEY=%s\n' "$(get_env RESEND_API_KEY)"
printf 'CHECKOUT_ENABLED=%s\n' "$(get_env CHECKOUT_ENABLED)"
printf 'NEXT_PUBLIC_CHECKOUT_ENABLED=%s\n' "$(get_env NEXT_PUBLIC_CHECKOUT_ENABLED)"
printf 'SAFEPAY_ENVIRONMENT=%s\n' "$(get_env SAFEPAY_ENVIRONMENT)"
printf 'SAFEPAY_MERCHANT_API_KEY=%s\n' "$(get_env SAFEPAY_MERCHANT_API_KEY)"
printf 'SAFEPAY_MERCHANT_SECRET=%s\n' "$(get_env SAFEPAY_MERCHANT_SECRET)"

section "INFRASTRUCTURE SECRETS (full /opt/cera/.env)"
if [[ -r "$CERA_ENV_FILE" ]]; then
  cat "$CERA_ENV_FILE"
else
  printf 'Cannot read %s\n' "$CERA_ENV_FILE"
fi

section "NOTES"
cat <<'EOF'
- Rotate all passwords after storing in a password manager.
- Never commit this file or chat logs containing secrets to git.
- Cloudflare / R2 / SSH keys are not in CERA .env — check Cloudflare dashboard and GitHub secrets.
- ERPNext Administrator password may differ if changed in UI; use bench set-admin-password if login fails.
EOF
