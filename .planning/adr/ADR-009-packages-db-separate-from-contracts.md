# ADR-009: The Drizzle schema lives in `packages/db`, not in `packages/contracts` or `apps/api`

- **Status:** Accepted
- **Date:** 2026-09-21
- **Phase:** 02 Contracts, data model and fixtures
- **Extends:** the repository structure in `architecture.md` section 2 and PRD 9.2
- **PRD references:** section 8.1 (outbox pattern), section 9.2 (repository structure), FND-003, section 10 (Maintainability)

## Context

`cera_app` is written by two processes. `apps/api` inserts enquiries, status events, notes, audit
events, and outbox rows. `apps/worker` claims outbox rows, updates `integration_deliveries`, and
writes its own audit events. Both need the same table definitions, and both need the same migration
history, or a deploy can leave one of them reading columns that the other has not yet been told about.

`architecture.md` lists Drizzle under "`apps/api` and `apps/worker` schema and migrations" without
saying where the schema file sits, and PRD 9.2's `packages/` listing does not include a database
package. Three placements are possible.

## Decision

**Add `packages/db`, owning the Drizzle schema, the migration folder, and the pool factory. Both
`apps/api` and `apps/worker` depend on it.**

Rejected alternatives, and why each is worse:

**Put it in `packages/contracts`.** This is the tempting one, because the tables mirror the entities.
It is wrong for a reason that has nothing to do with tidiness: `packages/contracts` is imported by
`apps/web`, including by client components that validate form input with `EnquiryInputSchema`. Adding
`drizzle-orm` and `pg` to that package puts a database driver into the module graph of a browser
bundle. Next.js would either bundle it, fail the build on Node built-ins, or - worst case - tree-shake
it successfully today and stop doing so after an unrelated refactor. Keeping the two packages separate
makes the dependency direction enforceable rather than merely intended: `packages/db` imports
`packages/contracts`, never the reverse, and an ESLint boundary rule can assert it.

**Put it in `apps/api` and have `apps/worker` import from it.** This makes one deployable unit depend
on another deployable unit's source. The worker's Docker build would need the API's source tree, the
API could not be changed without rebuilding the worker, and the dependency would be invisible in the
Compose topology while being real at build time. App-to-app imports also break the `output:
'standalone'` and per-app image model that Phase 13 depends on.

**Duplicate the schema in both apps.** Rejected outright. Two copies of a table definition drift, and
the failure mode is a worker writing a column the API does not read, which surfaces as an enquiry that
appears to have been processed and has not.

## Consequences

- **One migration owner for `cera_app`.** `packages/db` holds `drizzle/` and is the only place
  `drizzle-kit generate` runs, so the migration history is linear. Payload and Vendure continue to own
  their own databases and migration tools, unchanged.
- **The migration runner is a package script, not an app's.** `pnpm migrate` at the root delegates to
  `packages/db`, so a deploy runs migrations once rather than racing two containers that both try.
  This matters in Phase 13: the API and worker start concurrently, and two simultaneous
  `drizzle-kit migrate` invocations against one database is a genuine failure mode.
- **Reverse-dependency tests become possible.** Because the schema and the Zod entities are in
  different packages, a test in `packages/db` can assert that every Drizzle column has a
  corresponding field in the matching contract schema, and fail when someone adds a column without
  extending the contract. That check cannot exist if both live in the same file.
- **One more package to configure.** Its own `tsconfig`, ESLint, and Vitest setup. Cheap, and Phase 01
  made this a copy-and-adjust job rather than new work.
- **A documented departure from PRD 9.2's package list.** Recorded here so it is a decision rather
  than drift. It is additive: nothing in the PRD's listing is removed or moved.

## Notes

`packages/db` exports no query helpers beyond the pool factory. Business logic stays in `apps/api`,
because PRD 1.2 requires authorisation and record-ownership checks in one auditable layer, and a
shared package of convenience queries is exactly how ownership filters end up applied inconsistently
in two places.
