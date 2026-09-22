# Summary

<!-- What changes and why. Link the phase work package, e.g. FND-003. -->

**Phase / work package:**
**PRD reference:**

## Type of change

- [ ] Feature
- [ ] Fix
- [ ] Refactor with no behaviour change
- [ ] Infrastructure or tooling
- [ ] Documentation
- [ ] Dependency update

## How this was verified

<!-- Commands run and what they proved. "Tests pass" is not a verification. -->

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass locally
- [ ] New behaviour has tests that fail without the change
- [ ] No secret, credential, or real customer data is committed (PRD 15)
- [ ] `.env.example` updated if a new environment variable was introduced
- [ ] Database changes ship as a migration, and the migration was tested against a copy of existing data

## Security and privacy

<!-- Delete any line that genuinely does not apply, rather than ticking it. -->

- [ ] No new route exposes data without a server-side authorisation check
- [ ] Any new personal-data field is justified by a stated purpose (PRD 10, minimisation)
- [ ] No personal data is written to logs, error reports, or analytics
- [ ] New external calls are idempotent and go through the outbox

## Accessibility and design

- [ ] No raw colour values; semantic tokens only (ADR-001, enforced by `@cera/no-raw-color`)
- [ ] Keyboard reachable with a visible focus indicator
- [ ] Contrast meets WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text and UI boundaries
- [ ] Any new form control has a programmatically associated label and an error message linked via `aria-describedby`

## Rollback

<!-- How to undo this. If a migration is not reversible, say so and explain the
     forward fix, because "revert the deploy" will not be enough. -->
