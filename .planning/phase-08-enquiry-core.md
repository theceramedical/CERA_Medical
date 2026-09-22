# Phase 08 - Enquiry capture and status engine

**PRD mapping:** ENQ-401, ENQ-402, ENQ-403
**Depends on:** Phases 02, 04, 06
**PRD acceptance:**

| ID      | Acceptance statement                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ENQ-401 | Valid enquiries are stored once; invalid requests return field-level errors; duplicate submissions do not create duplicate records. |
| ENQ-402 | A keyboard-only user can submit successfully; confirmation displays the reference number; errors preserve safe form fields.         |
| ENQ-403 | Invalid transitions are rejected; customers never receive internal notes or staff-only status values.                               |

## Objective

The core business transaction. One validated submission produces exactly one enquiry, one reference,
one audit event, and three queued outbox records, and the response never waits on an external
provider.

## Work packages

### WP-08.1 Fastify API foundation

- [ ] `apps/api` on Fastify 5 with the Zod type provider, so route schemas are the contracts rather than
      copies of them
- [ ] Request ID middleware, structured logging, and a global error handler that maps every thrown
      domain error onto the envelope in `data-contracts.md` section 3
- [ ] **No stack trace, SQL fragment, or provider body ever reaches a response**
- [ ] `GET /health` with database and Valkey checks
- [ ] `helmet`, strict CORS allow-list, and a global body-size cap
- [ ] Graceful shutdown draining in-flight requests before exit

### WP-08.2 Submission endpoint

`POST /v1/enquiries`, the single most security-sensitive public route.

- [ ] Server-side validation against `EnquirySchema`, returning **field-level** errors keyed by dot path
- [ ] Normalisation before persistence: trim, collapse internal whitespace, lowercase email,
      E.164-normalise phone where possible, strip control characters and zero-width characters
- [ ] Reject a submission whose `serviceId` is unknown, inactive, or `enquiryEnabled: false` - the client
      hiding a CTA is not a control
- [ ] **Consent is mandatory.** Absent or false consent returns `consent_required`. `consentAt` is the
      server clock, never a client value.
- [ ] Reference generated per `packages/contracts`, unique constraint enforced, bounded retry on
      collision
- [ ] **One transaction** inserting the enquiry, the initial status event, the audit event, and three
      outbox rows, so a partial write is impossible
- [ ] `201` returning `{ reference, requestId }` only - no internal ID, so the response cannot be used
      to enumerate records
- [ ] Best-effort enqueue to Valkey after commit; failure is logged and non-fatal because the worker
      also sweeps on a timer

### WP-08.3 Duplicate protection

Three independent mechanisms, because they defend against different things.

- [ ] **`Idempotency-Key` header** - a client-generated key per form instance. A replay within the
      window returns the original `201` and reference, so a double-click or a retried fetch produces one
      record.
- [ ] **Content fingerprint** - SHA-256 over normalised email, `serviceId`, and message, with a short
      window, catching a resubmission from a different tab that has no shared key.
- [ ] **Unique constraint** on the idempotency record - the final authority, so two concurrent requests
      cannot both win.
- [ ] A duplicate returns the original reference with `200`, not an error. An error would push the
      visitor to submit again, which is the opposite of the goal.

### WP-08.4 Anti-abuse

- [ ] Layered rate limits in Valkey: per IP per minute and per hour, per email per hour, and a global
      ceiling
- [ ] `429` with `Retry-After` and a `rate_limited` envelope
- [ ] A timestamp check rejecting submissions faster than a human could complete the form, plus a
      honeypot field that must stay empty
- [ ] Heuristic spam scoring on link count, repetition, and known patterns, routing to
      `rejected_spam` rather than silently discarding, so a false positive is recoverable
- [ ] IPs are stored as a salted hash for rate limiting, never as a raw address on the enquiry record
- [ ] Rate-limit state failing open on a Valkey outage, with an alert, because blocking every enquiry is
      worse than briefly losing rate limiting

### WP-08.5 Status engine

- [ ] The transition table from `data-contracts.md` section 4.1 as the only authority, imported from
      `packages/contracts`
- [ ] Every transition validated, writing an append-only `EnquiryStatusEvent` plus an `AuditEvent` in
      one transaction
- [ ] An invalid edge returns `invalid_transition` with the permitted next states, so a client can
      correct itself
- [ ] Terminal states reject every outgoing transition
- [ ] Optimistic concurrency on the enquiry row, so two staff members acting simultaneously cannot
      interleave into an impossible state
- [ ] `toCustomerStatus()` applied at every customer boundary; `customerStatus` denormalised onto the
      event row so a timeline is one query

### WP-08.6 Enquiry form

- [ ] `/enquiry` and `/services/[slug]/enquiry` with the service pre-identified and displayed
- [ ] Progressive enhancement: a Server Action handles submission so the form works without
      JavaScript, and client validation is an enhancement rather than the gate
- [ ] Fields per `EnquirySchema`, each with a persistent visible label, hint, and inline error
- [ ] Consent checkbox with the full purpose statement adjacent - not behind a link, and never
      pre-checked
- [ ] **Errors preserve safe fields.** On failure the form re-renders with every value except consent
      retained, focus moves to an error summary at the top, and the summary links to each field. This is
      ENQ-402's "errors preserve safe form fields".
- [ ] Submit button disables and sets `aria-busy` during flight while keeping its width
- [ ] Confirmation page showing the reference prominently, copyable, with what happens next and an
      invitation to create an account
- [ ] A retryable failure keeps the data and offers retry; a non-retryable one explains the fix
- [ ] Honeypot field hidden accessibly, so a screen reader user is not trapped by it

### WP-08.7 Tests

- [ ] Unit: validation, normalisation, reference generation, fingerprinting, transition table, status
      mapping
- [ ] Integration: one submission produces exactly one enquiry, one status event, one audit event, and
      three outbox rows; a replayed key produces no second record; a concurrent double submission
      produces one record
- [ ] Integration: every invalid transition rejected; every valid one recorded
- [ ] **Leak test**: the customer response for an enquiry carrying notes, an owner, and an internal
      status contains none of those values
- [ ] E2E keyboard-only: navigate to the form, complete it, submit, and read the reference using only
      the keyboard
- [ ] E2E: a validation failure preserves fields and moves focus to the summary
- [ ] E2E: the form submits with JavaScript disabled

## Verification

```bash
pnpm --filter api test
pnpm test:integration -- --grep "enquiry"
pnpm test:e2e -- --grep "enquiry"
pnpm test:a11y -- --grep "enquiry"
```

## Exit gate

- [ ] ENQ-401: a valid enquiry is stored once; an invalid request returns field-level errors; duplicate
      submissions create no duplicate record, proven for the key path, the fingerprint path, and the
      concurrent path
- [ ] ENQ-402: a keyboard-only user submits successfully; the confirmation displays the reference;
      errors preserve safe fields and move focus to a linked summary
- [ ] ENQ-403: invalid transitions are rejected; no customer response contains an internal note or a
      staff-only status
- [ ] Consent is mandatory and `consentAt` is server-generated
- [ ] The response does not wait on Zoho or Resend
- [ ] Rate limiting is effective and fails open with an alert on a Valkey outage
- [ ] No enquiry message text appears in any log or error report
