#!/usr/bin/env bash
# Re-apply customer Authentik branding, Google enrollment, and email_verified
# mappings without a full release. Run on the production host as the deploy user.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
compose=(docker compose)
if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
  compose+=(--project-name "$COMPOSE_PROJECT_NAME")
fi
"${compose[@]}" exec -T authentik-server ak shell \
  -c 'exec(__import__("sys").stdin.read())' \
  < "$ROOT_DIR/infra/scripts/configure-authentik-customer-experience.py"
