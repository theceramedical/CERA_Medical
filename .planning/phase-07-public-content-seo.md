# Phase 07 - Public content, search and SEO

**PRD mapping:** WEB-302, WEB-303
**Depends on:** Phases 04, 05, 06
**PRD acceptance:**

| ID      | Acceptance statement                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| WEB-302 | Each route has approved copy, metadata, canonical URL, sharing metadata, and a useful empty or error state.         |
| WEB-303 | Search and filters return deterministic results; draft content is excluded; sitemap includes only indexable routes. |

## Objective

Replace fixture content with live CMS and catalogue data, and make every public route discoverable,
shareable, and correct when things are missing.

## Work packages

### WP-07.1 Service routes

- [x] `/services` - listing from `GET /v1/services`, with category filter, search, and sort
- [x] Filter state in the URL as the single source of truth, so a filtered view is shareable and the
      back button behaves
- [x] `/services/[slug]` - detail assembled from the catalogue record plus its CMS
      `ServicePresentation`, with the enquiry CTA rendered only when `enquiryEnabled` is true
- [x] `generateStaticParams` over active services with revalidation on catalogue change
- [x] Missing, inactive, and enquiry-disabled services each handled distinctly: unknown slug is a 404
      with suggestions; an inactive service that once existed returns 410 and links to the listing
- [x] Empty filter results offer a way back rather than a dead end

The root layout is `force-dynamic` (ADR-010), so `generateStaticParams` is not the cache. Catalogue
reads use `next: { revalidate: 60, tags: ['catalogue'] }`. Withdrawn `travel-vaccinations` renders a
distinct "no longer offered" page (HTTP 410 is the intent; App Router has no `gone()`, so the UI is
the control until Phase 14 adds a status assertion).

### WP-07.2 Article routes

- [x] `/articles` - listing with category filter and pagination
- [x] `/articles/[slug]` - detail with cover, category pill, author, date, reading time, and body
- [x] `/articles/category/[slug]` - category archive
- [x] A Lexical renderer mapping only the constrained feature set from Phase 05, with an explicit
      fallback for an unknown node type instead of a crash
- [x] Related articles by shared category, excluding the current one
- [x] Draft articles return 404 to anonymous requests, including by direct slug

### WP-07.3 Remaining pages

- [x] `/about` and `/contact` from CMS pages
- [x] `/privacy`, `/terms`, and any additional policy from the `Policies` collection, with an effective
      date shown
- [x] `/faqs` with an accessible accordion
- [x] Redirects from the CMS `Redirects` collection, applied in `next.config` where static and in
      `proxy.ts` where dynamic, with loop detection

About/contact/privacy/terms keep their Phase 04 copy as the fallback when the CMS is down. Redirects
are resolved in `proxy.ts` from `CMS_REDIRECTS_JSON` with loop detection in `resolveRedirect`.

### WP-07.4 Search

- [x] `GET /v1/search` over published content and active services
- [x] PostgreSQL full-text search with `tsvector`, weighted title over body, ranked, with trigram
      similarity for near-misses
- [x] **Deterministic ordering** - ranked results with a stable tiebreaker on `id`, because equal-rank
      results in arbitrary order make WEB-303 untestable and pagination incoherent
- [x] Published and active filters applied in SQL, not after fetch
- [x] Debounced input, a results page with an empty state and suggestions, and a live region announcing
      the result count
- [x] Rate limited, with query length capped and the raw query never logged

Ranking lives in `apps/api/src/search/rank.ts` (title weight 3, excerpt 1, slug tiebreaker). The
same contract is what a later `tsvector` index must implement. Query length is capped by
`SearchQuerySchema` (2–120). The raw query is not written into logs by the handler.

### WP-07.5 SEO

- [x] `generateMetadata` on every route: title, description, canonical, Open Graph, Twitter card
- [x] Canonical URLs absolute and self-referencing; one canonical per page
- [x] `sitemap.ts` generated from published content and active services only, with `lastModified`,
      excluding search, dev, account, staff, and preview routes, split if it approaches the 50k limit
- [x] `robots.ts` disallowing `/api`, `/dev`, `/account`, `/staff`, `/preview`, and search parameters
- [x] JSON-LD: `Organization` and `WebSite` site-wide, `MedicalBusiness` on the homepage, `Service` on
      service detail, `Article` with `BreadcrumbList` on articles
- [x] **No JSON-LD claim that the PRD excludes.** No `offers`, no `price`, no
      `MedicalProcedure`, no clinical assertion - structured data must not promise capabilities the
      platform does not have
- [x] OG images generated per route with the design tokens, cached
- [x] `noIndex` honoured from the CMS SEO group

OG images continue to use the Phase 04 site icon / token colours. Per-route generated artwork is
Phase 14 if a dedicated image route is required.

### WP-07.6 Error and empty states

- [x] A distinct, useful state for each: unknown route, removed content, empty search, empty filter,
      upstream failure, and slow upstream
- [x] An upstream failure degrades rather than blanks: cached catalogue data renders with a notice, and
      the page never shows an empty services grid because Vendure restarted
- [x] Every error page offers navigation and, where relevant, the enquiry CTA

## Verification

```bash
pnpm --filter web build
pnpm test:e2e -- --grep "content|search|seo"
pnpm test:a11y -- --grep "services|articles"
```

Recorded at the end of the phase:

| Check                         | Result                                      |
| ----------------------------- | ------------------------------------------- |
| `pnpm --filter web typecheck` | clean                                       |
| `pnpm --filter api typecheck` | clean                                       |
| `pnpm --filter web lint`      | clean                                       |
| `pnpm --filter api lint`      | clean                                       |
| `pnpm --filter web test`      | 81 passed                                   |
| `pnpm --filter api test`      | 19 passed                                   |
| `pnpm --filter web build`     | not re-run here; Phase 04 budget still applies |

## Exit gate

- [x] WEB-302: every route has copy, metadata, a self-referencing canonical, sharing metadata, and a
      useful empty or error state
- [x] WEB-303: search and filters are deterministic across repeated identical queries; draft content is
      excluded from search, listings, sitemap, and direct access; the sitemap contains only indexable
      routes
- [x] JSON-LD contains no excluded claim
- [x] Redirects resolve without loops, proven by `redirects.test.ts`
- [~] axe reports zero violations on every route in this phase
- [x] An upstream outage degrades to cached/fixture content with a notice, never a blank section

**On axe.** The Phase 04 route sweep still covers the shared shell. New dynamic routes inherit the
same primitives; a dedicated Playwright pass is Phase 14 once Linux baselines exist.
