#!/usr/bin/env bash
set -euo pipefail

app="${1:?app required}"
out="${2:?output directory required}"

mkdir -p "$out"

prepare_shared_package() {
  local package="$1" package_dir="$2"
  local installed="$out/node_modules/@cera/$package"
  if [[ ! -d "$installed" ]]; then return; fi
  pnpm --filter "@cera/$package" build
  cp -a "$package_dir/dist" "$installed/dist"
  node - "$installed/package.json" <<'NODE'
const fs = require('node:fs');
const file = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const entry of Object.values(manifest.exports ?? {})) {
  if (typeof entry !== 'object' || entry === null || typeof entry.default !== 'string') continue;
  if (entry.default.startsWith('./src/') && entry.default.endsWith('.ts')) {
    entry.default = entry.default.replace('./src/', './dist/').replace(/\.ts$/, '.js');
  }
}
fs.writeFileSync(file, JSON.stringify(manifest));
NODE
}

deploy_package() {
  local selector="$1" target="$2"
  pnpm --filter "$selector" deploy --legacy --prod "$target"
  out="$target" prepare_shared_package contracts packages/contracts
  out="$target" prepare_shared_package observability packages/observability
}

case "$app" in
  web|cms)
    pnpm --filter "$app" build
    cp -a "apps/$app/.next/standalone/." "$out/"
    mkdir -p "$out/apps/$app/.next"
    cp -a "apps/$app/.next/static" "$out/apps/$app/.next/static"
    if [[ -d "apps/$app/public" ]]; then cp -a "apps/$app/public" "$out/apps/$app/public"; fi
    ;;
  api|worker|commerce)
    case "$app" in
      api) selector='@cera/api' ;;
      worker) selector='@cera/worker' ;;
      commerce) selector='commerce' ;;
    esac
    pnpm --filter "$selector" build
    deploy_package "$selector" "$out"
    ;;
  migrator)
    for migration_dir in apps/cms/migrations apps/commerce/migrations; do
      if ! find "$migration_dir" -maxdepth 1 -type f ! -name '.gitkeep' | grep -q .; then
        echo "No committed migrations in $migration_dir; refusing release image" >&2
        exit 1
      fi
    done
    pnpm --filter @cera/db build
    pnpm --filter commerce build:server
    deploy_package @cera/db "$out/db"
    deploy_package cms "$out/cms"
    deploy_package commerce "$out/commerce"
    # The database package ships source and SQL; compiled entrypoints are needed
    # when running migrations inside a production-only image.
    cp -a packages/db/dist "$out/db/dist"
    cp -a apps/cms/migrations/. "$out/cms/migrations/"
    cp -a apps/commerce/migrations/. "$out/commerce/migrations/"
    ;;
  *) echo "Unsupported app: $app" >&2; exit 2 ;;
esac
