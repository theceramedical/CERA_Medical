# Pre-deploy verification

## Headed / Playwright UI (recommended before pushing images)

See **[playwright-local-ui.md](./playwright-local-ui.md)**.

```bash
pnpm stack:up && pnpm dev
pnpm test:live:ui
```

Run the **portal manual checklist** in the Playwright UI, complete Authentik in the visible browser,
and confirm enquiries/profile do not show “Something went wrong”.

## CI-like gate (optional)

```bash
pnpm typecheck && pnpm test && pnpm test:a11y && pnpm test:e2e
```

Stub portal regression (no Authentik):

```bash
pnpm --filter web test:portal:ui
```

## What the portal E2E covers

Playwright starts a stub API (`e2e/support/backend.mjs`) and a **production** Next build on port 3100. It does **not** start Authentik. Covered flows:

| Flow              | How                                                       |
| ----------------- | --------------------------------------------------------- |
| Sign-in UI        | Form `GET` to `/auth/signin` (no RSC fetch to OIDC)       |
| Account dashboard | Session cookie with verified customer                     |
| Profile           | `GET /v1/me/profile`                                      |
| Enquiries list    | Empty list without server error boundary                  |
| Orders list       | Empty list (checkout enabled in E2E env)                  |
| Claim page        | Shell loads                                               |
| Unverified email  | Warning on dashboard; enquiries → verify-email error page |

OIDC itself is **not** in E2E; use the full local stack below once per release.

## Full local stack (real API + Authentik)

Use this when you change OIDC, session sealing, or portal API behaviour.

```bash
pnpm stack:up
pnpm migrate          # if schema changed
pnpm dev              # web :3000, api :3003, cms, commerce, worker
pnpm health           # infra + apps when dev is running
```

Manual checklist (browser):

1. **Sign in** — header → Sign In → Continue → Authentik → land on `/account`
2. **Profile** — update name, save, reload
3. **Enquiries** — list loads (empty or rows); open one reference if present
4. **Claim** — request claim emails (check Mailpit at http://localhost:8025)
5. **Sign out** — returns to public site; `/account` redirects to sign-in
6. **Orders** — only if `NEXT_PUBLIC_CHECKOUT_ENABLED=true` and checkout tested

## After images are built (production smoke)

On the server or from your machine with URLs set:

```bash
SMOKE_ORIGIN=https://www.ceramedical.org \
SMOKE_API=https://api.ceramedical.org \
pnpm smoke
```

Then repeat the manual sign-in → account → enquiries path once on production.

## When something fails

| Symptom                                 | Likely cause                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| E2E portal 401/404                      | `SESSION_SECRET` mismatch between web build and stub API (should not happen if using `pnpm test:e2e` only) |
| E2E “Something went wrong” on enquiries | Server component threw — run `pnpm test:portal` in dev after `next build` or read API logs in full stack   |
| Local sign-in CORS in console           | Client navigation to `/auth/signin`; ensure **Continue** uses the form, not `next/link`                    |
| Production enquiries only               | API DB/migration (`internal_notes`, `customer_profiles`); API logs at click time                           |

See also [local-development.md](./local-development.md).
