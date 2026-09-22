# Phase 02 - Contracts, data model and fixtures

**PRD mapping:** FND-003
**Depends on:** Phase 01
**PRD acceptance:** "Web, API, and tests import the same contracts; contract tests reject
incompatible changes."

## Objective

Establish the shared vocabulary every later phase builds against, so `apps/web`, `apps/api`, and the
test suites cannot disagree about a shape. This phase is the reason the API and web layers can be
built in either order.

Normative specification: [data-contracts.md](data-contracts.md). This document is the build plan for it.

## Work packages

### WP-02.1 `packages/contracts`

- [ ] Zod schemas for all ten entities in `data-contracts.md` section 2, with inferred TypeScript types
      exported alongside each schema
- [ ] `ErrorEnvelopeSchema` and `ErrorCodeSchema`, plus the code-to-HTTP-status map as a single
      exhaustive record so a new code cannot be added without a status
- [ ] `InternalStatusSchema` and `CustomerStatusSchema` as separate enums - separate **types**, so a
      staff-only value cannot reach a customer field by assignment
- [ ] The transition table as data, plus `canTransition()` and `nextStates()` derived from it
- [ ] `toCustomerStatus()` as a total mapping, typed so an unmapped internal status fails to compile
- [ ] Projection builders `toCustomerEnquiry()`, `toStaffEnquiry()`, `toZohoLead()`, each taking
      **named fields**, never spreading a record
- [ ] Request and response schemas for every endpoint in `data-contracts.md` section 6
- [ ] Pagination primitives: cursor encode and decode, with a server-enforced maximum limit of 100
- [ ] `reference.ts` generating `CERA-YYMMDD-XXXXX` from a CSPRNG over Crockford base32, excluding
      ambiguous characters
- [ ] Subpath exports so consumers import `@cera/contracts/enquiry` rather than one barrel

### WP-02.2 Database schema and migrations

Drizzle against `cera_app`. Payload and Vendure own their own databases and migrations.

- [ ] Tables: `enquiries`, `enquiry_status_events`, `internal_notes`, `customer_profiles`,
      `audit_events`, `integration_deliveries`, `enquiry_claim_tokens`, `outbox`,
      `email_suppressions`
- [ ] UUID v7 primary keys; `timestamptz` throughout; `snake_case` columns mapped from `camelCase`
- [ ] Constraints that encode the rules rather than trusting callers:
      unique `enquiries.reference`; unique `integration_deliveries.idempotency_key`;
      unique `enquiry_claim_tokens.token_hash`; `check (consent_at is not null)`;
      `check (char_length(message) <= 2000)`; foreign keys with `on delete restrict` on enquiry
      children so audit history cannot be orphaned
- [ ] Indexes driven by the actual query shapes: `(internal_status, created_at desc)` for the queue,
      `(customer_subject_id, created_at desc)` for the dashboard, `(status, available_at)` partial on
      pending for the outbox sweep, `(enquiry_id, created_at)` for timelines
- [ ] **Append-only enforcement** on `enquiry_status_events` and `audit_events` by a `BEFORE UPDATE OR
DELETE` trigger that raises. Application discipline is not enough for an audit trail.
- [ ] Migrations are forward-only and backward-compatible: additive columns, nullable-then-backfill,
      no destructive change in a single release (PRD 10, Maintainability)
- [ ] `pnpm migrate` and `pnpm migrate:status`; a CI check asserting no pending drift

### WP-02.3 `packages/observability`

- [x] Pino logger emitting JSON with `requestId`, `environment`, `release`, `service`, and `durationMs`
- [x] **Redaction by allow-list, not deny-list.** Only explicitly listed fields are logged; everything
      else is `[redacted]`. A deny-list fails the day a field is added, which is exactly when it
      matters.
- [x] `message`, note bodies, transition reasons, tokens, cookies, and `authorization` are never
      loggable, enforced by a test that logs a fully populated enquiry and asserts none of its free
      text appears in the output
- [x] Request ID propagation: accept an inbound `X-Request-Id` when it matches a safe pattern,
      otherwise generate one; return it on every response; carry it through the outbox into worker logs
      so one identifier spans the whole enquiry lifecycle
- [x] GlitchTip helpers with `beforeSend` scrubbing user email, IP, cookies, and authorization headers,
      `sendDefaultPii: false`, and parameterised transaction names
- [x] A domain error hierarchy mapping cleanly onto the error envelope

### WP-02.4 Fixtures

- [ ] The fixture set specified in `data-contracts.md` section 7, built **from the schemas** so a
      contract change breaks fixture compilation immediately
- [ ] Deterministic seeded generation, so a fixture-dependent test failure reproduces exactly
- [ ] Every record carries `__fixture: true`
- [ ] `pnpm seed` idempotently loads them; `pnpm seed:reset` truncates and reloads
- [ ] A guard refusing to seed when `NODE_ENV=production`

### WP-02.5 Contract tests

- [ ] Every schema round-trips: valid input parses, invalid input fails with the expected issue path
- [ ] The transition table is exhaustive: every internal status appears, terminal states have no
      outgoing edge, and every non-edge is rejected
- [ ] `toCustomerStatus()` is total over the internal enum
- [ ] **Leak tests.** Serialise the customer projection and the Zoho payload for a fixture enquiry that
      has notes, an owner, an internal status, and a transition reason, then assert that none of those
      strings appears anywhere in the output. This is the automated form of PRD 8's exposure rules.
- [ ] Error envelope shape is stable, and no envelope contains a stack trace
- [ ] Reference generation: format, character set, and no collision across 100k draws

## Verification

```bash
pnpm --filter @cera/contracts test
pnpm migrate && pnpm migrate:status     # no pending drift
pnpm seed
pnpm --filter @cera/observability test  # redaction proven
pnpm typecheck
```

## Exit gate

- [ ] FND-003: `apps/web`, `apps/api`, and the test suites import the same contracts, and a
      deliberately incompatible schema change is shown to fail the contract job
- [ ] Migrations apply to an empty database and are re-runnable
- [ ] Append-only triggers reject an update and a delete
- [ ] Leak tests pass for both the customer and the Zoho projection
- [ ] Redaction test proves no enquiry free text reaches a log
