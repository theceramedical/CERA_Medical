import { notFound } from 'next/navigation';

/**
 * Blocks a `/dev/*` route outside development and preview.
 *
 * The preview route exposes the design system and nothing else - no data, no credentials, no
 * authenticated surface - so the risk of it being reachable is low. It is gated anyway, for two
 * reasons that are about hygiene rather than secrecy: a public `/dev/design` invites someone to
 * treat it as a supported page, and a route that renders every component in the library is a page
 * whose performance profile has nothing to do with the real site, which makes it noise in any
 * production monitoring.
 *
 * `notFound()` rather than a redirect. A 404 says the route does not exist, which is the truth as
 * far as production is concerned; a 302 to the homepage confirms that something is there.
 *
 * **This does not remove the code from the production build.** The route's JavaScript still ships,
 * it just returns 404. Removing it entirely needs a build-time exclusion, and the honest trade is
 * that the guard is one line and an exclusion is a config mechanism to maintain. Phase 13 adds the
 * defence that actually keeps the request off the app: Caddy rejects `/dev/*` at the edge in the
 * production overlay.
 */
export function assertDevOnly(): void {
  /**
   * `NODE_ENV`, not a custom flag.
   *
   * Next sets it to `production` for any production build, including the one running in preview, so
   * a preview deployment also 404s here. That is the conservative direction: a flag we set
   * ourselves is a flag that can be forgotten in one environment file, and the failure mode of
   * forgetting is the route being live in production.
   */
  if (process.env.NODE_ENV === 'production') notFound();
}
