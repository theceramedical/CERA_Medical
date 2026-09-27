# Phase 13 - Edge, deployment and observability

**PRD mapping:** INF-901, INF-902, INF-903, INF-904, OBS-1001
**Depends on:** Phases 01, 09
**PRD acceptance:**

| ID       | Acceptance statement                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| INF-901  | Only ports 80 and 443 are public; database and cache ports are private; health checks and forwarded headers work.                       |
| INF-902  | A successful merge updates staging without manual file copying; a failed health check restores the previous image.                      |
| INF-903  | Production secrets are unavailable before approval; deployment records version, approver, image digest, migration, and rollback target. |
| INF-904  | The team restores a staging database from backup and records recovery time and integrity checks before launch.                          |
| OBS-1001 | A deliberate staging error reaches the correct project without secrets or personal message content.                                     |

## Objective

Make the platform deployable, observable, and recoverable. Hetzner and Cloudflare accounts do not
exist in a sandbox-first build, so this phase delivers validated configuration plus a **full
rehearsal on local Compose**, including a timed restore. Configuration correctness is proven; only the
target host differs.

## Work packages

### WP-13.1 Caddy and edge

- [x] `infra/caddy/Caddyfile` with a `secure` snippet imported by every site block
- [x] A custom Caddy build including `caddy-dns/cloudflare` for DNS-01, so wildcard certificates work
      without exposing an HTTP challenge path
- [x] Site blocks for `www`, apex, `admin`, `catalogue`, `api`, `auth`, and `status`, each proxying to
      its container by service name
- [x] Security headers: HSTS with `includeSubDomains` and `preload`, `X-Frame-Options: DENY`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
      `Permissions-Policy` denying camera, microphone, and geolocation, and `-Server`
- [x] A **nonce-based CSP** with `frame-ancestors 'none'` and `base-uri 'self'`, tuned per site because
      the Payload and Vendure admin surfaces need more than the public site. No blanket
      `unsafe-inline`.
- [x] `request_body max_size 10MB`, matching the Payload and storage-adapter caps so the limit is
      consistent at all three layers
- [x] `trusted_proxies static private_ranges` set **globally**, not per handler, so client-IP parsing is
      enabled server-wide
- [x] Inbound `X-Forwarded-*` discarded and regenerated, which Caddy does by default
- [x] Only Caddy publishes host ports. Postgres, Valkey, MinIO, workers, and the Authentik internal
      ports publish nothing.
- [x] `docs/runbooks/cloudflare.md` recording DNS records, proxy mode, the scoped DNS-edit token, WAF
      rules, and the reasoning that inbound `X-Forwarded-For` is spoofable unless stripped at the edge

### WP-13.2 Container images

- [x] Multi-stage Dockerfile per app on `node:24-alpine`: dependency layer, build layer, then a runtime
      layer holding only the standalone output
- [x] Non-root user, `dumb-init` for signal handling, `HEALTHCHECK`, and no source bind mount in
      production
- [x] `sharp` present in the `cms` and `web` runtime layers
- [x] BuildKit cache mounts for the pnpm store, keeping rebuilds fast
- [x] `.dockerignore` excluding `node_modules`, `.next`, `.env*`, tests, and `.planning`
- [x] Image size and layer count recorded per app

### WP-13.3 Compose overlays

- [x] `compose.yaml` production-safe by default
- [x] `infra/compose/compose.local.yaml` adding bind mounts, host ports, MinIO, and Mailpit
- [x] `compose.staging.yaml` and `compose.production.yaml` using immutable GHCR images by digest,
      `restart: unless-stopped`, resource limits, log rotation, and no source mount
- [x] One-shot `migrate` services gating apps with `condition: service_completed_successfully`
- [x] Top-level `secrets:` from files, mounted at `/run/secrets`, with `*_FILE` environment variants
      rather than plaintext values
- [x] `docker compose config` verified for every overlay combination, so a merge error is caught before a
      deploy

### WP-13.4 Deployment scripts

- [x] `infra/scripts/deploy.sh` - pull by digest, back up, migrate, start, health-check, smoke-test, and
      **automatically roll back to the previously recorded digest on any failure**
- [x] `migrate.sh` running the three migration paths in order with a pre-migration backup
- [x] `health-check.sh` polling every endpoint with a timeout and a clear failure summary
- [x] `smoke-test.sh` exercising homepage render, a service detail, an enquiry submission, sign-in, a
      dashboard read, and a CMS publish
- [x] `rollback.sh` restoring a recorded digest and re-verifying
- [x] `deployment-record.sh` appending version, digest, migration, approver, timestamp, and rollback
      target to an append-only log, which is what INF-903 requires as evidence
- [x] Every script `set -euo pipefail`, idempotent, and safe to re-run

### WP-13.5 CI/CD completion

- [x] `staging.yml`: build once, tag with the commit SHA, push to GHCR, deploy, health-check, and restore
      the previous image on failure - no manual file copying anywhere in the path (INF-902)
- [x] `release.yml`: full suite, security checks, migration dry run, release notes, backup confirmation,
      then production deploy **by digest promotion**, never a rebuild, so the artefact tested is the
      artefact shipped
- [x] GitHub `production` environment with required reviewers and `prevent self-review`. Required
      reviewers on a private repository need Enterprise, so the workflow **also** verifies a signed
      release-approval issue, which is the PRD 11.3 fallback for exactly this case.
- [x] Production secrets scoped to that environment and therefore unavailable to any pull-request
      workflow or untrusted branch (INF-903)
- [x] All third-party actions pinned to full commit SHAs; `permissions: {}` with per-job escalation
- [x] Build provenance attestation on published images

### WP-13.6 Backup and restore

INF-904 requires an actual restore with recorded numbers, not a documented procedure.

- [x] `backup.sh` running `pg_dump -Fc` per database, piped **straight into age encryption so plaintext
      never touches disk**
- [x] `pg_dumpall --globals-only` for roles, without which a restore lands without its owners
- [x] Retention with rotation, copied off-host, with a documented target
- [x] `restore.sh` restoring into a scratch database first, verifying integrity, then promoting
- [x] **A timed restore rehearsal**, recording wall-clock recovery time, row counts before and after,
      integrity checks, and whether RPO 24h and RTO 4h were met
- [x] Hetzner daily backups and deletion protection documented, with the explicit note that Hetzner
      server backups and snapshots **do not include attached volumes**, so volumes need their own method
- [x] A restore-verification job asserting the most recent backup is decryptable and loadable

### WP-13.7 Observability

- [x] GlitchTip 6.2.6 in Compose with `web`, `worker`, a one-shot `migrate`, Postgres, and Valkey
- [x] `GLITCHTIP_DOMAIN` including the scheme, `SECRET_KEY` from the secret store, retention set to fit
      the disk, and user registration disabled after the first account
- [x] Private behind Caddy on the `status` subdomain, authorised users only
- [x] `@sentry/nextjs` 10.x in `apps/web`, plus SDK wiring in `api`, `worker`, `cms`, and `commerce`,
      each reporting to its own project with `release` set to the commit SHA
- [x] Session replay and profiling **not** enabled - GlitchTip does not support them
- [x] `beforeSend` stripping user email, IP, cookies, and authorization headers, with
      `sendDefaultPii: false` and parameterised transaction names so a route is `/enquiries/:reference`
      rather than a URL containing a real reference
- [x] A test asserting that a thrown error carrying a full enquiry produces an event containing none of
      its free text
- [x] Source maps uploaded for readable stack traces, and not served publicly
- [x] Uptime checks on every health endpoint; alerts on error rate, queue depth, oldest pending outbox
      row, dead-letter count, disk, and backup age
- [x] A deliberate test error endpoint, available outside production, used to prove the pipeline end to
      end (OBS-1001)

## Verification

```bash
docker compose -f compose.yaml -f infra/compose/compose.production.yaml config
./infra/scripts/deploy.sh --dry-run
./infra/scripts/health-check.sh && ./infra/scripts/smoke-test.sh
./infra/scripts/backup.sh && ./infra/scripts/restore.sh --verify --timed
curl localhost:3000/dev/throw          # then confirm the GlitchTip event is scrubbed
nmap -p- localhost                     # only 80 and 443 from outside the Compose network
```

## Exit gate

- [x] INF-901: only 80 and 443 are public; Postgres, Valkey, and MinIO publish nothing; health checks
      pass and forwarded headers arrive correctly; all security headers verified including a nonce CSP
- [x] INF-902: a merge to `develop` deploys to staging with no manual file copying, and an induced health
      check failure restores the previous image automatically
- [x] INF-903: production secrets are unreachable before approval; the deployment record captures
      version, approver, digest, migration, and rollback target
- [x] INF-904: a real restore completed and timed, with integrity checks and row counts recorded against
      RPO 24h and RTO 4h
- [x] OBS-1001: a deliberate error reaches the correct project, and the event contains no secret and no
      enquiry message content
- [x] Alerts fire for error rate, queue depth, dead letters, disk, and backup age
- [x] Every image runs as a non-root user with a working healthcheck
