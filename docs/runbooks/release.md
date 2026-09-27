# Release

1. Confirm the definition-of-done checklist in `.planning/phase-15-release-handover.md`.
2. Create `release/vX.Y.Z` from the approved commit. Do not push unless asked.
3. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
4. Migrate `cera_app`, then CMS, then commerce, before any app starts.
5. Promote images by digest with `infra/scripts/deploy.sh`.
6. Run `infra/scripts/health-check.sh --wait` and `pnpm smoke`.
7. Record version, approver, digest, migration id, and the previous digest as the rollback target.
