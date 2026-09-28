#!/usr/bin/env bash
set -euo pipefail

case "${CERA_APP:?CERA_APP required}" in
  web|cms)
    export PORT="${PORT:?PORT required}" HOSTNAME=0.0.0.0
    exec node "/app/apps/$CERA_APP/server.js"
    ;;
  api) exec node /app/dist/server.js ;;
  worker) exec node /app/dist/main.js ;;
  commerce) exec node /app/dist/index.js ;;
  commerce-worker) exec node /app/dist/index-worker.js ;;
  migrator)
    if ! find /app/cms/migrations -type f ! -name '.gitkeep' | grep -q .; then
      echo 'CMS migrations are missing; refusing release' >&2
      exit 1
    fi
    if ! find /app/commerce/migrations -type f ! -name '.gitkeep' | grep -q .; then
      echo 'Commerce migrations are missing; refusing release' >&2
      exit 1
    fi
    node /app/db/dist/migrate.js
    cd /app/cms
    ./node_modules/.bin/payload migrate
    cd /app/commerce
    exec node dist/migrate.js
    ;;
  *) echo "Unsupported CERA_APP" >&2; exit 2 ;;
esac
