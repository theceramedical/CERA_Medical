# Cloudflare operations handover

This replaces the older Payload, Vendure, and ERPNext operating guide. Those server-backed dashboards are not deployed in the current Cloudflare production runtime.

## Current production status

- The public website runs on the Cloudflare Worker with D1, R2, and KV bindings.
- Enquiry submissions are stored in the D1 staff queue. Resend is not configured, so customer acknowledgements and staff alert emails are not being delivered.
- The staff queue and order-fulfilment pages require a CERA staff session with an approved role and MFA. Cloudflare Access protects the staff hostname, but CERA OIDC credentials are still missing, so staff cannot yet sign in to the application.
- Customer account pages use the same fail-closed OIDC integration. Customer sign-in is not available until its production identity client is configured.
- Checkout accepts cash on delivery only. The production checkout gate remains off; no online payment method is active.
- The current product catalogue is code and D1-seed managed. There is no production product editor or stock-management screen.
- Payload CMS content editing is not deployed. The current Worker does not connect to the local Payload/PostgreSQL service. Content updates must go through the repository and a reviewed deployment until a Cloudflare-compatible editor is built.
- The `/privacy` and `/terms` pages are marked as drafts. Have the owner review and approve them before treating the site as ready to collect customer data.

## Staff links

Use the canonical site after the legacy-dashboard redirect change in PR #14 is deployed:

- Enquiry queue: `https://www.ceramedical.org/staff`
- Order fulfilment: `https://www.ceramedical.org/staff/orders`
- Integration delivery status: `https://www.ceramedical.org/staff/deliveries`

The staff hostname is additionally protected by Cloudflare Access. Access does not replace the CERA session, staff role, or MFA checks.

## Operator runbook

See [Cloudflare Workers operations](cloudflare-workers.md) for Wrangler deployment, D1 migrations, required Worker variables and secrets, verified smoke checks, and the current production blockers. Do not use the old `admin`, `crm`, or `catalogue` dashboard instructions while PR #14 is pending; the existing Payload and Vendure dashboards are not part of the Worker.
