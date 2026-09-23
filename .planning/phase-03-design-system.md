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

- [x] Source Sans 3 (400, 600, 700) and Montserrat (600, 700 — `MEDICAL` is 600) through
      `next/font/google` with `display: 'swap'`, assigned into `--font-sans` and `--font-wordmark`
- [x] Self-hosted, subsetted to Latin. Verified against the build output: 12 `woff2` files under
      `.next/static/media`, `@font-face` sources all relative, and zero occurrences of
      `fonts.googleapis.com` or `fonts.gstatic.com` in the served CSS
- [x] `Text` and `Heading` components exposing only scale tokens, so no component sets a raw font size
- [x] `size-adjust` fallbacks tuned to minimise CLS during swap

`Heading` takes `level` and `size` as separate props. Heading level is document structure — a screen
reader user navigates by it, and a skip from `h2` to `h4` reads as a missing section — while size is
appearance. They agree most of the time, which is exactly why the one case where they must not (the
hero is `level={1} size="display-1"`; a footer column heading is `level={2} size="h4"`) gets silently
broken when a component picks an element in order to get a size.

**Two silent defects found here, both of which had shipped in my first version:**

1. **`tailwind-merge` was deleting font sizes.** It resolves conflicts by class group and recognises
   stock Tailwind names, so it knows `text-sm` is a size and `text-red-500` is a colour. It knows
   nothing about `text-button` or `text-copy`, assumes they are the same group, and keeps only the
   last: `cn('text-button', 'text-copy')` returned `'text-copy'`. Every button would have rendered at
   the inherited size with a plausible-looking class list and no error anywhere. `cn.ts` now declares
   both namespaces to `extendTailwindMerge`, and `theme.test.ts` asserts its token lists against
   `theme.css` so the restated names — restated because `cn.ts` runs in the browser and cannot read
   the stylesheet — cannot drift.
2. **A `fallback` array silently disabled CLS protection.** `adjustFontFallback` generates a
   companion `@font-face` (`"Source Sans 3 Fallback"`, `local("Arial")` plus `ascent-override`,
   `descent-override`, `size-adjust`) so the stand-in occupies the same space as the webfont and the
   `swap` handover moves nothing. Supplying `fallback` **replaces** that face rather than appending
   to it, and nothing warns. Verified by building both ways: with `fallback` the output contained no
   `Fallback` face and no `size-adjust`; without it, both families gained one. The generic tail is
   not lost — `theme.css` already appends `ui-sans-serif, system-ui, sans-serif` to `--font-sans`,
   which is where a design-system default belongs. `fonts.test.ts` pins it.

Also corrected: Next 16 removed `next lint` and rejects the `eslint` key in `next.config.ts`
outright, which failed the build until removed.

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

### WP-03.4 Primitives — complete

Each component ships with tests, an axe assertion, and an entry in the token preview route. The
preview entries land with WP-03.7; everything else is done.

- [x] `Button` - five variants and three sizes per section 5.1, with icon slot, loading state that
      preserves width and sets `aria-busy`, and a visible focus ring on every variant including
      `on-dark`
- [x] `Link` - inline and standalone, with an external-link affordance and an accessible name
- [x] `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` - all with persistent visible labels,
      `aria-describedby` error wiring, `aria-invalid`, and a 44px minimum height
- [x] `Field` - the label, hint, error, and required-marker wrapper that makes the above consistent
- [x] `Card`, `Badge`, `Pill`, `IconDisc`, `Divider`, `SectionRule`
- [x] `EmptyState`, `Skeleton`, `Spinner`, `Toast` with `role="status"` for success and `role="alert"`
      for error, never auto-dismissing an error
- [x] `Alert`, `Breadcrumbs` with `aria-current`, `Pagination` in a labelled `<nav>`
- [x] `VisuallyHidden`, `SkipLink`, `FocusTrap`
- [x] `Table` with a proper `<caption>`, scoped headers, and a horizontal-scroll wrapper that is
      keyboard reachable

**Where the wiring lives.** `Field` owns the control ids and passes them through context, so `Input`,
`Textarea`, and `Select` take their `id`, `aria-describedby`, and `aria-invalid` from the wrapper
rather than from props. A control rendered outside `Field` throws. That is harsher than it needs to
be for a rendering concern, and it is the only way to make the failure loud: an unlabelled input
looks completely normal, because the label is positioned above it whether or not `for` and `id`
agree.

`Checkbox` and `RadioGroup` deliberately do **not** use `Field`. A checkbox's label belongs beside
it, and a radio group needs two levels of labelling — a question for the group and a label per
option — which one `<label>` cannot express. Forcing them through `Field` produces a group whose
question is associated with nothing.

**Component-level axe.** `src/testing/axe.ts` runs `axe-core` over each rendered primitive in jsdom
at the same WCAG 2.2 AA tags the Playwright run will use in WP-03.8, and `src/a11y.test.tsx` sweeps
all 29 cases. The two halves are not interchangeable: jsdom has no layout or stylesheets, so every
rule needing a computed colour or box is disabled with a stated reason (contrast is proved
arithmetically in `contrast.test.ts` instead). What jsdom _can_ check is the part that lives in the
markup — roles, accessible names, `aria-*` pointing at nothing, required parent-child relationships,
heading order — which is exactly what a component gets wrong in isolation, and a failure here names
the component rather than a page that happens to use it.

Two negative controls assert the harness has teeth, on different rule families. A suite of 29 passing
axe checks is indistinguishable from an engine that silently checked nothing.

**Defects found by building it.**

- **`Pagination` announced "Page2".** The obvious construction — a visually hidden `Page ` followed
  by `{page}` — computes to the accessible name `Page2`. Accessible-name computation concatenates
  child text and then trims, and with no whitespace text node between the hidden span and the number
  there is nothing to survive the trim. It is correct on screen and wrong in the ear, so only a
  name assertion finds it. The whole string now lives in one text node with the visible digit
  rendered separately and hidden; SC 2.5.3 Label in Name still holds because the visible "2" is
  contained in "Page 2".
- **`FocusTrap`'s visibility filter made the component untestable.** `offsetParent`/`getClientRects`
  is the standard way to exclude hidden elements and returns "hidden" for _everything_ in jsdom,
  which has no layout — so the trap focused nothing at all and four tests failed identically. Fixed
  by preferring `Element.checkVisibility()` (present in every current engine, absent in jsdom 30)
  with an ancestor-walking computed-style fallback. An untested focus trap is the kind that ships
  subtly broken, so the fallback earns its lines.
- **`userEvent` deadlocks against faked timers.** Eight toast tests timed out at 10s each. The toast
  rules that matter are timing rules, so the clock has to be controlled; `fireEvent` is sufficient
  because none of the assertions depends on a realistic event sequence. Recorded because the symptom
  — a timeout with no error — reads like a hung component rather than a harness problem.
- **`lucide-react` 1.x dropped the deprecated icon aliases.** `CheckCircle2`, `XCircle`,
  `AlertTriangle`, and `Loader2` no longer exist; the current names are `CircleCheckBig`, `CircleX`,
  `TriangleAlert`, and `LoaderCircle`. Worth noting before WP-03.6, where most of the icon set
  arrives.

**Deliberate rejections.**

- **No whole-card link.** A `Card` has no `href` and no `onClick`. Wrapping the card gives a
  comfortable target and produces one link whose accessible name is every word in the card, with any
  nested link now invalid markup. Section 5.2 makes the title the link, and the component enforces
  it by having nowhere to put a URL.
- **Native `<select>`.** A custom listbox would have to reimplement type-ahead, keyboard paging, the
  mobile wheel picker, and off-viewport rendering, and that reimplementation is where combobox
  accessibility bugs come from. Nothing in the reference needs it.
- **`accent-color` on checkboxes and radios rather than `appearance: none`.** The custom-glyph route
  has to rebuild the indeterminate state, the disabled state, the focus ring, and forced-colours
  rendering; recolouring the native widget keeps all four. The 44px target comes from the padded
  label row, since a 44px checkbox glyph looks wrong but a 44px clickable row does not.
- **`aria-disabled` nowhere.** At a pagination boundary and on a loading button the control is
  removed or genuinely `disabled`. `aria-disabled` announces a control as unavailable while leaving
  it fully clickable, which is worse than either.
- **`no-restricted-syntax` off for `packages/ui/src`.** The shared rule pushes raw anchors towards
  `next/link` and is right for `apps/web`. This package must never acquire a Next dependency —
  `Link`, `Breadcrumbs`, and `Pagination` take the link component through a prop precisely so
  `apps/web` can bind `next/link` — so a bare `<a>` is both the documented default and the only
  thing a fixture can render.

**Verification.**

```
pnpm --filter @cera/ui test        # 354 passing across 9 files
pnpm --filter @cera/ui typecheck
pnpm --filter @cera/ui lint
```

Coverage: 95.17% statements, 88.38% branches, 99.01% functions, 98.71% lines — against thresholds of
85/80/85/85.

### WP-03.5 Composites — complete

- [x] `ServiceCard` per section 5.2 - title is the link, "Learn More" is a second link with a distinct
      accessible name, whole card is not a link
- [x] `ArticleCard` per section 5.4 - decorative cover, pill prefixed with a visually hidden
      "Category:", two-line clamp that keeps full text in the DOM
- [x] `ProcessStep` per section 5.3 - `<ol>` semantics with the visible ordinal `aria-hidden`
- [x] `SectionHeader` per section 5.7 - teal rule, `h2`, sub-heading capped at 65ch, optional "View all"
- [x] `StatusBadge` mapping customer status to label and tone, colour never the sole carrier
- [x] `Timeline` as an ordered list with accessible datetimes

**`ButtonLink`, added to `button.tsx`.** Both cards need an action that looks like a button and
navigates, and `Button` renders a `<button>`. A separate component rather than an `as` prop, because
the distinction it encodes is the one that gets muddled: a control that navigates must be an anchor
and a control that acts must be a button. Getting it backwards breaks things no screenshot shows —
an anchor-shaped button loses Enter/Space parity, and a button used for navigation has no href, so
middle-click, ctrl-click, "copy link address", and the status-bar preview all stop working. Being
separate also means it cannot accept `loading` or `disabled`: there is no `disabled` attribute on an
anchor, and the usual workaround leaves a control that is focusable, reports an href, and does
nothing. A test asserts the two render the same class list apart from `no-underline`, so they cannot
drift apart visually.

**`packages/ui` now depends on `@cera/contracts`.** `StatusBadge` takes its label text from
`CUSTOMER_STATUS_LABELS` rather than a map in the UI package. The alternative is a second copy of
the customer-facing wording, which can drift from what the API and the emails say with nothing
failing. Tone stays local, because which of five tints reads as "waiting on you" is a design
decision with no meaning outside a rendered page. Both maps are
`satisfies Record<CustomerStatus, …>`, so a new status cannot be added without a label _and_ a tone.

`StatusBadge` accepts `CustomerStatus` only. `InternalStatus` distinguishes `rejected_spam`,
`closed_withdrawn`, and `closed_no_response`, all of which collapse to `closed` for a customer, so a
component that accepted either would be one prop away from telling someone their enquiry was marked
as spam. The type makes that unrepresentable rather than merely discouraged.

**The `Page2` defect has a second home.** `Timeline` originally rendered a visually hidden `Updated `
followed by the visible date, which computes to the accessible name `Updated23 September 2026` for
exactly the reason `Pagination` did — accessible-name computation trims each node's text before
concatenating, so a trailing space inside a hidden span is discarded. Both now put the whole phrase
in one text node with the painted value `aria-hidden`. Worth recording as a pattern rather than two
incidents: **a visually hidden prefix never works; the hidden node has to carry the complete
phrase.**

**Date formatting is the caller's job.** `TimelineItem` takes `dateTime` (ISO, for the attribute) and
`dateLabel` (formatted, for reading) as separate props and formats nothing. A component reaching for
`toLocaleString()` has neither a locale nor a time zone, so it renders the server's zone during SSR
and the user's on hydration — a date that changes after the page settles, and a React hydration
mismatch.

**A test fixture surfaced a content problem.** Using "Enquiry received" as a timeline title alongside a
`StatusBadge` for `received` produced two identical strings in one row, because the contract label
for that status _is_ "Enquiry received". The fixture now words the title as the event ("We received
your enquiry") and leaves the status to the badge. Flagged for Phase 11: the portal timeline must not
repeat the status label as the entry title.

**Verification.**

```
pnpm --filter @cera/ui test        # 405 passing across 10 files
pnpm --filter @cera/ui typecheck
pnpm --filter @cera/ui lint
```

### WP-03.6 Icons and artwork — complete

- [x] `lucide-react` as the single icon set, sized on the 4px scale, `aria-hidden` unless it is a
      control's only content
- [x] The cross-and-leaf mark and the `CERA MEDICAL` lock-up as an inline SVG component with a
      `title` for the linked instance and `aria-hidden` for decorative instances
- [x] The two decorative script phrases as inline SVG paths, `aria-hidden`, so no third font loads

**The wordmark is text, not an SVG.** This departs from the work package as written, which asked for
the whole lock-up as an inline SVG with a `title`. Only the cross-and-leaf mark is drawn;
`CERA MEDICAL` is set in Montserrat, which is already loaded for exactly this purpose. Tracing
lettering into paths costs nothing visually and loses: text that scales with the user's font size,
text that survives 200% zoom and a 400% reflow without becoming a blurry bitmap, text that can be
selected and copied, and text a screen reader reads as words rather than as an `alt` string somebody
maintains separately. The mark is `aria-hidden` rather than carrying a `title`, because it sits
directly beside the words it stands for — a `title` there would make the header announce
"CERA Medical logo, CERA MEDICAL".

`Wordmark` is deliberately never a heading. A logo is not a section title, and making it an `h1`
gives every page the same first heading and demotes the real one, which is both a broken outline and
an axe failure.

**A new type step, `--text-wordmark-sub`.** `MEDICAL` needs 10px at 0.28em tracking, and the obvious
spelling — `text-pill` plus `tracking-wordmark` — puts a `font-size` utility and a `letter-spacing`
utility in conflict, where the winner is decided by their order in the generated stylesheet rather
than the order they were written. One step keeps size, tracking, and weight together. 10px is
defensible here and nowhere else: it is a logotype, not content, and it never carries information on
its own. `cn.ts`'s `FONT_SIZE_TOKENS` and the theme test's step list both had to be extended, which
is the drift guard from WP-03.1 doing its job.

**`lucide-react` 1.x has no brand icons, so the footer needed its own.** `Linkedin`, `Facebook`,
`Instagram`, and `Youtube` all existed in 0.x and are gone from 1.x along with the deprecated
aliases — a reasonable removal, since trademarks carry their own usage rules. Nothing in the
remaining 3,698 icons substitutes: a `Share2` or `Globe` in place of a recognisable mark leaves the
user guessing which platform a link goes to, and a visually hidden name is no help to a sighted user
scanning a row of four identical circles. `social.tsx` therefore draws the four marks as inline paths
in the same spirit as the wordmark — simplified monochrome silhouettes from `currentColor`, not
traces of the official brand assets. Discovered by a test failing on the import, which is the cheap
place to find it; the expensive place is four blank squares in a built footer.

`SocialLink` renders a 20px glyph in a 44px target. The reference draws a 32px button, which is below
the touch minimum the design contract commits to, and four links this close together is exactly where
an undersized target produces a mis-tap. The padding grows the target without changing the drawn
size. The accessible name is the full phrase — "CERA Medical on LinkedIn (opens in a new tab)" —
including the new-tab clause, because `Link` with `external` announces it too, and a package where one
external link says so and another does not is a package where someone eventually "fixes" the wrong
one.

**`Icon` defaults to hidden.** Naming an icon is the thing a call site asks for, not the thing it has
to remember. The name is rendered as visually hidden text rather than `aria-label` on the `<svg>`,
because `aria-label` on an SVG is honoured inconsistently — some engines ignore it unless the element
also has `role="img"` — and hidden text is announced by everything. Sizes are a lookup of complete
class strings, not `size-${n}`: Tailwind scans source for whole class names, so an interpolation
generates nothing and leaves every icon at its intrinsic 24px with no error anywhere.

**The script phrases carry no `<title>` and no `role="img"`.** design-language.md section 2 rules both
decorative. "Care Support Wellness For a Brighter Tomorrow" announced between the hero headline and
the buttons is an interruption made of marketing copy, and it is unreadable as speech in the order the
strokes are drawn. They are paths rather than text so no third font loads — a family used on two
elements is a font file, a render-blocking fetch, and a layout shift, all for ornament.

**Verification.**

```
pnpm --filter @cera/ui test        # 460 passing across 11 files
pnpm --filter @cera/ui typecheck
pnpm --filter @cera/ui lint
```

### WP-03.7 Token preview route

- [x] `/dev/design` in `apps/web`, available outside production only, rendering every token, type
      step, component, and state
- [x] Contrast ratios displayed next to each pairing
- [x] Used as the Playwright and axe target, so the design system is tested independently of page
      composition

**Values are parsed, never restated.** Every colour, type step, spacing, radius, shadow, duration,
easing, container, and tracking token on the page is read out of `theme.css` by `tokens.ts` at request
time. A preview built from a hand-maintained list is a second source of truth, and it fails in the
worst direction: it keeps displaying a design system that no longer exists, and it is the artefact
people trust. `export const dynamic = 'force-dynamic'` is load-bearing for the same reason - a
statically rendered page would freeze the values at build time and reintroduce exactly that drift.

**The contrast pairings moved into `packages/ui/src/pairings.ts`**, shared by the gate and the
preview. They were previously inline in `contrast.test.ts`. Two lists would have defeated the purpose
of having either: the preview would show a comfortable table while CI checked a different set, and the
one people look at is the one that is wrong. `measurePairings` also had to stop delegating to
`requiredRatio` for non-text pairings - `requiredRatio(0)` returns 4.5, because 0px is not large text,
which would hold focus rings to a threshold SC 1.4.11 does not ask for and fail the build over a
compliant design. `pairings.test.ts` pins both thresholds from this side, including 24px rather than
18px as the large-text boundary.

**Defects found by building it.** This is the return on the work package, and it was immediate.

1. **`Field`, `Input`, and `Checkbox`/`RadioGroup` could not be server-rendered at all.** They use
   `createContext`, `useContext`, and `useId` with no `'use client'` directive, so `next build` failed
   the moment a server component rendered a form. Nothing in the unit suite could catch it: Vitest
   treats the directive as a no-op, so all 460 tests passed against code that could not be built. The
   three files now carry the directive. The rejected alternative was a required `id` prop, which would
   keep forms on the server - rejected because duplicate ids are silent in precisely the way the
   missing attributes were, and every form in this product is interactive regardless.
2. **The decorative script phrases rendered as gibberish.** "Care Support Wellness" came out as
   "ArzSopctr Wsllnzss" and "Your Health Matters" as "Yory Hzalh Mattzrs". The cause was structural
   rather than a typo: forty unrelated `<path>` elements, one run per phrase, with nothing tying the
   `e` in "Care" to the `e` in "Wellness", so each letter was drawn again slightly wrong. The only way
   to check any of it was to look at a rendered page, and nobody looks at ornament.

   `script-lettering.ts` replaces it with a monoline stroke alphabet: each glyph is authored once in a
   shared em box, a phrase is a string, and the slant is one `skewX` on the group. This is not a font
   and does not become one - nothing is fetched, so section 2's objection to a third family (a
   render-blocking request and a layout shift for decoration) is untouched. What was rejected there was
   the fetch, not the reuse of a letter shape. The CTA heart's position is now computed from the last
   line's advance width, because the hard-coded x it previously used sat on top of the word "Health".

   `script-lettering.test.ts` cannot assert legibility - that is what the preview page is for - but it
   asserts everything around it, and the original defect would have failed several: every character of
   both real phrases resolves to a glyph, an unknown character throws by name rather than being
   skipped, keys are unique, the pen only advances forwards, and the `viewBox` encloses the content
   plus the slant and the stroke.

**Production gating is a 404, not a redirect.** A 302 to the homepage confirms something is there; a
404 states the route does not exist, which is the truth as far as production is concerned. The
condition is a production block rather than a development allow-list, because `NODE_ENV` is `test`
under Playwright and an allow-list would make every E2E run fail on a 404 that looks like a routing
bug. `guard.test.ts` pins all three cases. The guard does not remove the route from the production
bundle - the code ships and returns 404 - and the honest trade is that the guard is one line while a
build-time exclusion is a config mechanism to maintain. Phase 13 adds the defence that keeps the
request off the app entirely: Caddy rejects `/dev/*` in the production overlay.

**States are separate instances, not something to hover or click.** A reviewer comparing a resting
button against its disabled twin needs both on screen, and axe only sees the state that is rendered -
a variant reachable only by a click is a variant the gate never checks. Hover and active are the two
exceptions, since faking them with a class would test the fake; their contrast is proven by the ratio
table instead. Only three examples genuinely need state, and they are isolated in one client island:
a toast has to be fired, a focus trap has to be operated, and a loading placeholder has to resolve.

**The page's own structure is part of the deliverable.** It is the axe and keyboard-walk target for
WP-03.8, so a broken outline here would report failures that belong to the harness rather than to the
library. `PreviewSection` and `PreviewCase` fix the heading level rather than accepting one, which is
what keeps the rendered page at one `h1`, one `h2` per section, and no level skipped. The skip link is
real rather than demonstrated, because the page is long enough that this is genuinely the case SC 2.4.1
is about.

**`lucide-react` is a direct dependency of `apps/web`,** not something re-exported by `@cera/ui`.
`Icon` takes a `LucideIcon` rather than an icon name, so the app imports the two dozen glyphs it uses
and the other 3,676 are never bundled; re-exporting them from the design system would defeat that.

**Verification.**

```
pnpm --filter @cera/ui test        # 484 passing across 13 files
pnpm --filter web test             # 9 passing, including the production guard
pnpm --filter web build            # /dev/design listed as dynamic, everything else static
pnpm lint && pnpm typecheck && pnpm format:check
```

Rendered and inspected at 1280px with zero console errors: every token group, all 24 text pairings and
12 non-text pairings with measured ratios, all three gradient samples, every type step, all five button
variants at three sizes plus disabled and loading, every form control including its error state, and
both script phrases now legible.

### WP-03.8 Accessibility baseline

- [x] `@axe-core/playwright` at the `wcag2a`, `wcag2aa`, `wcag21aa` tag set, zero violations required
- [x] Keyboard walk of every interactive component: reachable, operable, visible focus, logical order
- [x] 200% zoom and 400% reflow checks with no horizontal scroll and no clipping
- [x] `prefers-reduced-motion` verified to suppress all motion
- [x] Forced-colours mode leaves every control perceivable

`apps/web/playwright.config.ts`, `apps/web/e2e/support/axe.ts`, and three specs —
`design-system.a11y.spec.ts` (18 checks), `keyboard.a11y.spec.ts` (10), `resilience.a11y.spec.ts` (12).
40 checks, all passing, wired into CI as a required job.

**Measured against the production build, not the dev server.** The `webServer` block runs
`pnpm build && next start`, because the dev server injects an error overlay and a dev-tools indicator
that are themselves focusable DOM — a keyboard walk would tab through scaffolding that does not ship, and
a reflow check would measure it. It also means the tags cover `wcag22aa` rather than stopping at 2.1: the
product claims 2.2 (QA-1102), so the gate has to test what is claimed. `best-practice` is deliberately
excluded — it mixes advisory opinion with conformance, and a gate that reports opinions gets switched off.

**Why this is not redundant with the jsdom sweep in WP-03.4.** That sweep disables every rule needing a
computed colour or box, because jsdom has neither. The rules it has to skip are the ones that produced
every defect below: `aria-allowed-attr` on a role that is computed, `color-contrast`, target size, and
reflow. 490 passing component tests had not found any of them. The two layers answer different questions
— "is this component's markup right in isolation" and "is the assembled page usable" — and the second
cannot be answered without layout.

**Four real defects, found by the browser run.** Each now has a unit test that fails against the old code:

- **`aria-required` on a `<fieldset>`.** A fieldset computes to role `group`, and `aria-required` is
  defined only for widget roles, so a browser may ignore it — an attribute that may be ignored is not a
  way to communicate a requirement. HTML defines `required` on a radio as a constraint on the whole
  group, so `RadioGroup` now threads `required` through its context to every option. Three tests in
  `form.test.tsx` pin the fieldset being clean, the radios carrying it, and the legend still saying
  "(required)" for people who are not using a screen reader.
- **`ServiceCard` rendered outside a list.** The component is an `<li>`, and the preview page put a grid
  of them in a plain `<div>` — a `listitem` with no list, which is a serious violation and not
  expressible in the type system. The preview now uses `<ul>`, and `ServiceCardProps` documents the
  requirement. This is exactly the class of bug a component test cannot see, because the component is
  correct and the call site is not.
- **Toast live regions were created along with their content.** A live region must exist in the DOM
  before the text arrives, or there is no mutation for the assistive technology to observe; the file's
  own header comment said so and the implementation did the opposite. `ToastViewport` now renders two
  permanent regions and routes by tone, and `Toast` no longer carries a role of its own. Two regions
  rather than one because a single element cannot be both polite and assertive, and an error interrupting
  is the whole point of `danger`. Five unit tests had to be rewritten: they asserted `queryByRole`
  disappeared on timeout, which only passed _because_ of the bug.
- **The document scrolled sideways at 320px.** Two compounding faults in `Table`, both in one class
  attribute. A flex or grid item defaults to `min-width: auto` and refuses to shrink below its content,
  so `overflow-x-auto` never engaged and the wrapper dragged the page wider — `min-w-0`. And the wrapper
  established no containing block, so the visually hidden `absolute` spans inside its cells resolved
  against the initial containing block, escaped the clip, and extended `scrollWidth` from outside the
  scroller — `relative`. The general rule, now written on the component: **a scroll container that is not
  positioned does not contain anything.** Diagnosed with a throwaway script that bisected the page by
  hiding sections and then individual nodes, because the symptom pointed at no element in particular.

**Every check is designed to be able to fail.** The axe suite injects a `<button>` with no accessible
name and requires `button-name` to be reported, so a misconfigured engine is distinguishable from a clean
page. The focus-visibility walk asserts it found more than fifty focusable elements before checking them,
so a selector that silently matches nothing cannot pass. The reflow check measures `documentElement`
rather than trusting a media query. The font check asserts on the computed stack _and_ on the absence of a
third-party request, since either alone is satisfiable without the other.

**The guard needed an escape hatch, and it is fail-closed.** `next start` forces `NODE_ENV=production`
with no way to override, so the first run had 26 of 37 checks scanning Next's 404 page — the preview route
correctly refused to exist. Rather than weaken the guard, `assertDevOnly()` also admits
`CERA_ENABLE_DEV_ROUTES=1`: compared against the exact string, because `'false'` is truthy and an operator
who writes `=false` should get what they asked for. It is set only by the Playwright config and appears in
no Compose file, deployment script, or `.env.example`, so forgetting it yields a 404 rather than an
exposed route. Nine tests cover the matrix, including `''`, `'0'`, `'false'`, `'true'`, and `' 1'`.

**The reduced-motion assertion was wrong, not the CSS.** The reset uses `0.01ms` rather than `0s` on
purpose, so `animationend` still fires and a component waiting on it does not hang forever. Asserting
"duration is zero" therefore failed against correct code. Replaced with a 1ms perceptibility threshold,
plus separate checks that an infinite animation is clamped to one iteration and that the skeleton is still
_visible_ — suppressing motion must not suppress the content.

**Deliberate scope.** Chromium only: axe reads the DOM and computed styles rather than engine internals,
so a second browser re-derives the same answers at triple the runtime, and cross-browser rendering is
Phase 14's matrix. Manual screen-reader and slow-network verification stay deferred to Phase 14, where
real pages exist — there is nothing meaningful to narrate on a component gallery.

**Verification.**

```
pnpm test                          # 1045 passing across 33 files, 33 skipped (need Docker)
pnpm test:a11y                     # 40 passing in 1.6m against the production build
pnpm lint && pnpm typecheck && pnpm format:check
```

One unrelated repair on the way through: `packages/db`'s migration-SQL assertions compared against
literal `\n`, and a Windows working tree had drifted to CRLF despite `.gitattributes` — so a trigger
assertion was really an assertion about the developer's git configuration. The SQL loader now normalises
newlines at the boundary, and `git add --renormalize` confirmed the committed content was already LF.

## Verification

```bash
pnpm --filter @cera/ui test
pnpm --filter @cera/ui test:contrast
pnpm --filter web dev &
pnpm test:a11y -- --grep "design system"
pnpm lint            # no-raw-color must report zero
```

## Exit gate

- [x] Every token from `design-language.md` exists and is the only source of colour, type, space,
      radius, shadow, and motion
- [x] `no-raw-color` reports zero across the workspace and is proven to fire on a violation
- [x] Contrast test passes for all pairings, with measured ratios recorded
- [x] Fonts self-hosted, with no external font request in the network log
- [x] axe reports zero violations on `/dev/design`
- [x] Keyboard, zoom, reflow, reduced-motion, and forced-colours checks recorded
- [x] QA-1102 (automated portion) satisfied; manual screen-reader and slow-network checks are deferred
      to Phase 14 where full pages exist
