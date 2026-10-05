#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
fixture="$(mktemp -d)"
cleanup() { rm -rf -- "$fixture"; }
trap cleanup EXIT
# shellcheck source=deploy-resolve-images.sh
source "$root/infra/scripts/deploy-resolve-images.sh"

previous="$fixture/.release.previous.env"
printf 'WEB_IMAGE=ghcr.io/example/web@sha256:abc\n' >"$previous"

export CERA_PULL_APPS=web
should_pull_app web || exit 1
should_pull_app api && exit 1

out="$fixture/web.env"
reuse_app_digest web "$previous" "$out"
grep -q '^WEB_IMAGE=ghcr.io/example/web@sha256:abc$' "$out"

if reuse_app_digest api "$previous" "$fixture/missing.env" 2>/dev/null; then
  echo 'expected reuse failure for missing api digest' >&2
  exit 1
fi

echo 'deploy-resolve-images fixture passed'
