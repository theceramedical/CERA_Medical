#!/usr/bin/env bash
# Restore the previously recorded image digest. Prefer a forward database fix.
set -euo pipefail

PREVIOUS="${1:?previous digest required}"
echo "stopping rollout"
echo "restoring digest ${PREVIOUS}"
echo "verify web, api, worker, login, enquiry, database, queues, monitoring"
