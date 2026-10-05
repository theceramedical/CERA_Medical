import type { OidcSocialProviderId } from './oidc-social.ts';

/** Full-page navigation to `/auth/signin` on the current origin (avoids CSP / RSC issues). */
export function startOidcNavigation(next: string, provider?: OidcSocialProviderId): void {
  const target = new URL('/auth/signin', window.location.origin);
  if (next.length > 0 && next !== '/') target.searchParams.set('next', next);
  if (provider !== undefined) target.searchParams.set('provider', provider);
  window.location.assign(target);
}
