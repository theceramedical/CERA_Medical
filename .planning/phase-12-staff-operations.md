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

- [ ] `GET /v1/ops/enquiries` with filters on status, owner, service, date range, and free text over
      name, email, and reference
- [ ] Cursor pagination with a server-enforced maximum of 100, and sorting on created, updated, and
      status
- [ ] Deterministic ordering with a stable tiebreaker, so pagination cannot skip or repeat a row
- [ ] Indexes verified with `EXPLAIN` against the real query shapes - the queue is the one endpoint most
      likely to become an unbounded scan as data grows
- [ ] Saved views for the common working sets: unassigned, mine, awaiting customer, and stale
- [ ] Every response built by `toStaffEnquiry()`

### WP-12.2 Assignment and transitions

- [ ] `PATCH /v1/ops/enquiries/:id/assign` - assign or unassign, validating the target is a staff subject,
      writing an audit event
- [ ] `POST /v1/ops/enquiries/:id/transition` - validated through the Phase 08 status engine, with an
      optional staff-only reason, writing a status event and an audit event in one transaction
- [ ] Optimistic concurrency, returning `conflict` when the record moved underneath the actor, with the
      current state so the UI can re-present rather than guess
- [ ] The permitted next states returned with every enquiry, so the UI offers only legal moves and an
      invalid one is a bug rather than a user error
- [ ] Transitions that notify the customer enqueue an outbox record rather than sending inline

### WP-12.3 Internal notes

- [ ] `GET` and `POST /v1/ops/enquiries/:id/notes`, staff only
- [ ] Notes are append-only in practice: an edit records `editedAt` and preserves the original in the
      audit trail
- [ ] **Three independent guarantees that notes never leak** (OPS-702): 1. No customer or public route selects the `internal_notes` table at all 2. `toZohoLead()` and `toCustomerEnquiry()` take named fields, so a note cannot arrive by spread 3. A contract test serialises every customer, public, and CRM payload for a fixture enquiry with
      notes and asserts none of the note bodies appears
- [ ] Note bodies never logged and never sent to GlitchTip

### WP-12.4 Audit history

- [ ] `GET /v1/ops/enquiries/:id/audit` returning a chronological history of actor, action, target,
      `safeDiff`, and timestamp
- [ ] Free-text changes recorded as `{ changed: true }` rather than by value, so the audit trail is not a
      second copy of the sensitive data
- [ ] Append-only enforced by the database triggers from Phase 02, not by application discipline
- [ ] Actor identities resolved to display names for presentation, with subject IDs retained underneath

### WP-12.5 Exports

- [ ] CSV export of the queue for administrators, with an explicit column allow-list
- [ ] **Internal notes, transition reasons, and audit diffs are excluded from every export**, which is
      the second half of OPS-702
- [ ] Export writes an audit event recording who exported what and when, because a bulk read of personal
      data is exactly what an audit trail is for
- [ ] Row cap with pagination, so an export cannot become an unbounded query
- [ ] CSV injection defused by prefixing cells that begin with `=`, `+`, `-`, or `@`

### WP-12.6 Console UI

- [ ] `/staff` layout in the `(staff)` route group, gated server-side on every request
- [ ] `/staff/enquiries` - the queue as an accessible table with sortable headers, filter controls whose
      state lives in the URL, and a result count in a live region
- [ ] `/staff/enquiries/[id]` - detail with the customer summary, message, permitted transitions, an
      assignment control, a notes panel, and the audit history
- [ ] `/staff/deliveries` - integration deliveries and dead letters from Phase 10, with retry for
      administrators
- [ ] A clear visual and textual boundary marking internal-only areas, so a shared screen does not become
      an accidental disclosure
- [ ] Keyboard-first: every action reachable without a pointer, with a focus order that follows the work
- [ ] Optimistic UI with rollback on conflict, and an announced result for every mutation

### WP-12.7 Tests

- [ ] Integration: every filter and sort combination returns deterministic, correctly paginated results
- [ ] Integration: assignment and transition write audit events; a conflicting concurrent transition is
      rejected
- [ ] Integration: a non-staff role receives no data from any `/v1/ops/*` route - `403` with an empty
      body, never a partial payload
- [ ] Leak tests across the customer, public, CRM, and export surfaces
- [ ] E2E: process a seeded enquiry end to end as an operations user - filter, open, assign, note,
      transition, and confirm the customer-visible status changed correctly
- [ ] E2E: an operations user cannot reach an administrator-only action
- [ ] axe on every staff route

## Verification

```bash
pnpm --filter api test -- --grep "ops"
pnpm test:integration -- --grep "operations|notes|audit|export"
pnpm test:e2e -- --grep "staff"
pnpm test:a11y -- --grep "staff"
```

## Exit gate

- [ ] OPS-701: an operations user completes the full lifecycle of a seeded enquiry with no database
      access; every unauthorised role receives no data from any `/v1/ops/*` route
- [ ] OPS-702: no customer API response and no export contains an internal note; audit events show who
      changed what and when for every mutation
- [ ] Audit rows cannot be updated or deleted, proven against the triggers
- [ ] Every list endpoint is bounded and `EXPLAIN`-verified against its index
- [ ] Exports are column-allow-listed, audited, capped, and injection-safe
- [ ] axe reports zero violations on every staff route
