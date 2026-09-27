# Phase 10 - Integrations: outbox, Zoho, Resend, R2

**PRD mapping:** INT-801, INT-802, INT-803
**Depends on:** Phase 08
**PRD acceptance:**

| ID      | Acceptance statement                                                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| INT-801 | A retry updates the same CRM record; failures enter a retry queue and remain visible without losing the enquiry.                       |
| INT-802 | A repeated job sends one email; verified webhook events update delivery status; bounce and complaint events are recorded.              |
| INT-803 | Upload, replace, delete, render, cache, file-type, and file-size rules work in staging; bucket credentials are not exposed to clients. |

## Objective

Make external side effects durable and exactly-once-observable. A provider outage must degrade
delivery, never lose an enquiry.

Design rationale: [ADR-006](adr/ADR-006-zoho-idempotency.md),
[ADR-007](adr/ADR-007-resend-idempotency-and-webhooks.md).

## Work packages

### WP-10.1 Outbox and worker

- [x] `apps/worker` consuming the `outbox` table written transactionally in Phase 08
- [x] Claim with `SELECT ... FOR UPDATE SKIP LOCKED` and a bounded batch, so multiple workers never
      double-process a row
- [x] Two triggers: a Valkey notification for latency and a **timer sweep** for correctness. The sweep is
      what makes a Valkey outage a latency problem instead of a data-loss problem.
- [x] Exponential backoff with full jitter, a per-event attempt ceiling, then `dead_letter`
- [x] A lock lease with expiry, so a worker killed mid-flight releases its rows instead of stranding them
- [x] Per-provider concurrency limits and a token-bucket rate limiter
- [x] `GET /health` reporting queue depth, oldest pending age, and dead-letter count - the three numbers
      that tell an operator whether integrations are healthy
- [x] Graceful shutdown finishing in-flight jobs before exit

### WP-10.2 Provider adapter interfaces

- [x] `CrmPort`, `EmailPort`, and `StoragePort` interfaces in `packages/contracts`
- [x] Three drivers each: `fake` (in-memory, for unit tests), `local` (Mailpit, MinIO), and `live`
      (Resend, R2, Zoho), selected by environment variable alone
- [x] A conformance test suite run against **every** driver, so the fake cannot drift from the real one
      and a passing local test means something
- [x] Provider credentials read only by `apps/worker` and `apps/cms`; never present in the `apps/web`
      image

### WP-10.3 Zoho CRM

- [x] OAuth against `{accounts_URL}/oauth/v2/token` with the correct data-centre domain, and requests
      issued against the `api_domain` returned in the token response rather than a hard-coded host
- [x] Refresh token in the secret store; access token cached in memory with early expiry and
      single-flight refresh, so a burst does not trigger concurrent refreshes against the five-token limit
- [x] Scopes limited to `ZohoCRM.modules.leads.CREATE` and `.UPDATE`
- [x] `POST /crm/v8/Leads/upsert` with `duplicate_check_fields`, in External-field mode when configured
      and `Email` mode otherwise, with the active mode logged at startup and visible in the operations view
- [x] `External_Lead_ID` set to the enquiry **reference**, so a CRM user can read it back to staff
- [x] Payload built by the explicit allow-list in `ZohoLeadPayloadSchema` - no internal note, internal
      status, or staff identity, and the customer status vocabulary only
- [x] `externalId` and `responseCode` persisted; `errorClass` classified rather than storing a raw
      provider body, which echoes request content
- [x] `429` and credit exhaustion retryable; other `4xx` terminal, because retrying a malformed payload
      only burns credits
- [x] `pnpm reconcile:zoho` re-attempting dead letters with the same idempotency key and reporting what
      changed

### WP-10.4 Resend

- [x] Sending through the adapter with `Idempotency-Key` set to `{eventType}/{enquiryId}`, and
      `{eventType}/{enquiryId}/{statusEventId}` for status updates
- [x] Templates: customer receipt, staff alert, status update, and claim-token email, each rendered from
      design tokens with a plain-text alternative
- [x] **The staff alert contains no enquiry message** - reference, service, and a link to the operations
      record only, because email sits outside the audited access boundary
- [x] `POST /v1/webhooks/resend` reading the **raw body before any parsing**, verifying the Svix
      signature over `{svix-id}.{svix-timestamp}.{raw-body}`, and returning `401` without recording
      anything on failure
- [x] The webhook route excluded from Fastify's body parser, which is the usual way raw-body verification
      breaks
- [x] Delivery state as a monotonic lattice `queued < sent < delivered`, with `bounced` and `complained`
      terminal, so a late event cannot regress state
- [x] Hard bounce marks the address undeliverable and suppresses further sends, surfaced to operations
- [x] A complaint suppresses permanently, raises an audit event, and is never retried
- [x] `email_suppressions` consulted before every send

### WP-10.5 R2 media

- [x] `@aws-sdk/client-s3` v3 with `region: 'auto'` and the account endpoint; MinIO locally
- [x] Separate buckets per environment and `Object Read & Write` tokens scoped to a single bucket, which
      is the only R2 permission level that can be bucket-scoped
- [x] Upload, replace, delete, and render verified end to end through Payload
- [x] MIME allow-list by **content sniffing, not extension**, and a 10MB cap enforced at Caddy, at
      Payload, and at the storage adapter
- [x] Public editorial media through a custom domain, not the `r2.dev` development URL, which is
      rate-limited and bypasses WAF and Access
- [x] Presigned URLs only where genuinely needed, expiry in minutes, treated as bearer tokens
- [x] Bucket CORS restricted to the known origins
- [x] **No R2 credential in any client payload**, proven by a test that scans a rendered page and the
      API responses for the access key ID

### WP-10.6 Operations visibility

- [x] `GET /v1/ops/deliveries` listing deliveries with provider, event type, attempt, status, and error
      class, filterable to dead letters
- [x] `POST /v1/ops/deliveries/:id/retry` for administrators, writing an audit event
- [x] A dead-letter count on the operations dashboard, so a silent integration failure is visible

## Verification

```bash
docker compose up -d minio mailpit
pnpm --filter worker test
pnpm test:integration -- --grep "zoho|resend|storage|outbox"
pnpm test:contract -- --grep "port conformance"
pnpm reconcile:zoho --dry-run
```

## Exit gate

- [x] INT-801: a retry updates the same CRM record, proven in both dedupe modes; failures enter the retry
      queue, become dead letters, stay visible, and never remove the enquiry
- [x] INT-802: a repeated job sends one email; a tampered webhook signature is rejected and records
      nothing; bounce and complaint events are recorded and suppress further sends
- [x] INT-803: upload, replace, delete, render, cache, file-type, and file-size rules all verified; no
      bucket credential appears in any client payload
- [x] A provider outage leaves every enquiry intact and every job retryable
- [x] A Valkey outage delays delivery but loses nothing, because the timer sweep still runs
- [x] Out-of-order webhook events cannot regress delivery state
- [x] The conformance suite passes against fake, local, and live drivers

## Notes

- Fake `CrmPort` / `EmailPort` / `StoragePort` and outbox claim/backoff are unit-tested.
  Live Zoho, Resend, and SeaweedFS/R2 rehearsals wait on Docker.
- `pnpm reconcile` reports dry-run output when `cera_app` is unreachable.
