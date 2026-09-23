import type { NextConfig } from 'next';

/**
 * Next.js configuration for the public site.
 *
 * `standalone` output because Phase 13 ships this as a container behind Caddy. It bundles
 * only the traced dependencies into `.next/standalone`, so the image does not carry a full
 * `node_modules` - the difference is several hundred megabytes per deploy.
 */
const nextConfig: NextConfig = {
  output: 'standalone',

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
