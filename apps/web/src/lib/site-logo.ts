import { CERA_LOGO_LOCKUP_SRC } from '@cera/ui/wordmark';

import { publicizeCmsMediaUrl } from './cms/media-url.ts';

/** Resolve populated Payload uploads; missing/deleted media retains the bundled brand. */
export function siteLogoSrc(settings: Record<string, unknown> | null): string {
  const logo = settings?.logo;
  if (typeof logo !== 'object' || logo === null || !('url' in logo)) return CERA_LOGO_LOCKUP_SRC;
  if (typeof logo.url !== 'string' || !logo.url.trim()) return CERA_LOGO_LOCKUP_SRC;
  try {
    const absolute = new URL(logo.url, process.env.CMS_URL ?? 'http://localhost:3001');
    if (!['https:', 'http:'].includes(absolute.protocol)) return CERA_LOGO_LOCKUP_SRC;
    return publicizeCmsMediaUrl(absolute.href) ?? CERA_LOGO_LOCKUP_SRC;
  } catch {
    return CERA_LOGO_LOCKUP_SRC;
  }
}
