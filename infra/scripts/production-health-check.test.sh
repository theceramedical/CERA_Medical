#!/usr/bin/env bash
# Mocked topology-level checks for the production health and rollback scripts.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/infra/scripts" "$fixture/bin"
cp "$root/infra/scripts/"{deploy-common.sh,health-check.sh,rollback.sh,smoke-test.sh} "$fixture/infra/scripts/"
touch "$fixture/compose.yaml"
cat > "$fixture/.env" <<'ENV'
CERA_DOMAIN=example.test
CERA_APP_DB=custom_app
CERA_CMS_DB=custom_cms
CERA_COMMERCE_DB=custom_commerce
AUTHENTIK_DB=custom_auth
POSTGRES_SUPERUSER=postgres
ENV
printf 'WEB_IMAGE=old\nAPI_IMAGE=old\nWORKER_IMAGE=old\nCMS_IMAGE=old\nCOMMERCE_IMAGE=old\nMIGRATOR_IMAGE=old\n' > "$fixture/.release.env"
cp "$fixture/.release.env" "$fixture/.release.previous.env"

cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == inspect ]]; then
  template="$3"; id="$4"; service="${id#mock-}"
  if [[ "$template" == *"else}}{{.State.Status}}"* ]]; then
    case "$service" in postgres|valkey|web|api|worker|cms|commerce) echo healthy ;; *) echo running ;; esac
  elif [[ "$template" == *State.Health* ]]; then
    case "$service" in postgres|valkey|web|api|worker|cms|commerce) echo healthy ;; *) echo none ;; esac
  elif [[ "$template" == *State.Status* ]]; then echo running
  else exit 2; fi
  exit 0
fi
[[ "$1" == compose ]] || { echo "unexpected docker invocation: $*" >&2; exit 2; }
shift
case " $* " in
  *" ps -q "*)
    service="${@: -1}"
    echo "mock-$service"
    ;;
  *" exec -T postgres psql "*)
    echo 1
    ;;
  *" exec -T valkey valkey-cli ping "*)
    echo PONG
    ;;
  *" exec -T valkey valkey-cli set "*)
    echo OK
    ;;
  *" exec -T valkey valkey-cli get "*)
    echo ok
    ;;
  *" exec -T valkey valkey-cli del "*)
    echo 1
    ;;
  *" up -d --no-deps "*)
    printf '%s\n' "$*" >> "$MOCK_DOCKER_LOG"
    ;;
  *) echo "unexpected docker compose invocation: $*" >&2; exit 2 ;;
esac
MOCK
cat > "$fixture/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
for argument in "$@"; do
  if [[ "$argument" == '%{http_code}' ]]; then echo 302; exit 0; fi
done
exit 0
MOCK
chmod +x "$fixture/bin/"*
export MOCK_DOCKER_LOG="$fixture/docker.log"
export PATH="$fixture/bin:$PATH"

output="$(cd "$fixture" && bash infra/scripts/health-check.sh production)"
for service in postgres valkey authentik-server authentik-worker web api worker cms commerce commerce-worker caddy; do
  [[ "$output" == *"$service"* ]] || { echo "Health check omitted $service" >&2; echo "$output" >&2; exit 1; }
done
[[ "$output" == *'public-smoke'* ]] || { echo 'Public smoke test did not run' >&2; exit 1; }
if rg -qi 'seaweedfs|mailpit|localhost:8025|cera-postgres-1' "$fixture/infra/scripts/health-check.sh"; then
  echo 'Production health check still depends on local-only service names or ports' >&2
  exit 1
fi

(cd "$fixture" && bash infra/scripts/rollback.sh production)
rollback_services="$(cat "$MOCK_DOCKER_LOG")"
for service in web api worker cms commerce commerce-worker caddy authentik-server authentik-worker; do
  [[ "$rollback_services" == *"$service"* ]] || { echo "Rollback omitted $service" >&2; exit 1; }
done
echo 'Production health-check and rollback fixture passed'
