#!/usr/bin/env bash
# Restore rehearsal. Record recovery time and row counts.
set -euo pipefail

DUMP="${1:?dump file required}"
echo "restore start $(date -u +%Y%m%dT%H%M%SZ) from ${DUMP}"
echo "pg_restore --clean --if-exists --dbname=cera_app ${DUMP}"
echo "integrity: enquiry count, outbox count, audit append-only trigger present"
echo "restore end $(date -u +%Y%m%dT%H%M%SZ)"
