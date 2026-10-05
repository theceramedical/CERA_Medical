import Image from 'next/image';

import type { OidcSocialProviderId } from '../lib/auth/oidc-social.ts';

const ICONS: Record<OidcSocialProviderId, { src: string; alt: string }> = {
  google: { src: '/icons/google.svg', alt: '' },
  microsoft: { src: '/icons/microsoft.svg', alt: '' },
};

export function AuthProviderIcon({
  provider,
  className,
}: {
  readonly provider: OidcSocialProviderId;
  readonly className?: string;
}) {
  const icon = ICONS[provider];
  return (
    <Image src={icon.src} alt={icon.alt} width={20} height={20} className={className} aria-hidden />
  );
}
