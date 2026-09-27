# Phase 12 - Staff operations console

**PRD mapping:** OPS-701, OPS-702
**Depends on:** Phases 08, 09
**PRD acceptance:**

| ID      | Acceptance statement                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| OPS-701 | Operations users can process seeded enquiries without database access; unauthorized roles receive no data. |
| OPS-702 | Customer APIs and exports contain no internal notes; audit events show who changed what and when.          |

## Objective

Let CERA operations run the enquiry lifecycle without a developer and without database access, while
keeping internal notes strictly internal.

## Work packages

### WP-12.1 Queue API

- [x] `GET /v1/ops/enquiries` with filters on status, owner, service, date range, and free text over
      name, email, and reference
- [x] Cursor pagination with a server-enforced maximum of 100, and sorting on created, updated, and
      status
- [x] Deterministic ordering with a stable tiebreaker, so pagination cannot skip or repeat a row
- [x] Indexes verified with `EXPLAIN` against the real query shapes - the queue is the one endpoint most
      likely to become an unbounded scan as data grows
- [x] Saved views for the common working sets: unassigned, mine, awaiting customer, and stale
- [x] Every response built by `toStaffEnquiry()`

### WP-12.2 Assignment and transitions

- [x] `PATCH /v1/ops/enquiries/:id/assign` - assign or unassign, validating the target is a staff subject,
      writing an audit event
- [x] `POST /v1/ops/enquiries/:id/transition` - validated through the Phase 08 status engine, with an
      optional staff-only reason, writing a status event and an audit event in one transaction
- [x] Optimistic concurrency, returning `conflict` when the record moved underneath the actor, with the
      current state so the UI can re-present rather than guess
- [x] The permitted next states returned with every enquiry, so the UI offers only legal moves and an
      invalid one is a bug rather than a user error
- [x] Transitions that notify the customer enqueue an outbox record rather than sending inline

### WP-12.3 Internal notes

- [x] `GET` and `POST /v1/ops/enquiries/:id/notes`, staff only
- [x] Notes are append-only in practice: an edit records `editedAt` and preserves the original in the
      audit trail
- [x] **Three independent guarantees that notes never leak** (OPS-702): 1. No customer or public route selects the `internal_notes` table at all 2. `toZohoLead()` and `toCustomerEnquiry()` take named fields, so a note cannot arrive by spread 3. A contract test serialises every customer, public, and CRM payload for a fixture enquiry with
      notes and asserts none of the note bodies appears
- [x] Note bodies never logged and never sent to GlitchTip

### WP-12.4 Audit history

- [x] `GET /v1/ops/enquiries/:id/audit` returning a chronological history of actor, action, target,
      `safeDiff`, and timestamp
- [x] Free-text changes recorded as `{ changed: true }` rather than by value, so the audit trail is not a
      second copy of the sensitive data
- [x] Append-only enforced by the database triggers from Phase 02, not by application discipline
- [x] Actor identities resolved to display names for presentation, with subject IDs retained underneath

### WP-12.5 Exports

- [x] CSV export of the queue for administrators, with an explicit column allow-list
- [x] **Internal notes, transition reasons, and audit diffs are excluded from every export**, which is
      the second half of OPS-702
- [x] Export writes an audit event recording who exported what and when, because a bulk read of personal
      data is exactly what an audit trail is for
- [x] Row cap with pagination, so an export cannot become an unbounded query
- [x] CSV injection defused by prefixing cells that begin with `=`, `+`, `-`, or `@`

### WP-12.6 Console UI

- [x] `/staff` layout in the `(staff)` route group, gated server-side on every request
- [x] `/staff/enquiries` - the queue as an accessible table with sortable headers, filter controls whose
      state lives in the URL, and a result count in a live region
- [x] `/staff/enquiries/[id]` - detail with the customer summary, message, permitted transitions, an
      assignment control, a notes panel, and the audit history
- [x] `/staff/deliveries` - integration deliveries and dead letters from Phase 10, with retry for
      administrators
- [x] A clear visual and textual boundary marking internal-only areas, so a shared screen does not become
      an accidental disclosure
- [x] Keyboard-first: every action reachable without a pointer, with a focus order that follows the work
- [x] Optimistic UI with rollback on conflict, and an announced result for every mutation

### WP-12.7 Tests

- [x] Integration: every filter and sort combination returns deterministic, correctly paginated results
- [x] Integration: assignment and transition write audit events; a conflicting concurrent transition is
      rejected
- [x] Integration: a non-staff role receives no data from any `/v1/ops/*` route - `403` with an empty
      body, never a partial payload
- [x] Leak tests across the customer, public, CRM, and export surfaces
- [x] E2E: process a seeded enquiry end to end as an operations user - filter, open, assign, note,
      transition, and confirm the customer-visible status changed correctly
- [x] E2E: an operations user cannot reach an administrator-only action
- [x] axe on every staff route

## Verification

```bash
pnpm --filter api test -- --grep "ops"
pnpm test:integration -- --grep "operations|notes|audit|export"
pnpm test:e2e -- --grep "staff"
pnpm test:a11y -- --grep "staff"
```

## Exit gate

- [x] OPS-701: an operations user completes the full lifecycle of a seeded enquiry with no database
      access; every unauthorised role receives no data from any `/v1/ops/*` route
- [x] OPS-702: no customer API response and no export contains an internal note; audit events show who
      changed what and when for every mutation
- [x] Audit rows cannot be updated or deleted, proven against the triggers
- [x] Every list endpoint is bounded and `EXPLAIN`-verified against its index
- [x] Exports are column-allow-listed, audited, capped, and injection-safe
- [x] axe reports zero violations on every staff route
