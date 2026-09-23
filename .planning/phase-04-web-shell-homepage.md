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

- [x] `apps/web` on Next.js 16.3.5 with React 19.2.8, App Router, TypeScript strict
- [x] `output: 'standalone'` for the container image
- [x] Route groups: `(public)`, `(account)`, `(staff)` - separate layouts and separate auth posture
      from the start, so the staff console is not retrofitted into the public tree
- [x] `proxy.ts` (Next.js 16 renamed `middleware.ts`) handling request IDs, security headers, and a
      **presence-only** session check for redirect ergonomics. It is explicitly not an authorisation
      boundary; see [ADR-004](adr/ADR-004-oidc-relying-party.md).
- [x] `instrumentation.ts` wiring the GlitchTip SDK with release and environment
- [x] `next/image` configured for the MinIO and R2 hosts with explicit remote patterns

`src/proxy.ts`, `src/lib/security-headers.ts`, `src/lib/site-url.ts`, `src/instrumentation.ts`, and
`packages/contracts/src/session.ts`. 65 unit tests across `proxy.test.ts` and
`security-headers.test.ts`.

**`proxy.ts` is not `middleware.ts`, and the rename carries two behavioural changes** worth recording
because neither is obvious from the filename. It always runs on the Node.js runtime - the edge/Node
choice is gone - and route segment config is rejected inside it, which is verifiable in Next's own
`get-page-static-info.js`. The matcher therefore does the excluding: `_next/static`, `_next/image`,
`favicon.ico`, `robots.txt`, and `sitemap.xml` are skipped so a CSP nonce is not minted for a static
asset that will never use it.

**The session check is presence-only, and the file says so in a comment that is load-bearing rather than
decorative.** It reads whether a cookie named `__Host-cera_session` exists and redirects to sign-in if it
does not. It does not validate it, and it must never start to: a proxy that appears to authorise is how an
authorisation bug gets introduced by someone reasonably assuming the check upstream is real. Authorisation
is the API's, per [ADR-004](adr/ADR-004-oidc-relying-party.md). The cookie _names_ live in
`@cera/contracts` so the web app and the API cannot drift on them, and only the names - a cookie's
contents are the API's business.

**An open redirect, closed before Phase 09 could inherit it.** The redirect preserves the requested path
as `?next=`, and a path is only safe to hand back to a browser if it is genuinely relative. A request to
`https://host//evil.test` produces `nextUrl.pathname === '//evil.test'`, which is protocol-relative - a
browser resolving the redirect treats it as `https://evil.test` - and `startsWith('/')` accepts it
happily. `normalisePath` collapses leading slashes, and it is applied to both the prefix match and the
return target, so the defence sits on the path that needs it rather than merely in the file. The test
that proves it asserts the raw pathname is `//account/enquiries` and the emitted `next` is
`/account/enquiries`, so it would fail if the normalisation were removed.

Finding it was an accident worth describing. The first version of the test asserted that the return
target "must not contain `attacker.example`", which is wrong - a query-string value is inert - but
writing the assertion is what surfaced the real vector.

**No HSTS from the application, asserted absent by a test.** Caddy terminates TLS and owns transport
headers (Phase 13). Two sources for `Strict-Transport-Security` is how a `max-age` of a year ends up
shadowed by a stale zero, and the application cannot know whether it is being served over HTTPS anyway.

**`style-src` keeps `'unsafe-inline'`, and that is a documented concession rather than an oversight.**
`next/font` emits an inline `<style>` block during rendering that carries no nonce. The alternative is a
style hash recomputed on every font change, which fails closed in a way nobody notices until the site
renders unstyled. Inline _styles_ cannot execute; the directive that matters is `script-src`, which has
no such escape.

### WP-04.2 Shell

- [x] `Header` per `design-language.md` section 5.5: 80px, sticky with shadow after 8px of scroll,
      wordmark, five nav items with `aria-current` on the active one, search button, `Sign In`,
      `Make an Enquiry`
- [x] Mobile navigation as a disclosure with `aria-expanded`, `aria-controls`, focus trap, `Escape` to
      close returning focus to the trigger, and scroll lock while open
- [x] `Footer` per section 5.9: four columns, labelled nav per column, social buttons with visually
      hidden names, newsletter form with a real label and a polite live region for its result
- [x] `SkipLink` as the first focusable element, visible on focus, targeting `#main`
- [x] `RootLayout` with `lang="en"`, font variables, `<main id="main">`, and a route announcer so
      client navigation is announced
- [x] `error.tsx`, `not-found.tsx`, `loading.tsx`, and `global-error.tsx` for every route group, each a
      real page with a heading and a way forward rather than a bare string

`src/components/` - `site-header.tsx` plus three client islands, `site-footer.tsx`,
`newsletter-form.client.tsx`, `navigation.ts`, `link.tsx`, `route-states.tsx`, `coming-soon.tsx`,
`policy-document.tsx` - and thirteen state files across the three route groups.

**The header is a server component with three small islands, not one client component.** It renders on
every page, so whatever is in it is in every bundle. Three things genuinely need the client: the scroll
shadow, marking the active nav item, and the mobile disclosure. Each is its own file, so the nav markup,
the wordmark, and the call-to-action buttons stay on the server. `HeaderScrollShadow` also reads the
scroll position once on mount rather than only listening, because a page restored from the back/forward
cache or loaded at a fragment starts already scrolled and would otherwise show no shadow.

**The mobile nav derives its open state instead of synchronising it.** The obvious implementation is
`useState(false)` plus an effect that closes the menu when `usePathname()` changes, and
`react-hooks/set-state-in-effect` rejects it - correctly, since it is a render, an effect, then another
render. The state here is _which path the menu was opened on_, and `open` is that value compared against
the current path. Navigating closes the menu in the same commit as the navigation, and the browser back
button is handled for free, which a click handler on each link would not be.

**The trigger lives inside the `FocusTrap` container.** `FocusTrap` closes on a pointer-down outside
itself, so a trigger placed outside it would close the panel on mousedown and the same tap's click handler
would immediately reopen it - a menu that appears not to respond at all. Inside, it is also first in the
focus cycle, where a disclosure's trigger belongs. This has a consequence for tests: the wrap-around lands
on the trigger, which is outside the _panel_, so an assertion scoped to the panel reports an escape from a
trap that is working. The first version of `pages.a11y.spec.ts` did exactly that.

**A disclosure, not a dialog.** A dialog role claims the page behind it is unavailable, which obliges
`aria-modal` and hiding the rest of the document. A navigation panel is a button that shows and hides a
list. It still traps focus, because it visually covers the page and an untrapped Tab would operate
controls the user cannot see.

**`global-error.tsx` imports nothing from `@cera/ui`.** It replaces the root layout, so it renders its own
`<html>` and `<body>`, and it runs precisely when the tree below has failed - importing the component
library into it means a fault inside that library takes out the page meant to report the fault. It re-imports
the fonts and `globals.css` directly and uses a plain `<a href="/">` rather than `next/link`, because the
router lives inside the tree that just failed and `reset()` would re-render it.

`app/not-found.tsx` hand-assembles the public shell rather than reusing `(public)/layout.tsx`, because a
root `not-found` sits outside every route group and cannot inherit one. That duplication is the framework's
shape, not a choice.

**`AppLink` decides between the router and a plain anchor from the href.** `mailto:`, `tel:`, and
protocol-relative URLs must not go through `next/link` - the router will try to prefetch them - and
requiring every call site to pass `external` correctly is a rule that holds until someone forgets. The
regex `^(?:[a-z][\w+.-]*:|\/\/)/i` decides instead.

### WP-04.3 Homepage sections

Built in reference order, each against the copy transcribed in `design-language.md` section 6.

- [x] `HeroSection` per section 5.6 - eyebrow, two-tone `display-1` inside a single `<h1>`, supporting
      copy, `primary` plus `outline` buttons, three-item trust row, portrait with real `alt`,
      decorative script SVG, and the overlapping badge card
- [x] `ServicesSection` - `SectionHeader` with "View All Services", then six `ServiceCard`s in a `<ul>`,
      grid 1 / 2 / 3 / 6 across breakpoints
- [x] `ProcessSection` on the `surface-tint-2` band - three `ProcessStep`s in an `<ol>` with decorative
      chevrons that are removed, not rotated, when the row stacks
- [x] `ArticlesSection` - `SectionHeader` with "View All Articles", then three `ArticleCard`s
- [x] `CtaBandSection` per section 5.8 - full-bleed gradient, `on-dark` button, decorative script hidden
      below `lg`, contrast verified at both gradient stops and the midpoint
- [x] Section order and band backgrounds exactly as the reference: tint, white, tint-2, white, gradient,
      footer

`src/components/home/` - five section components - and `src/content/homepage.ts` carrying the copy
transcribed in `design-language.md` section 6.

**The copy lives in `src/content/`, not in `@cera/contracts/fixtures`,** and the two are pinned together
by a test rather than by an import. Fixtures carry a `Fixture` marker, synthetic subject ids, and
`example.com` addresses precisely so they cannot reach production; their own docblock forbids application
code importing them. But two copies of the same words drift. `src/content/homepage.test.ts` imports both
and asserts the slug sets and the copy agree, which gets the coupling without the dependency. Phase 05 and
07 replace the content module with CMS and catalogue reads behind the same prop shapes.

**That test immediately earned its place by finding a conflict between two phases.** Phase 02 made
`wellness-preventive-care` the `inactive` fixture, to give "excluded from listings, page 404s" a record to
exercise. The reference image shows all six services on the homepage - including that one - so Phase 04's
homepage linked to a page that must not exist. The fix is in the fixtures, not the homepage: a withdrawn
service is a record the business _used_ to offer, so it is now a seventh record, `travel-vaccinations`,
and all six of the reference's services are active. `listableServiceFixtures` goes from five to six and
`enquirableServiceFixtures` from four to five.

**The hero's accent line is `text-accent-hover`, not `text-accent`.** The pairing the contrast gate
verifies for "accent headline on hero tint" is teal-700 on `surface-tint`; teal-600 is the token that reads
slightly better and is not the one with a measured ratio behind it. Choosing the verified token over the
prettier one is the rule, and the comment at the call site says why so it is not "corrected" later.

**Two deliberate deviations from the reference, both recorded here rather than silently absorbed:**

- The CTA band's button is `on-dark` at full opacity. The reference draws it at about 85%, which on the
  gradient lands below 4.5:1 for a 15px label.
- Below `lg` the hero portrait is capped at `max-w-sm` and centred. The portrait is 4:5, so at full width
  on a stacked layout it is 1.25 screens tall - the visitor scrolls past an image rather than reading a
  page, and the section below the hero effectively does not exist on a phone. The reference is a desktop
  composition and says nothing about this, so it is a decision rather than a transcription. Cropping to a
  landscape ratio was the alternative and is worse: it would cut the subject out of a photograph nobody
  has taken yet. The decorative script consequently appears from `lg` rather than `md`, because section
  5.6 calls for it _overlaid_ on the portrait and below `lg` it would hang in the empty margin beside a
  centred image.

**The placeholder assets are deliberately obvious, and one of them had to be recoloured to stay that way.**
`hero-portrait.svg` was filled with `surface-tint` - the same colour as the hero band - so it rendered as
two floating circle outlines with no visible image box, which reads as a broken layout rather than a
pending asset. It is `primary-100` now, one step down the ramp, and its caption moved above the figure
because the badge card overlaps the lower-left by design and was covering it. Literal hex is unavoidable in
these files: an SVG in `public/` is served as a file and never passes through Tailwind, so the header
comment names the token each value came from.

### WP-04.4 Visual fidelity check

- [x] Playwright screenshots at 360, 768, 1024, 1280, and 1440 widths
- [x] A side-by-side comparison of the 1280 capture against the reference image, with any deliberate
      deviation recorded and justified in the phase log
- [x] Baseline screenshots committed so Phase 14 can detect unintended visual drift

`apps/web/e2e/shell.visual.spec.ts` and a third Playwright project, `visual`. 25 baselines - five routes
at five widths - plus one measured assertion. 26 checks, passing, and verified stable by running the suite
twice against unchanged code.

**What this suite is and is not.** It is a regression net: it answers "did this commit change how anything
looks, and did I mean to". It cannot check fidelity against the reference, because no machine can tell
whether a 6px difference in section padding is a defect or a decision. The comparison at 1280 was done by
eye against `design-language.md` section 6 and the reference; the deviations it found are the two recorded
under WP-04.3. The baselines then hold that agreed result still.

**Five routes, not twelve, and that subset is the point.** Twelve routes at five widths is sixty images to
review whenever the header padding changes, which is how a visual suite stops being read. The five chosen
carry every distinct layout the shell produces: the homepage's five bands, a prose page, a form-and-details
page, a long policy document, and a placeholder.

**Baselines are only worth committing if they are stable,** because a suite that fails at random gets its
baselines regenerated without being looked at, at which point it is worse than nothing. Three sources of
drift had to be removed. Reduced motion is emulated at the project level, which eliminates every
mid-transition capture in one line since all the design system's motion is already gated on it. `scale:
'css'` forces a 1x raster, without which a HiDPI workstation produces baselines at twice the resolution CI
would compare against. And `settle()` scrolls the page in viewport-sized steps so lazy images load, then
awaits `document.fonts.ready` and `image.decode()`.

**`networkidle` was the wrong wait and had to go.** It was the obvious choice and it timed out on exactly
one of twenty-five captures - the worst possible failure rate, frequent enough to break a run and rare
enough to look like a real diff. It waits for a 500ms gap in _all_ requests, and a streamed RSC response or
any kept-alive connection means that gap may never arrive. Waiting on `img.complete` instead asserts the
thing actually being photographed, and covers loaded-or-failed so a missing image shows up as a visual
regression in the diff rather than as a timeout.

**The suite is not in CI yet, deliberately.** Playwright tags baselines with the platform that produced
them, and these are committed from a Windows workstation as `-visual-win32.png`. A Linux runner would find
no baseline and _write_ one rather than compare, which is a job that passes unconditionally - worse than
absent, because it looks like coverage. Enforcing it means generating Linux baselines inside the Playwright
container, which belongs with Phase 14's cross-browser matrix. The CI comment says all of this at the point
where someone would notice the gap.

### WP-04.5 Supporting pages

Skeletons with real layout and metadata; content arrives in Phase 07.

- [x] `/about`, `/contact` with an accessible contact block
- [x] `/privacy`, `/terms` rendering policy documents
- [x] `/sitemap` as a human-readable index
- [x] A shared `PageHeader` for interior pages

Plus `ComingSoon` placeholders for `/services`, `/articles`, `/search`, `/enquiry`, `/faqs`, and
`/auth/sign-in`, so every link in the header, footer, and homepage resolves to a real page with a heading
rather than a 404. Deep links that Phase 07 owns - `/services/[slug]` and `/articles/[slug]` - do still
404; the homepage cards point at them because that is where they will live, and the 404 page is a real
page. Recorded as a known gap rather than papered over with a redirect that would have to be removed.

**The contact block is a `<dl>`, and getting that right took two attempts.** Each entry is genuinely a
label and a value, which is what a description list is for. The first draft nested a second `<div>` inside
the per-entry wrapper to stack the label over the value beside the icon - it reads perfectly well and is
invalid. A `<dl>` may contain only `dt`, `dd`, `div`, `script`, or `template`, and a wrapping `div` may hold
only the `dt`/`dd` group, so axe reported both `definition-list` and `dlitem`: assistive technology was no
longer treating these as term/value pairs at all. The icon now lives inside the `<dt>` and the `<dd>` is
indented to match. Found by the route sweep in WP-04.6, not by review.

The contact details are deliberately obvious fakes - an `example.com` address and a placeholder number - so
nobody mistakes them for real and calls them.

**`policy-document.tsx` puts the slug `id` on the heading, not the `<section>`.** An in-page link should
move focus to the heading text, which is what a screen reader then announces; targeting the section
announces the whole section's contents. Each policy also carries a warning `Alert` marking the wording as
pre-legal-review, because a plausible-looking privacy policy is exactly the kind of placeholder that reaches
production.

### WP-04.6 Metadata and performance

- [x] `generateMetadata` per route: title template, description, canonical, Open Graph, Twitter card
- [x] `robots.ts`, `manifest.ts`, favicon and app icon set
- [x] Server Components by default; `'use client'` only where interaction requires it, and recorded per
      component so the boundary is a decision rather than an accident
- [x] Explicit `width` and `height` on every image to hold CLS at zero
- [x] A route-level bundle budget, failing the build when exceeded

`src/app/robots.ts`, `src/app/manifest.ts`, `src/app/icon.svg`, `public/icon-maskable.svg`,
`scripts/bundle-budget.mjs`, `e2e/security.e2e.spec.ts`, `e2e/pages.a11y.spec.ts`, `e2e/support/routes.ts`.

**Every document route renders dynamically, and that is a consequence rather than a default** - see
[ADR-010](adr/ADR-010-csp-nonce-and-dynamic-rendering.md). A nonce CSP and prerendered HTML are mutually
exclusive in Next, because a prerendered page is built before any request exists and so its scripts carry no
nonce. Measured: the statically prerendered homepage had 8 script tags and 0 nonces, two of them inline
`self.__next_f.push` calls, so a nonce-only `script-src` blocked all hydration with no error anywhere. The
page looked almost identical and the mobile menu was dead. `export const dynamic = 'force-dynamic'` in the
root layout is the fix, stated explicitly rather than as a side effect of calling `headers()`, so it survives
someone tidying up an unused variable.

**`security.e2e.spec.ts` is what makes that decision keep working.** It walks all twelve public routes and
asserts the nonce on every `<script>` matches the one in the response's own policy, that the browser reported
no `securitypolicyviolation` events, and that the mobile menu opens - which server HTML cannot do, so it is
proof the client bundle executed under the enforced policy. That last assertion is the one that would have
caught the prerendering bug on its own, without anyone reasoning about nonces. One detail cost real time and
is now recorded in the ADR: Chromium strips the `nonce` _attribute_ from the parsed element, deliberately, so
that a script able to read the DOM cannot harvest the value. It survives on the element's `nonce` property.
A check querying `[nonce]` in the DOM reports zero nonces on a perfectly working page.

**The bundle budget measures gzipped bytes and enforces two numbers, because they fail differently.** Shared
JavaScript is downloaded on every route by every visitor, so a regression there is paid on the first page load
of the whole site. The total catches the other shape: a heavy dependency added to one route, which does not
move the shared figure at all. Raw sizes are roughly three times the wire size, so a raw budget is either far
too loose to catch anything or gets set by whoever last regenerated it.

Per-route attribution is not available and the script says so rather than approximating it. Next 16 with
Turbopack prints no First Load JS figures, there is no `app-build-manifest.json`, and
`build-manifest.json`'s `pages` and `rootMainFilesTree` are both empty under the App Router - it gives
`rootMainFiles` and `polyfillFiles` and nothing else. A number claiming to be per-route derived from that
file would be a guess.

**A route sweep for accessibility, which found things the component-level gate structurally could not.**
`pages.a11y.spec.ts` runs axe over all twelve routes and adds heading outlines, landmark uniqueness, the skip
link, the mobile disclosure, and the 404 page - 22 checks. Two real defects:

- **Muted text failed AA on both tinted bands.** `neutral-600` measures 4.44:1 on `surface-tint` and 4.28:1
  on `surface-tint-2`, against the 4.5:1 that text below 24px needs. The Phase 03 pairing table listed muted
  against white, the footer tint, and the subtle surface - not the two bands the homepage actually uses, so
  the fast gate passed. `--color-muted-on-tint` resolves to `neutral-700` and `theme.css` re-points
  `--color-muted` to it on any element carrying either tint background, so no component has to know which
  band it is sitting on: applying the tint _is_ the trigger, and the two cannot drift apart. Both pairings
  are in `pairings.ts` now, so the next instance of this fails in a second rather than in a two-minute
  browser run, and `theme.test.ts` asserts the cascade rule covers every tint token, because the rule is
  keyed on Tailwind's generated class name and renaming a token would otherwise silently drop the
  correction. Recorded in `design-language.md` section 1.4.
- **The `<dl>` on `/contact`**, described under WP-04.5.

**`manifest.ts` reads its colours out of the stylesheet.** `@cera/no-raw-color` fired on the two literals,
correctly: a manifest is not exempt from the single-source rule just because it is JSON. `manifestColor()`
looks the token up through `readColorTokens()` and throws if it is missing, so a renamed token fails the
build rather than shipping a manifest with an empty `theme_color`.

`display: 'browser'` deliberately. A standalone display mode hides the URL bar, and for a site whose entire
job is to be a trustworthy source of medical information, hiding the address is the wrong trade.

**`next/image` remote patterns are derived from `S3_PUBLIC_URL`, not hard-coded.** The same code has to work
against local MinIO and against R2 with no change (the sandbox-first constraint), so `mediaPattern()` parses
the environment variable and throws on a malformed value or a non-http(s) protocol - a misconfiguration
becomes a startup failure instead of images silently 404ing in production. `dangerouslyAllowSVG` stays
`false`.

## Verification

```bash
pnpm --filter web dev
pnpm --filter web build           # bundle budget enforced
pnpm test:e2e                     # CSP nonce coverage, security headers, redirect
pnpm test:a11y                    # axe over every route, keyboard, shell behaviour
pnpm --filter web test:visual     # 25 baselines at five widths
```

Recorded at the end of the phase:

| Check                           | Result                                                                     |
| ------------------------------- | -------------------------------------------------------------------------- |
| `pnpm lint`                     | clean, zero warnings                                                       |
| `pnpm typecheck`                | clean                                                                      |
| `pnpm format:check`             | clean                                                                      |
| `pnpm test`                     | 1110 passing across 38 files; one file of 33 tests skipped, needing Docker |
| `pnpm test:a11y`                | 72 passing in 2.4m                                                         |
| `pnpm test:e2e`                 | 15 passing in 39s                                                          |
| `pnpm --filter web test:visual` | 26 passing in 1.0m, stable across two consecutive runs                     |
| `pnpm --filter web build`       | all 16 document routes `ƒ`; shared 165.8 kB / 222.3 kB total, gzipped      |

Bundle budgets are 190 kB shared and 260 kB total, set from the measured figures with about 15% of headroom -
enough that adding a component does not fail the build, not enough that a second date library slips in
unnoticed. They are meant to be lowered by Phase 14's performance pass, not raised.

## Exit gate

- [x] Homepage reproduces the reference at 1280 with every deviation recorded
- [x] Responsive behaviour correct at 360, 768, 1024, 1280, and 1440 with no horizontal scroll
- [x] WEB-301: keyboard navigation complete - every interactive element reachable and operable, focus
      always visible, order logical, skip link working, mobile nav trap and restore correct
- [x] axe reports zero violations on every route built in this phase
- [x] One `<h1>` per page and a correct heading outline
- [x] Error, loading, and not-found states render as real pages for every route group
- [~] CLS effectively zero; LCP within budget on a throttled mobile profile

**On the last item.** The CLS half is done and is structural: every `<img>` carries explicit `width` and
`height` matching its file's intrinsic size, so the box is reserved before the bytes arrive, and the hero
image is `priority` so it is not lazy-loaded into the largest-contentful-paint measurement. LCP on a
throttled mobile profile is not measured here and is marked accordingly rather than ticked. Doing it
honestly needs Lighthouse against a deployed origin over a real network profile, which arrives with Phase 13,
and a number taken against `next start` on localhost would be a number that cannot fail. The bundle budget
is the enforceable proxy in the meantime.

**Also carried forward:** `/services/[slug]` and `/articles/[slug]` 404 until Phase 07, and the visual suite
is a local gate until Phase 14 generates Linux baselines.
