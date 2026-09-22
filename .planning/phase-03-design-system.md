# Phase 03 - Design system

**PRD mapping:** WEB-301, QA-1102
**Depends on:** Phase 01
**PRD acceptance:** "Core pages work on current mobile and desktop browsers, keyboard navigation is
complete, and automated accessibility checks pass."

## Objective

Turn [design-language.md](design-language.md) into working tokens and components, so Phase 04 assembles
a page instead of inventing styling. This is where the reference image becomes code.

## Work packages

### WP-03.1 Tokens

- [ ] `packages/ui/src/styles/theme.css` as a single Tailwind v4 `@theme` block holding every scale and
      semantic token from `design-language.md` sections 1.2, 1.3, 2.1, and 3
- [ ] `@import "tailwindcss"` and `@tailwindcss/postcss` wiring; no `tailwind.config.ts`, which is
      legacy in v4
- [ ] Fluid type scale with `clamp()` between 360px and 1280px
- [ ] Motion tokens, with a global `prefers-reduced-motion` block that neutralises every duration
- [ ] Semantic tokens structured so a `[data-theme="dark"]` block can be added later without touching
      components
- [ ] Verify the `no-raw-color` ESLint rule from Phase 01 fires on a deliberate violation

### WP-03.2 Typography

- [ ] Source Sans 3 (400, 600, 700) and Montserrat (700) through `next/font/google` with
      `display: 'swap'`, assigned into `--font-sans` and `--font-wordmark`
- [ ] Self-hosted, subsetted to Latin. No `<link>` to a font CDN, so no third-party request and no
      layout shift from a blocked domain
- [ ] `Text` and `Heading` components exposing only scale tokens, so no component sets a raw font size
- [ ] `size-adjust` fallbacks tuned to minimise CLS during swap

### WP-03.3 Colour contrast gate

- [ ] A test computing WCAG 2.2 contrast for every pairing in `design-language.md` section 1.4 and
      failing below threshold
- [ ] Apply the two documented resolutions: `neutral-500` restricted to 18px and above, and `teal-700`
      substituted for `teal-600` behind labels under 16px
- [ ] Record measured ratios in the phase log so a reviewer sees numbers, not assurances

This test is the reason a contrast regression cannot ship: it is a unit test, not a review step.

### WP-03.4 Primitives

Each component ships with tests, an axe assertion, and an entry in the token preview route.

- [ ] `Button` - five variants and three sizes per section 5.1, with icon slot, loading state that
      preserves width and sets `aria-busy`, and a visible focus ring on every variant including
      `on-dark`
- [ ] `Link` - inline and standalone, with an external-link affordance and an accessible name
- [ ] `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` - all with persistent visible labels,
      `aria-describedby` error wiring, `aria-invalid`, and a 44px minimum height
- [ ] `Field` - the label, hint, error, and required-marker wrapper that makes the above consistent
- [ ] `Card`, `Badge`, `Pill`, `IconDisc`, `Divider`, `SectionRule`
- [ ] `EmptyState`, `Skeleton`, `Spinner`, `Toast` with `role="status"` for success and `role="alert"`
      for error, never auto-dismissing an error
- [ ] `Alert`, `Breadcrumbs` with `aria-current`, `Pagination` in a labelled `<nav>`
- [ ] `VisuallyHidden`, `SkipLink`, `FocusTrap`
- [ ] `Table` with a proper `<caption>`, scoped headers, and a horizontal-scroll wrapper that is
      keyboard reachable

### WP-03.5 Composites

- [ ] `ServiceCard` per section 5.2 - title is the link, "Learn More" is a second link with a distinct
      accessible name, whole card is not a link
- [ ] `ArticleCard` per section 5.4 - decorative cover, pill prefixed with a visually hidden
      "Category:", two-line clamp that keeps full text in the DOM
- [ ] `ProcessStep` per section 5.3 - `<ol>` semantics with the visible ordinal `aria-hidden`
- [ ] `SectionHeader` per section 5.7 - teal rule, `h2`, sub-heading capped at 65ch, optional "View all"
- [ ] `StatusBadge` mapping customer status to label and tone, colour never the sole carrier
- [ ] `Timeline` as an ordered list with accessible datetimes

### WP-03.6 Icons and artwork

- [ ] `lucide-react` as the single icon set, sized on the 4px scale, `aria-hidden` unless it is a
      control's only content
- [ ] The cross-and-leaf mark and the `CERA MEDICAL` lock-up as an inline SVG component with a
      `title` for the linked instance and `aria-hidden` for decorative instances
- [ ] The two decorative script phrases as inline SVG paths, `aria-hidden`, so no third font loads

### WP-03.7 Token preview route

- [ ] `/dev/design` in `apps/web`, available outside production only, rendering every token, type
      step, component, and state
- [ ] Contrast ratios displayed next to each pairing
- [ ] Used as the Playwright and axe target, so the design system is tested independently of page
      composition

### WP-03.8 Accessibility baseline

- [ ] `@axe-core/playwright` at the `wcag2a`, `wcag2aa`, `wcag21aa` tag set, zero violations required
- [ ] Keyboard walk of every interactive component: reachable, operable, visible focus, logical order
- [ ] 200% zoom and 400% reflow checks with no horizontal scroll and no clipping
- [ ] `prefers-reduced-motion` verified to suppress all motion
- [ ] Forced-colours mode leaves every control perceivable

## Verification

```bash
pnpm --filter @cera/ui test
pnpm --filter @cera/ui test:contrast
pnpm --filter web dev &
pnpm test:a11y -- --grep "design system"
pnpm lint            # no-raw-color must report zero
```

## Exit gate

- [ ] Every token from `design-language.md` exists and is the only source of colour, type, space,
      radius, shadow, and motion
- [ ] `no-raw-color` reports zero across the workspace and is proven to fire on a violation
- [ ] Contrast test passes for all pairings, with measured ratios recorded
- [ ] Fonts self-hosted, with no external font request in the network log
- [ ] axe reports zero violations on `/dev/design`
- [ ] Keyboard, zoom, reflow, reduced-motion, and forced-colours checks recorded
- [ ] QA-1102 (automated portion) satisfied; manual screen-reader and slow-network checks are deferred
      to Phase 14 where full pages exist
