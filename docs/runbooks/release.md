# Release

1. Confirm the definition-of-done checklist in `.planning/phase-15-release-handover.md`.
2. Create `release/vX.Y.Z` from the approved commit. Do not push unless asked.
3. Push to `main` and wait for the **CI** workflow to succeed on that commit.
4. Run **Release to production** (`workflow_dispatch` on `main`). Preflight requires green CI; only changed app images are built unless you enable **rebuild all**.
5. Migrate `cera_app`, then CMS, then commerce, before any app starts (handled by `infra/scripts/deploy.sh` on the host).
6. Run `infra/scripts/health-check.sh --wait` and `pnpm smoke`.
7. Record version, approver, digest, migration id, and the previous digest as the rollback target.

Path filters compare `HEAD` to the last **successful** production release on `main` (fallback: `HEAD^`). Use **rebuild all** if you need every image regardless of diff.
