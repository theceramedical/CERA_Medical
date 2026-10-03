#!/usr/bin/env bash
# Encrypted logical backups of all databases. Backups stay on this host.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh" "${1:?environment required}"
command -v age >/dev/null || { echo 'age is required on the host' >&2; exit 1; }
require_release_file
key="${BACKUP_AGE_PUBLIC_KEY:-$(sed -n 's/^BACKUP_AGE_PUBLIC_KEY=//p' "$CERA_ENV_FILE" | tail -1)}"
[[ "$key" == age1* ]] || { echo 'BACKUP_AGE_PUBLIC_KEY is missing' >&2; exit 1; }
backup_dir="${BACKUP_TARGET_DIR:-$ROOT_DIR/backups}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
database_name() {
  local name="$1" fallback="$2" value
  value="$(sed -n "s/^${name}=//p" "$CERA_ENV_FILE" | tail -1)"
  printf '%s' "${value:-$fallback}"
}
for database in \
  "$(database_name CERA_APP_DB cera_app)" \
  "$(database_name CERA_CMS_DB cera_cms)" \
  "$(database_name CERA_COMMERCE_DB cera_commerce)" \
  "$(database_name AUTHENTIK_DB authentik)" \
  "$(database_name GLITCHTIP_DB glitchtip)"; do
  destination="$backup_dir/${ENVIRONMENT}-${database}-${stamp}.dump.age"
  compose exec -T postgres pg_dump -U postgres -Fc "$database" | age -r "$key" -o "$destination"
  test -s "$destination"
  chmod 600 "$destination"
  echo "Backed up $database: $destination"
done
retention="$(sed -n 's/^BACKUP_RETENTION_DAYS=//p' "$CERA_ENV_FILE" | tail -1)"
retention="${retention:-14}"
[[ "$retention" =~ ^[0-9]+$ ]] && (( retention >= 7 )) || { echo 'BACKUP_RETENTION_DAYS must be at least 7' >&2; exit 1; }
find "$backup_dir" -maxdepth 1 -type f -name "${ENVIRONMENT}-*.dump.age" -mtime "+$retention" -delete
