# Cloudflare Workers operations

The web application runs as a full-stack Cloudflare Worker built by vinext. Cloudflare Pages snapshot generation is no longer part of this deployment path. The Worker uses the bound D1 database (`cera-production-db`), R2 bucket (`cera-media`), and KV namespace (`VINEXT_KV_CACHE`). Legacy Pages, production SSH, and staging SSH deployment workflows are manually disabled in GitHub. The replacement Worker workflow is in draft PR #14 and is not on `main`; GitHub has `CLOUDFLARE_ACCOUNT_ID` but still needs a narrowly scoped `CLOUDFLARE_API_TOKEN` before automatic deployment can succeed.

## Production scope and unavailable tools

The Worker serves the public website, the D1-backed staff enquiry queue, staff order fulfilment, and COD checkout APIs. Customer accounts and customer sign-in are retired; customers use public enquiries and, once enabled, guest checkout. Resend is not configured, so email delivery is unavailable. Checkout is disabled. The D1 catalogue is seeded from the checked-in product list; there is no live product editor or inventory manager.

Payload CMS and Vendure are retained as local-development source, not deployed services. The Worker build does not include either app, the Worker has no `CMS_API_URL`, and the Payload adapter still requires PostgreSQL. Editors therefore cannot publish content through the old `/admin` CMS. Order fulfilment uses the new staff page, but there is no live product editor or stock-management screen. ERPNext is not required for the D1 enquiry queue and is not part of the Cloudflare runtime.

The `admin`, `crm`, and `catalogue` hostnames redirect to the Access-protected `https://staff.ceramedical.org` workspace. Staff operations require a verified Cloudflare Access assertion and an allowlisted email mapped to a CERA staff role. Configure Access email one-time PIN for staff sign-in; the application does not claim that email OTP is multi-factor authentication. The `/privacy` and `/terms` pages are explicitly marked as drafts and need owner review before the site is treated as ready to collect real customer data.

## Configuration

Set these values in the Cloudflare Worker environment. Keep secrets in Wrangler/Cloudflare secrets or GitHub Actions secrets; do not put secret values in `wrangler.json`.

| Variable/secret                                | Purpose                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                         | Canonical public origin; checked-in Worker default is `https://www.ceramedical.org`.                                                             |
| `NEXT_PUBLIC_CHECKOUT_ENABLED`                 | Guest COD checkout route gate; checked-in Worker default is `false`. Enable only after product prices and available stock are verified.          |
| `ENQUIRY_CONSENT_VERSION`                      | Must match the consent copy shown by the deployed enquiry form.                                                                                  |
| `ENQUIRY_RATE_LIMIT_SALT` (secret)             | Random per-environment salt for hashed hourly enquiry and guest-checkout email/IP rate-limit keys.                                               |
| `SESSION_SECRET` (secret)                      | Base64-encoded key of at least 32 random bytes; rotate it to invalidate all CERA sessions.                                                       |
| `CLOUDFLARE_ACCESS_TEAM_DOMAIN`                | Access issuer URL. Checked-in Wrangler value: `https://super-bush-de78.cloudflareaccess.com`.                                                    |
| `CLOUDFLARE_ACCESS_AUD`                        | Staff-host Access audience tag. Checked-in Wrangler value: `5ffdfccf5d79358d158f5826a3711049ce1b5308ac9e9a21700754bd86258854`.                   |
| `CLOUDFLARE_ACCESS_STAFF_ROLE_MAP`             | JSON mapping exact staff emails to approved CERA roles, e.g. `{"staff@example.org":["administrator"]}`; store as a Worker secret.                |
| `RESEND_API_KEY` (secret), `RESEND_FROM_EMAIL` | Sends enquiry acknowledgements, staff alerts, claim links and newsletter opt-in emails. The sending domain/address must be verified with Resend. |
| `EMAIL_STAFF_ALERT_TO` (secret)                | Operations mailbox for new enquiry alerts. This is configured on the production Worker.                                                          |

The deployment also requires GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token needs permission to deploy the Worker. Run D1 migrations separately with an operator token authorized for D1. `wrangler.json` contains public defaults and resource identifiers only.

## Vinext cache

Vinext's `kvDataAdapter()` stores ISR responses and cached fetch/`unstable_cache` data in the `VINEXT_KV_CACHE` namespace. The binding and namespace ID are declared in `apps/web/wrangler.json`; the Cloudflare Vite build carries this binding into `dist/server/wrangler.json`, which is used for deploys. Keep the namespace available and preserve its ID across deployments. If it is replaced, update the Wrangler binding before building and deploying; cached entries can be regenerated as routes are requested. Vinext's default cache-entry TTL is 30 days, and KV propagation is eventually consistent, so content invalidations may take a short time to be visible everywhere.

## Identity and access

Configure a Cloudflare Access self-hosted application for `staff.ceramedical.org/*`. Restrict it to named staff emails and enable email one-time PIN. The Worker verifies `Cf-Access-Jwt-Assertion` against the Access JWKS, expected issuer, staff application audience, and email-to-role allowlist. It rejects missing configuration or unapproved identities. The application treats Access admission as authentication and separately checks the allowlisted CERA role for every staff operation. Configure the Access application and policy in the Cloudflare dashboard; Wrangler does not manage Access applications.

Do not accept request-supplied role, email, or identity values as credentials. The removed precomputed token remains in earlier Git history: revoke/rotate the production session secret and invalidate sessions created with it. This repository change does not rotate live secrets or rewrite history.

## D1 schema and checkout

For a fresh local preview database, inspect and apply the migrations locally:

```sh
pnpm exec wrangler d1 migrations list cera-production-db --config apps/web/wrangler.json --remote
pnpm exec wrangler d1 migrations list cera-production-db --config apps/web/wrangler.json --local
pnpm exec wrangler d1 migrations apply cera-production-db --config apps/web/wrangler.json --local
```

Migration `0003_cloudflare_runtime.sql` adds the D1 integration-delivery outbox, enquiry claim tokens, newsletter opt-in records, checkout idempotency fields, and the three explicitly priced catalogue rows. Migration `0004_disable_unverified_products.sql` disables every product row until an operator verifies its current price and available stock. Guest checkout accepts COD only, stores no customer account ID, and limits new orders to 5 per email and 10 per IP per hour using salted hashes; the retired Safepay route returns `410`. Checkout stays disabled by default until product prices and stock are verified.

After migration and product verification, verify guest checkout: add a priced item, enter the customer's contact and delivery details, complete COD checkout, and verify staff see the exact order lines and can update fulfillment. Staff reads and changes require approved roles; updates produce audit events. Enquiry intake records consent and a D1 outbox entry; missing provider settings are recorded as failed delivery attempts, not reported as sent. The staff delivery screen lets administrators retry failed integrations.

## Enquiries, email and newsletter

The enquiry form requires same-origin submission, validates the shared input/consent schema, rejects honeypot/too-fast submissions, and applies hourly IP/email limits. D1 stores salted hashes, not raw IP addresses. The current limits are 10 submissions per IP and 5 per email per hour. Old counters can be pruned with a scheduled maintenance task; they contain only hashed keys and are not used after their window expires.

An accepted enquiry is stored in D1, which is the authoritative staff queue, and creates two email delivery records: customer acknowledgement and staff alert. Configure and verify Resend and the operations mailbox before expecting email delivery. Failed deliveries remain visible for administrator retry; enquiry intake remains recorded in D1 if email delivery is unavailable. Newsletter addresses stay pending until the subscriber confirms through the emailed one-time link; unsubscribe links are single-use. If mail configuration is absent, the subscribe endpoint returns an error and does not claim success.

## Build, preview and deploy

```sh
pnpm --filter web run build:vinext
pnpm --filter web run start:vinext
```

Deployment uses `pnpm deploy:cloudflare`, which builds and deploys `dist/server/wrangler.json`. The Worker routes all six production hostnames through the application while their existing proxied DNS records remain in place. The production Worker has the `VINEXT_KV_CACHE` binding. Verify the public host, Access-protected staff host, D1, R2, and KV bindings after each deployment.

## Current production cutover state

On 2026-11-01 (PKT), Wrangler deployed production Worker version `c0097ac2-2a10-4c09-afea-d1b26e469cc8` from branch `fix/cloudflare-edge-flows` at source commit `6b38346` and routed the public and staff hostnames through it. That deployment predates the guest-checkout and Access-session changes now being prepared on this branch. At the time of the smoke check, customer sign-in showed an identity-provider setup notice, unauthenticated staff routes redirected to sign-in, staff API order reads and updates returned 403, and COD checkout returned 503 while its gate was off. The retired Safepay endpoint returned 410 and unknown routes returned 404. The `cera-web.pages.dev` alias redirects to `www.ceramedical.org`; its previous 21 production deployments were deleted with Wrangler, leaving the redirect deployment as the only production deployment. Wrangler reported no preview deployments.

The retired Pages Worker accepted request-provided identity/session data and exposed staff order APIs. Its Pages deployment URLs have been removed, and the branded domains now reach the Worker. New random `SESSION_SECRET` and `ENQUIRY_RATE_LIMIT_SALT` secrets were uploaded directly to the Worker, and `EMAIL_STAFF_ALERT_TO` was configured. Session rotation invalidates sessions issued with the historical secret; the precomputed token remains in Git history. The current source switches staff authentication to Cloudflare Access and removes customer sign-in. The Access team issuer and staff-app audience are in the checked-in Wrangler variables, but are not live until this branch is deployed. The Access application's email-OTP-only policy and approved staff email-to-role secret still need owner configuration. Resend API key/sender configuration is also missing. Enquiries are saved in the D1 staff queue even when email delivery is unavailable; ERPNext access is not required.

The production D1 schema was compared with migration `0001`; the existing base tables and indexes matched. Migrations `0001` through `0004` were applied on 2026-11-01. Migration `0004` disables the three seeded products until an operator verifies their current prices and stock. Wrangler reports no migrations pending, and the D1 product rows are currently disabled. The pre-migration time-travel bookmark is `00000043-00000000-00005115-aa83f8f4439efd7e7e89541c5eab20de`. Restore only for a verified recovery; it rolls back later database changes too.

The Worker workflow and cutover source are in draft PR #14 and are not merged to `main`; production was last deployed from an earlier branch revision with Wrangler. GitHub has `CLOUDFLARE_ACCOUNT_ID` but lacks `CLOUDFLARE_API_TOKEN`, so automated deployment cannot work until that secret is added. Customer sign-in has been removed. Before staff sign-in is usable, restrict the staff Access application to email OTP and configure the approved staff email-to-role secret; the checked-in issuer and audience values take effect after deployment. Add Resend API key and verified sender for outbound email. Keep checkout disabled until product prices and available stock are verified.
