#!/usr/bin/env bash
# Roll back container images. Database migrations are forward-only.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh" "${1:?environment required}"
previous="$ROOT_DIR/.release.previous.env"
[[ -f "$previous" ]] || { echo 'No previous release manifest' >&2; exit 1; }
cp "$previous" "$RELEASE_FILE"
compose up -d --no-deps web api worker cms commerce commerce-worker
wait_healthy
echo 'Previous images restored; inspect migrations for forward compatibility.'
