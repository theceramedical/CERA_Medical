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

- [x] `packages/ui/src/styles/theme.css` as a single Tailwind v4 `@theme` block holding every scale and
      semantic token from `design-language.md` sections 1.2, 1.3, 2.1, and 3
- [x] `@import "tailwindcss"`; no `tailwind.config.ts`, which is legacy in v4
- [x] Fluid type scale with `clamp()` between 360px and 1280px
- [x] Motion tokens, with a global `prefers-reduced-motion` block that neutralises every duration
- [x] Semantic tokens structured so a `[data-theme="dark"]` block can be added later without touching
      components — every semantic token is `var()` onto a ramp step, and no component names a step
- [x] Verify the `no-raw-color` ESLint rule from Phase 01 fires on a deliberate violation — proven
      against all four forms it claims to catch (hex, `rgb()`, `oklch()`, `bg-[#…]`), with
      `transparent` correctly allowed through

`theme.css` is compiled by the real Tailwind engine in `styles/theme.test.ts` rather than only
parsed. The `@theme` contract fails silently: `--text-body--lineheight` instead of
`--text-body--line-height` is not an error and emits no line-height, and on the page that reads as
"the spacing looks slightly off" rather than as a broken token. 93 assertions cover it.

**Three defects the tests caught, none of which would have surfaced in review:**

1. `--text-body` and `--color-body` both generate `.text-body`. Tailwind builds that utility from
   two namespaces, one declaration wins, and the colour won — so a component asking for body _type_
   would have received a colour, looking correct wherever the inherited size happened to match. The
   paragraph colour is now `--color-copy`, and a test fails on any future name present in both
   namespaces rather than leaving the next one to be found on a page.
2. `--duration-*` is not a Tailwind theme namespace, unlike `--ease-*`. The tokens existed and
   generated nothing, so every transition would have run at the browser default while the tokens sat
   in the file looking authoritative. Declared with `@utility` instead.
3. The sampled control border fails WCAG 1.4.11 — see WP-03.3.

### WP-03.2 Typography

- [ ] Source Sans 3 (400, 600, 700) and Montserrat (700) through `next/font/google` with
      `display: 'swap'`, assigned into `--font-sans` and `--font-wordmark`
- [ ] Self-hosted, subsetted to Latin. No `<link>` to a font CDN, so no third-party request and no
      layout shift from a blocked domain
- [ ] `Text` and `Heading` components exposing only scale tokens, so no component sets a raw font size
- [ ] `size-adjust` fallbacks tuned to minimise CLS during swap

### WP-03.3 Colour contrast gate

- [x] A test computing WCAG 2.2 contrast for every pairing in `design-language.md` section 1.4 and
      failing below threshold — 25 text pairings, each recorded at the size it is actually used at,
      plus 12 non-text pairings at 3:1, the gradient at both stops and the midpoint, and the disabled
      state
- [x] Apply the documented resolutions: `--color-muted` is `neutral-600` and `--color-accent-fill` is
      `teal-700`, and the _rejected_ values are asserted to fail so that consolidating them back looks
      like the regression it is
- [x] Record measured ratios in the phase log so a reviewer sees numbers, not assurances

This test is the reason a contrast regression cannot ship: it is a unit test, not a review step.

**Corrections it forced.**

- **The "large text" threshold was wrong.** WCAG defines large as 18pt, which is **24px**, not 18px.
  An earlier draft of `design-language.md` section 1.4 said 18px, and that error relaxes the
  requirement from 4.5:1 to 3:1 across 18–24px — the range body and sub-heading text occupies. The
  gate implements 24px, and a test pins it.
- **The sampled control border fails 1.4.11.** `neutral-300` on white measures **1.54:1** where a
  control boundary needs 3:1. A card hairline is decoration and is exempt; the edge of an input is
  the only thing telling you where the control is, and is not. `--color-border-control` is therefore
  `neutral-500` — the lightest step clearing 3:1 against every band background — and it reads darker
  than the reference mockup. That is the trade `design-language.md` already declared: accessibility
  over visual fidelity. This is the first place the two actually conflicted.

**Measured ratios.** Tightest first; `headroom` is the margin over the threshold that applies at that
size. Full table is printed by `pnpm --filter @cera/ui test:contrast`.

| Pairing                            | Ratio | Required | Size | Headroom |
| ---------------------------------- | ----- | -------- | ---- | -------- |
| muted on footer tint at caption    | 4.51  | 4.5      | 13px | **0.01** |
| muted on subtle surface at caption | 4.65  | 4.5      | 13px | 0.15     |
| muted on white at caption          | 4.87  | 4.5      | 13px | 0.37     |
| label on accent fill               | 5.08  | 4.5      | 15px | 0.58     |
| pill label on accent fill          | 5.08  | 4.5      | 11px | 0.58     |
| copy on process tint / icon disc   | 5.27  | 4.5      | 16px | 0.77     |
| copy on hero tint                  | 5.47  | 4.5      | 16px | 0.97     |
| copy on white                      | 6.00  | 4.5      | 16px | 1.50     |
| accent headline on hero tint       | 4.62  | 3.0      | 32px | 1.62     |
| heading ink on white               | 14.51 | 4.5      | 16px | 10.01    |

`muted` on the footer tint at caption size passes by 0.01. It is the one pairing with no practical
margin, so any future change to either token fails the gate — which is the intended behaviour, but
worth knowing before someone adjusts the footer tint and is surprised.

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
