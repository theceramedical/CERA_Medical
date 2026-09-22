# CERA Medical Design Language

**Authority.** This document is derived from the approved reference image and **supersedes the
branding and typography guidance in the PRD**. Where the PRD and this document disagree on colour,
type, or layout, this document wins. Where they disagree on behaviour, accessibility, or data, the
PRD wins.

Colour values were obtained by decoding the reference image and taking the modal colour over flat
regions and the mean of the darkest 12% of pixels ("ink") over text regions. They are measurements,
not estimates.

---

## 1. Colour

### 1.1 Sampled anchors

| Role in the reference                                            | Sampled value | Token            |
| ---------------------------------------------------------------- | ------------- | ---------------- |
| Hero headline, section headings, card titles, wordmark           | `#13294B`     | `navy-900`       |
| Filled primary buttons: Explore Services, Read More, Subscribe   | `#0A5378`     | `primary-700`    |
| Deepest edge of the hero Explore button                          | `#143047`     | `primary-900`    |
| "Made Easier to Access." accent line, header CTA, category pills | `#0E8A93`     | `teal-600`       |
| Hero band background                                             | `#EBF6FC`     | `surface-tint`   |
| "How CERA Works" band background                                 | `#E6F2FA`     | `surface-tint-2` |
| Footer background                                                | `#F0F7FD`     | `surface-footer` |
| Service icon discs                                               | `#E6F2F8`     | `icon-disc`      |
| Body copy                                                        | `#546575`     | `text-body`      |
| Sub-headings, captions, copyright                                | `#7A8896`     | `text-muted`     |
| Card and input hairlines                                         | `#DCE7EF`     | `border-default` |
| CTA band, left stop                                              | `#1B5882`     | `gradient-from`  |
| CTA band, right stop                                             | `#005B7D`     | `gradient-to`    |

### 1.2 Full scales

Derived from the anchors above by holding hue and chroma and walking lightness. Anchor steps are
marked; all other steps are interpolated for state and surface use.

```
navy      50 #F2F5F9   100 #E3E9F1   200 #C3CEDE   300 #9CADC5   400 #6D82A2
          500 #465D82   600 #2C436A   700 #1D3558   800 #182F4F   900 #13294B  (anchor)
          950 #0C1B33

primary   50 #EFF7FB   100 #DAEDF6   200 #B2D8EB   300 #7FBCD9   400 #4795BF
          500 #1E74A2   600 #0F6490   700 #0A5378  (anchor)   800 #0B4260
          900 #143047  (anchor)   950 #0A1F30

teal      50 #EDF8F9   100 #D6F0F2   200 #A7E0E4   300 #6FC9D0   400 #34AAB4
          500 #0F959F   600 #0E8A93  (anchor)   700 #0A7A84   800 #0B6269
          900 #0C4E54   950 #063236

neutral   0  #FFFFFF   25 #FCFDFE   50 #F7FAFC   100 #EFF4F8   200 #DCE7EF  (anchor)
          300 #C3D2DF   400 #9BAAB9   500 #7A8896  (anchor)   600 #647380
          700 #546575  (anchor)   800 #3D4A57   900 #27313B
```

Semantic colours for validation, status, and alerts. These are not present in the reference image;
they are chosen to sit beside the palette without competing with the teal accent.

```
success  50 #ECFAF3  500 #10855A  700 #0A6244
warning  50 #FEF6EA  500 #B7791F  700 #8A5A12
danger   50 #FDF1F1  500 #C0392B  700 #96271B
info     = primary
```

### 1.3 Semantic token map

These are the names application code uses. Component code never references a scale step directly.

**Naming constraint.** Tailwind generates `text-*` utilities from two namespaces: `--text-*` for font
size and `--color-*` for colour. A name present in both — `--text-body` and `--color-body` — produces
two `.text-body` rules, one silently wins, and a component asking for body _type_ receives a colour.
The paragraph colour is therefore `--color-copy`. A test in `packages/ui/src/styles/theme.test.ts`
fails on any future collision rather than leaving it to be found on a page.

| Token                    | Light value   | Used for                           |
| ------------------------ | ------------- | ---------------------------------- |
| `--color-background`     | `neutral-0`   | Page canvas                        |
| `--color-surface`        | `neutral-0`   | Cards, panels                      |
| `--color-surface-tint`   | `#EBF6FC`     | Hero band                          |
| `--color-surface-tint-2` | `#E6F2FA`     | Alternating section band           |
| `--color-surface-footer` | `#F0F7FD`     | Footer                             |
| `--color-surface-subtle` | `neutral-50`  | Table stripes, disabled fills      |
| `--color-icon-disc`      | `#E6F2F8`     | Icon containers                    |
| `--color-foreground`     | `navy-900`    | Headings                           |
| `--color-copy`           | `neutral-700` | Paragraph text                     |
| `--color-muted`          | `neutral-500` | Secondary text                     |
| `--color-border`         | `neutral-200` | Decorative hairlines on cards      |
| `--color-border-strong`  | `neutral-300` | Dividers, table rules              |
| `--color-border-control` | `neutral-500` | Inputs, selects, outline buttons   |
| `--color-primary`        | `primary-700` | Filled buttons, links              |
| `--color-primary-hover`  | `primary-800` |                                    |
| `--color-primary-active` | `primary-900` |                                    |
| `--color-accent`         | `teal-600`    | Accent headline, pills, header CTA |
| `--color-accent-hover`   | `teal-700`    |                                    |
| `--color-on-primary`     | `neutral-0`   | Text on filled primary             |
| `--color-on-accent`      | `neutral-0`   | Text on filled accent              |
| `--color-focus-ring`     | `teal-600`    | Focus outline                      |

### 1.4 Contrast verification

Every pairing below is required to pass before Phase 03 exits. Ratios are against WCAG 2.2 AA
(4.5:1 body text, 3:1 large text and non-text UI).

| Foreground    | Background                    | Required | Purpose                                          |
| ------------- | ----------------------------- | -------- | ------------------------------------------------ |
| `navy-900`    | `neutral-0`                   | 4.5:1    | Headings on white                                |
| `navy-900`    | `surface-tint`                | 4.5:1    | Hero headline                                    |
| `neutral-700` | `neutral-0`                   | 4.5:1    | Body on white                                    |
| `neutral-700` | `surface-tint`                | 4.5:1    | Hero body                                        |
| `neutral-500` | `neutral-0`                   | 4.5:1    | Captions - **verify, this is the tightest pair** |
| `neutral-0`   | `primary-700`                 | 4.5:1    | Filled button label                              |
| `neutral-0`   | `teal-600`                    | 4.5:1    | Header CTA label, pills - **verify**             |
| `teal-700`    | `surface-tint`                | 4.5:1    | Accent headline at body size                     |
| `neutral-0`   | `gradient-from`/`gradient-to` | 4.5:1    | CTA band copy at both stops                      |
| `focus-ring`  | adjacent surface              | 3:1      | Focus visibility                                 |

**On "large text".** WCAG defines large as 18pt, or 14pt bold. Those are point sizes: at the CSS
reference 96dpi they are **24px and 18.66px**, not 18px. An earlier draft of this section said 18px,
which relaxes the requirement from 4.5:1 to 3:1 across 18-24px — precisely the range body and
sub-heading text occupies. The gate in `packages/ui/src/contrast.ts` implements 24px.

Two pairs are known to be marginal and carry explicit instructions:

- **`neutral-500` on white** measures 4.38:1 and therefore **fails** AA for normal-size text. All
  caption, helper, and secondary text uses `neutral-600` (`#647380`), which measures 5.37:1. The
  semantic token `--color-muted` resolves to `neutral-600` so that the compliant value is the one
  obtained by not thinking about it. `neutral-500` survives as `--color-muted-large`, restricted to
  24px+ text and to non-text decoration, and there is currently no component that qualifies.
- **White on `teal-600`** measures 3.42:1, below AA for normal-size text. Anything placing a label
  on a filled accent — the header CTA, category pills — fills with `teal-700` instead, exposed as
  `--color-accent-fill`. `teal-600` remains correct for the accent headline, which is `display-1`
  and so large text, and for the 3px section rule, which is non-text at 3:1.
- **Control borders.** The sampled hairline `neutral-300` measures **1.54:1** on white. That is
  acceptable for a card border, which is decoration over content layout has already grouped, but
  WCAG 1.4.11 requires **3:1** for the boundary of an input, select, or outline button, because that
  boundary is the only thing indicating where the control is. `--color-border-control` is therefore
  `neutral-500`, the lightest step clearing 3:1 against every band background (3.62:1 on white,
  3.18:1 on `surface-tint-2`). It reads darker than the reference mockup. That is the intended
  trade: the authority note at the top of this document gives accessibility precedence over visual
  fidelity, and this is the first place the two actually conflict.

---

## 2. Typography

The reference uses a humanist sans for all running text and a squarer geometric face for the `CERA`
wordmark. Confirmed substitutions, both self-hosted through `next/font/google` so no request leaves
the origin at runtime:

| Role                 | Family            | Weights       | Token             |
| -------------------- | ----------------- | ------------- | ----------------- |
| Headings, body, UI   | **Source Sans 3** | 400, 600, 700 | `--font-sans`     |
| `CERA` wordmark only | **Montserrat**    | 700           | `--font-wordmark` |

`MEDICAL` beneath the wordmark is Montserrat 600 at `0.28em` letter-spacing, matching the wide
tracking in the reference.

No other typeface may be introduced. The script overlay in the reference hero ("Care Support
Wellness For a Brighter Tomorrow") and in the CTA band ("Your Health Matters") is **decorative
artwork, not text** - it ships as an inline SVG with `aria-hidden="true"`, so no third font is
loaded and no screen reader announces it.

### 2.1 Type scale

Fluid between the 360px and 1280px viewports using `clamp()`. Line heights are unitless.

| Token       | Size                                      | Line height | Weight | Tracking   | Use                                      |
| ----------- | ----------------------------------------- | ----------- | ------ | ---------- | ---------------------------------------- |
| `display-1` | `clamp(2rem, 1.35rem + 2.9vw, 3rem)`      | 1.12        | 700    | `-0.02em`  | Hero headline                            |
| `h1`        | `clamp(1.75rem, 1.3rem + 2vw, 2.5rem)`    | 1.18        | 700    | `-0.015em` | Page title                               |
| `h2`        | `clamp(1.5rem, 1.2rem + 1.3vw, 2rem)`     | 1.22        | 700    | `-0.01em`  | Section heading                          |
| `h3`        | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)` | 1.3         | 600    | `-0.005em` | Card group heading                       |
| `h4`        | `1rem`                                    | 1.4         | 600    | `0`        | Card title, footer column heading        |
| `body-lg`   | `1.0625rem`                               | 1.6         | 400    | `0`        | Hero body, section sub-heading           |
| `body`      | `1rem`                                    | 1.6         | 400    | `0`        | Default                                  |
| `body-sm`   | `0.875rem`                                | 1.55        | 400    | `0`        | Card body, footer links                  |
| `caption`   | `0.8125rem`                               | 1.5         | 400    | `0`        | Helper, copyright                        |
| `eyebrow`   | `0.75rem`                                 | 1.4         | 600    | `0.14em`   | `YOUR HEALTH, OUR PRIORITY.` (uppercase) |
| `pill`      | `0.6875rem`                               | 1.3         | 700    | `0.08em`   | `WELLNESS`, `NUTRITION` (uppercase)      |
| `button`    | `0.9375rem`                               | 1.2         | 600    | `0.01em`   | All button labels                        |

Minimum body size is 16px on all public routes. `caption` and `pill` are permitted below that only
for non-essential text, and never for the sole carrier of meaning.

---

## 3. Space, radius, elevation, motion

Four-pixel base scale.

```
space  0:0  1:4px  2:8px  3:12px  4:16px  5:20px  6:24px  8:32px
      10:40px  12:48px  14:56px  16:64px  20:80px  24:96px  28:112px
```

```
radius  sm:4px   md:6px   lg:8px   xl:12px   2xl:16px   pill:9999px
```

The reference uses restrained corner rounding: buttons and cards read as `radius-md` to
`radius-lg`, never fully rounded except the icon discs and category pills.

```
shadow-xs    0 1px 2px    rgba(19,41,75,0.05)
shadow-sm    0 1px 3px    rgba(19,41,75,0.07), 0 1px 2px rgba(19,41,75,0.04)
shadow-md    0 4px 12px   rgba(19,41,75,0.08)
shadow-lg    0 12px 28px  rgba(19,41,75,0.10)
shadow-card-hover  0 8px 20px rgba(10,83,120,0.12)
```

Motion is deliberately minimal for a medical context.

```
duration  fast:120ms  base:180ms  slow:260ms
easing    standard: cubic-bezier(0.2, 0, 0, 1)
```

`--ease-*` is a Tailwind theme namespace, so `ease-standard` is generated. `--duration-*` is **not**,
so `duration-fast|base|slow` are declared with `@utility` in `theme.css`. Without that the tokens
exist but generate nothing, and transitions quietly run at the browser default.

Every transition and animation must be suppressed under `@media (prefers-reduced-motion: reduce)`.

---

## 4. Layout

Normalised from the reference, which was measured at roughly a 1280px design width with a ~43px
header. The reference's own insets are inconsistent between sections (hero copy sits further in
than the service card row); the values below regularise that into one container.

```
container   max-width 1200px, centred
gutter      24px below md, 40px at md and above
breakpoints sm 640  md 768  lg 1024  xl 1280  2xl 1536
```

### 4.1 Vertical rhythm

Measured band heights from the reference, scaled to an 80px header.

| Band           | Reference px | Scaled target | Section padding                    |
| -------------- | ------------ | ------------- | ---------------------------------- |
| Header         | 43           | 80            | fixed height                       |
| Hero           | 238          | ~443          | `py-16` / `lg:py-20`               |
| Services       | 205          | ~381          | `py-14` / `lg:py-20`               |
| How CERA Works | 116          | ~216          | `py-12` / `lg:py-16`               |
| Articles       | 203          | ~378          | `py-14` / `lg:py-20`               |
| CTA band       | 79           | ~147          | `py-10` / `lg:py-12`               |
| Footer         | 130          | ~242          | `pt-12 pb-0` + separate bottom bar |

Band backgrounds alternate `surface-tint` (hero), `neutral-0` (services), `surface-tint-2` (process),
`neutral-0` (articles), gradient (CTA), `surface-footer` (footer).

### 4.2 Grids

| Section        | Mobile                   | `sm` | `lg`         | `xl`         |
| -------------- | ------------------------ | ---- | ------------ | ------------ |
| Service cards  | 1                        | 2    | 3            | 6            |
| Process steps  | 1 (stacked, no chevrons) | 1    | 3 + chevrons | 3 + chevrons |
| Article cards  | 1                        | 2    | 3            | 3            |
| Footer columns | 1                        | 2    | 4            | 4            |

The six-across service row only holds at `xl`. Below that it wraps; the chevron separators between
process steps are decorative and are removed rather than rotated when the row stacks.

---

## 5. Component specification

Each entry lists the visual contract from the reference plus the accessibility contract that the
reference cannot express. Both are binding.

### 5.1 Button

| Variant   | Fill          | Label         | Border               | Use in reference                         |
| --------- | ------------- | ------------- | -------------------- | ---------------------------------------- |
| `primary` | `primary-700` | `neutral-0`   | none                 | Explore Services, Read More, Subscribe   |
| `accent`  | `teal-700`    | `neutral-0`   | none                 | Header "Make an Enquiry"                 |
| `outline` | `neutral-0`   | `navy-900`    | 1px `border-control` | Hero "Make an Enquiry"                   |
| `ghost`   | transparent   | `primary-700` | none                 | "View All Services", "View All Articles" |
| `on-dark` | `neutral-0`   | `primary-700` | none                 | CTA band "Make an Enquiry"               |

Sizes `sm` 36px, `md` 44px, `lg` 48px tall; horizontal padding `space-5`/`space-6`/`space-6`.
Buttons carrying the `→` glyph render it as an `aria-hidden` icon with `gap: space-2`, and the glyph
translates 2px on hover.

Accessibility contract: minimum 44x44px hit target for anything touch-reachable; a 2px
`focus-ring` offset 2px, visible on every variant including `on-dark`; `disabled` drops to
`neutral-200` fill with `neutral-500` label and keeps 3:1 against the surface; a loading button
retains its width, sets `aria-busy="true"`, and announces state through a live region rather than by
label swap alone.

### 5.2 ServiceCard

White surface, 1px `border-default`, `radius-lg`, `shadow-xs`, padding `space-5`. Top-to-bottom:
48px `radius-pill` disc filled `icon-disc` holding a 24px `primary-700` line icon; `space-4`; `h4`
title in `navy-900`; `space-2`; two-line `body-sm` description in `neutral-700`; spacer; full-width
`outline` "Learn More" button pinned to the card foot so all cards in a row align.

Accessibility contract: the whole card is **not** a link. The title is the link and carries the
accessible name; "Learn More" is a second link to the same target with
`aria-label="Learn more about {service}"` so a link list is not full of identical text. Icons are
`aria-hidden`. Cards in a row are `<li>` inside a `<ul>`. Hover raises to `shadow-card-hover` and
shifts the border to `primary-200`; hover is never the only affordance.

### 5.3 ProcessStep

Two-digit `primary-700` ordinal at `h3` weight 700; 56px white `radius-pill` disc with
`shadow-sm` holding a 24px `primary-700` icon; then `h4` title and two-line `body-sm` copy.
Chevron separators between steps are `neutral-300`, `aria-hidden`, and removed below `lg`.

Accessibility contract: renders as an ordered list `<ol>`; the visible `01`/`02`/`03` is decorative
because the list already conveys order, so it is `aria-hidden` to avoid "01 Explore 1 of 3".

### 5.4 ArticleCard

16:9 cover image, `radius-lg` clipped, `object-cover`. A category pill sits at the image's
bottom-left with 12px inset: `teal-700` fill, `neutral-0` `pill` type, `radius-sm`, padding
`space-1`/`space-2`. Below: `h4` title `navy-900`, `space-2`, two-line `body-sm` excerpt, `space-4`,
`primary` "Read More" button.

Accessibility contract: cover images are decorative (`alt=""`) because the title carries the
meaning; the pill is a `<span>`, not a link, and is prefixed for assistive tech with a visually
hidden "Category:"; excerpts clamp with `line-clamp-2` but the full text remains in the DOM.

### 5.5 Header

80px tall, `neutral-0`, 1px bottom `border-default`, sticky with `shadow-sm` once scrolled past
8px. Left: wordmark lock-up (cross-and-leaf mark, `CERA` in Montserrat 700 `navy-900`, `MEDICAL`
tracked beneath). Centre: Home, Services, Articles, About, Contact in `button` type `neutral-700`;
the active item is `navy-900` with a 2px `primary-700` underline offset 6px. Right: search icon
button, `outline` "Sign In", `accent` "Make an Enquiry".

Accessibility contract: `<header>` + `<nav aria-label="Main">`; the active item carries
`aria-current="page"`; below `lg` the nav collapses to a disclosure button with
`aria-expanded`/`aria-controls`, focus trapped while open, `Escape` closes and returns focus to the
trigger; a "Skip to content" link is the first focusable element and becomes visible on focus.

### 5.6 Hero

Two columns at `lg` (copy 7/12, imagery 5/12), stacked below. Copy column: `eyebrow` in
`neutral-600`; `display-1` where line one is `navy-900` and line two is `teal-700`; `body-lg`
two-line supporting copy; a button row of `primary` + `outline`; then a three-item trust row of
16px icons with two-line `body-sm` labels. Imagery column: portrait with the decorative script SVG
overlaid top-right and a white `radius-lg` `shadow-md` badge card overlapping the lower-left with a
teal icon disc, `h4` title, and `caption` body.

Accessibility contract: exactly one `<h1>` per page, and the teal second line is part of the same
`<h1>` via a `<span>`, not a separate heading. The portrait is meaningful and takes a real `alt`.
The overlapping badge must not cover the portrait subject's face at any breakpoint and must not clip
at 320px. The whole hero must survive 200% zoom and a 400% reflow check without horizontal scroll.

### 5.7 SectionHeader

Centred: a 40px `teal-600` 3px rule above the heading, `h2` in `navy-900`, then a `body-lg`
sub-heading in `neutral-600` capped at `65ch`. An optional `ghost` "View all" link sits
right-aligned on the same baseline at `lg` and drops beneath the sub-heading below that.

### 5.8 CtaBand

Full-bleed `linear-gradient(90deg, #1B5882, #005B7D)`. Left: `h2` in `neutral-0` and a `body`
sub-line at 85% opacity. Centre-right: `on-dark` button. Far right: decorative script SVG with a
heart outline, hidden below `lg`.

Accessibility contract: because copy sits on a gradient, contrast is verified at **both** stops and
at the midpoint. Gradient text is forbidden.

### 5.9 Footer

`surface-footer`, four columns: brand lock-up plus the "Better Information. Healthier Lives."
tagline; Quick Links; Support; Stay Connected as 32px social icon buttons; and the newsletter block
with an `h4`, a `caption` line, and an inline email input plus `primary` Subscribe button. A
separate lighter bottom bar holds "© 2026 CERA Medical. All rights reserved." on the left and
"A Healthier Tomorrow, Together." on the right, both `caption` `neutral-600` — the sampled
`neutral-500` fails AA at 13px, per section 1.4.

Accessibility contract: `<footer>` with `<nav aria-label>` per link column; social icon buttons carry
visually hidden names ("CERA Medical on LinkedIn") and `rel="noopener noreferrer"`; the newsletter
input has a real `<label>` (visually hidden is acceptable) and never placeholder-only labelling, and
its result is announced through a polite live region.

### 5.10 Form controls

Input, textarea, and select: 44px minimum height, `neutral-0` fill, 1px `border-control`,
`radius-md`, `space-3` padding, `body` type. Focus shows a 2px `focus-ring` at 2px offset and keeps
the border. Error state shifts the border to `danger-500` and renders `caption` `danger-700` help
text beneath.

Accessibility contract: every control has a persistent visible `<label>` above it; required fields
are marked in text, not by colour or asterisk alone; errors are tied with `aria-describedby` and
`aria-invalid`, focus moves to a summary at the top of the form on submit failure, and the summary
links to each field. Placeholders never replace labels. This contract is what ENQ-402 is tested
against.

### 5.11 Supporting states

`Badge` for statuses using the semantic ramp, always pairing colour with a text label.
`EmptyState` with icon disc, `h3`, `body` explanation, and one action.
`Toast` bottom-right, `role="status"` for success and `role="alert"` for error, dismissible,
never auto-dismissing an error.
`Skeleton` blocks in `neutral-100` honouring `prefers-reduced-motion`.
`Pagination` with `<nav aria-label="Pagination">` and `aria-current` on the active page.

---

## 6. Reference content

Copy transcribed from the reference image. Phase 03 and 04 build against this verbatim; Phase 05
replaces it with CMS-managed content. It is **placeholder pending CERA content approval** (PRD 22)
and must be marked as such in the seed fixtures.

**Hero.** Eyebrow `YOUR HEALTH, OUR PRIORITY.` Headline `Trusted Medical Services,` /
`Made Easier to Access.` Body `Clear information. Simple enquiries.` /
`Better care for a healthier tomorrow.` Buttons `Explore Services`, `Make an Enquiry`.
Trust row `Trusted Information`, `Patient Focused`, `A Healthier Tomorrow`.
Badge `Real People Real Care` / `Access the right services with confidence.`

**Services.** `Our Medical Services` / `Explore our range of trusted medical services designed to
support your health and wellbeing.`

| Service                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| General Health             | Comprehensive care for everyday health needs. |
| Cardiology                 | Expert care for a healthier heart.            |
| Orthopaedics               | Getting you moving with confidence.           |
| Women's Health             | Specialist care for every stage of life.      |
| Diagnostic Tests           | Accurate results for better care.             |
| Wellness & Preventive Care | Stay healthy today and tomorrow.              |

**Process.** `How CERA Works` / `Getting the care you need is simple.`

| #   | Step      | Copy                                                 |
| --- | --------- | ---------------------------------------------------- |
| 01  | Explore   | Browse our services and find the right care for you. |
| 02  | Enquire   | Submit a simple enquiry through our secure form.     |
| 03  | Follow Up | Track your enquiry and stay updated in your account. |

**Articles.** `Health Insights & Articles` / `Helpful information to support your health and
wellbeing.`

| Category     | Title                               | Excerpt                                                                  |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------ |
| WELLNESS     | 5 Simple Habits for a Healthier You | Small changes can make a big difference to your long-term health.        |
| NUTRITION    | The Role of Nutrition in Wellbeing  | Discover how the right diet can support your physical and mental health. |
| HEART HEALTH | Understanding Heart Health          | Learn about key risk factors and how to keep your heart healthy.         |

**CTA band.** `Need help finding the right service?` / `Our team is here to help you with any
questions.` / `Make an Enquiry`

**Footer.** Tagline `Better Information. Healthier Lives.`
Quick Links: Home, Services, Articles, About, Contact.
Support: Make an Enquiry, Sign In, FAQs, Privacy Policy, Terms of Service.
Stay Connected: LinkedIn, Facebook, Instagram, YouTube.
Newsletter: `Subscribe to Our Newsletter` / `Get the latest health insights and updates.`
Bottom bar: `© 2026 CERA Medical. All rights reserved.` / `A Healthier Tomorrow, Together.`

---

## 7. Implementation rules

1. Tokens are declared once, in `packages/ui/src/styles/theme.css`, as a Tailwind v4 `@theme`
   block. Nothing else declares a colour.
2. No component may contain a hard-coded hex value, `rgb()`, or arbitrary Tailwind colour such as
   `bg-[#0A5378]`. This is enforced by an ESLint rule, not by review alone.
3. Fonts load through `next/font/google` with `display: 'swap'` and are assigned into the
   `--font-sans` and `--font-wordmark` tokens. No `<link>` to a font CDN.
4. Icons come from one set (`lucide-react`), sized on the 4px scale, and are `aria-hidden` unless
   they are the sole content of a control, in which case the control carries a visually hidden name.
5. Every component ships with an axe assertion at the `wcag2a`, `wcag2aa`, and `wcag21aa` tag set.
6. Dark mode is out of scope for this release. Tokens are structured so a `[data-theme="dark"]`
   block can be added later without touching component code.
