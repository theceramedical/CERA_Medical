#!/usr/bin/env bash
# Resolve per-app image digests for deploy.sh (pull new tags and/or reuse prior release).
set -euo pipefail

image_digest_from_pulled() {
  local app="$1" image="$2" prefix="$3"
  local digest='' reference
  while IFS= read -r reference; do
    if [[ "$reference" == "$prefix/$app"@sha256:* ]]; then
      digest="$reference"
      break
    fi
  done < <(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image")
  [[ "$digest" == *@sha256:* ]] || {
    echo "No registry digest for $image" >&2
    return 1
  }
  printf '%s' "$digest"
}

pull_one_app() {
  local app="$1" image_prefix="$2" image_tag="$3" out_file="$4"
  local image="$image_prefix/$app:$image_tag"
  if [[ "${CERA_SKIP_IMAGE_PULL:-}" == 1 ]]; then
    docker image inspect "$image" >/dev/null
    local id
    id="$(docker image inspect --format '{{.Id}}' "$image")"
    printf '%s_IMAGE=%s\n' "${app^^}" "$image_prefix/$app@$id" >"$out_file"
    return 0
  fi
  docker pull "$image"
  printf '%s_IMAGE=%s\n' "${app^^}" "$(image_digest_from_pulled "$app" "$image" "$image_prefix")" >"$out_file"
}

should_pull_app() {
  local app="$1"
  if [[ -z "${CERA_PULL_APPS:-}" ]]; then
    return 0
  fi
  local item
  IFS=',' read -ra pull_list <<<"$CERA_PULL_APPS"
  for item in "${pull_list[@]}"; do
    [[ "$item" == "$app" ]] && return 0
  done
  return 1
}

reuse_app_digest() {
  local app="$1" previous_file="$2" out_file="$3"
  local key="${app^^}_IMAGE" line
  line="$(grep -E "^${key}=" "$previous_file" | tail -1 || true)"
  [[ -n "$line" ]] || {
    echo "No previous digest to reuse for $app (set CERA_PULL_APPS or run a full release first)" >&2
    return 1
  }
  printf '%s\n' "$line" >"$out_file"
}
