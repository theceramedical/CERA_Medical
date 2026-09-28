#!/usr/bin/env bash
# Encrypt an ERPNext database, configuration, and site-files backup locally.
set -euo pipefail

cera_root="${CERA_ROOT:-/opt/cera}"
frappe_root="${FRAPPE_ROOT:-/opt/frappe_docker}"
cera_env="${CERA_ENV_FILE:-$cera_root/.backup.env}"
frappe_env="${FRAPPE_ENV_FILE:-$frappe_root/.env}"
[[ -f "$cera_env" && -f "$frappe_env" ]] || { echo 'CERA and Frappe host env files are required' >&2; exit 1; }
command -v age >/dev/null || { echo 'age is required' >&2; exit 1; }

env_value() { sed -n "s/^${1}=//p" "$2" | tail -1; }
site="$(env_value FRAPPE_SITE_NAME "$frappe_env")"
recipient="$(env_value BACKUP_AGE_PUBLIC_KEY "$cera_env")"
retention="$(env_value BACKUP_RETENTION_DAYS "$cera_env")"
[[ "$site" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'FRAPPE_SITE_NAME is required' >&2; exit 1; }
[[ "$recipient" == age1* ]] || { echo 'BACKUP_AGE_PUBLIC_KEY is required' >&2; exit 1; }
retention="${retention:-14}"
[[ "$retention" =~ ^[0-9]+$ ]] && (( retention >= 7 )) || { echo 'BACKUP_RETENTION_DAYS must be at least 7' >&2; exit 1; }

frappe() {
  docker compose --project-name frappe --env-file "$frappe_env" \
    -f "$frappe_root/compose.yaml" \
    -f "$frappe_root/overrides/compose.mariadb.yaml" \
    -f "$frappe_root/overrides/compose.redis.yaml" "$@"
}

temp_dir="$(frappe exec -T backend mktemp -d /tmp/cera-erpnext-backup.XXXXXX | tr -d '\r\n')"
[[ "$temp_dir" =~ ^/tmp/cera-erpnext-backup\.[a-zA-Z0-9]+$ ]] || { echo 'Could not create temporary backup directory' >&2; exit 1; }
partial=''
cleanup() {
  local result=$?
  frappe exec -T backend rm -rf -- "$temp_dir" >/dev/null || true
  [[ -z "$partial" ]] || rm -f -- "$partial"
  exit "$result"
}
trap cleanup EXIT

frappe exec -T backend bench --site "$site" backup --with-files --compress --backup-path "$temp_dir"
file_count="$(frappe exec -T backend find "$temp_dir" -maxdepth 1 -type f | wc -l)"
(( file_count >= 4 )) || { echo 'ERPNext backup did not contain database, config, and both file archives' >&2; exit 1; }

backup_dir="${ERPNEXT_BACKUP_DIR:-$cera_root/backups/erpnext}"
install -d -m 700 "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$backup_dir/erpnext-$stamp.tar.age"
partial="$(mktemp "$backup_dir/.erpnext-$stamp.XXXXXX")"
chmod 600 "$partial"
frappe exec -T backend tar -C "$temp_dir" -cf - . | age -r "$recipient" -o "$partial"
test -s "$partial"
mv -f -- "$partial" "$destination"
partial=''
find "$backup_dir" -maxdepth 1 -type f -name 'erpnext-*.tar.age' -mtime "+$retention" -delete
echo "Encrypted ERPNext backup: $destination"
