#!/usr/bin/env bash
# Verify the CERA ERPNext API account and remove the synthetic Lead afterwards.
set -euo pipefail

cera_root="${CERA_ROOT:-/opt/cera}"
frappe_root="${FRAPPE_ROOT:-/opt/frappe_docker}"
frappe_env="${FRAPPE_ENV_FILE:-$frappe_root/.env}"
credentials_file="${ERPNEXT_CREDENTIALS_FILE:-$cera_root/.erpnext-credentials}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
backend='frappe-backend-1'

[[ -f "$frappe_env" ]] || { echo 'Frappe Docker .env is required' >&2; exit 1; }
[[ -s "$credentials_file" ]] || { echo 'ERPNext API credentials are required' >&2; exit 1; }
[[ -f "$script_dir/verify_api.py" ]] || { echo 'verify_api.py is required' >&2; exit 1; }
command -v docker >/dev/null || { echo 'docker is required' >&2; exit 1; }

site="$(sed -n 's/^FRAPPE_SITE_NAME=//p' "$frappe_env" | tail -1)"
[[ "$site" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'FRAPPE_SITE_NAME is required' >&2; exit 1; }
docker inspect "$backend" >/dev/null 2>&1 || { echo 'frappe-backend-1 is not running' >&2; exit 1; }

cleanup() {
  local status=0
  if docker exec "$backend" test -s /tmp/cera-api-test-name 2>/dev/null; then
    if docker exec -i "$backend" bench --site "$site" console <<'PY' >/dev/null
from pathlib import Path
import frappe

name = Path('/tmp/cera-api-test-name').read_text().strip()
if name and frappe.db.exists('Lead', name):
    frappe.delete_doc('Lead', name, force=True)
    frappe.db.commit()
assert not frappe.db.exists('Lead', name)
print('synthetic lead removed')
PY
    then
      :
    else
      status=$?
    fi
  fi
  docker exec -u root "$backend" rm -f \
    /tmp/cera-erpnext-credentials /tmp/cera-api-test-name /tmp/cera-verify-api.py \
    >/dev/null 2>&1 || status=$?
  return "$status"
}
trap cleanup EXIT

docker cp "$credentials_file" "$backend:/tmp/cera-erpnext-credentials"
docker cp "$script_dir/verify_api.py" "$backend:/tmp/cera-verify-api.py"
docker exec -u root "$backend" chown frappe:frappe /tmp/cera-erpnext-credentials
docker exec -u root "$backend" chmod 600 /tmp/cera-erpnext-credentials
docker exec "$backend" python /tmp/cera-verify-api.py
cleanup
trap - EXIT
echo 'ERPNext Lead create/read verified; synthetic Lead removed.'
