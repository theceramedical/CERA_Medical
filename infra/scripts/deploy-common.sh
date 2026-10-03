#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENVIRONMENT="${1:?staging or production required}"
case "$ENVIRONMENT" in staging|production) ;; *) echo 'Invalid environment' >&2; exit 2;; esac
cd "$ROOT_DIR"
CERA_ENV_FILE="${CERA_ENV_FILE:-$ROOT_DIR/.env}"
RELEASE_FILE="${RELEASE_FILE:-$ROOT_DIR/.release.env}"
export CERA_ENV_FILE
[[ -f "$CERA_ENV_FILE" ]] || { echo "Missing host secrets: $CERA_ENV_FILE" >&2; exit 1; }

compose() {
  docker compose --env-file "$CERA_ENV_FILE" --env-file "$RELEASE_FILE" \
    -f compose.yaml -f infra/compose/compose.application.yaml \
    -f "infra/compose/compose.$ENVIRONMENT.yaml" \
    -f infra/compose/compose.authentik.yaml "$@"
}

require_release_file() {
  [[ -f "$RELEASE_FILE" ]] || { echo "Missing release manifest: $RELEASE_FILE" >&2; exit 1; }
}

wait_healthy() {
  local service container state attempt
  for service in postgres valkey authentik-server authentik-worker web api worker cms commerce commerce-worker caddy; do
    container="$(compose ps -q "$service")"
    [[ -n "$container" ]] || { echo "$service is not running" >&2; return 1; }
    for attempt in {1..30}; do
      state="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")"
      if [[ "$state" == healthy ]]; then break; fi
      # Authentik, its worker, commerce-worker, and Caddy have no Docker
      # healthcheck; their container must at least be running. Public smoke
      # checks verify the edge routes after the containers start.
      if [[ "$state" == running && ( "$service" == authentik-server || "$service" == authentik-worker || "$service" == commerce-worker || "$service" == caddy ) ]]; then break; fi
      [[ "$state" == unhealthy || "$state" == exited || "$state" == dead ]] && { echo "$service is $state" >&2; return 1; }
      sleep 3
    done
    if [[ "$state" != healthy && !( "$state" == running && ( "$service" == authentik-server || "$service" == authentik-worker || "$service" == commerce-worker || "$service" == caddy ) ) ]]; then
      echo "$service did not become healthy (state=$state)" >&2; return 1
    fi
  done
}
