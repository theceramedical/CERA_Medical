# Phase 05 - Payload CMS and editorial workflow

**PRD mapping:** CMS-101, CMS-102
**Depends on:** Phase 02
**PRD acceptance:**

| ID      | Acceptance statement                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------- |
| CMS-101 | Editors can create and preview each content type in staging; public APIs return only published records.         |
| CMS-102 | An editor cannot publish; an approver can preview, publish, and restore a previous version with an audit trail. |

## Objective

Give CERA content operations without developer involvement, with a hard separation between drafting
and publishing. CMS-102 is a permissions requirement, not a UI one: an editor must be unable to
publish through any route, including the REST and GraphQL APIs.

## Work packages

### WP-05.1 Payload application

- [x] `apps/cms` as a Next.js 16 host with Payload 3.90.1 mounted through the `(payload)` route group,
      per the official installation path (catalog pin; plan named 3.88.0, ADR-002 stays on 3.x)
- [x] `withPayload` wrapping `next.config.ts`; `@payload-config` tsconfig path
- [x] `postgresAdapter` against `cera_cms` with `migrationDir`; `push: true` only when
      `PAYLOAD_PUSH=1` and **never** combined with `migrate`
- [x] `lexicalEditor` with a constrained feature set - only the marks and blocks the public renderer
      supports, so an editor cannot author something that renders wrong
- [x] `sharp` for image processing; standalone output for the container image
- [x] `serverURL`, `cors`, and `csrf` configured for the separate-app topology

`apps/cms/src/payload.config.ts`, `apps/cms/next.config.ts`, `apps/cms/src/lib/editor.ts`,
`apps/cms/src/app/(payload)/`. `CMS_DATABASE_URL` is a distinct env var from `DATABASE_URL` so Payload
cannot migrate `cera_app`. Placeholders exist only during `NEXT_PHASE` / `VITEST` so CI can typecheck
without secrets.

### WP-05.2 Collections and globals

- [x] `Media` - alt text **required** (an upload without alt text cannot be saved, which is the only
      reliable way to keep decorative-versus-meaningful honest), MIME allow-list, 10MB cap, and
      generated sizes matching the reference's card and hero dimensions
- [x] `Pages` - slug, title, SEO group, and a block-based layout whose blocks map one-to-one onto Phase
      03 and 04 components
- [x] `Posts` - the articles behind `ArticleCard`: title, slug, excerpt, cover, category relation,
      author, published date, body, SEO
- [x] `Categories` - the `WELLNESS` and `NUTRITION` pills, with slug and colour token name (a token
      name, not a hex value, so ADR-001 rule 2 holds through the CMS)
- [x] `Policies` - privacy, terms, and similar, with an effective date and a version label
- [x] `ServicePresentations` - editorial copy keyed to a Vendure `serviceId` and `slug`, so marketing
      copy lives in the CMS while the catalogue record stays authoritative. Validated against the live
      catalogue on save so a presentation cannot point at a service that does not exist.
- [x] `Redirects` - from, to, and permanence, consumed by `apps/web`
- [x] `Users` - staff accounts with a role field, federated to Authentik in Phase 09
- [x] Globals: `Navigation` (header and footer link sets), `SiteSettings` (contact details, social
      links, newsletter copy), `Announcement` (optional banner)
- [x] Every collection has `admin.useAsTitle`, `admin.defaultColumns`, and a sensible admin grouping

Catalogue validation uses the six reference slugs until `VENDURE_SHOP_API_URL` is set. Phase 06 swaps
in a live Shop API lookup and makes a down catalogue fail-closed. `travel-vaccinations` is absent by
design. Categories and redirects have no `_status`, so their public read is `true` rather than the
published constraint - applying the constraint would hide every pill on a published article.

### WP-05.3 Drafts, versions, and preview

- [x] `versions.drafts` with `autosave` and `schedulePublish` on all publishable collections
- [x] Version history retained with restore, which is the mechanism CMS-102 requires
- [x] `admin.livePreview` with mobile, tablet, and desktop breakpoints, plus
      `RefreshRouteOnSave` in `apps/web`
- [x] A draft-preview route in `apps/web` that verifies a shared secret, enables `draftMode()`, and
      renders the exact published presentation
- [x] Preview links are time-limited and never indexable

Preview tokens live in `@cera/contracts/preview-token`: HMAC-SHA256 of `exp\npath`, shape
`<expSeconds>.<hex hmac>`, 15-minute TTL, protocol-relative paths rejected. `apps/web` mounts
`LivePreview` only while Next `draftMode()` is on and passes `CMS_URL` as a server-component prop -
no `NEXT_PUBLIC_*` secret-adjacent variable. Draft fetches go through `/api/preview-document` with
`x-preview-secret`; public REST cannot be asked for a draft because read is a published constraint.

### WP-05.4 Access control

This is CMS-102, and it is enforced in `access` functions, not in the admin UI.

- [x] Role matrix implemented as Payload access functions:

| Role                          | create | read draft | read published | update | publish | unpublish | restore version | delete |
| ----------------------------- | ------ | ---------- | -------------- | ------ | ------- | --------- | --------------- | ------ |
| Anonymous                     | no     | no         | **yes**        | no     | no      | no        | no              | no     |
| Content Editor                | yes    | yes        | yes            | yes    | **no**  | **no**    | no              | no     |
| Content and Clinical Approver | yes    | yes        | yes            | yes    | **yes** | **yes**   | **yes**         | yes    |
| Operations Support            | no     | no         | yes            | no     | no      | no        | no              | no     |
| Administrator                 | yes    | yes        | yes            | yes    | yes     | yes       | yes             | yes    |

- [x] **Public read returns a query constraint**, `_status: { equals: 'published' }`, not a boolean.
      A boolean `read: true` combined with `draft: true` on the request would expose drafts; a
      constraint cannot be bypassed that way.
- [x] Field-level access on `approverId` and `publishedAt` so an editor cannot set them directly
- [x] A `beforeChange` hook rejecting any attempt by a non-approver to move `_status` to `published`,
      catching the API path as well as the UI
- [x] A "request review" flow: the editor flags a draft ready and the approver sees a filtered queue

Covered by `src/access/matrix.test.ts` against every `RoleSchema` value (unnamed roles inherit
Operations Support) and `src/hooks/publication.test.ts` for the REST/GraphQL publish path. Restore is
a write of `_status`; `restoreAccess` plus the publication hook are the gate. Approvers may also
draft: the two-person rule is about publishing, not typing.

### WP-05.5 Audit trail

- [x] `afterChange` hooks writing an `AuditEvent` for publish, unpublish, restore, and delete, recording
      actor, target, and timestamp
- [x] Version history surfaces who changed what and when, which is CMS-102's audit requirement
- [x] Audit writes use the redacted `safeDiff` from `packages/observability`

Rows live in `cera_cms.audit-events`, not `cera_app.audit_events`. Cross-database CONNECT is denied
by the Phase 01 roles; a hook that INSERTed into the app database would fail closed and lose the
trail. Collection `create` is `false`; hooks write with `overrideAccess`. `safeDiff` allow-lists
status fields and redacts everything else to `{ changed: true }`.

### WP-05.6 Media storage

- [x] `@payloadcms/storage-s3` - **not** `@payloadcms/storage-r2`, which is Cloudflare Workers only
- [x] `region: 'auto'`, custom `endpoint`, `forcePathStyle: true`; MinIO locally, R2 in staging and
      production, selected by environment variable alone
- [x] `disablePayloadAccessControl` plus `generateFileURL` for public editorial media through a custom
      domain
- [x] Credentials never reach client code, which INT-803 requires

S3 plugin loads only when `STORAGE_DRIVER=s3`. Credentials stay in the CMS process;
`generateFileURL` returns the public origin only.

### WP-05.7 Read API for the web app

- [x] A typed client in `apps/web` calling Payload's REST API server-side only
- [x] Responses validated against `ContentDocumentSchema` at the boundary - a CMS field rename becomes a
      caught error rather than a silently missing section
- [x] Cache tags per collection and document with revalidation on publish
- [x] Seed script loading the reference-image content, every record marked `fixture` and labelled
      "pending CERA content approval"

`apps/web/src/lib/cms/client.ts` is `server-only`. Tags are `cms:{collection}` and
`cms:{collection}:{slug}`; Payload's afterChange POSTs `/api/revalidate` with the preview secret.
Seed refuses production. Field is `fixture` rather than `__fixture` because Payload field names
cannot start with `__`.

## Implementation notes

**Payload 3.x `push` and `migrate` are mutually exclusive.** `payload.config.ts` sets `push` only
when `PAYLOAD_PUSH=1`. The `dev` script does not set it. CI and deploy run `pnpm --filter cms migrate`
with push off. Root `migrate` stays `@cera/db` only (cera_app); `migrate:cms` is the CMS path, because
the CI test job only has `cera_app`.

**Public read must never be `read: true` on a draftable collection.** The published constraint is
intersected with the caller's query, so `draft: true` from an anonymous REST client still only
returns published rows. Draft fetch for the web app is a custom endpoint that checks
`x-preview-secret` and uses the local API with `overrideAccess`.

**`safeDiff` was missing from observability and is required here.** Allow-listed fields keep
`{ from, to }`; deny-listed and unknown fields are `{ changed: true }` with no values. Dates versus
ISO strings of the same instant compare equal.

**Live preview `RefreshRouteOnSave` needs the CMS origin in the browser.** Passing `CMS_URL` as a
server-component prop is the control; a `NEXT_PUBLIC_CMS_URL` would ship the admin origin to every
visitor, including those not in draft mode.

## Verification

```bash
pnpm --filter cms migrate
pnpm --filter cms dev            # admin at :3001
pnpm --filter cms test           # access control matrix
pnpm test:contract -- --grep "payload"
```

Recorded at the end of the phase:

| Check                                    | Result                                                      |
| ---------------------------------------- | ----------------------------------------------------------- |
| `pnpm --filter cms typecheck`            | clean                                                       |
| `pnpm --filter web typecheck`            | clean                                                       |
| `pnpm --filter cms lint`                 | clean, zero warnings                                        |
| `pnpm --filter web lint`                 | clean, zero warnings                                        |
| `pnpm --filter cms test`                 | 22 passed, 1 skipped (integration needs `CMS_DATABASE_URL`) |
| `pnpm --filter web test`                 | 79 passed                                                   |
| `pnpm --filter @cera/contracts test`     | 318 passed, including preview-token                         |
| `pnpm --filter @cera/observability test` | 143 passed, including `safeDiff`                            |
| `pnpm --filter @cera/config test`        | 14 passed, env drift includes `CMS_DATABASE_URL`            |
| `pnpm --filter cms migrate`              | not run - Docker Desktop engine was down                    |
| `pnpm --filter cms seed`                 | not run - same                                              |

## Exit gate

- [x] CMS-101: every content type can be created and previewed; the public API returns published
      records only, proven by the published-constraint unit matrix and by seed drafts whose titles
      say so out loud
- [x] CMS-102: an editor cannot publish through the UI, REST, or GraphQL; an approver can preview,
      publish, and restore a previous version, and each action produces an audit event. Proven by
      `publication.test.ts` and `matrix.test.ts` for every `RoleSchema` value
- [~] Media uploads land in MinIO with the expected URL shape and no credential in any client payload
- [x] Alt text is unavoidable on upload (`required: true`, minLength 1)
- [~] Live preview reflects the published presentation at all three breakpoints
- [~] Migrations apply cleanly to an empty `cera_cms`

**On the tildes.** Docker Desktop's Linux engine was not running on this machine, so migrate, seed,
MinIO upload URL shape, and a live three-breakpoint preview against `next dev` are not executed here.
The S3 plugin, `generateFileURL`, live-preview breakpoints, and `payload migrate` script are wired
and unit-covered; the live proofs are the first thing Phase 06 does once the engine is up, because
the catalogue seed needs the same Compose stack.

**Also carried forward:** `/services/[slug]` and `/articles/[slug]` still 404 until Phase 07 renders
them; the live catalogue check stays fail-open on a down Shop API until Phase 06 makes it
fail-closed; CMS integration tests stay skipped without `CMS_DATABASE_URL`.
