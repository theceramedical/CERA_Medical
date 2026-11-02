# CERA Medical Platform

Public website and operations tools for CERA Medical. The checked-in production target is a
full-stack Cloudflare Worker with D1 for application records and R2 for media. Wrangler bindings
and the Worker build are configured in [`apps/web/wrangler.json`](apps/web/wrangler.json) and
[`apps/web/package.json`](apps/web/package.json).

The platform presents research services, publishes content, collects enquiries, and supports the
current product-order workflow. It does not store clinical records. The Cloudflare edge handler is
the production request path; the repository also retains application services and a Docker Compose
stack for local development.

## Requirements

- Node.js 24.21.0 (`.nvmrc`)
- pnpm 10.28.2 (`packageManager`)
- Wrangler access to the `cera-web` Worker, `cera-production-db` D1 database, and `cera-media`
  R2 bucket for Cloudflare deployment
- Docker Compose v2 only when running the local dependency stack

## Local development

```bash
nvm use
corepack enable
pnpm install
cp .env.example .env
pnpm stack:up
pnpm dev
```

The local Compose overlay starts development dependencies. See
[`docs/runbooks/local-development.md`](docs/runbooks/local-development.md) for local setup and
troubleshooting. `pnpm stack:reset` deletes local database, queue, and media volumes.

## Cloudflare Workers

`apps/web/wrangler.json` configures the Worker, production D1 binding (`DB`), and R2 binding
(`MEDIA`). The deployment command is `pnpm deploy:cloudflare`. See
[`docs/runbooks/cloudflare-workers.md`](docs/runbooks/cloudflare-workers.md) for identity and
integration secrets, D1 migrations, checkout and deployment configuration.

The Worker is live on the production hostnames and uses D1 and R2. The retired `cera-web.pages.dev`
deployment redirects to the Worker, and its prior deployment aliases were removed. Customer
accounts and customer sign-in are retired; customer orders are guest-only and COD-only. The latest
guest-checkout and Cloudflare Access code is not yet deployed. Staff Access policy/role mapping,
Resend credentials, and the GitHub Actions `CLOUDFLARE_API_TOKEN` remain to be configured; checkout
stays disabled until product availability is verified.

The Worker runs the Next.js route handlers and server-rendered app. Enquiry intake, guest COD
checkout, staff operations, and newsletter opt-in use the same Worker runtime and D1 database.
Safepay is retired; its old start endpoint returns `410`.

## Repository map

```text
apps/web/       Next.js site and Cloudflare Worker build
apps/api/       Application API source retained for local/dev workflows
apps/cms/       Payload content-management source
apps/commerce/  Vendure catalogue and order-management source
apps/worker/    Integration worker source
packages/db/    PostgreSQL and D1 schemas
packages/ui/    Design tokens and accessible interface components
packages/contracts/ Shared data and API schemas
scripts/        Cloudflare deployment and repository tooling
infra/          Local development dependencies and checks
docs/runbooks/  Current operator and editorial procedures
```

## Common checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use semantic design tokens rather than raw colors. Keep secrets out of source control. Do not treat
UI visibility or a client-side session check as authorization.

## Accessibility and browser support

WCAG 2.2 AA is the interface target. Interactive controls must be keyboard reachable with visible
focus, and text and UI boundaries must meet the documented contrast requirements. Supported browsers
are current and previous major versions of Chrome, Edge, Firefox, and Safari.

## Licence

Proprietary. All rights reserved.
