#!/usr/bin/env bash
# Set shared operator email/password across ERPNext, .env bootstrap vars, and CMS user.
# Run on the VPS as root. Does not commit secrets to git.
#
#   OPERATOR_EMAIL=admin@ceramedical.org \
#   OPERATOR_PASSWORD='theCeraMedical@123' \
#   bash /opt/cera/infra/scripts/standardize-operator-logins.sh
#
# Vendure: updates SUPERADMIN_* in .env — restart commerce after. Dashboard login
# uses identifier "superadmin" unless you change it in the Vendure UI.
# Authentik: set bootstrap vars in .env; change the live user password in Authentik UI
# or ak CLI after this script.

set -euo pipefail

OPERATOR_EMAIL="${OPERATOR_EMAIL:-admin@ceramedical.org}"
OPERATOR_PASSWORD="${OPERATOR_PASSWORD:?OPERATOR_PASSWORD is required}"
CERA_ENV_FILE="${CERA_ENV_FILE:-/opt/cera/.env}"
FRAPPE_DIR="${FRAPPE_DIR:-/opt/frappe_docker}"
SITE="${FRAPPE_SITE_NAME:-cera-production}"

if ((${#OPERATOR_PASSWORD} < 12)); then
  echo 'Use a password of at least 12 characters.' >&2
  exit 1
fi

set_env_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$CERA_ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CERA_ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >>"$CERA_ENV_FILE"
  fi
}

echo "Updating ${CERA_ENV_FILE} bootstrap entries..."
set_env_kv CMS_BOOTSTRAP_ADMIN_EMAIL "$OPERATOR_EMAIL"
# Bootstrap seed requires 32+ chars if a new CMS user is ever created from env alone.
set_env_kv CMS_BOOTSTRAP_ADMIN_PASSWORD "$OPERATOR_PASSWORD"
set_env_kv SUPERADMIN_USERNAME superadmin
set_env_kv SUPERADMIN_PASSWORD "$OPERATOR_PASSWORD"
set_env_kv AUTHENTIK_BOOTSTRAP_EMAIL "$OPERATOR_EMAIL"
set_env_kv AUTHENTIK_BOOTSTRAP_PASSWORD "$OPERATOR_PASSWORD"

echo "ERPNext Administrator password..."
docker exec frappe-backend-1 bench --site "$SITE" set-admin-password "$OPERATOR_PASSWORD"

echo "Payload CMS user email + password (Payload 3 pbkdf2-sha256-v1)..."
cms_creds="$(
  OPERATOR_PASSWORD="$OPERATOR_PASSWORD" docker exec -e OPERATOR_PASSWORD cera-cms-1 node --input-type=module -e "
import crypto from 'crypto';
const password = process.env.OPERATOR_PASSWORD;
const salt = crypto.randomBytes(32).toString('hex');
const prefix = 'pbkdf2-sha256-v1:';
const hashRaw = await new Promise((resolve, reject) =>
  crypto.pbkdf2(password, salt, 600000, 32, 'sha256', (e, b) => (e ? reject(e) : resolve(b))),
);
process.stdout.write(salt + '\n' + prefix + hashRaw.toString('hex'));
" 2>/dev/null
)" || cms_creds=""
if [[ -n "$cms_creds" ]]; then
  cms_salt="$(printf '%s\n' "$cms_creds" | head -1)"
  cms_hash="$(printf '%s\n' "$cms_creds" | tail -1)"
  docker exec cera-postgres-1 psql -U postgres -d cera_cms -v ON_ERROR_STOP=1 -c \
    "UPDATE users SET email = '${OPERATOR_EMAIL}', hash = '${cms_hash}', salt = '${cms_salt}', login_attempts = 0, lock_until = NULL WHERE id = 1;" \
    >/dev/null
  echo "CMS user id=1 updated to ${OPERATOR_EMAIL}"
else
  echo 'CMS update skipped (run manually in Payload admin if this failed).'
fi

echo ""
echo "Done. Next steps:"
echo "  1. docker compose -f /opt/cera/infra/compose/compose.application.yaml up -d commerce cms web"
echo "  2. Authentik: sign in at https://auth.\${CERA_DOMAIN} and set ${OPERATOR_EMAIL} password to match (or create user)."
echo "  3. Vendure: sign in at https://catalogue.\${CERA_DOMAIN}/dashboard as superadmin with new password after commerce restart."
echo "  4. Re-sync CRM lead: bash /opt/cera/infra/erpnext/replay-enquiry-lead.sh (if present)"
