# CI and CD

## Workflows

| Workflow       | Trigger                              | Purpose                                                |
| -------------- | ------------------------------------ | ------------------------------------------------------ |
| `ci.yml`       | pull request, push to `main`         | Lint, typecheck, test, build                           |
| `security.yml` | pull request, push to `main`, weekly | Secret scan, dependency audit, action-pinning check    |
| `staging.yml`  | push to `develop`                    | Optional; unused in the one-server rollout             |
| `release.yml`  | Manual owner dispatch from `main`    | Full verification, security gate, deploy to production |

## Design decisions worth knowing

**Every action is pinned to a commit SHA, never a tag.** A tag is mutable: whoever controls an action
repository can repoint `v4` at new code, and it then runs with this workflow's token. The version
appears in a trailing comment for humans. A job in `security.yml` fails the build if any reference
reverts to a tag, so the discipline cannot decay one pull request at a time.

**`permissions: {}` at workflow level, granted per job.** The default token is contents-write. A lint
job has no need for that, and the blast radius of a compromised dependency is proportional to what the
token can do.

**Jobs are split so failures are legible.** `lint`, `typecheck`, `test`, and `build` run in parallel and
report independently. "Typecheck failed" points somewhere; "the build step failed" does not. They cost
a repeated install, which the pnpm cache makes cheap.

**One aggregate required check.** Branch protection references `CI complete`, which fails if any needed
job did not succeed. Adding or renaming a job therefore cannot silently un-protect the branch, which is
the usual way a required-checks list rots.

**Tests run against real PostgreSQL and Valkey**, as service containers. A mocked database cannot catch
a constraint violation, a migration that fails on existing data, or a transaction-scope error - which
is most of what integration tests are for.

**Production blocks on fixable critical and high image findings**, via `ignore-unfixed`.

**Production builds compile the public URLs into the images.** The host records resolved digests in its release manifest. The optional staging workflow is not used for this rollout.

**Production makes an encrypted local database backup before deploying.** The user chose no off-site
backup. A single-server failure can destroy both live data and local backups; the former PRD recovery
targets cannot be claimed for this deployment.

## Reproducing a CI failure locally

CI runs exactly these commands. Nothing in the workflows is CI-only:

```bash
pnpm install --frozen-lockfile   # fails if the lockfile is stale, as CI does
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If CI fails but local passes, check in this order:

1. **Lockfile.** `--frozen-lockfile` fails where a plain `pnpm install` silently resolves a new version.
2. **Case sensitivity.** CI runs Linux. `import './Button'` resolving a file named `button.tsx` works on
   Windows and macOS and fails on Linux. This is the most common one.
3. **Line endings.** A CRLF shell script fails in a container with `bad interpreter`.
4. **Node version.** CI pins 24.21.0. Run `nvm use`.
5. **Test isolation.** CI runs with a clean database. A test that depends on data left by a previous
   run passes locally and fails in CI.

## Required status checks

Configure branch protection to require exactly one check: **`CI complete`**.

Per-job checks should not be listed individually. GitHub matches required checks by name, so a renamed
job is treated as a check that never reports, and the branch quietly stops being protected.

## Secrets

Deployment SSH secrets are scoped to the GitHub **production environment**, not the repository, so
the workflow cannot reach the host until the environment review gate passes. Provider secrets remain
in `/opt/cera/.env` on the host, not in GitHub Actions.

| Secret                                                                               | Environment      |
| ------------------------------------------------------------------------------------ | ---------------- |
| `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, `PRODUCTION_KNOWN_HOSTS` | production       |
| R2, Resend, ERPNext, OIDC, and database credentials                                  | host `.env` only |

Do not reuse local test credentials in production.

## Current state

The repository is private under `theceramedical/CERA_Medical`; the first production-readiness PR is
merged and its main-branch CI and security checks passed on 2026-10-03. The production release has
not run: `/opt/cera/.env` is absent, and live Resend/R2 credentials plus production OIDC setup are
still required. The production GitHub environment has SSH credentials and the site, API, CMS, and
media URL variables. See [`deploy-host.md`](deploy-host.md) for the host setup and recovery procedure.

First run after the organisation exists:

1. Push the repository and confirm `ci.yml` passes on a pull request.
2. Deliberately break a test and confirm `CI complete` blocks the merge. An untested gate is not a gate.
3. Apply the rulesets in [`github-rulesets.md`](github-rulesets.md).
4. Populate the environment secrets, production last.
