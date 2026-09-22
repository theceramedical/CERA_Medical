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

- [ ] `apps/cms` as a Next.js 16 host with Payload 3.88 mounted through the `(payload)` route group,
      per the official installation path
- [ ] `withPayload` wrapping `next.config.mjs`; `@payload-config` tsconfig path
- [ ] `postgresAdapter` against `cera_cms` with `migrationDir`; `push: true` in local development only
      and **never** combined with `migrate`
- [ ] `lexicalEditor` with a constrained feature set - only the marks and blocks the public renderer
      supports, so an editor cannot author something that renders wrong
- [ ] `sharp` for image processing; standalone output for the container image
- [ ] `serverURL`, `cors`, and `csrf` configured for the separate-app topology

### WP-05.2 Collections and globals

- [ ] `Media` - alt text **required** (an upload without alt text cannot be saved, which is the only
      reliable way to keep decorative-versus-meaningful honest), MIME allow-list, 10MB cap, and
      generated sizes matching the reference's card and hero dimensions
- [ ] `Pages` - slug, title, SEO group, and a block-based layout whose blocks map one-to-one onto Phase
      03 and 04 components
- [ ] `Posts` - the articles behind `ArticleCard`: title, slug, excerpt, cover, category relation,
      author, published date, body, SEO
- [ ] `Categories` - the `WELLNESS` and `NUTRITION` pills, with slug and colour token name (a token
      name, not a hex value, so ADR-001 rule 2 holds through the CMS)
- [ ] `Policies` - privacy, terms, and similar, with an effective date and a version label
- [ ] `ServicePresentations` - editorial copy keyed to a Vendure `serviceId` and `slug`, so marketing
      copy lives in the CMS while the catalogue record stays authoritative. Validated against the live
      catalogue on save so a presentation cannot point at a service that does not exist.
- [ ] `Redirects` - from, to, and permanence, consumed by `apps/web`
- [ ] `Users` - staff accounts with a role field, federated to Authentik in Phase 09
- [ ] Globals: `Navigation` (header and footer link sets), `SiteSettings` (contact details, social
      links, newsletter copy), `Announcement` (optional banner)
- [ ] Every collection has `admin.useAsTitle`, `admin.defaultColumns`, and a sensible admin grouping

### WP-05.3 Drafts, versions, and preview

- [ ] `versions.drafts` with `autosave` and `schedulePublish` on all publishable collections
- [ ] Version history retained with restore, which is the mechanism CMS-102 requires
- [ ] `admin.livePreview` with mobile, tablet, and desktop breakpoints, plus
      `RefreshRouteOnSave` in `apps/web`
- [ ] A draft-preview route in `apps/web` that verifies a shared secret, enables `draftMode()`, and
      renders the exact published presentation
- [ ] Preview links are time-limited and never indexable

### WP-05.4 Access control

This is CMS-102, and it is enforced in `access` functions, not in the admin UI.

- [ ] Role matrix implemented as Payload access functions:

| Role                          | create | read draft | read published | update | publish | unpublish | restore version | delete |
| ----------------------------- | ------ | ---------- | -------------- | ------ | ------- | --------- | --------------- | ------ |
| Anonymous                     | no     | no         | **yes**        | no     | no      | no        | no              | no     |
| Content Editor                | yes    | yes        | yes            | yes    | **no**  | **no**    | no              | no     |
| Content and Clinical Approver | yes    | yes        | yes            | yes    | **yes** | **yes**   | **yes**         | yes    |
| Operations Support            | no     | no         | yes            | no     | no      | no        | no              | no     |
| Administrator                 | yes    | yes        | yes            | yes    | yes     | yes       | yes             | yes    |

- [ ] **Public read returns a query constraint**, `_status: { equals: 'published' }`, not a boolean.
      A boolean `read: true` combined with `draft: true` on the request would expose drafts; a
      constraint cannot be bypassed that way.
- [ ] Field-level access on `approverId` and `publishedAt` so an editor cannot set them directly
- [ ] A `beforeChange` hook rejecting any attempt by a non-approver to move `_status` to `published`,
      catching the API path as well as the UI
- [ ] A "request review" flow: the editor flags a draft ready and the approver sees a filtered queue

### WP-05.5 Audit trail

- [ ] `afterChange` hooks writing an `AuditEvent` for publish, unpublish, restore, and delete, recording
      actor, target, and timestamp
- [ ] Version history surfaces who changed what and when, which is CMS-102's audit requirement
- [ ] Audit writes use the redacted `safeDiff` from `packages/observability`

### WP-05.6 Media storage

- [ ] `@payloadcms/storage-s3` - **not** `@payloadcms/storage-r2`, which is Cloudflare Workers only
- [ ] `region: 'auto'`, custom `endpoint`, `forcePathStyle: true`; MinIO locally, R2 in staging and
      production, selected by environment variable alone
- [ ] `disablePayloadAccessControl` plus `generateFileURL` for public editorial media through a custom
      domain
- [ ] Credentials never reach client code, which INT-803 requires

### WP-05.7 Read API for the web app

- [ ] A typed client in `apps/web` calling Payload's REST API server-side only
- [ ] Responses validated against `ContentDocumentSchema` at the boundary - a CMS field rename becomes a
      caught error rather than a silently missing section
- [ ] Cache tags per collection and document with revalidation on publish
- [ ] Seed script loading the reference-image content, every record marked `__fixture` and labelled
      "pending CERA content approval"

## Verification

```bash
pnpm --filter cms migrate
pnpm --filter cms dev            # admin at :3001
pnpm --filter cms test           # access control matrix
pnpm test:contract -- --grep "payload"
```

## Exit gate

- [ ] CMS-101: every content type can be created and previewed; the public API returns published
      records only, proven by requesting a known draft anonymously and by REST with `draft: true`
- [ ] CMS-102: an editor cannot publish through the UI, REST, or GraphQL; an approver can preview,
      publish, and restore a previous version, and each action produces an audit event
- [ ] Media uploads land in MinIO with the expected URL shape and no credential in any client payload
- [ ] Alt text is unavoidable on upload
- [ ] Live preview reflects the published presentation at all three breakpoints
- [ ] Migrations apply cleanly to an empty `cera_cms`
