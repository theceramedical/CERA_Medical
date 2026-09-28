#!/usr/bin/env bash
# Destructive restore, intended for an isolated rehearsal or an approved incident.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh" "${1:?environment required}"
database="${2:?database required}"
dump="${3:?encrypted dump required}"
case "$database" in cera_app|cera_cms|cera_commerce|authentik|glitchtip) ;; *) echo 'Unsupported database' >&2; exit 2;; esac
[[ "${RESTORE_CONFIRM:-}" == "restore:$ENVIRONMENT:$database" ]] || { echo "Set RESTORE_CONFIRM=restore:$ENVIRONMENT:$database to acknowledge replacement" >&2; exit 2; }
[[ -f "$dump" ]] || { echo 'Dump not found' >&2; exit 1; }
[[ -f "${BACKUP_AGE_IDENTITY_FILE:-}" ]] || { echo 'BACKUP_AGE_IDENTITY_FILE missing' >&2; exit 1; }
require_release_file
age -d -i "$BACKUP_AGE_IDENTITY_FILE" "$dump" | compose exec -T postgres pg_restore -U postgres -d "$database" --clean --if-exists --exit-on-error
compose exec -T postgres psql -U postgres -d "$database" -Atc 'select current_database(), count(*) from information_schema.tables where table_schema = '\''public'\'';'
if [[ "$database" == cera_app ]]; then
  compose exec -T postgres psql -U postgres -d "$database" -Atc 'select (select count(*) from enquiries), (select count(*) from outbox), (select count(*) from audit_events);'
fi
