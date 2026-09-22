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

- [ ] `/services` - listing from `GET /v1/services`, with category filter, search, and sort
- [ ] Filter state in the URL as the single source of truth, so a filtered view is shareable and the
      back button behaves
- [ ] `/services/[slug]` - detail assembled from the catalogue record plus its CMS
      `ServicePresentation`, with the enquiry CTA rendered only when `enquiryEnabled` is true
- [ ] `generateStaticParams` over active services with revalidation on catalogue change
- [ ] Missing, inactive, and enquiry-disabled services each handled distinctly: unknown slug is a 404
      with suggestions; an inactive service that once existed returns 410 and links to the listing
- [ ] Empty filter results offer a way back rather than a dead end

### WP-07.2 Article routes

- [ ] `/articles` - listing with category filter and pagination
- [ ] `/articles/[slug]` - detail with cover, category pill, author, date, reading time, and body
- [ ] `/articles/category/[slug]` - category archive
- [ ] A Lexical renderer mapping only the constrained feature set from Phase 05, with an explicit
      fallback for an unknown node type instead of a crash
- [ ] Related articles by shared category, excluding the current one
- [ ] Draft articles return 404 to anonymous requests, including by direct slug

### WP-07.3 Remaining pages

- [ ] `/about` and `/contact` from CMS pages
- [ ] `/privacy`, `/terms`, and any additional policy from the `Policies` collection, with an effective
      date shown
- [ ] `/faqs` with an accessible accordion
- [ ] Redirects from the CMS `Redirects` collection, applied in `next.config` where static and in
      `proxy.ts` where dynamic, with loop detection

### WP-07.4 Search

- [ ] `GET /v1/search` over published content and active services
- [ ] PostgreSQL full-text search with `tsvector`, weighted title over body, ranked, with trigram
      similarity for near-misses
- [ ] **Deterministic ordering** - ranked results with a stable tiebreaker on `id`, because equal-rank
      results in arbitrary order make WEB-303 untestable and pagination incoherent
- [ ] Published and active filters applied in SQL, not after fetch
- [ ] Debounced input, a results page with an empty state and suggestions, and a live region announcing
      the result count
- [ ] Rate limited, with query length capped and the raw query never logged

### WP-07.5 SEO

- [ ] `generateMetadata` on every route: title, description, canonical, Open Graph, Twitter card
- [ ] Canonical URLs absolute and self-referencing; one canonical per page
- [ ] `sitemap.ts` generated from published content and active services only, with `lastModified`,
      excluding search, dev, account, staff, and preview routes, split if it approaches the 50k limit
- [ ] `robots.ts` disallowing `/api`, `/dev`, `/account`, `/staff`, `/preview`, and search parameters
- [ ] JSON-LD: `Organization` and `WebSite` site-wide, `MedicalBusiness` on the homepage, `Service` on
      service detail, `Article` with `BreadcrumbList` on articles
- [ ] **No JSON-LD claim that the PRD excludes.** No `offers`, no `price`, no
      `MedicalProcedure`, no clinical assertion - structured data must not promise capabilities the
      platform does not have
- [ ] OG images generated per route with the design tokens, cached
- [ ] `noIndex` honoured from the CMS SEO group

### WP-07.6 Error and empty states

- [ ] A distinct, useful state for each: unknown route, removed content, empty search, empty filter,
      upstream failure, and slow upstream
- [ ] An upstream failure degrades rather than blanks: cached catalogue data renders with a notice, and
      the page never shows an empty services grid because Vendure restarted
- [ ] Every error page offers navigation and, where relevant, the enquiry CTA

## Verification

```bash
pnpm --filter web build
pnpm test:e2e -- --grep "content|search|seo"
pnpm test:a11y -- --grep "services|articles"
curl -s localhost:3000/sitemap.xml | grep -c '<url>'
curl -s localhost:3000/articles/<known-draft-slug> -o /dev/null -w '%{http_code}'  # expect 404
```

## Exit gate

- [ ] WEB-302: every route has copy, metadata, a self-referencing canonical, sharing metadata, and a
      useful empty or error state
- [ ] WEB-303: search and filters are deterministic across repeated identical queries; draft content is
      excluded from search, listings, sitemap, and direct access; the sitemap contains only indexable
      routes
- [ ] JSON-LD validates and contains no excluded claim
- [ ] Redirects resolve without loops
- [ ] axe reports zero violations on every route in this phase
- [ ] An upstream outage degrades to cached content with a notice, never a blank section
