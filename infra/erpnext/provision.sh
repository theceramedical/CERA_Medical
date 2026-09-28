#!/usr/bin/env bash
# Provision the private ERPNext Lead API used by the CERA worker.
set -euo pipefail

cera_root="${CERA_ROOT:-/opt/cera}"
frappe_root="${FRAPPE_ROOT:-/opt/frappe_docker}"
frappe_env="${FRAPPE_ENV_FILE:-$frappe_root/.env}"
credentials_file="${ERPNEXT_CREDENTIALS_FILE:-$cera_root/.erpnext-credentials}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

[[ -f "$frappe_env" ]] || { echo 'Frappe Docker .env is required' >&2; exit 1; }
[[ -f "$script_dir/provision.py" ]] || { echo 'provision.py is required' >&2; exit 1; }
command -v docker >/dev/null || { echo 'docker is required' >&2; exit 1; }

env_value() { sed -n "s/^${1}=//p" "$2" | tail -1; }
site="$(env_value FRAPPE_SITE_NAME "$frappe_env")"
[[ "$site" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'FRAPPE_SITE_NAME is required' >&2; exit 1; }

frappe() {
  docker compose --project-name frappe --env-file "$frappe_env" \
    -f "$frappe_root/compose.yaml" \
    -f "$frappe_root/overrides/compose.mariadb.yaml" \
    -f "$frappe_root/overrides/compose.redis.yaml" "$@"
}

backend="frappe-backend-1"
docker inspect "$backend" >/dev/null 2>&1 || { echo 'frappe-backend-1 is not running' >&2; exit 1; }
docker cp "$script_dir/provision.py" "$backend:/tmp/cera-provision.py"
trap 'docker exec -u root "$backend" rm -f /tmp/cera-provision.py >/dev/null 2>&1 || true' EXIT

output="$(frappe exec -T backend bench --site "$site" console <<'PY'
exec(open("/tmp/cera-provision.py").read(), globals())
exit()
PY
)"
credentials_json="$(printf '%s\n' "$output" | sed -n 's/^CERA_INTEGRATION_CREDENTIALS=//p' | tail -1)"

if [[ -n "$credentials_json" ]]; then
  install -d -m 700 -- "$(dirname -- "$credentials_file")"
  temporary="$(mktemp "${credentials_file}.XXXXXX")"
  chmod 600 "$temporary"
  if ! printf '%s' "$credentials_json" | python3 -c '
import json
import sys

data = json.load(sys.stdin)
assert set(data) == {"ERPNEXT_API_KEY", "ERPNEXT_API_SECRET"}
assert all(isinstance(value, str) and value for value in data.values())
print(f"ERPNEXT_API_KEY={data[\"ERPNEXT_API_KEY\"]}")
print(f"ERPNEXT_API_SECRET={data[\"ERPNEXT_API_SECRET\"]}")
' > "$temporary"; then
    rm -f -- "$temporary"
    echo 'ERPNext provisioning returned invalid credentials' >&2
    exit 1
  fi
  mv -f -- "$temporary" "$credentials_file"
elif [[ ! -s "$credentials_file" ]]; then
  echo 'ERPNext is provisioned, but no credentials file exists' >&2
  exit 1
fi

chmod 600 -- "$credentials_file"
echo "ERPNext CERA integration provisioned for site $site"
