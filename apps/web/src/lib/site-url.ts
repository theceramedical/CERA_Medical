/**
 * The site's own absolute origin.
 *
 * Needed by anything that has to emit an absolute URL rather than a path: the canonical link, Open
 * Graph tags, and the `Sitemap:` line in `robots.txt`, all of which are ignored - silently - when given
 * a relative value.
 *
 * **Derived from configuration, never from the request.** Building it from the `Host` header would mean
 * a request with a spoofed host could make this site advertise canonicals and Open Graph URLs pointing
 * at another origin, which is how a copy of a site gets indexed in place of the original.
 */

/**
 * The local default, used when `NEXT_PUBLIC_SITE_URL` is unset.
 *
 * A default rather than a thrown error, because `next build` runs in CI with no environment and the
 * metadata files are evaluated during it. The value is wrong in production and that is the point: it is
 * `localhost`, which is unmistakable in a canonical tag, where a plausible-looking guess would not be.
 */
const LOCAL_DEFAULT = 'http://localhost:3000';

export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured === undefined || configured.length === 0) return new URL(LOCAL_DEFAULT);

  try {
    return new URL(configured);
  } catch {
    /**
     * Throws on a malformed value rather than falling back.
     *
     * The fallback above covers "not configured", which is a legitimate state in development. A value
     * that is present and unparseable is a typo in a deployment variable, and quietly serving
     * `localhost` canonicals from production because of one is far worse than failing the build.
     */
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not a valid absolute URL: ${JSON.stringify(configured)}`,
    );
  }
}

/**
 * The other public hostname for this site (apex vs `www`), when there is one.
 *
 * Visitors can still hit the non-canonical host before the edge or `proxy.ts` redirect runs, or when
 * a bookmark points at apex. CSP `form-action 'self'` is document-origin only, so allowing the
 * configured canonical origin as well avoids blocking sign-in when HTML and the address bar disagree.
 */
export function pairedPublicSiteOrigin(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured === undefined || configured.length === 0) return undefined;

  let canonical: URL;
  try {
    canonical = new URL(configured);
  } catch {
    return undefined;
  }

  const { hostname, protocol } = canonical;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined;

  const alternateHost = hostname.startsWith('www.')
    ? hostname.slice('www.'.length)
    : `www.${hostname}`;

  if (alternateHost.length === 0) return undefined;

  return `${protocol}//${alternateHost}`;
}
