import type { OidcSocialProviderId } from './oidc-social.ts';

export interface EmailInboxLink {
  readonly href: string;
  readonly label: string;
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase();
}

/** Common webmail entry points so customers can check verification messages in their inbox. */
export function emailInboxLink(email: string): EmailInboxLink | null {
  const domain = emailDomain(email);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { href: 'https://mail.google.com/', label: 'Open Gmail' };
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    return { href: 'https://outlook.live.com/mail/', label: 'Open Outlook' };
  }
  if (domain === 'yahoo.com' || domain === 'ymail.com') {
    return { href: 'https://mail.yahoo.com/', label: 'Open Yahoo Mail' };
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return { href: 'https://www.icloud.com/mail', label: 'Open iCloud Mail' };
  }
  return null;
}

export function googleAccountEmailSettingsUrl(): string {
  return 'https://myaccount.google.com/email';
}

/** Best-effort match between inbox domain and the CERA social sign-in button to use for refresh. */
export function suggestedOidcProviderForEmail(email: string): OidcSocialProviderId | null {
  const domain = emailDomain(email);
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'google';
  if (
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'live.com' ||
    domain.endsWith('.onmicrosoft.com')
  ) {
    return 'microsoft';
  }
  return null;
}

/** Forces a fresh OIDC login so Authentik re-reads `email_verified` from the identity provider. */
export function buildEmailVerificationSignInHref(
  returnTo: string,
  provider: OidcSocialProviderId | null,
): string {
  const params = new URLSearchParams({
    next: returnTo,
    refresh: '1',
  });
  if (provider !== null) params.set('provider', provider);
  return `/auth/signin?${params.toString()}`;
}
