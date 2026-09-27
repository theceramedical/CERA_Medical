import { withPayload } from '@payloadcms/next/withPayload';

import type { NextConfig } from 'next';

/**
 * Payload's Next host.
 *
 * `standalone` because Phase 13 ships this as its own container. `withPayload`
 * injects the webpack/turbopack aliases Payload needs (`@payload-config`, the
 * admin bundling). The admin UI is the product of this app; the public site
 * lives in `apps/web` and only talks to this process over HTTP.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@cera/contracts', '@cera/observability'],
  typescript: { ignoreBuildErrors: false },
};

export default withPayload(nextConfig);
