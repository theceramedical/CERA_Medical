# Phase 04 - Web shell and homepage

**PRD mapping:** WEB-301
**Depends on:** Phase 03
**PRD acceptance:** "Core pages work on current mobile and desktop browsers, keyboard navigation is
complete, and automated accessibility checks pass."

## Objective

Assemble the application shell and reproduce the reference homepage, section for section, using only
Phase 03 components. Content comes from fixtures here; Phase 05 and 07 swap in CMS and catalogue data
behind the same props, so this phase's markup does not change when real content arrives.

## Work packages

### WP-04.1 Next.js application

- [ ] `apps/web` on Next.js 16.3.5 with React 19.2.8, App Router, TypeScript strict
- [ ] `output: 'standalone'` for the container image
- [ ] Route groups: `(public)`, `(account)`, `(staff)` - separate layouts and separate auth posture
      from the start, so the staff console is not retrofitted into the public tree
- [ ] `proxy.ts` (Next.js 16 renamed `middleware.ts`) handling request IDs, security headers, and a
      **presence-only** session check for redirect ergonomics. It is explicitly not an authorisation
      boundary; see [ADR-004](adr/ADR-004-oidc-relying-party.md).
- [ ] `instrumentation.ts` wiring the GlitchTip SDK with release and environment
- [ ] `next/image` configured for the MinIO and R2 hosts with explicit remote patterns

### WP-04.2 Shell

- [ ] `Header` per `design-language.md` section 5.5: 80px, sticky with shadow after 8px of scroll,
      wordmark, five nav items with `aria-current` on the active one, search button, `Sign In`,
      `Make an Enquiry`
- [ ] Mobile navigation as a disclosure with `aria-expanded`, `aria-controls`, focus trap, `Escape` to
      close returning focus to the trigger, and scroll lock while open
- [ ] `Footer` per section 5.9: four columns, labelled nav per column, social buttons with visually
      hidden names, newsletter form with a real label and a polite live region for its result
- [ ] `SkipLink` as the first focusable element, visible on focus, targeting `#main`
- [ ] `RootLayout` with `lang="en"`, font variables, `<main id="main">`, and a route announcer so
      client navigation is announced
- [ ] `error.tsx`, `not-found.tsx`, `loading.tsx`, and `global-error.tsx` for every route group, each a
      real page with a heading and a way forward rather than a bare string

### WP-04.3 Homepage sections

Built in reference order, each against the copy transcribed in `design-language.md` section 6.

- [ ] `HeroSection` per section 5.6 - eyebrow, two-tone `display-1` inside a single `<h1>`, supporting
      copy, `primary` plus `outline` buttons, three-item trust row, portrait with real `alt`,
      decorative script SVG, and the overlapping badge card
- [ ] `ServicesSection` - `SectionHeader` with "View All Services", then six `ServiceCard`s in a `<ul>`,
      grid 1 / 2 / 3 / 6 across breakpoints
- [ ] `ProcessSection` on the `surface-tint-2` band - three `ProcessStep`s in an `<ol>` with decorative
      chevrons that are removed, not rotated, when the row stacks
- [ ] `ArticlesSection` - `SectionHeader` with "View All Articles", then three `ArticleCard`s
- [ ] `CtaBandSection` per section 5.8 - full-bleed gradient, `on-dark` button, decorative script hidden
      below `lg`, contrast verified at both gradient stops and the midpoint
- [ ] Section order and band backgrounds exactly as the reference: tint, white, tint-2, white, gradient,
      footer

### WP-04.4 Visual fidelity check

- [ ] Playwright screenshots at 360, 768, 1024, 1280, and 1440 widths
- [ ] A side-by-side comparison of the 1280 capture against the reference image, with any deliberate
      deviation recorded and justified in the phase log
- [ ] Baseline screenshots committed so Phase 14 can detect unintended visual drift

### WP-04.5 Supporting pages

Skeletons with real layout and metadata; content arrives in Phase 07.

- [ ] `/about`, `/contact` with an accessible contact block
- [ ] `/privacy`, `/terms` rendering policy documents
- [ ] `/sitemap` as a human-readable index
- [ ] A shared `PageHeader` for interior pages

### WP-04.6 Metadata and performance

- [ ] `generateMetadata` per route: title template, description, canonical, Open Graph, Twitter card
- [ ] `robots.ts`, `manifest.ts`, favicon and app icon set
- [ ] Server Components by default; `'use client'` only where interaction requires it, and recorded per
      component so the boundary is a decision rather than an accident
- [ ] Explicit `width` and `height` on every image to hold CLS at zero
- [ ] A route-level bundle budget, failing the build when exceeded

## Verification

```bash
pnpm --filter web dev
pnpm --filter web build           # bundle budget enforced
pnpm test:e2e -- --grep "homepage"
pnpm test:a11y -- --grep "homepage"
pnpm --filter web test:visual
```

## Exit gate

- [ ] Homepage reproduces the reference at 1280 with every deviation recorded
- [ ] Responsive behaviour correct at 360, 768, 1024, 1280, and 1440 with no horizontal scroll
- [ ] WEB-301: keyboard navigation complete - every interactive element reachable and operable, focus
      always visible, order logical, skip link working, mobile nav trap and restore correct
- [ ] axe reports zero violations on every route built in this phase
- [ ] One `<h1>` per page and a correct heading outline
- [ ] Error, loading, and not-found states render as real pages for every route group
- [ ] CLS effectively zero; LCP within budget on a throttled mobile profile
