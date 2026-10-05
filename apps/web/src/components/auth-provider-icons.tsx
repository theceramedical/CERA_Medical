import type { OidcSocialProviderId } from '../lib/auth/oidc-social.ts';

const ICONS: Record<OidcSocialProviderId, string> = {
  google: '/icons/google.svg',
  microsoft: '/icons/microsoft.svg',
};

export function AuthProviderIcon({
  provider,
  className,
}: {
  readonly provider: OidcSocialProviderId;
  readonly className?: string;
}) {
  return (
    <img src={ICONS[provider]} alt="" width={20} height={20} className={className} aria-hidden />
  );
}
