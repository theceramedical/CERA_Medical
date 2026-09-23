import type { NextConfig } from 'next';

/**
 * The origin media is served from: SeaweedFS locally, Cloudflare R2 in staging and production.
 *
 * Derived from `S3_PUBLIC_URL` rather than listing hosts, because the whole point of the
 * adapter arrangement is that real R2 credentials drop in without a code change - and a
 * hard-coded `remotePatterns` entry would be exactly the code change. The local SeaweedFS
 * default keeps `next build` working with no environment at all, which CI relies on.
 *
 * A malformed value throws rather than falling back. `remotePatterns` is an allow-list, and
 * silently ignoring a bad entry means every production image 400s with "hostname is not
 * configured" long after the typo was introduced.
 */
function mediaPattern(): { protocol: 'http' | 'https'; hostname: string; port: string } {
  const raw = process.env['S3_PUBLIC_URL'] ?? 'http://localhost:9001/cera-media';

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`S3_PUBLIC_URL is not a valid absolute URL: ${JSON.stringify(raw)}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`S3_PUBLIC_URL must be http or https, received ${url.protocol}`);
  }

  return {
    protocol: url.protocol === 'https:' ? 'https' : 'http',
    hostname: url.hostname,
    // An empty string means "the default port for this protocol", which is what R2 uses.
    port: url.port,
  };
}

/**
 * Next.js configuration for the public site.
 *
 * `standalone` output because Phase 13 ships this as a container behind Caddy. It bundles
 * only the traced dependencies into `.next/standalone`, so the image does not carry a full
 * `node_modules` - the difference is several hundred megabytes per deploy.
 */
const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    /**
     * An allow-list of exactly one origin, plus the CMS for editor-uploaded media.
     *
     * `remotePatterns` is a security control, not a convenience: the optimiser will fetch and
     * re-serve any URL it permits, so a wildcard turns this app into an open image proxy that
     * anyone can point at any host and have the bandwidth billed here.
     */
    remotePatterns: [mediaPattern()],

    /**
     * Widths matched to the layout rather than left at the defaults.
     *
     * The defaults span 640-3840px, and every entry is a separate optimisation and a separate
     * cache entry. The reference uses a 1200px container, so anything above 1920 only serves
     * devices at 2x on the widest band; 3840 would be generated and never requested.
     */
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],

    // AVIF first, WebP second. Roughly 20% smaller than WebP at the same quality, and every
    // browser in the support matrix takes one or the other.
    formats: ['image/avif', 'image/webp'],

    /**
     * SVG stays disabled (the default), stated here because it looks like an omission.
     *
     * An SVG can carry script, and the optimiser passes it through untouched - so permitting
     * remote SVG means a stored XSS in whatever uploads media. The decorative artwork in this
     * app is inline JSX from `@cera/ui`, which is unaffected.
     */
    dangerouslyAllowSVG: false,
  },

  /**
   * The workspace packages are TypeScript source, not built output. Without transpiling
   * them Next treats them as pre-compiled dependencies and fails on the first `.ts`
   * extension in an import.
   */
  transpilePackages: ['@cera/ui', '@cera/contracts', '@cera/observability'],

  // `x-powered-by: Next.js` names the framework and version to anyone scanning. Free to
  // remove, and one less thing pointing at a known CVE list (PRD 15).
  poweredByHeader: false,

  reactStrictMode: true,

  /**
   * There is deliberately no `eslint` key. Next 16 removed `next lint` and rejects the option,
   * and linting is its own CI job against the whole workspace with one config - which is the
   * arrangement worth keeping anyway, since a build-local rule set is a second configuration
   * nobody maintains.
   */
  typescript: {
    // `pnpm typecheck` is the real gate, because it also covers files the build never imports -
    // tests, config, scripts. Left on here as well: it costs a few seconds and catches a type
    // error in a route that the build would otherwise ship.
    ignoreBuildErrors: false,
  },

  experimental: {
    // Only the icons actually imported are pulled in, rather than the whole set being
    // traced through the barrel file. lucide-react is large enough for this to matter to
    // first-load JS on every route.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
