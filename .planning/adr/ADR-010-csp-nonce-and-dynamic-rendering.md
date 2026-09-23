# ADR-010: A nonce-based Content-Security-Policy, at the cost of static HTML rendering

- **Status:** Accepted
- **Date:** 2026-09-23
- **Phase:** 04 Web shell and homepage
- **PRD references:** section 15 (Security), section 10 (Performance), WEB-301, QA-1102

## Context

`proxy.ts` sets the response security headers for every document, including
`Content-Security-Policy`. The question is what `script-src` should contain, and the answer turns out
to decide how the whole site renders.

Next's App Router emits two inline `<script>` elements in every document: the hydration bootstrap and
the RSC flight payload (`self.__next_f.push(...)`). Neither can be moved to an external file - the
flight payload is the page's own data. So a policy that restricts inline script has to identify those
two somehow, and CSP offers exactly three mechanisms: a nonce, a hash, or `'unsafe-inline'`.

- A **hash** is not available. The flight payload differs per page and per render, so there is no
  build-time digest to publish, and Next does not emit one.
- A **nonce** works, and Next supports it well: it parses the `content-security-policy` header on the
  inbound request, extracts the nonce, and stamps it onto every script tag it emits. Measured on this
  codebase, a dynamically rendered route produced 9 script tags and 9 nonces.
- **`'unsafe-inline'`** works unconditionally and permits any injected inline script, which is the
  attack the directive exists to stop.

The problem is that a nonce is a per-request value and a statically prerendered page is HTML produced
at build time, when there is no request. Measured on this codebase before the decision was taken: the
prerendered homepage was served from the full-route cache with the nonce policy applied to the
response and **zero** nonces in the HTML. Every script on the page would have been blocked. The site
would have rendered, looked correct, and not hydrated - no error, no console warning visible to a
build, just a site where nothing interactive works.

So the real choice is between two coherent positions, and there is no third:

1. A nonce policy, with every HTML document rendered per request.
2. A `'unsafe-inline'` policy, with static prerendering and the full-route cache intact.

## Decision

**Option 1. `script-src` carries a per-request nonce with `'strict-dynamic'`, and the root layout
forces dynamic rendering for every route beneath it.**

The forcing is explicit - `export const dynamic = 'force-dynamic'` in `app/layout.tsx` - rather than
implicit through a `headers()` call whose side effect happens to be the same. An implicit mechanism
would be removed by the first person who tidies up an unused variable.

It is also verified rather than trusted. `apps/web/e2e/security.e2e.spec.ts` walks every route in
`e2e/support/routes.ts` and asserts three things: that every `<script>` element's nonce matches the one
in the response's own policy, that the browser reported no `securitypolicyviolation` events, and that the
mobile menu opens - which server-rendered HTML cannot do, so it is proof that the client bundle executed
under the enforced policy. That last assertion is the one that would have caught this on its own, without
anyone having to reason about nonces. The suite runs in the `browser` CI job.

One implementation detail is worth recording because it costs an afternoon otherwise: Chromium strips the
`nonce` _attribute_ from the parsed element, deliberately, so that a script which can read the DOM cannot
harvest the value and mint itself a trusted tag. The value survives on the element's `nonce` property.
A check that queried `[nonce]` in the DOM would therefore report zero nonces on a perfectly working page.

## Consequences

**What is given up.** The full-route HTML cache, and with it incremental static regeneration. Every
document request runs a React render in the Node process. There is no version of this that keeps a
per-request nonce and a cached document, because a cached nonce is a shared nonce, which is worth no
more than `'unsafe-inline'`.

**What is kept.** Almost everything that determines the numbers in the performance budget:

- The immutable, fingerprinted `_next/static` chunk cache, which the proxy matcher deliberately skips.
- `next/image` optimisation and its cache.
- The **data** cache. Phase 05 and 06 fetch from Payload and Vendure with `revalidate`, and that
  caching is unaffected - so a per-request render does not become a per-request upstream call, which
  is the cost that would actually have mattered.
- Fonts, self-hosted and preloaded.

The remaining cost is a server-side render of a small component tree. On a site whose largest
contentful paint is a hero photograph, that is not the number under pressure.

**Why the trade lands this way for this product.** Phase 05 puts a CMS behind the content, with
editors authoring rich text that is rendered into these pages. Stored cross-site scripting through
authored content is the realistic attack on a medical content site, and a `script-src` without
`'unsafe-inline'` is the highest-value single mitigation against it. A policy containing
`'unsafe-inline'` is worse than no policy, because it produces a header that satisfies a security
review while defending against nothing.

**`'strict-dynamic'` comes with the nonce, not instead of it.** Next's bootstrap loads further
scripts dynamically, and those injected elements carry no nonce of their own;`'strict-dynamic'`
extends trust to scripts created by already-trusted script. `'self'` and `https:` stay in the list as
a CSP2 fallback, where `'strict-dynamic'` is unrecognised and the alternative is no script policy at
all.

**`style-src` keeps `'unsafe-inline'`,** which is a separate and much smaller concession: Next inlines
style elements for `next/font` and hoisted critical CSS without nonces, so the alternative is an
unstyled site. Injected CSS can restyle and reshape a page - which is a clickjacking concern, closed
off by `frame-ancestors 'none'` and `form-action 'self'` - but it cannot execute.

**Revisit if** traffic characteristics change such that document TTFB becomes the constraint, or if
Next gains the ability to emit build-time script hashes. The first would be visible in Phase 13's
observability; the second would let both options be taken at once.

## Alternatives considered

**`'unsafe-inline'` with static prerendering.** The common choice for Next sites, and the reason
`script-src` is so often decorative. Rejected on the grounds above: it optimises a number that is not
binding in exchange for the control that is.

**Report-only enforcement.** Keeps static rendering and produces violation reports. Rejected: a
report-only policy blocks nothing, so it is a monitoring feature described in the vocabulary of a
security control, and PRD 15 asks for the control.

**Per-route policies - nonce for dynamic routes, `'unsafe-inline'` for static ones.** Rejected: the
proxy would have to know which routes the build decided to prerender, which is a duplicate of the
router's own knowledge maintained by hand, and the failure mode of getting it wrong is a broken page
in production.

**Setting the policy at the edge in Caddy (Phase 13).** Rejected for the nonce specifically: Caddy
would have to rewrite the HTML body to insert a matching nonce into each script tag, which is body
rewriting in a reverse proxy - fragile, and duplicating what the framework already does correctly.
Caddy still owns the transport headers, notably HSTS, which this process cannot determine.
