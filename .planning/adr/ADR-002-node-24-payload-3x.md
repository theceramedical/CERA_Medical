# ADR-002: Node 24 runtime and Payload pinned to 3.x

**Status:** Accepted
**Date:** 2026-09-21

## Context

The PRD requires pinned tool versions and locked dependencies (PRD 10, Maintainability) but predates
the current releases of the chosen components. State verified directly against the npm registry on
2026-09-21:

| Package         | Latest     | Declared `engines`                                      |
| --------------- | ---------- | ------------------------------------------------------- |
| `payload`       | **3.90.1** | `^18.20.2 \|\| >=20.9.0`                                |
| `next`          | **16.3.5** | `>=20.9.0`                                              |
| `@vendure/core` | **3.7.3**  | none declared; docs state Node 20.19+/22.12+, 24 tested |
| `react`         | **19.3.0** | -                                                       |
| `typescript`    | 7.0.2      | -                                                       |
| `eslint`        | 10.11.0    | -                                                       |

Two corrections to earlier notes, recorded because they changed the reasoning:

- An initial research pass reported that Payload 3.88 required **Node 24.15+**. Querying the package
  directly shows the floor is `>=20.9.0`. Node 24 remains the choice, but on the grounds below rather
  than on a hard requirement.
- Payload **4.x** is still pre-alpha; the maintainers recommend 3.x for production.

A single Node major across the monorepo is worth real money in avoided debugging: mixed majors
produce native-module mismatches in `sharp` and `pg`, and lockfile churn that is invisible until CI.

## Decision

1. **Node 24 LTS across every workspace** - currently 24.21.0. Pinned by `.nvmrc`, `engines` in the
   root `package.json`, `packageManager` for pnpm, and the `node:24-alpine` base image in every
   Dockerfile. `engine-strict=true` in `.npmrc` turns a wrong local version into an install-time
   error rather than a runtime mystery. Node 24 is chosen because it is the active LTS line, it is
   within every component's supported range, and it is the line Vendure explicitly tests against -
   not because any package forces it.

2. **Payload pinned to `3.90.1`**, exact-versioned, not caret-ranged. Payload 4 is evaluated only
   after it reaches stable and only through its own ADR and migration issue.

3. **Vendure 3.7.3 runs on the same Node 24 runtime**, which is within its supported set.

4. **TypeScript held at 6.0.3, not 7.0.2.** `typescript-eslint` 8.70 declares
   `typescript: '>=4.8.4 <6.1.0'`. Adopting 7 would silently disable typed linting across the whole
   monorepo - `no-floating-promises`, `no-misused-promises`, and the rest - which is a far worse trade
   than running one major behind.

5. **ESLint held at 9.39.5, not 10.11.0.** npm marks the 9 line deprecated; the hold is deliberate
   anyway. The reason is not `typescript-eslint`, which already accepts `^10`, nor
   `eslint-plugin-import-x`, which also does. The blockers are **`eslint-plugin-react`** (peer
   `<=^9.7`) and **`eslint-plugin-jsx-a11y`** (peer `<=^9`). `jsx-a11y` is not negotiable here: WCAG
   2.2 AA is a delivery requirement, and these rules run at error severity precisely so an
   accessibility defect fails the build rather than waiting for the Phase 14 audit. Running ESLint 10
   would mean dropping accessibility linting or accepting unmet peers.

   **Lift condition:** both plugins declare `^10`. Re-check with
   `npm view eslint-plugin-jsx-a11y peerDependencies.eslint`.

6. **One catalog.** Every version lives in `pnpm-workspace.yaml` under `catalog:` and workspaces
   reference `catalog:`, so a bump happens once and cannot drift between apps.

   One practical caveat, learned the hard way: **`pnpm add` rewrites that file and does not preserve
   comments or grouping.** Rationale placed inline there is silently deleted by the next dependency
   addition, which is why the justification for both holds lives in this ADR instead. Treat the
   catalog as data and this record as the explanation.

7. Dependencies are locked with `pnpm-lock.yaml` and CI installs with `--frozen-lockfile`. Renovate
   or Dependabot proposes upgrades; nothing floats.

## Consequences

- Node 24 must be installed locally before Phase 01. This is the first task in Phase 00, using the
  already-present `nvm` for Windows.
- Every container uses one base image family, so image layers are shared and the build cache is
  effective.
- Payload 4's admin redesign is deferred. That is the correct call for a release with a fixed launch
  date, and the pin makes the deferral explicit rather than accidental.
- Exact-pinning means security patches arrive by deliberate bump. The security workflow in Phase 14
  surfaces advisories so the pin does not become neglect.
- The TypeScript and ESLint holds are temporary and each carries a named lift condition above, so the
  hold has an exit rather than becoming permanent by inertia. The Phase 14 dependency review checks
  both conditions explicitly.
- **A verification step is now part of Phase 00**: every pinned version is queried against the registry
  rather than recalled. That is how the incorrect Node floor was caught, and it costs one command.

## Alternatives considered

**Stay on Node 22.** Workable - nothing actually requires 24. Rejected because 24 is the active LTS,
Node 22 enters maintenance sooner, and starting a new build on the older line schedules an upgrade for
no benefit.

**Mixed runtimes: Node 22 for Vendure, Node 24 for Payload.** Rejected: two native toolchains, two
image bases, and a class of bug that only appears in CI.

**Adopt TypeScript 7 and ESLint 10 now.** Rejected: it would disable typed linting across the
monorepo, trading a real control for version currency.

**Caret ranges to receive patches automatically.** Rejected: PRD 10 requires pinned versions, and
reproducible builds are a precondition for the immutable-image promotion model in PRD 14.
