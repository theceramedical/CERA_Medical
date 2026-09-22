# ADR-003: Separate `apps/api` and `apps/worker`

**Status:** Accepted
**Date:** 2026-09-21

## Context

PRD 9.2 lists three applications: `web`, `cms`, and `commerce`. It does not say where the enquiry,
customer-ownership, and operations APIs live. But PRD 9 describes "Vendure worker and integration
workers" as separate private-network processes, PRD 1.2 requires that "every protected route enforces
role and record ownership on the server", and PRD 8.1 requires that external calls use "an outbox or
durable job record so successful local writes are not lost".

PRD 6 explicitly allows this: "The owner may split implementation across focused pull requests, but
the acceptance statement remains the feature's release condition."

The realistic alternative is to implement the API as Next.js route handlers inside `apps/web`.

## Decision

Add two applications.

**`apps/api`** - Fastify 5 with Drizzle ORM. Owns the `cera_app` database and is the only component
that authorises access to enquiries, profiles, notes, and audit records. `apps/web` is a consumer: it
forwards the sealed session and holds no authority.

**`apps/worker`** - BullMQ on Valkey plus a timer-based outbox sweep. The only component holding Zoho
and Resend credentials.

## Consequences

Why this is worth two extra containers:

- **One authorisation surface.** The AUTH-502 requirement is "automated authorization tests prove
  each role can only access approved routes, records, and actions". With one Fastify app that is a
  single test suite against a single route table. Spread across server components, server actions,
  and route handlers, the same proof requires enumerating every render path, and the enumeration
  silently goes stale as pages are added.
- **A real trust boundary.** A rendering-layer compromise - a bad dependency in the React tree, a
  leaked build artefact - cannot escalate to data access, because the API re-derives identity and
  ownership from the sealed session on every request.
- **Credential isolation.** Zoho and Resend credentials exist only in the worker. They are not in the
  image that serves public HTML.
- **Independent scaling and latency accounting.** The PRD's API p95 budget of 800ms "excluding
  external-provider latency" is measurable when the API is a process, not a render path.
- **Blast radius.** A stuck integration job cannot exhaust the connection pool serving public pages.

Costs accepted:

- Two more containers to build, deploy, health-check, and monitor.
- A network hop between web and API, mitigated by co-location on the Docker network and server-side
  fetch with `cache: 'no-store'` only where correctness requires it.
- Contract discipline becomes mandatory rather than optional, which is why `packages/contracts` is
  Phase 02 and precedes both consumers.
- A documented departure from the PRD's directory listing, recorded here and cross-referenced in
  `architecture.md` so a reviewer reading the PRD is not surprised.

## Alternatives considered

**API as Next.js route handlers in `apps/web`.** Fewer moving parts and one less deployment. Rejected
because the authorisation proof required by AUTH-502 becomes an open-ended audit of every render
path, and because provider credentials would then live in the public-facing image.

**Collapse the worker into the API with an in-process queue.** Rejected: an in-process queue loses
work on restart, which directly violates PRD 8.1. It is the same mistake Vendure's documentation
warns against for its own in-memory queue.

**Put the API inside Payload as custom endpoints.** Rejected: it couples the enquiry lifecycle to CMS
release cadence and puts customer records in the database a content editor's admin session reaches.
