#!/usr/bin/env bash
# Roll back the complete CERA runtime image set. Database migrations are forward-only.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh" "${1:?environment required}"
previous="$ROOT_DIR/.release.previous.env"
[[ -f "$previous" ]] || { echo 'No previous release manifest' >&2; exit 1; }
cp "$previous" "$RELEASE_FILE"

# Keep the whole public runtime on one release: edge routing and identity are
# part of the deployed behavior just as much as the application containers.
compose up -d --no-deps web api worker cms commerce commerce-worker caddy authentik-server authentik-worker
wait_healthy

health_check="$ROOT_DIR/infra/scripts/health-check.sh"
if [[ -x "$health_check" ]]; then
  "$health_check" "$ENVIRONMENT"
else
  echo 'Production health-check script is unavailable' >&2
  exit 1
fi

echo 'Previous runtime image set restored and health/smoke checks passed; inspect migrations for forward compatibility.'
