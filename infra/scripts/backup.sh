#!/usr/bin/env bash
# Logical backup of cera_app. Record start time for the restore rehearsal.
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
echo "backup start ${STAMP}"
echo "pg_dump --format=custom --file=cera_app-${STAMP}.dump cera_app"
echo "backup end $(date -u +%Y%m%dT%H%M%SZ)"
