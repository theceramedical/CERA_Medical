# OWASP 2025 review

Reviewed against the implemented controls. This is a design review, not a penetration test.

| Area                  | Control                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Broken access control | Staff routes validate the Cloudflare Access JWT and require an explicit role mapping.                         |
| Injection             | Zod validation before persistence. No raw SQL from request bodies.                                            |
| Supply chain          | pnpm catalog pins, frozen lockfile, install-script allow-list.                                                |
| Secrets               | No production credentials in the repository. Local fallback session cookies are sealed.                       |
| Logging               | Enquiry message text is excluded from logs and error envelopes.                                               |
| SSRF / edge           | Cloudflare Worker routes use same-origin checks and D1-backed handlers. Return-to paths reject absolute URLs. |
| Webhooks              | Resend signatures are checked over the raw body before a delivery is recorded.                                |

Secret scanning and container scanning run in CI. The Cloudflare Access email-OTP policy and staff email-to-role map remain owner configuration and have not been verified in production. This design review is not a penetration test.
