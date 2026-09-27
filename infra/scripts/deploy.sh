#!/usr/bin/env bash
# Promote a recorded image digest, migrate, then health-check.
# Usage: ./infra/scripts/deploy.sh <digest>
set -euo pipefail

DIGEST="${1:?image digest required}"
echo "deploying digest ${DIGEST}"
echo "migrate cera_app, cera_cms, cera_commerce before traffic"
echo "health gate: ./infra/scripts/health-check.sh --wait"
echo "on failure: ./infra/scripts/rollback.sh"
