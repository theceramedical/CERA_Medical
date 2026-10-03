#!/usr/bin/env bash
# Verify the single-server production Compose topology and public read-only routes.
# Usage: infra/scripts/health-check.sh [production] [--wait]
set -uo pipefail
ENVIRONMENT="${1:-production}"
WAIT_MODE=false
if [[ "${2:-}" == "--wait" || "${1:-}" == "--wait" ]]; then
  WAIT_MODE=true
  ENVIRONMENT="${1/--wait/production}"
fi
source "$(dirname "$0")/deploy-common.sh" "$ENVIRONMENT"
require_release_file
WAIT_SECONDS="${HEALTH_CHECK_TIMEOUT_SECONDS:-180}"
[[ "$WAIT_SECONDS" =~ ^[0-9]+$ ]] || { echo 'HEALTH_CHECK_TIMEOUT_SECONDS must be an integer' >&2; exit 2; }
PASS=0; FAIL=0
C_RESET='\033[0m'; C_GREEN='\033[0;32m'; C_RED='\033[0;31m'
report() {
  local status="$1" name="$2" detail="${3:-}"
  if [[ "$status" == pass ]]; then
    printf "  ${C_GREEN}PASS${C_RESET}  %-24s %s\n" "$name" "$detail"; PASS=$((PASS + 1))
  else
    printf "  ${C_RED}FAIL${C_RESET}  %-24s %s\n" "$name" "$detail"; FAIL=$((FAIL + 1))
  fi
}
configured_setting() {
  local name="$1" value="${2:-}" fallback="${3:-}"
  if [[ -z "$value" ]]; then
    value="$(sed -n "s/^${name}=//p" "$CERA_ENV_FILE" | tail -1)"
  fi
  value="${value%\"}"; value="${value#\"}"
  printf '%s' "${value:-$fallback}"
}

check_service() {
  local service="$1" require_health="${2:-false}" container state health attempt
  container="$(compose ps -q "$service" 2>/dev/null | head -1)"
  if [[ -z "$container" ]]; then report fail "$service" 'container is missing'; return 1; fi
  for attempt in {1..3}; do
    state="$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || true)"
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || true)"
    if [[ "$state" == running && ( "$health" == healthy || ( "$health" == none && "$require_health" == false ) ) ]]; then
      report pass "$service" "running${health/none/}"; return 0
    fi
    [[ "$state" == exited || "$state" == dead || "$health" == unhealthy ]] && break
    sleep 2
  done
  report fail "$service" "state=${state:-unknown}, health=${health:-unknown}"; return 1
}
check_databases() {
  local db result failed=0
  local databases=(
    "$(configured_setting CERA_APP_DB "${CERA_APP_DB:-}" cera_app)"
    "$(configured_setting CERA_CMS_DB "${CERA_CMS_DB:-}" cera_cms)"
    "$(configured_setting CERA_COMMERCE_DB "${CERA_COMMERCE_DB:-}" cera_commerce)"
    "$(configured_setting AUTHENTIK_DB "${AUTHENTIK_DB:-}" authentik)"
  )
  for db in "${databases[@]}"; do
    if [[ ! "$db" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      report fail postgres "invalid configured database name: $db"
      failed=1
      continue
    fi
    result="$(compose exec -T postgres psql -U "${POSTGRES_SUPERUSER:-postgres}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" 2>/dev/null || true)"
    if [[ "$result" == *1* ]]; then report pass "database:$db" 'present'
    else report fail "database:$db" 'missing or PostgreSQL query failed'; failed=1; fi
  done
  return "$failed"
}
check_valkey() {
  local probe="cera:health:$$" value
  if ! compose exec -T valkey valkey-cli ping 2>/dev/null | grep -q PONG; then report fail valkey 'PING did not return PONG'; return 1; fi
  if ! compose exec -T valkey valkey-cli set "$probe" ok EX 30 >/dev/null 2>&1; then report fail valkey 'write failed'; return 1; fi
  value="$(compose exec -T valkey valkey-cli get "$probe" 2>/dev/null | tr -d '\r')"
  compose exec -T valkey valkey-cli del "$probe" >/dev/null 2>&1 || true
  if [[ "$value" == ok ]]; then report pass valkey 'PING and temporary write/read passed'; return 0; fi
  report fail valkey 'temporary write did not read back'; return 1
}
check_public_routes() {
  local domain="$(configured_setting CERA_DOMAIN "${CERA_DOMAIN:-}")" origin api
  if [[ -n "${SMOKE_ORIGIN:-}" && -n "${SMOKE_API:-}" ]]; then origin="$SMOKE_ORIGIN"; api="$SMOKE_API"
  elif [[ -n "$domain" ]]; then origin="https://www.$domain"; api="https://api.$domain"
  else report fail public-smoke 'CERA_DOMAIN (or SMOKE_ORIGIN and SMOKE_API) is required'; return 1; fi
  if SMOKE_ORIGIN="$origin" SMOKE_API="$api" bash "$ROOT_DIR/infra/scripts/smoke-test.sh"; then report pass public-smoke "$origin"; return 0; fi
  report fail public-smoke 'read-only public smoke test failed'; return 1
}
run_checks() {
  PASS=0; FAIL=0
  echo "Production services ($ENVIRONMENT)"
  check_service postgres true || true
  check_service valkey true || true
  check_service authentik-server false || true
  check_service authentik-worker false || true
  check_service web true || true
  check_service api true || true
  check_service worker true || true
  check_service cms true || true
  check_service commerce true || true
  check_service commerce-worker false || true
  check_service caddy false || true
  check_databases || true
  check_valkey || true
  check_public_routes || true
  printf '%d passed, %d failed\n' "$PASS" "$FAIL"
  [[ $FAIL -eq 0 ]]
}
if [[ "$WAIT_MODE" == true ]]; then
  deadline=$(( $(date +%s) + WAIT_SECONDS ))
  until run_checks; do
    if (( $(date +%s) >= deadline )); then echo "Timed out after ${WAIT_SECONDS}s waiting for production health." >&2; exit 1; fi
    echo 'Retrying production health checks in 5 seconds...'; sleep 5
  done
else
  run_checks
fi
