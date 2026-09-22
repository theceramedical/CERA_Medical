# Phase 01 - Monorepo foundation and local stack

**PRD mapping:** FND-001, FND-002, FND-004, FND-005
**Depends on:** Phase 00
**PRD exit condition:** "All developers can work from contracts and protected PRs; staging
prerequisites are ready."

## Objective

A fresh clone installs, every local dependency starts healthy, quality gates run, and no secret or
generated artefact is tracked.

## PRD acceptance evidence

| ID      | Acceptance statement                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| FND-001 | Fresh clone installs and all workspace commands run; no secret or generated artefact is tracked.                  |
| FND-002 | A new developer follows README steps and reaches all local health endpoints within 30 minutes.                    |
| FND-004 | Required checks report independently and a failing required check blocks merge.                                   |
| FND-005 | The repository contains `.env.example` files with placeholders; real values exist only in approved secret stores. |

## Work packages

### WP-01.1 Workspace skeleton

- [ ] `pnpm-workspace.yaml` covering `apps/*` and `packages/*`
- [ ] Root `package.json` with `engines.node >= 24.15`, `packageManager`, and the script surface
      below; `private: true`
- [ ] `.npmrc` with `engine-strict=true`, `save-exact=true` for runtime deps
- [ ] `.nvmrc` pinned to 24
- [ ] `.gitignore` and `.dockerignore` covering `node_modules`, `.next`, `dist`, `.env*`
      (except `.env.example`), `coverage`, `playwright-report`, `*.dump*`
- [ ] `.editorconfig`, `.gitattributes` with `* text=auto eol=lf`

Root scripts, each fanning out through the workspace so one command is correct everywhere:
`dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:unit`, `test:contract`,
`test:integration`, `test:e2e`, `test:a11y`, `migrate`, `seed`, `health`, `smoke`, `reconcile`.

### WP-01.2 `packages/config`

- [ ] Shared TypeScript bases: `base.json`, `next.json`, `node.json`, `react-library.json`
      (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `moduleResolution: bundler`)
- [ ] Flat ESLint config with TypeScript, import ordering, `jsx-a11y`, and Prettier last
- [ ] **Custom rule `no-raw-color`** forbidding hex, `rgb()`, `hsl()`, and arbitrary Tailwind colour
      such as `bg-[#0A5378]` outside `packages/ui/src/styles/`. This is what makes
      [ADR-001](adr/ADR-001-design-tokens-from-reference-image.md) rule 2 real rather than aspirational.
- [ ] Prettier config and Vitest base config with coverage thresholds

### WP-01.3 Local service stack

`compose.yaml` holds production-safe definitions; `infra/compose/compose.local.yaml` adds the
development-only conveniences. Two networks: `cera-public` and `cera-private` with
`internal: true`, so Postgres and Valkey have no route off the host.

- [ ] `postgres` on `postgres:18.6-alpine`, volume mounted at `/var/lib/postgresql` (the parent path -
      Postgres 18 moved `PGDATA` to a version-specific subdirectory), `pg_isready` healthcheck
- [ ] `infra/postgres/init/01-databases.sh` creating the five databases and five least-privilege
      roles from `architecture.md` section 5, revoking `PUBLIC` on each database and schema
- [ ] `valkey` on `valkey/valkey:9.1.2-alpine` with AOF enabled and a `PING` healthcheck
- [ ] `minio` standing in for R2, with a one-shot `minio-init` creating the `cera-media` bucket and
      a scoped access key
- [ ] `mailpit` standing in for Resend, SMTP on 1025 and UI on 8025
- [ ] Every service: `restart: unless-stopped`, a healthcheck, pinned tag, and log rotation
- [ ] Dependents wait on `condition: service_healthy`; apps wait on migration containers with
      `condition: service_completed_successfully`

### WP-01.4 Health endpoints

- [ ] `GET /health` on every app returning `{ status, version, uptime, checks[] }` with per-dependency
      status and duration, HTTP 200 only when every required check passes
- [ ] `infra/scripts/health-check.sh` polling all endpoints with a timeout, non-zero on any failure
- [ ] Minimal `apps/api` and `apps/worker` skeletons so the endpoints exist from Phase 01 onward
      rather than appearing late

### WP-01.5 Environment contract

- [ ] Root `.env.example` documenting every variable with name, purpose, example placeholder, and
      which environments require it - **placeholders only, never a real value**
- [ ] Per-app `.env.example` files
- [ ] `packages/config/src/env.ts` validating `process.env` with Zod at startup and failing fast with
      a list of every missing variable at once, not one per restart
- [ ] A test asserting that `.env.example` and the Zod schema describe the same variable set, so the
      documentation cannot silently drift

### WP-01.6 Git and GitHub controls

Authored and committed; not pushed (no remote by decision).

- [ ] `git init`, `main` as the default branch, then `develop` branched from it (PRD 11.2)
- [ ] Conventional Commits enforced by a `commit-msg` hook; `pre-commit` running lint-staged;
      `pre-push` running typecheck and unit tests
- [ ] `CODEOWNERS` exactly as PRD 13.3, extended for `apps/api`, `apps/worker`, and `packages/ui`
- [ ] `.github/pull_request_template.md` covering what changed, why, tests run, screenshots, migration
      impact, secret or environment changes, and rollback behaviour (PRD 13.2)
- [ ] `.github/ISSUE_TEMPLATE/` with feature, bug, and epic forms carrying the PRD feature ID field
- [ ] `docs/runbooks/github-rulesets.md` recording the exact ruleset configuration for `develop`,
      `main`, and `v*` tags from PRD 11.3, as a checklist to apply when the CERA org exists

### WP-01.7 CI workflows

Four workflows. Every third-party action pinned to a full 40-character commit SHA with a trailing
version comment, because a tag is mutable. Workflow-level `permissions: {}` with per-job escalation.

- [ ] `ci.yml` on pull requests to `develop`: install with `--frozen-lockfile`, then **independent
      jobs** for format, lint, typecheck, unit, contract, integration, build, and migration check.
      Independent jobs matter for FND-004 - one combined job cannot "report independently".
- [ ] `staging.yml` on push to `develop`: build once, tag the image with the commit SHA, push to GHCR,
      migrate, deploy the staging overlay, health and smoke test, roll back to the previous image on
      failure
- [ ] `release.yml` on `v*` tags: full suite, security checks, migration dry run, release notes,
      backup confirmation, UAT approval verification, production deploy by digest
- [ ] `security.yml` on a schedule and on pull requests: dependency review, secret scan, container
      scan, licence check
- [ ] Postgres and Valkey as CI services for integration jobs
- [ ] `docs/runbooks/ci-cd.md` explaining each workflow, its required checks, and how to reproduce a
      failure locally

### WP-01.8 Developer onboarding

- [ ] `README.md` with a 30-minute path: prerequisites, clone, `pnpm install`, copy env, start Compose,
      migrate, seed, `pnpm dev`, then a table of every local URL and health endpoint
- [ ] A troubleshooting section covering port conflicts, Docker not running, wrong Node version, and
      stale volumes
- [ ] `docs/runbooks/local-development.md` for day-to-day operation

## Verification

```bash
pnpm install --frozen-lockfile
docker compose -f compose.yaml -f infra/compose/compose.local.yaml up -d
docker compose ps                      # every service healthy
pnpm lint && pnpm typecheck && pnpm test
./infra/scripts/health-check.sh
git ls-files | grep -E '\.env$|\.env\.local$'   # must return nothing
```

## Exit gate

- [x] FND-001: a fresh clone installs and every workspace command runs; `git ls-files` shows no
      secret, no `.env`, and no generated artefact
- [x] FND-002: README steps reach every health endpoint inside 30 minutes on a clean machine
- [~] FND-004: CI jobs report independently and a deliberately failing job is shown to block -
  **authored and validated, not executed.** Requires the GitHub organisation (PRD 22)
- [x] FND-005: `.env.example` carries placeholders only, and the drift test passes
- [x] Postgres has five databases with five roles, and cross-database access is proven denied
- [x] Neither Postgres nor Valkey is reachable from the public network

## Completion record

Closed 2026-09-21. Commits `5fa5941` and `fc0d027`.

### Verified, with the evidence

| Claim                                      | How it was proven                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five databases, five least-privilege roles | `pg_database` lists all five with the correct owner                                                                                                                                            |
| Cross-database access denied               | `cera_app` to `cera_cms` and `cera_cms` to `cera_app` both return `permission denied ... does not have CONNECT privilege`. Asserted in both directions, and re-asserted on every `pnpm health` |
| Extensions present                         | `pg_trgm` in `cera_app` for search; `btree_gist` in `cera_commerce` for Vendure. Both created by the superuser so no app role needs elevated rights                                            |
| Valkey durable                             | `PING`, a write/read round trip, and `appendonly=yes`                                                                                                                                          |
| S3 usable                                  | endpoint returns 200 and the `cera-media` bucket exists                                                                                                                                        |
| Email capture usable                       | Mailpit API returns 200                                                                                                                                                                        |
| API reaches the real database              | `/health/ready` returned `{"status":"ready"}` with `database: ok` against live PostgreSQL                                                                                                      |
| Liveness and readiness are distinct        | 6 tests, including that `/health` returns 200 while every dependency is down, and that neither endpoint leaks a connection string                                                              |
| Shutdown ordering                          | 5 tests on the extracted handler: strict sequencing, pool still released when the queue fails, duplicate SIGTERM ignored, deliberate timeout instead of hanging                                |
| `.env.example` matches the schemas         | 10 tests, including a non-vacuity guard and a real-credential-format scan                                                                                                                      |
| Commit hook enforces Conventional Commits  | 5 valid messages accepted, 5 invalid rejected                                                                                                                                                  |
| Every GitHub Action is SHA-pinned          | The same check CI runs, executed locally; 11 YAML files parsed                                                                                                                                 |
| Full gate                                  | `format`, `lint`, `typecheck`, `build`, and 21 tests pass                                                                                                                                      |

### Things that were wrong and are now corrected

Recorded because each changed a decision rather than just a line of code:

1. **Payload does not require Node 24.15.** Its declared `engines` is `^18.20.2 || >=20.9.0`. Node 24
   is still the runtime, on LTS grounds. ADR-002 updated.
2. **The ESLint hold has a different cause than first recorded.** `typescript-eslint` already accepts
   ESLint 10; the blockers are `eslint-plugin-react` and `eslint-plugin-jsx-a11y`. Since accessibility
   linting is a delivery requirement, the hold stands - but for the right reason, with a named lift
   condition. The TypeScript hold at 6.0.3 is genuine: `typescript-eslint` declares `<6.1.0`.
3. **MinIO is no longer publicly available.** Replaced with SeaweedFS after testing five alternatives.
   [ADR-008](adr/ADR-008-local-s3-seaweedfs-over-minio.md).
4. **`pnpm add` rewrites `pnpm-workspace.yaml` and strips comments.** Rationale placed inline there is
   deleted by the next dependency addition, so it lives in ADR-002 instead. `pnpm add pkg@catalog:`
   also writes `catalog:` recursively into the catalog entry itself, which then fails the next install.

### Deferred, with the reason

| Item                                                                   | Why                                                                                                                                                        | Lands in |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-app `.env.example` files                                           | The root file plus the Zod schemas already cover every variable, and a second copy is a second thing to drift. Revisit only if per-app deployment needs it | -        |
| `Dockerfile` per app                                                   | Two of five apps exist so far. Writing five Dockerfiles now means rewriting them as each app gains real dependencies                                       | Phase 13 |
| `infra/scripts/deploy.sh`, `rollback.sh`, `backup.sh`, `smoke-test.sh` | Referenced by the workflows, which warn and skip when absent. Writing them before there is a deployable artefact would make them untestable                | Phase 13 |
| SIGTERM drain rehearsal against a running process                      | Verified by unit test. A genuine end-to-end rehearsal needs `docker stop` against a container, which is where it belongs                                   | Phase 13 |
| CI executing                                                           | Needs the GitHub organisation (PRD 22)                                                                                                                     | Phase 15 |
