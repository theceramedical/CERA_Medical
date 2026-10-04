# Playwright UI — local headed testing

Use this when you want to **see the browser** and step through sign-in, account, and enquiries
yourself — not run a headless CI script.

## A. Real stack (Authentik + API) — recommended before production

This matches what you run in production: real OIDC, real `apps/api`, real database.

### 1. Start the platform

```bash
pnpm stack:up
pnpm migrate    # if you reset the DB recently
pnpm dev        # web :3000, api :3003, cms, commerce, worker
```

Confirm in the browser: http://localhost:3000 loads.

### 2. Open Playwright UI (headed)

From the repo root:

```bash
pnpm test:live:ui
```

Or from `apps/web`:

```bash
pnpm test:live:ui
```

The **Playwright Test UI** opens. Choose a test under `portal manual checklist`, click **Run**,
and a **visible Chrome window** opens.

### 3. How the manual tests work

Each test hits `page.pause()`:

- Playwright **pauses** and shows the **Inspector**.
- You complete **Authentik sign-in**, click links, and fix anything that breaks.
- Click **Resume** (or step) in the Inspector to continue to the next assertion.

Checklist covered:

1. Sign-in form → Authentik → `/account`
2. Profile → Enquiries (must **not** show “Something went wrong”) → Claim
3. Sign out → `/account/enquiries` redirects to sign-in

Optional slower motion:

```bash
PW_SLOW_MO=200 pnpm test:live:ui
```

Different site URL (e.g. staging):

```bash
PW_BASE_URL=https://www.ceramedical.org pnpm --filter web test:live:ui
```

### 4. Headed without the UI panel

```bash
pnpm test:live:headed
```

Same tests, one browser window, no Playwright UI sidebar.

---

## B. Stub API (no Authentik) — fast regression on portal markup

Playwright starts a **fixture API** on `:3101` and a **production build** on `:3100`. Session
cookies are faked; OIDC is not exercised.

```bash
pnpm --filter web test:portal:ui
```

Or headed only:

```bash
pnpm --filter web test:portal:headed
```

Use this after code changes to confirm account pages render without the error boundary. Use **A**
before you push images.

---

## Troubleshooting

| Issue                             | What to do                                                         |
| --------------------------------- | ------------------------------------------------------------------ |
| `test:live:ui` cannot reach site  | Ensure `pnpm dev` is running; default URL is http://127.0.0.1:3000 |
| Pause never resumes               | Use the Playwright Inspector **Resume** button                     |
| Stub suite hangs on start         | First run builds Next (~2–4 min); wait for “Ready” in the terminal |
| `next start` / standalone warning | E2E uses `node .next/standalone/apps/web/server.js` automatically  |

See also [pre-deploy-verification.md](./pre-deploy-verification.md).
