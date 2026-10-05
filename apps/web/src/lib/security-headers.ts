/**
 * The response security headers, as a pure function of the request.
 *
 * Separate from `proxy.ts` so the policy can be asserted directly. A CSP is a string that is
 * either exactly right or quietly useless, and the failure mode of a wrong one is not an error -
 * it is a directive the browser ignores, or a page that renders with its scripts blocked. Neither
 * is visible from a passing build, so the policy needs tests that read it.
 *
 * Phase 13 adds the edge layer in the Caddyfile. The two are not duplicates: Caddy owns the
 * headers that describe the *transport* (HSTS, which is only meaningful on a connection Caddy
 * terminates and this process cannot observe), and this owns the ones that describe the
 * *document*. Setting HSTS from here would be a guess about a hop we are behind.
 */

/** A per-request nonce for the CSP, and the policy that carries it. */
export interface CspResult {
  readonly nonce: string;
  readonly policy: string;
}

/**
 * Origins the document is allowed to talk to or load from, beyond `'self'`.
 *
 * Passed in rather than read from `process.env` here, because a pure function of its arguments
 * is testable and a function that reads the environment is testable only by mutating it.
 */
export interface CspOrigins {
  /** Where `next/image` is pointed: SeaweedFS locally, R2 in staging and production. */
  readonly mediaOrigin?: string | undefined;
  /** `apps/api`, which the browser calls directly for enquiry submission and the portal. */
  readonly apiOrigin?: string | undefined;
  /** Authentik (`OIDC_ISSUER`), used when the sign-in route prefetches the authorize redirect. */
  readonly authOrigin?: string | undefined;
  /**
   * Extra `form-action` origins (e.g. apex when canonical is `www`), so a rare host mismatch does
   * not block legitimate sign-in forms.
   */
  readonly formActionOrigins?: readonly string[] | undefined;
}

/**
 * Builds the Content-Security-Policy.
 *
 * This is a nonce plus `'strict-dynamic'` policy, which is the only kind worth deploying. A
 * host allow-list policy (`script-src 'self' cdn.example.com`) is bypassable through any JSONP
 * endpoint or outdated library on any allowed host, and it has to be edited every time a script
 * moves. `'strict-dynamic'` instead trusts scripts the page itself created, which is exactly the
 * set Next's hydration bootstrap needs, and trusts nothing that arrives through an injected
 * attribute or a `document.write`.
 *
 * `'self'` and `https:` are still listed in `script-src` on purpose: a CSP3 browser ignores them
 * in the presence of `'strict-dynamic'`, and a CSP2 browser ignores `'strict-dynamic'` and falls
 * back to them. Removing them would leave older engines with no policy at all.
 */
export function buildCsp(nonce: string, origins: CspOrigins = {}): string {
  const imageSources = ["'self'", 'data:', 'blob:'];
  if (origins.mediaOrigin !== undefined) imageSources.push(origins.mediaOrigin);

  const connectSources = ["'self'"];
  if (origins.apiOrigin !== undefined) connectSources.push(origins.apiOrigin);
  if (origins.authOrigin !== undefined) connectSources.push(origins.authOrigin);

  const formActionSources = ["'self'", ...(origins.formActionOrigins ?? [])];

  const directives: Record<string, readonly string[] | null> = {
    'default-src': ["'self'"],

    'script-src': [`'nonce-${nonce}'`, "'strict-dynamic'", "'self'", 'https:'],

    /**
     * `'unsafe-inline'` for styles, and it is a deliberate concession rather than an oversight.
     *
     * Next inlines a `<style>` element for `next/font` and for the critical CSS it hoists, and
     * neither carries the nonce - so a nonce-only `style-src` renders the site unstyled. The risk
     * it admits is real but bounded: injected CSS can exfiltrate the *shape* of a page and
     * restyle it, which matters for clickjacking, and `frame-ancestors 'none'` plus
     * `form-action 'self'` below is what actually closes that off. It cannot execute script,
     * which is the exposure `script-src` exists to prevent and which stays nonce-gated.
     */
    'style-src': ["'self'", "'unsafe-inline'"],

    'img-src': imageSources,

    // Self only. Fonts are self-hosted through `next/font`, and a font CDN entry here would make
    // the third-party-request assertion in the accessibility suite pass while the policy quietly
    // permitted the thing it checks for.
    'font-src': ["'self'"],

    'connect-src': connectSources,
    'manifest-src': ["'self'"],

    // No plugins, no nested browsing contexts. Both are attack surface this product has no use
    // for, and `object-src 'none'` in particular is required for `'strict-dynamic'` to mean
    // anything, since a Flash-era `<object>` bypasses script-src entirely.
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'child-src': ["'none'"],
    'worker-src': ["'self'"],

    /**
     * `base-uri 'none'` is the directive most often left out and it is load-bearing here.
     *
     * An injected `<base href="https://attacker.example">` silently repoints every relative URL
     * on the page, including the script sources Next emits - which turns a markup injection into
     * script execution without ever violating `script-src`.
     */
    'base-uri': ["'none'"],

    // Clickjacking. `frame-ancestors` is the directive that is actually enforced by current
    // browsers; `X-Frame-Options` below is the same statement for engines that predate it.
    'frame-ancestors': ["'none'"],

    /**
     * `form-action 'self'`. Without it, an injected `<form action>` can post the contents of the
     * enquiry form to another origin, and no other directive prevents that - `connect-src` does
     * not cover form submission.
     */
    'form-action': formActionSources,

    // A valueless directive. `null` marks it so the serialiser emits the name alone rather than
    // `upgrade-insecure-requests ;`, which some parsers reject.
    'upgrade-insecure-requests': null,
  };

  return Object.entries(directives)
    .map(([name, values]) => (values === null ? name : `${name} ${values.join(' ')}`))
    .join('; ');
}

/**
 * The headers applied to every response.
 *
 * `Content-Security-Policy` is not in here: it is built per request because it carries a nonce,
 * and `proxy.ts` has to put the same string on both the request (so Next can read the nonce out
 * of it) and the response (so the browser enforces it).
 */
export const STATIC_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  /**
   * Stops the browser guessing a content type from the bytes. The attack is an upload served as
   * `text/plain` that a sniffing browser decides is HTML and executes on this origin.
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * Superseded by `frame-ancestors`, kept for engines that do not implement it. Costs one header
   * and removes the "we forgot old browsers" conversation.
   */
  'X-Frame-Options': 'DENY',

  /**
   * Full URL to our own origin, origin only when crossing to another.
   *
   * `no-referrer` would be stricter and is the wrong trade: it breaks our own analytics-free
   * server logs for internal navigation while providing no protection we do not already get,
   * since the sensitive case is a claim token in a URL and that is handled by keeping tokens out
   * of URLs (see `stripSensitiveQuery` in @cera/observability) rather than by hoping the browser
   * withholds them.
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Every powerful feature denied. This product is a content site with forms - it has no use for
   * a camera, a microphone, a location, or a payment handler, and PRD 3.2 puts payments out of
   * scope entirely. Denying them means a compromised script cannot prompt for them either.
   */
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'display-capture=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'usb=()',
    'xr-spatial-tracking=()',
  ].join(', '),

  /**
   * Process isolation. `same-origin` severs the `window.opener` reference a cross-origin opener
   * would otherwise hold, which is what makes tabnabbing possible.
   */
  'Cross-Origin-Opener-Policy': 'same-origin',

  /**
   * `same-site` rather than `same-origin`.
   *
   * `same-origin` would block the CMS and the API from embedding our own resources across
   * subdomains, which Phase 05's live preview needs. `same-site` still blocks the cross-site
   * inclusion that Spectre-class side-channel attacks depend on.
   */
  'Cross-Origin-Resource-Policy': 'same-site',

  /**
   * Off, because a DNS prefetch is a request to a third party made before the user has done
   * anything - which is both a privacy leak and, on a medical site, a disclosure of intent to
   * whoever runs the resolver.
   */
  'X-DNS-Prefetch-Control': 'off',
};
