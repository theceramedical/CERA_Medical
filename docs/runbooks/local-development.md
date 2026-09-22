# Local development

Day-to-day operation of the local stack.

## First-time setup

```bash
nvm use                 # reads .nvmrc -> 24.21.0
corepack enable
pnpm install
cp .env.example .env    # then fill in the placeholders
pnpm stack:up
pnpm health
```

`pnpm health` should report every infrastructure check passing and the applications as `SKIP` until you
start them with `pnpm dev`.

## Daily loop

```bash
pnpm stack:up     # infrastructure, if not already running
pnpm dev          # every app in watch mode
```

Stop with `Ctrl+C`; leave the infrastructure running. `pnpm stack:down` stops the containers and keeps
the data. `pnpm stack:reset` deletes the volumes, which throws away your local database.

## Troubleshooting

### `ERR_PNPM_UNSUPPORTED_ENGINE`

```
Your Node version is incompatible. Expected: >=24.11.0  Got: v22.22.0
```

`engine-strict=true` is doing its job. Run `nvm use`. If `node -v` already reports 24 but pnpm still
reports the old version, pnpm is resolving a shim from the previous Node directory:

```bash
corepack enable --install-directory "$(dirname "$(which node)")"
which pnpm    # must sit under the Node 24 directory
```

### `bad interpreter: /bin/bash^M`

A shell script has CRLF line endings. Containers cannot execute those.

```bash
git config core.autocrlf false
perl -i -pe 's/\r\n$/\n/' path/to/script.sh
```

`.gitattributes` prevents this for tracked files, so it only affects files created outside git on
Windows.

### Postgres starts, but the databases do not exist

`FATAL: database "cera_app" does not exist`. The init script only runs against an **empty** data
directory; it is skipped entirely if the volume already holds a cluster. Check the container log first:

```bash
docker logs cera-postgres-1 | grep -iE 'init|error'
```

Then recreate:

```bash
pnpm stack:reset && pnpm stack:up
```

### SeaweedFS is healthy but the app cannot reach S3

Check that `-ip.bind=0.0.0.0` is still present in the Compose command. Without it SeaweedFS binds only
to loopback inside the container, Docker forwards published ports to the container's bridge IP, and the
endpoint is unreachable from the host. The logs look entirely normal, which is what makes this one
expensive. See [ADR-008](../../.planning/adr/ADR-008-local-s3-seaweedfs-over-minio.md).

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:9001/   # expect 200
```

### Port already in use

```bash
# Windows
netstat -ano | grep ':3000' | grep -i listen    # last column is the PID
taskkill //PID <pid> //F

# macOS and Linux
lsof -ti:3000 | xargs kill
```

Ports used: 3000 web, 3001 cms, 3002 commerce, 3003 api, 3004 worker, 5432 Postgres, 6379 Valkey,
8025 Mailpit UI, 1025 Mailpit SMTP, 9001 S3, 9333 SeaweedFS master, 8888 SeaweedFS filer.

### Docker Desktop is not running

```
error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Start Docker Desktop and wait for the engine. It takes 30-60 seconds after the window appears; `docker
info` returning a server version is the real signal.

### `pnpm install` succeeds but a binary is not found

```
'eslint' is not recognized as an internal or external command
```

pnpm resolves binaries from the nearest `node_modules/.bin`. A tool invoked from the repository root -
including anything `lint-staged` runs - needs to be a root dependency, not only a workspace one.

### Typed lint rules fail on a new file

```
Parsing error: <file> was not found by the project service
```

The file is outside every `tsconfig.json` `include`. Each app has two: `tsconfig.json` covers editor
and lint and includes tests, `tsconfig.build.json` covers emit and excludes them. Add the path to the
first.

## Inspecting local state

```bash
# Database
docker exec -it cera-postgres-1 psql -U cera_app -d cera_app

# All five databases and their owners
docker exec cera-postgres-1 psql -U postgres -tAc \
  "SELECT datname, pg_get_userbyid(datdba) FROM pg_database WHERE datname NOT LIKE 'template%';"

# Queues
docker exec -it cera-valkey-1 valkey-cli
docker exec cera-valkey-1 valkey-cli --scan --pattern 'bull:*' | head

# Sent email
open http://localhost:8025

# S3 buckets
curl -s -H 'Accept: application/json' http://localhost:8888/buckets/
```

## Resetting cleanly

```bash
pnpm stack:reset       # deletes volumes: database, queues, uploaded media
pnpm stack:up
pnpm migrate
pnpm seed
```

Local seeds are fixtures, not CERA content. Every seeded record is marked `__fixture` and labelled
pending content approval, so fixture data can never be mistaken for approved copy.
