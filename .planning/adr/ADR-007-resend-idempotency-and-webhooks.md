# ADR-007: Resend idempotency keys and webhook verification

**Status:** Accepted
**Date:** 2026-09-21

## Context

INT-802's acceptance is "a repeated job sends one email; verified webhook events update delivery
status; bounce and complaint events are recorded." PRD 7 adds: a CERA-owned verified sending domain,
separate test and production keys, an idempotency key based on event type and enquiry ID, and webhook
signature verification before accepting any event.

Verified against Resend's documentation:

- Idempotency is the **`Idempotency-Key`** HTTP header, exposed by the Node SDK as `idempotencyKey`.
  Keys are 1-256 characters and **retained for 24 hours**. Same key with the same payload replays the
  original response; same key with a different payload returns `409 invalid_idempotent_request`;
  concurrent reuse returns `409 concurrent_idempotent_requests`. The recommended shape is
  `entity/id`.
- Webhooks are delivered through **Svix**. Headers are `svix-id`, `svix-timestamp`, `svix-signature`;
  the signature is HMAC-SHA256 over `{svix-id}.{svix-timestamp}.{raw-body}` with a `whsec_` secret and
  a 5-minute timestamp tolerance. **Verification requires the raw body.**
- Event ordering is **not guaranteed**.
- There is no test-versus-live key prefix. Separation is by permission and domain scope. Simulator
  recipients are `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`.

The 24-hour retention window matters: our retry policy for a failing provider can exceed a day, so
the provider key alone cannot guarantee single delivery.

## Decision

1. **Two-layer idempotency.** The `IntegrationDelivery` row, with a unique constraint on
   `idempotencyKey = '{eventType}/{enquiryId}'`, is authoritative and unbounded in time. The same
   string is sent as Resend's `Idempotency-Key` to cover in-flight duplicates inside the 24-hour
   window. The database prevents the day-later duplicate that the provider has forgotten about.

2. **Transition emails include the status.** A status-update email keys on
   `resend.status.update/{enquiryId}/{statusEventId}`, because two different transitions must produce
   two different emails while a retry of either produces one.

3. **Webhook verification is unconditional.** The route reads the **raw body** before any JSON
   parsing, verifies the Svix signature, and returns `401` on failure without recording anything. An
   unverified request never reaches business logic. The webhook path is excluded from body parsing in
   Fastify configuration, which is the usual way this breaks.

4. **Out-of-order tolerance.** Delivery state is a monotonic lattice, ordered
   `queued < sent < delivered`, with `bounced` and `complained` as terminal. A late `sent` after
   `delivered` is ignored rather than regressing state. Every event is also stored raw-but-minimised
   for audit, so ignoring is visible rather than silent.

5. **Bounces and complaints act.** A hard bounce marks the address undeliverable and suppresses
   further sends to it, surfacing in the operations view so staff contact the customer another way. A
   complaint suppresses permanently and raises an audit event; it is never retried, because retrying
   after a complaint damages domain reputation.

6. **Key and domain separation.** Sending-access keys scoped to one verified subdomain
   (`notifications.<domain>`), separate keys per environment, none with full access. The
   `RESEND_WEBHOOK_SECRET` is separate from the API key.

7. **Content minimisation.** The staff alert contains the reference, the service, and a link to the
   operations record - **never the enquiry message**, because email is outside the audited access
   boundary. The customer receipt echoes the reference and the service only.

8. **Local and CI use Mailpit** behind the same adapter interface, so templates are rendered and
   inspected without a Resend account. Phase 14 additionally drives the three simulator addresses in
   staging to prove the bounce and complaint paths.

## Consequences

- One email per event survives a retry at any interval, not only within 24 hours.
- Raw-body handling is a known foot-gun and is covered by a test that posts a tampered signature and
  asserts nothing is recorded.
- Out-of-order events cannot corrupt delivery state, which removes a class of flaky integration test.
- Suppression means some customers receive no email. That is correct behaviour and it is made visible
  to operations rather than failing quietly.
- Keeping the message body out of email means staff must open the operations record, which is the
  point: access stays inside the audited boundary.

## Alternatives considered

**Rely on Resend's idempotency key alone.** Rejected: 24-hour retention is shorter than our maximum
retry horizon, so a delayed retry would resend.

**Parse JSON first, verify later.** Rejected: signature verification requires the exact raw bytes,
and re-serialising is not byte-identical.

**Trust the webhook because the URL is secret.** Rejected: a URL is not a credential, and PRD 7
requires signature verification explicitly.

**Include the enquiry message in the staff alert for convenience.** Rejected: it copies the most
sensitive field into mailboxes and backups outside the audit trail, against PRD 10's privacy
requirement.
