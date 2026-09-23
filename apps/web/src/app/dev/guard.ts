import { notFound } from 'next/navigation';

/**
 * Blocks a `/dev/*` route in production.
 *
 * The preview route exposes the design system and nothing else - no data, no credentials, no
 * authenticated surface - so the risk of it being reachable is low. It is gated anyway, for two
 * reasons that are about hygiene rather than secrecy: a public `/dev/design` invites someone to treat
 * it as a supported page, and a route that renders every component in the library has a performance
 * profile with nothing to do with the real site, which makes it noise in production monitoring.
 *
 * `notFound()` rather than a redirect. A 404 says the route does not exist, which is the truth as far
 * as production is concerned; a 302 to the homepage confirms that something is there.
 *
 * **This does not remove the code from the production build.** The route's JavaScript still ships, it
 * just returns 404. Removing it entirely needs a build-time exclusion, and the honest trade is that
 * the guard is a few lines while an exclusion is a config mechanism to maintain. Phase 13 adds the
 * defence that actually keeps the request off the app: Caddy rejects `/dev/*` at the edge in the
 * production overlay.
 */

/**
 * The opt-in that lets the accessibility gate reach the route.
 *
 * `next start` forces `NODE_ENV` to `production` - there is no way to serve a production build under
 * any other value - and WP-03.8 deliberately tests a production build rather than `next dev`, because
 * the dev server injects an error overlay and a dev-tools indicator that are focusable DOM no user
 * will ever load. Without an escape hatch the two requirements are in direct conflict: the route is
 * gated on production and the gate must run in production.
 *
 * The flag is an opt-in rather than an opt-out, which is what makes it safe. Forgetting to set it
 * yields a 404, so the failure mode of a missed environment file is the route being unreachable. An
 * opt-out - `DISABLE_DEV_ROUTES` - would fail the other way, and a forgotten variable would put a page
 * of component fixtures on the public site.
 *
 * Set by `playwright.config.ts` and by nothing else. It appears in no Compose file, no deployment
 * script, and no `.env.example`, so switching it on in production takes a deliberate edit.
 */
const DEV_ROUTE_FLAG = 'CERA_ENABLE_DEV_ROUTES';

export function assertDevOnly(): void {
  if (process.env.NODE_ENV !== 'production') return;

  // Compared to the exact string rather than checked for truthiness: `'false'` and `'0'` are both
  // truthy, and an operator who writes `CERA_ENABLE_DEV_ROUTES=false` to turn it off should get what
  // they asked for.
  if (process.env[DEV_ROUTE_FLAG] === '1') return;

  notFound();
}
