# Playwright UI — local headed testing

Use this runbook for browser-visible checks of the public website. Customer accounts and customer
sign-in have been retired; the former portal manual test is now a regression check that old account
URLs route to Contact.

## Start the browser suites

From the repository root:

```bash
pnpm --filter web test:auth:headed
pnpm --filter web test:checkout
```

The checkout browser test exercises guest contact/delivery fields and the COD presentation against
a mocked order response. It does not use D1 or place a live order. The checkout gate remains off in
production until catalogue prices and stock are verified.

For the full suite:

```bash
pnpm --filter web test:browser
```

The production Cloudflare staff login cannot be exercised through the local test server. Verify
staff access in production only after the Cloudflare Access application, allowed staff emails,
audience, role map, and independent MFA policy are configured.

See [pre-deploy-verification.md](./pre-deploy-verification.md) for the remaining checks.
