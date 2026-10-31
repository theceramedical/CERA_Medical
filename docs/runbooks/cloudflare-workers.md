# Cloudflare Workers operations

The web application runs as a full-stack Cloudflare Worker built by vinext. Cloudflare Pages snapshot generation is no longer part of this deployment path. The Worker uses the bound D1 database (`cera-production-db`), R2 bucket (`cera-media`), and KV namespace (`VINEXT_KV_CACHE`). Legacy Pages, production SSH, and staging SSH deployment workflows are manually disabled in GitHub. The replacement Worker workflow is in draft PR #14 and is not on `main`; GitHub has `CLOUDFLARE_ACCOUNT_ID` but still needs a narrowly scoped `CLOUDFLARE_API_TOKEN` before automatic deployment can succeed.

## Production scope and unavailable tools

The Worker currently serves the public website, the D1-backed staff enquiry queue, staff order fulfilment, customer account routes, and COD checkout APIs. Production OIDC and Resend are not configured, so staff/customer sign-in and email delivery are unavailable. Checkout is disabled. The current D1 catalogue is seeded from the checked-in product list; there is no live product editor or inventory manager.

Payload CMS and Vendure are retained as local-development source, not deployed services. The Worker build does not include either app, the Worker has no `CMS_API_URL`, and the Payload adapter still requires PostgreSQL. Editors therefore cannot publish content through the old `/admin` CMS. Order fulfilment uses the new staff page, but there is no live product editor or stock-management screen. ERPNext is not required for the D1 enquiry queue and is not part of the Cloudflare runtime.

The `admin` and `crm` hostnames redirect to `https://www.ceramedical.org/staff`; `catalogue.ceramedical.org` redirects to `/staff/orders`. Wrangler deployed these redirects and the catalogue Worker route on 2026-11-01. Staff operations still require a CERA staff session; Cloudflare Access is an additional gate on the `staff` hostname. The `/privacy` and `/terms` pages are explicitly marked as drafts and need owner review before the site is treated as ready to collect real customer data.

## Configuration

Set these values in the Cloudflare Worker environment. Keep secrets in Wrangler/Cloudflare secrets or GitHub Actions secrets; do not put secret values in `wrangler.json`.

| Variable/secret                                                                                                         | Purpose                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                                                                                                  | Canonical public origin; checked-in Worker default is `https://www.ceramedical.org`.                                                                         |
| `NEXT_PUBLIC_CHECKOUT_ENABLED`                                                                                          | Public COD checkout route gate; checked-in Worker default is `false`. Set to `true` only after production customer OIDC is configured and verified.          |
| `ENQUIRY_CONSENT_VERSION`                                                                                               | Must match the consent copy shown by the deployed enquiry form.                                                                                              |
| `ENQUIRY_RATE_LIMIT_SALT` (secret)                                                                                      | Random per-environment salt for hashed hourly email/IP rate-limit keys.                                                                                      |
| `SESSION_SECRET` (secret)                                                                                               | Base64-encoded key of at least 32 random bytes; rotate it to invalidate all CERA sessions.                                                                   |
| `OIDC_CUSTOMER_ISSUER`, `OIDC_CUSTOMER_CLIENT_ID`, `OIDC_CUSTOMER_CLIENT_SECRET` (secret), `OIDC_CUSTOMER_REDIRECT_URI` | Customer OIDC client. Register `https://www.ceramedical.org/auth/callback`.                                                                                  |
| `OIDC_STAFF_ISSUER`, `OIDC_STAFF_CLIENT_ID`, `OIDC_STAFF_CLIENT_SECRET` (secret), `OIDC_STAFF_REDIRECT_URI`             | Separate staff OIDC client. Register the same callback and ensure staff tokens include approved CERA groups plus a verified MFA claim (`cera_mfa` or `amr`). |
| `RESEND_API_KEY` (secret), `RESEND_FROM_EMAIL`                                                                          | Sends enquiry acknowledgements, staff alerts, claim links and newsletter opt-in emails. The sending domain/address must be verified with Resend.             |
| `EMAIL_STAFF_ALERT_TO` (secret)                                                                                         | Operations mailbox for new enquiry alerts. This is configured on the production Worker.                                                                      |

The deployment also requires GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token needs permission to deploy the Worker. Run D1 migrations separately with an operator token authorized for D1. `wrangler.json` contains public defaults and resource identifiers only.

## Vinext cache

Vinext's `kvDataAdapter()` stores ISR responses and cached fetch/`unstable_cache` data in the `VINEXT_KV_CACHE` namespace. The binding and namespace ID are declared in `apps/web/wrangler.json`; the Cloudflare Vite build carries this binding into `dist/server/wrangler.json`, which is used for deploys. Keep the namespace available and preserve its ID across deployments. If it is replaced, update the Wrangler binding before building and deploying; cached entries can be regenerated as routes are requested. Vinext's default cache-entry TTL is 30 days, and KV propagation is eventually consistent, so content invalidations may take a short time to be visible everywhere.

## Identity and access

Register both customer and staff OIDC clients with the callback URI above. The callback validates state, nonce, PKCE, verified email and provider groups. Staff sessions are rejected unless the identity has a CERA staff role and a verified MFA claim. The app verifies the sealed session and role again on every staff API request. Cloudflare Access may be used as an additional network gate, but it does not replace the CERA session or role checks.

Do not accept request-supplied role, email, or identity values as credentials. The removed precomputed token remains in earlier Git history: revoke/rotate the production session secret and invalidate sessions created with it. This repository change does not rotate live secrets or rewrite history.

## D1 schema and checkout

For a fresh local preview database, inspect and apply the migrations locally:

```sh
pnpm exec wrangler d1 migrations list cera-production-db --config apps/web/wrangler.json --remote
pnpm exec wrangler d1 migrations list cera-production-db --config apps/web/wrangler.json --local
pnpm exec wrangler d1 migrations apply cera-production-db --config apps/web/wrangler.json --local
```

Migration `0003_cloudflare_runtime.sql` adds the D1 integration-delivery outbox, enquiry claim tokens, newsletter opt-in records, checkout idempotency fields, and the three explicitly priced catalogue rows. Migration `0004_disable_unverified_products.sql` disables every product row until an operator verifies its current price and available stock. The checkout handler accepts COD only; the retired Safepay route returns `410`. Checkout stays disabled by default until production customer OIDC, product prices, and stock are verified.

After migration, verify the local/preview customer journey: sign in with a verified customer account, add a priced item, complete COD checkout, confirm the customer order appears under that account, and verify staff see the exact order lines and can update fulfillment. Staff reads and changes require staff roles; updates produce audit events. Enquiry intake records consent and a D1 outbox entry; missing provider settings are recorded as failed delivery attempts, not reported as sent. The staff delivery screen lets administrators retry failed integrations.

## Enquiries, email and newsletter

The enquiry form requires same-origin submission, validates the shared input/consent schema, rejects honeypot/too-fast submissions, and applies hourly IP/email limits. D1 stores salted hashes, not raw IP addresses. The current limits are 10 submissions per IP and 5 per email per hour. Old counters can be pruned with a scheduled maintenance task; they contain only hashed keys and are not used after their window expires.

An accepted enquiry is stored in D1, which is the authoritative staff queue, and creates two email delivery records: customer acknowledgement and staff alert. Configure and verify Resend and the operations mailbox before expecting email delivery. Failed deliveries remain visible for administrator retry; enquiry intake remains recorded in D1 if email delivery is unavailable. Newsletter addresses stay pending until the subscriber confirms through the emailed one-time link; unsubscribe links are single-use. If mail configuration is absent, the subscribe endpoint returns an error and does not claim success.

## Build, preview and deploy

```sh
pnpm --filter web run build:vinext
pnpm --filter web run start:vinext
```

Deployment uses `pnpm deploy:cloudflare`, which builds and deploys `dist/server/wrangler.json`. The Worker routes all six production hostnames through the application while their existing proxied DNS records remain in place. The production Worker has the `VINEXT_KV_CACHE` binding. Verify the production hostname, OIDC callback, D1, R2, and KV bindings after each deployment.

## Current production cutover state

On 2026-11-01 (PKT), Wrangler deployed production Worker version `082f23e3-e2d3-4ecf-aa84-ad68eebf289c` from branch `fix/cloudflare-edge-flows` and routed `ceramedical.org`, `www.ceramedical.org`, `staff.ceramedical.org`, `admin.ceramedical.org`, `catalogue.ceramedical.org`, and `crm.ceramedical.org` through it. The production Worker has the `VINEXT_KV_CACHE` binding. The `staff` hostname remains behind Cloudflare Access. Browser-user-agent smoke checks returned 200 for `/` and `/api/health`; customer sign-in and sign-up pages return 200 with an identity-provider setup notice. The legacy `admin` and `crm` hosts return 308 to `/staff`, and `catalogue` returns 308 to `/staff/orders`. Unauthenticated staff routes redirect to sign-in; staff API order reads and updates return 403. Checkout returns 503 while its gate is off, the retired Safepay endpoint returns 410, and unknown routes return 404. The `cera-web.pages.dev` alias redirects to `www.ceramedical.org`; its previous 21 production deployments were deleted with Wrangler, leaving the redirect deployment as the only production deployment. Wrangler reported no preview deployments.

The retired Pages Worker accepted request-provided identity/session data and exposed staff order APIs. Its Pages deployment URLs have been removed, and the branded domains now reach the Worker, which validates sealed sessions and roles for staff APIs. New random `SESSION_SECRET` and `ENQUIRY_RATE_LIMIT_SALT` secrets were uploaded directly to the Worker, and the configured `EMAIL_STAFF_ALERT_TO` mailbox was uploaded as a Worker secret. Session rotation invalidates sessions issued with the historical secret. The precomputed token remains in Git history. Production OIDC issuer/client credentials and Resend API key/sender configuration are still missing, so customer/staff sign-in and email delivery are not ready; checkout remains disabled. The existing `auth.ceramedical.org` host timed out during an 8-second connection check. Configure reachable production customer/staff clients in the existing identity provider (do not reuse localhost credentials), the Resend API key and verified sender, before enabling customer ordering. Enquiries are saved in the D1 staff queue even when email delivery is unavailable, but staff cannot sign in to manage the queue until staff OIDC is configured; no ERPNext access is required.

The production D1 schema was compared with migration `0001`; the existing base tables and indexes matched. Migrations `0001` through `0004` were applied on 2026-11-01. Migration `0004` disables the three seeded products until an operator verifies their current prices and stock. Wrangler reports no migrations pending, and the D1 product rows are currently disabled. The pre-migration time-travel bookmark is `00000043-00000000-00005115-aa83f8f4439efd7e7e89541c5eab20de`. Restore only for a verified recovery; it rolls back later database changes too.

The Worker deployment workflow and cutover source are in draft PR #14 and are not merged to `main`; the current Worker was manually deployed from that branch with Wrangler. In GitHub, the legacy Pages deploy, production SSH release, and staging SSH deploy workflows are manually disabled. GitHub has `CLOUDFLARE_ACCOUNT_ID` but lacks `CLOUDFLARE_API_TOKEN`, so the Worker workflow cannot deploy until the token is added. Production customer and staff OIDC issuer/client configuration and Resend API key/sender configuration are still missing. Do not enable checkout until customer identity, product prices, and available stock are verified; email delivery also remains unavailable until Resend is configured.
