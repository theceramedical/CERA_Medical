# CERA Medical Platform

Public website, service catalogue, and controlled enquiry platform for CERA Medical.

The platform presents services, publishes content, and captures enquiries. It deliberately does **not**
take payments, and it does not store clinical records. Enquiries are handled by staff and mirrored to
Zoho CRM.

Delivery is planned and tracked in [`.planning/`](.planning/README.md). Read
[`.planning/README.md`](.planning/README.md) first.

## Prerequisites

| Tool           | Version | Notes                                                                                                                    |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Node.js        | 24.21.0 | Pinned by `.nvmrc`. `engine-strict=true` makes a wrong version an install error rather than a confusing runtime failure. |
| pnpm           | 10.28.2 | `corepack enable` installs it                                                                                            |
| Docker Desktop | 28.5.1+ | With Compose v2                                                                                                          |
| git            | 2.41+   |                                                                                                                          |

Windows users: the shell scripts in `infra/scripts/` require LF line endings. `.gitattributes`
enforces this. A CRLF script fails inside a container with `bad interpreter: No such file or directory`.

## Getting started

```bash
# 1. Activate the pinned Node version
nvm use            # reads .nvmrc
corepack enable

# 2. Install dependencies
pnpm install

# 3. Create your local environment file, then fill in the placeholders
cp .env.example .env

# 4. Start the local infrastructure: PostgreSQL, Valkey, SeaweedFS, Mailpit
pnpm stack:up

# 5. Confirm every service is genuinely usable, not merely running
pnpm health
```

`pnpm health` exercises each dependency rather than checking that a container exists: it runs a real
query, a real queue write, and confirms the S3 bucket. That distinction is what catches a service
whose logs look clean but which nothing can actually reach.

**If something fails**, [`docs/runbooks/local-development.md`](docs/runbooks/local-development.md) has
the specific fix for each failure seen so far: wrong Node version, CRLF line endings breaking container
scripts, Postgres skipping its init script, SeaweedFS healthy but unreachable, port conflicts, and
missing binaries.

## Local services

| Service      | URL                   | Purpose                                    |
| ------------ | --------------------- | ------------------------------------------ |
| web          | http://localhost:3000 | Public site and customer portal            |
| cms          | http://localhost:3001 | Payload admin                              |
| commerce     | http://localhost:3002 | Vendure dashboard                          |
| api          | http://localhost:3003 | Authorisation boundary and business logic  |
| worker       | http://localhost:3004 | Outbox drainer; health endpoint only       |
| PostgreSQL   | localhost:5432        | Five databases, five least-privilege roles |
| Valkey       | localhost:6379        | Queues, rate limiting, cache               |
| SeaweedFS S3 | http://localhost:9001 | Cloudflare R2 stand-in                     |
| Mailpit      | http://localhost:8025 | Resend stand-in; view every sent email     |

Local stand-ins sit behind the same interfaces as the live providers, so moving to R2, Resend, and
Zoho is an environment change rather than a code change. See
[`docs/runbooks/prerequisites.md`](docs/runbooks/prerequisites.md).

## Commands

| Command                        | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `pnpm dev`                     | Every app in watch mode                               |
| `pnpm lint`                    | ESLint across all workspaces, zero warnings tolerated |
| `pnpm typecheck`               | TypeScript across all workspaces                      |
| `pnpm test`                    | Unit and contract tests                               |
| `pnpm test:e2e`                | Playwright end-to-end tests                           |
| `pnpm test:a11y`               | Automated accessibility checks                        |
| `pnpm build`                   | Production build of every app                         |
| `pnpm health`                  | Verify the local stack                                |
| `pnpm stack:up` / `stack:down` | Start or stop local infrastructure                    |
| `pnpm stack:reset`             | Stop and **delete all local data**                    |

## Repository layout

```
apps/
  web/          Next.js 16 - public site and customer portal
  cms/          Payload 3 - content management
  commerce/     Vendure 3 - service catalogue
  api/          Fastify - authorisation boundary and business logic
  worker/       Outbox drainer and integration runner
packages/
  contracts/    Zod schemas shared by every app
  ui/           Design system: tokens and primitives
  config/       Shared TypeScript, ESLint, Prettier, Vitest config
  observability/  Logging and error reporting with PII redaction
infra/
  compose/      Per-environment Compose overlays
  postgres/     Database initialisation
  caddy/        Edge configuration and security headers
  scripts/      Health checks, backup, deploy
.planning/      Delivery plan, design language, architecture, ADRs
docs/runbooks/  Operational procedures
```

`api` and `worker` are additions to the PRD's original topology. The reasoning is in
[ADR-003](.planning/adr/ADR-003-api-worker-split.md): the API is the single place authorisation is
enforced, and the worker makes external calls durable so a Zoho outage cannot lose an enquiry.

## Conventions worth knowing before your first change

- **Never hard-code a colour.** Use a semantic design token. The `@cera/no-raw-color` ESLint rule
  fails the build on a hex value, an `rgb()` call, or an arbitrary Tailwind colour outside the token
  layer. Colour is defined once, in `packages/ui/src/styles/`, derived from the approved reference
  image ([ADR-001](.planning/adr/ADR-001-design-tokens-from-reference-image.md)).
- **Never commit a secret.** `.env.example` holds names and safe defaults only. A pre-commit hook
  scans staged changes.
- **Authorisation is enforced server-side, in `apps/api`.** Hiding a UI control is not access control.
- **External calls go through the outbox.** A direct call from a request handler cannot be retried and
  will lose data when the provider is down.
- **Dependency versions live in one place**, the `catalog:` block of `pnpm-workspace.yaml`. Bump there,
  not in an individual `package.json`.
- **Logging goes through `@cera/observability`.** Importing `pino` directly bypasses PII redaction, so
  ESLint blocks it.

## Accessibility and browser support

WCAG 2.2 AA is a delivery requirement, not an aspiration. Every interactive element must be keyboard
reachable with a visible focus indicator, and contrast must meet 4.5:1 for body text and 3:1 for large
text and UI boundaries. `jsx-a11y` rules run at error severity, and Playwright plus axe run in CI.

Supported browsers: the current and previous major versions of Chrome, Edge, Firefox, and Safari.

## Licence

Proprietary. All rights reserved.
