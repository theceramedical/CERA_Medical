# OWASP 2025 review

Reviewed against the implemented controls. This is a design review, not a penetration test.

| Area | Control |
| --- | --- |
| Broken access control | Deny-by-default route policies. Ownership is a subject filter. Unowned records return not-found. |
| Injection | Zod validation before persistence. No raw SQL from request bodies. |
| Supply chain | pnpm catalog pins, frozen lockfile, install-script allow-list. |
| Secrets | No production credentials in the repository. Session cookies are sealed. |
| Logging | Enquiry message text is excluded from logs and error envelopes. |
| SSRF / edge | Shop API is not routed by Caddy. Return-to paths reject absolute URLs. |
| Webhooks | Resend signatures are checked over the raw body before a delivery is recorded. |

Secret scanning and container scanning run in CI. A live Authentik MFA rehearsal waits on Docker.
