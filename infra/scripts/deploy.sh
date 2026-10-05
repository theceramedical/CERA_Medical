#!/usr/bin/env bash
# Run on the deployment host after images have been pushed and host secrets installed.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh" "${1:?environment required}"
image_prefix="${IMAGE_PREFIX:?IMAGE_PREFIX required, e.g. ghcr.io/owner/repo}"
image_tag="${IMAGE_TAG:?IMAGE_TAG required}"
[[ "$image_tag" =~ ^[a-zA-Z0-9._-]+$ ]] || { echo 'Invalid image tag' >&2; exit 2; }
[[ "$image_prefix" =~ ^[a-zA-Z0-9._/-]+$ ]] || { echo 'Invalid image prefix' >&2; exit 2; }
if [[ -f "$RELEASE_FILE" ]]; then
  cp "$RELEASE_FILE" "$ROOT_DIR/.release.previous.env"
else
  rm -f "$ROOT_DIR/.release.previous.env"
fi
tmp="$(mktemp "$ROOT_DIR/.release.env.XXXXXX")"
pull_dir=""
cleanup() {
  local result=$?
  [[ -n "$pull_dir" ]] && rm -rf "$pull_dir"
  rm -f "$tmp"
  if (( result != 0 )); then
    if [[ -f "$ROOT_DIR/.release.previous.env" ]]; then
      cp "$ROOT_DIR/.release.previous.env" "$RELEASE_FILE"
    else
      rm -f "$RELEASE_FILE"
    fi
  fi
  return "$result"
}
trap cleanup EXIT
chmod 600 "$tmp"
# shellcheck source=deploy-resolve-images.sh
source "$(dirname "$0")/deploy-resolve-images.sh"
all_apps=(web api worker cms commerce migrator)
pull_dir="$(mktemp -d)"
pull_queue=()
for app in "${all_apps[@]}"; do
  if should_pull_app "$app"; then
    pull_queue+=("$app")
  else
    [[ -f "$ROOT_DIR/.release.previous.env" ]] || {
      echo "Missing prior release manifest; cannot reuse $app image. Run with all apps in CERA_PULL_APPS." >&2
      exit 1
    }
    reuse_app_digest "$app" "$ROOT_DIR/.release.previous.env" "$pull_dir/$app.env"
  fi
done
parallel_max="${CERA_PULL_PARALLEL:-3}"
for ((offset = 0; offset < ${#pull_queue[@]}; offset += parallel_max)); do
  batch=( "${pull_queue[@]:offset:parallel_max}" )
  for app in "${batch[@]}"; do
    pull_one_app "$app" "$image_prefix" "$image_tag" "$pull_dir/$app.env" &
  done
  wait
done
for app in "${all_apps[@]}"; do
  [[ -f "$pull_dir/$app.env" ]] || { echo "Missing resolved image for $app" >&2; exit 1; }
  cat "$pull_dir/$app.env" >> "$tmp"
done
mv "$tmp" "$RELEASE_FILE"
compose config -q
compose up -d postgres valkey authentik-server authentik-worker
bash "$ROOT_DIR/infra/scripts/backup.sh" "$ENVIRONMENT"
if ! compose --profile migration run --rm migrator; then
  echo 'Migration failed. Previous images were not restarted. Restore requires explicit incident procedure.' >&2
  exit 1
fi
if ! timeout 180s docker compose --env-file "$CERA_ENV_FILE" --env-file "$RELEASE_FILE" \
  -f compose.yaml -f infra/compose/compose.application.yaml \
  -f "infra/compose/compose.$ENVIRONMENT.yaml" -f infra/compose/compose.authentik.yaml \
  run --rm --no-deps -e CERA_ALLOW_PRODUCTION_CATALOGUE_SEED=approved \
  --entrypoint node commerce /app/dist/seed.js; then
  bash "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Catalogue seed failed' >&2
  exit 1
fi
compose up -d web api worker cms commerce commerce-worker caddy
if ! wait_healthy; then
  bash "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Release health gate failed' >&2
  exit 1
fi
bootstrap_ok=false
for attempt in 1 2 3 4 5; do
  if compose exec -T cms node -e '
    const secret=process.env.PAYLOAD_PREVIEW_SECRET;
    if (!secret) { console.error("PAYLOAD_PREVIEW_SECRET is required for initial CMS content"); process.exit(1); }
    fetch("http://127.0.0.1:3001/api/bootstrap-client-content", {
      method:"POST", headers:{"x-preview-secret":secret}, signal:AbortSignal.timeout(30000)
    }).then(async r=>{if(!r.ok) throw Error(`CMS content bootstrap returned ${r.status}`);})
      .catch(e=>{console.error(e.message);process.exitCode=1;});
  '; then
    bootstrap_ok=true
    break
  fi
  echo "CMS bootstrap attempt $attempt failed; retrying in 15s" >&2
  sleep 15
done
if [[ "$bootstrap_ok" != true ]]; then
  echo 'WARNING: CMS bootstrap failed after 5 attempts. The release stays live; run bootstrap manually when CMS is ready.' >&2
fi
oidc_redirect_uri="$(grep -E '^OIDC_REDIRECT_URI=' "$CERA_ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)"
if [[ -z "$oidc_redirect_uri" ]]; then
  echo 'OIDC_REDIRECT_URI missing from host secrets' >&2
  exit 1
fi
if ! compose exec -T -e "OIDC_REDIRECT_URI=$oidc_redirect_uri" authentik-server ak shell \
  -c 'exec(__import__("sys").stdin.read())' < "$ROOT_DIR/infra/scripts/configure-authentik-cera.py"; then
  bash "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Authentik CERA role setup failed' >&2
  exit 1
fi
if ! compose exec -T worker node -e '
  if (process.env.CRM_DRIVER !== "erpnext") process.exit(0);
  const {ERPNEXT_URL,ERPNEXT_API_KEY,ERPNEXT_API_SECRET}=process.env;
  const url=new URL("/api/resource/Lead",ERPNEXT_URL);
  url.searchParams.set("fields",JSON.stringify(["name","custom_cera_reference","custom_cera_service","custom_cera_status","custom_cera_message"]));
  url.searchParams.set("filters",JSON.stringify([["custom_cera_reference","=","CERA-HEALTH-NOT-EXIST"]]));
  fetch(url,{headers:{authorization:`token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`},signal:AbortSignal.timeout(10000)})
    .then(r=>{if(!r.ok) throw Error(`ERPNext Lead check returned ${r.status}`);})
    .catch(e=>{console.error(e.message);process.exitCode=1;});
'; then
  bash "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'ERPNext CRM preflight failed' >&2
  exit 1
fi
if ! bash "$ROOT_DIR/infra/scripts/health-check.sh" "$ENVIRONMENT"; then
  bash "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Production health and public smoke gate failed' >&2
  exit 1
fi
printf 'Deployed %s at %s\n' "$image_tag" "$(date -u +%FT%TZ)"
