# CI and CD

## Workflows

| Workflow       | Trigger                              | Purpose                                                |
| -------------- | ------------------------------------ | ------------------------------------------------------ |
| `ci.yml`       | pull request, push to `main`         | Lint, typecheck, test, build                           |
| `security.yml` | pull request, push to `main`, weekly | Secret scan, dependency audit, action-pinning check    |
| `staging.yml`  | push to `develop`                    | Build images, scan, deploy to staging                  |
| `release.yml`  | `v*.*.*` tag                         | Full verification, security gate, deploy to production |

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

**Staging reports vulnerabilities; production blocks on them.** Blocking staging on an unfixable
base-image CVE stops all testing for something nobody can action today. Production gates on fixable
critical and high findings only, via `ignore-unfixed`.

**Production promotes the staging artefact, re-tagged.** It does not rebuild. A rebuild produces a
different artefact from the one that was verified, which defeats the purpose of having verified it.

**Production backs up before deploying.** The ordering is not negotiable: RPO is 24 hours and RTO is
4 hours (PRD 15), so deploying without a fresh backup means a failed migration could cost a full day of
enquiries.

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

Secrets are scoped to GitHub **environments**, not the repository, so a workflow cannot reach production
credentials unless it targets the production environment - and that environment requires approval.

| Secret                                                       | Environment                                           |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`            | staging                                               |
| `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`   | production                                            |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`                   | staging, production (separate values per environment) |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`                    | staging, production                                   |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` | staging, production                                   |
| `GLITCHTIP_DSN`                                              | staging, production                                   |

Never reuse a value across environments. A leaked staging key must not be valid in production; that is
the entire point of separating them.

## Current state

The workflows are authored, validated, and committed, but have never executed: CERA has not yet supplied
the GitHub organisation (PRD 22). The deploy steps detect an absent host secret and emit a warning
rather than failing, so the build and scan stages are still exercised on the first push.

First run after the organisation exists:

1. Push the repository and confirm `ci.yml` passes on a pull request.
2. Deliberately break a test and confirm `CI complete` blocks the merge. An untested gate is not a gate.
3. Apply the rulesets in [`github-rulesets.md`](github-rulesets.md).
4. Populate the environment secrets, production last.
