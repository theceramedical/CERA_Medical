# Architecture Decision Records

Required by PRD section 10 ("architecture decisions are required") and PRD 9.2, which reserves
`docs/adr/`. Records are authored here during delivery and copied to `docs/adr/` at Phase 15 handover.

Format: context, decision, consequences, alternatives considered. A record is never edited once
accepted; it is superseded by a new record that references it.

| ID                                                       | Title                                                      | Status   |
| -------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| [ADR-001](ADR-001-design-tokens-from-reference-image.md) | Design tokens derive from the reference image, not the PRD | Accepted |
| [ADR-002](ADR-002-node-24-payload-3x.md)                 | Node 24 runtime and Payload pinned to 3.x                  | Accepted |
| [ADR-003](ADR-003-api-worker-split.md)                   | Separate `apps/api` and `apps/worker`                      | Accepted |
| [ADR-004](ADR-004-oidc-relying-party.md)                 | OIDC relying party built on `openid-client` v6             | Accepted |
| [ADR-005](ADR-005-vendure-checkout-neutralisation.md)    | Vendure checkout neutralised in three layers               | Accepted |
| [ADR-006](ADR-006-zoho-idempotency.md)                   | Zoho deduplication strategy and fallback                   | Accepted |
| [ADR-007](ADR-007-resend-idempotency-and-webhooks.md)    | Resend idempotency keys and webhook verification           | Accepted |
| [ADR-008](ADR-008-local-s3-seaweedfs-over-minio.md)      | SeaweedFS as the local S3 stand-in, not MinIO              | Accepted |
