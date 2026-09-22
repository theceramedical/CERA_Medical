# ADR-006: Zoho deduplication strategy and fallback

**Status:** Accepted
**Date:** 2026-09-21

## Context

INT-801's acceptance is "a retry updates the same CRM record; failures enter a retry queue and remain
visible without losing the enquiry." PRD 7 adds: use Zoho CRM V8 OAuth with the narrowest module
scopes, never expose tokens to browser code, upsert by external enquiry ID, and reconcile retries
without duplicates.

Verified against the Zoho CRM v8 documentation:

- `POST /crm/v8/{module}/upsert` accepts an ordered `duplicate_check_fields` array. Only
  system-defined dedupe fields (`Email` for Leads) and user-defined **unique** fields are accepted.
- An **External** field is the intended external-ID mechanism. It can only be created through the
  Zoho UI, values are settable only by API, and it requires **Enterprise (10/module) or Ultimate
  (15/module)**. For upsert the `X-EXTERNAL` header is not needed; Zoho treats the field as unique
  and includes it in the duplicate check automatically.
- Refresh tokens do not expire and are not rotated; access tokens last 3600s; a maximum of five
  refresh tokens per user per client.
- Limits are credit-based over a rolling 24 hours, with per-edition concurrency and a sub-concurrency
  cap of 10 shared by COQL, Convert Lead, and bulk operations over 10 records.
- Accounts and API domains are per data centre. A mismatch yields `INVALID_CLIENT`.

CERA's Zoho edition is not yet known (PRD 22 places Zoho account ownership at "Before Day 2"), so the
External field may not be available.

## Decision

1. **Local record is authoritative.** `IntegrationDelivery` with `idempotencyKey =
'zoho.lead.upsert/{enquiryId}'` and a unique constraint is the primary guarantee that one enquiry
   produces one CRM write attempt lineage. Correctness does not depend on a provider feature.

2. **Preferred dedupe: External field.** When `ZOHO_EXTERNAL_FIELD` is configured, upsert with
   `duplicate_check_fields: ['External_Lead_ID', 'Email']`, setting `External_Lead_ID` to the enquiry
   **reference** (not the internal UUID, so a CRM user can read it back to staff on a call).

3. **Fallback on lower editions.** When the variable is unset, upsert with
   `duplicate_check_fields: ['Email']` and persist the returned record ID to
   `IntegrationDelivery.externalId`. Subsequent writes target that ID directly. Startup logs which
   mode is active; the mode is visible in the operations delivery view so support is never guessing.

4. **Token handling.** Refresh token in the secret store, read only by `apps/worker`. Access tokens
   cached in memory with early expiry and a single-flight refresh. The `api_domain` from the token
   response is used as the base URL - never a hard-coded host. Scopes limited to
   `ZohoCRM.modules.leads.CREATE` and `ZohoCRM.modules.leads.UPDATE`, adding `.READ` only when
   reconciliation needs it.

5. **Rate limiting.** Worker concurrency capped at 5 with a token-bucket limiter. `429` and credit
   exhaustion are retryable with exponential backoff plus jitter; `4xx` other than 429 is terminal
   and goes to dead letter, because retrying a malformed payload only burns credits.

6. **Payload minimisation.** `ZohoLeadPayloadSchema` is an explicit allow-list. The enquiry message
   goes to `Description`; no internal note, internal status, or staff identity is sent. Zoho receives
   the customer status vocabulary only.

7. **Reconciliation.** `pnpm reconcile:zoho` lists dead letters, re-attempts them with the same
   idempotency key, and reports what changed. Dead letters remain visible to operations
   indefinitely - the enquiry is never lost because the CRM write failed.

8. **Local and CI use a fake driver** behind the same interface, recording calls in memory so retry
   and dedupe behaviour is tested without a Zoho account.

## Consequences

- Retry safety holds on any Zoho edition, because the local unique constraint is doing the work.
- Two dedupe paths exist, so both are tested. The fallback path is the default in CI, since it is the
  one that runs when CERA's edition is unknown.
- Using the enquiry reference as the external ID makes support conversations concrete: the customer
  quotes `CERA-260921-K4M2X` and staff find it in either system.
- An External field cannot be created programmatically. Phase 10 emits a runbook step for a CERA
  administrator, and absence degrades rather than blocks.
- Credit consumption is bounded by design, so a retry storm cannot exhaust a day's quota.

## Alternatives considered

**Upsert on `Email` only.** Simplest, works on every edition. Rejected as the primary path: two
enquiries from the same person for different services would collapse into one CRM record, losing the
second enquiry's context.

**Create-then-search on retry.** Rejected: racy and expensive in credits, and a failed create whose
response was lost produces exactly the duplicate this is meant to prevent.

**Call Zoho inline in the request.** Rejected outright: PRD 4.1 requires the response not wait on
Zoho, and PRD 8.1 requires durability.
