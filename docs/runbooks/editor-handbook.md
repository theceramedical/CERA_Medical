# Cloudflare operations handover

This replaces the older Payload, Vendure, and ERPNext operating guide. Those server-backed dashboards are not deployed in the current Cloudflare production runtime.

## Current production status

- The public website runs on the Cloudflare Worker with D1, R2, and KV bindings.
- Enquiry submissions are stored in the D1 staff queue. Resend is not configured, so customer acknowledgements and staff alert emails are not being delivered.
- The staff queue and order-fulfilment pages use a staff-only Cloudflare Access assertion, an explicit email-to-role allowlist, and an MFA policy. The Worker code fails closed until its Access issuer, audience, role map, and MFA-policy assertion are configured.
- Customer sign-in and account pages are removed. Customers submit enquiries or use guest COD checkout when it is enabled.
- Checkout accepts cash on delivery only. The production checkout gate remains off; no online payment method is active.
- The current product catalogue is code and D1-seed managed. There is no production product editor or stock-management screen.
- Payload CMS content editing is not deployed. The current Worker does not connect to the local Payload/PostgreSQL service. Content updates must go through the repository and a reviewed deployment until a Cloudflare-compatible editor is built.
- The `/privacy` and `/terms` pages are marked as drafts. Have the owner review and approve them before treating the site as ready to collect customer data.

## Staff links

Use the Access-protected staff hostname:

- Enquiry queue: `https://staff.ceramedical.org/staff`
- Order fulfilment: `https://staff.ceramedical.org/staff/orders`
- Integration delivery status: `https://staff.ceramedical.org/staff/deliveries`

Cloudflare Access is the staff identity boundary. The Worker verifies its JWT, binds the email to the configured role allowlist, and requires the operator to confirm that independent MFA is enforced by the Access policy.

## Operator runbook

See [Cloudflare Workers operations](cloudflare-workers.md) for Wrangler deployment, D1 migrations, required Worker variables and secrets, verified smoke checks, and the current production blockers. Do not use the old `admin`, `crm`, or `catalogue` dashboard instructions while PR #14 is pending; the existing Payload and Vendure dashboards are not part of the Worker.
