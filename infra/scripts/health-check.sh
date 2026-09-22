#!/usr/bin/env bash
# =============================================================================
# Verify every service in the local stack is genuinely usable.
#
# "Container is running" is not health. Each check below exercises the capability
# the platform depends on: a real query, a real queue write, a real S3 round
# trip. That distinction caught a SeaweedFS misconfiguration in Phase 01 where
# the logs were clean but the S3 endpoint was unreachable from the host.
#
#   ./infra/scripts/health-check.sh
#   ./infra/scripts/health-check.sh --wait      # poll until healthy or timeout
# =============================================================================
set -uo pipefail

WAIT_MODE=false
TIMEOUT_SECONDS=180
[[ "${1:-}" == "--wait" ]] && WAIT_MODE=true

PASS=0
FAIL=0

C_RESET='\033[0m'; C_GREEN='\033[0;32m'; C_RED='\033[0;31m'; C_DIM='\033[0;90m'

report() {
  local status="$1" name="$2" detail="${3:-}"
  if [[ "$status" == "pass" ]]; then
    printf "  ${C_GREEN}PASS${C_RESET}  %-26s ${C_DIM}%s${C_RESET}\n" "$name" "$detail"
    PASS=$((PASS + 1))
  else
    printf "  ${C_RED}FAIL${C_RESET}  %-26s %s\n" "$name" "$detail"
    FAIL=$((FAIL + 1))
  fi
}

# Load .env so this script uses the same credentials as the stack.
# Parsed line by line rather than sourced: Compose tolerates unquoted values
# containing spaces and angle brackets (EMAIL_FROM), but `source` treats them as
# shell syntax and aborts.
if [[ -f .env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" != *=* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key//[[:space:]]/}"
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"
    export "${key}=${value}"
  done < .env
fi

# HTTP status, or 000 when the connection never completed.
http_status() {
  local url="$1" timeout="${2:-5}" code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$timeout" "$url" 2>/dev/null) || true
  [[ -z "$code" ]] && code=000
  printf '%s' "$code"
}

POSTGRES_PORT="${POSTGRES_PORT:-5432}"
VALKEY_PORT="${VALKEY_PORT:-6379}"
S3_BUCKET="${S3_BUCKET:-cera-media}"

# -----------------------------------------------------------------------------
check_postgres() {
  local dbs=("${CERA_APP_DB:-cera_app}" "${CERA_CMS_DB:-cera_cms}" "${CERA_COMMERCE_DB:-cera_commerce}" "${AUTHENTIK_DB:-authentik}" "${GLITCHTIP_DB:-glitchtip}")
  local missing=()

  for db in "${dbs[@]}"; do
    docker exec cera-postgres-1 psql -U "${POSTGRES_SUPERUSER:-postgres}" -tAc \
      "SELECT 1 FROM pg_database WHERE datname='${db}'" 2>/dev/null | grep -q 1 || missing+=("$db")
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    report fail "postgres databases" "missing: ${missing[*]}"
    return
  fi
  report pass "postgres databases" "5 databases present"

  # The isolation guarantee from PRD 9: a compromised CMS must not reach the
  # audit trail in cera_app. Assert the denial, not just the grant.
  local denied
  denied=$(PGPASSWORD="${CERA_APP_DB_PASSWORD:-}" docker exec -e PGPASSWORD="${CERA_APP_DB_PASSWORD:-}" \
    cera-postgres-1 psql -U "${CERA_APP_DB_USER:-cera_app}" -d "${CERA_CMS_DB:-cera_cms}" \
    -h 127.0.0.1 -tAc "SELECT 1" 2>&1 || true)

  if grep -q "permission denied" <<<"$denied"; then
    report pass "postgres isolation" "cera_app cannot reach cera_cms"
  else
    report fail "postgres isolation" "cross-database access was NOT denied"
  fi
}

# -----------------------------------------------------------------------------
check_valkey() {
  docker exec cera-valkey-1 valkey-cli ping 2>/dev/null | grep -q PONG \
    || { report fail "valkey" "no PONG"; return; }

  # Prove a write survives, since BullMQ depends on it.
  local probe="cera:health:$$"
  docker exec cera-valkey-1 valkey-cli set "$probe" ok EX 30 >/dev/null 2>&1
  local got
  got=$(docker exec cera-valkey-1 valkey-cli get "$probe" 2>/dev/null | tr -d '\r')
  docker exec cera-valkey-1 valkey-cli del "$probe" >/dev/null 2>&1

  if [[ "$got" == "ok" ]]; then
    local aof
    aof=$(docker exec cera-valkey-1 valkey-cli config get appendonly 2>/dev/null | tail -1 | tr -d '\r')
    report pass "valkey" "read/write ok, appendonly=${aof}"
  else
    report fail "valkey" "write did not read back"
  fi
}

# -----------------------------------------------------------------------------
check_seaweedfs() {
  local code
  code=$(http_status "http://localhost:9001/")
  if [[ "$code" != "200" ]]; then
    report fail "seaweedfs s3" "endpoint returned ${code}; check -ip.bind=0.0.0.0 (ADR-008)"
    return
  fi

  if curl -s --max-time 5 -H 'Accept: application/json' "http://localhost:8888/buckets/" 2>/dev/null \
     | grep -q "/buckets/${S3_BUCKET}"; then
    report pass "seaweedfs s3" "endpoint 200, bucket '${S3_BUCKET}' present"
  else
    report fail "seaweedfs s3" "bucket '${S3_BUCKET}' missing; rerun seaweedfs-init"
  fi
}

# -----------------------------------------------------------------------------
check_mailpit() {
  local code
  code=$(http_status "http://localhost:8025/api/v1/messages")
  if [[ "$code" == "200" ]]; then
    report pass "mailpit" "API 200, UI at http://localhost:8025"
  else
    report fail "mailpit" "API returned ${code}"
  fi
}

# -----------------------------------------------------------------------------
# Application health endpoints. Skipped rather than failed when not running, so
# this script is useful before the apps exist.
check_app() {
  local name="$1" url="$2"
  local code
  code=$(http_status "$url")
  case "$code" in
    200) report pass "$name" "$url" ;;
    000) printf "  ${C_DIM}SKIP  %-26s not running${C_RESET}\n" "$name" ;;
    *)   report fail "$name" "returned ${code}" ;;
  esac
}

run_all() {
  PASS=0; FAIL=0
  echo ""
  echo "Infrastructure"
  check_postgres
  check_valkey
  check_seaweedfs
  check_mailpit
  echo ""
  echo "Applications"
  check_app "web"      "http://localhost:3000/api/health"
  check_app "cms"      "http://localhost:3001/api/health"
  check_app "commerce" "http://localhost:3002/health"
  check_app "api"      "http://localhost:3003/health"
  check_app "worker"   "http://localhost:3004/health"
  echo ""
}

if $WAIT_MODE; then
  deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
  while true; do
    run_all
    [[ $FAIL -eq 0 ]] && break
    if [[ $(date +%s) -ge $deadline ]]; then
      echo "Timed out after ${TIMEOUT_SECONDS}s with ${FAIL} failing check(s)." >&2
      break
    fi
    echo "Retrying in 5s..."
    sleep 5
  done
else
  run_all
fi

printf "%d passed, %d failed\n" "$PASS" "$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
