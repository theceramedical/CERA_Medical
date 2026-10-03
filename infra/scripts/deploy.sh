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
cleanup() {
  local result=$?
  rm -f "$tmp"
  if (( result != 0 )); then
    if [[ -f "$ROOT_DIR/.release.previous.env" ]]; then
      cp "$ROOT_DIR/.release.previous.env" "$RELEASE_FILE"
    else
      rm -f "$RELEASE_FILE"
    fi
  fi
}
trap cleanup EXIT
chmod 600 "$tmp"
for app in web api worker cms commerce migrator; do
  image="$image_prefix/$app:$image_tag"
  docker pull "$image"
  digest=''
  while IFS= read -r reference; do
    if [[ "$reference" == "$image_prefix/$app"@sha256:* ]]; then
      digest="$reference"
      break
    fi
  done < <(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image")
  [[ "$digest" == *@sha256:* ]] || { echo "No registry digest for $image" >&2; exit 1; }
  printf '%s_IMAGE=%s\n' "${app^^}" "$digest" >> "$tmp"
done
mv "$tmp" "$RELEASE_FILE"
compose config -q
compose up -d postgres valkey authentik-server authentik-worker
"$ROOT_DIR/infra/scripts/backup.sh" "$ENVIRONMENT"
if ! compose --profile migration run --rm migrator; then
  echo 'Migration failed. Previous images were not restarted. Restore requires explicit incident procedure.' >&2
  exit 1
fi
compose up -d web api worker cms commerce commerce-worker caddy
if ! wait_healthy; then
  "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Release health gate failed' >&2
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
  "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'ERPNext CRM preflight failed' >&2
  exit 1
fi
if ! "$ROOT_DIR/infra/scripts/health-check.sh" "$ENVIRONMENT"; then
  "$ROOT_DIR/infra/scripts/rollback.sh" "$ENVIRONMENT" || true
  echo 'Production health and public smoke gate failed' >&2
  exit 1
fi
printf 'Deployed %s at %s\n' "$image_tag" "$(date -u +%FT%TZ)"
