import { Text } from '@cera/ui/typography';
import { ExternalLink, Mail, RefreshCw } from 'lucide-react';

import {
  buildEmailVerificationSignInHref,
  emailInboxLink,
  googleAccountEmailSettingsUrl,
  suggestedOidcProviderForEmail,
} from '../lib/auth/email-verification-help.ts';
import { configuredOidcSocialProviders } from '../lib/auth/oidc-social.ts';

import { AppButtonLink, AppLink } from './link.tsx';

export function VerifyEmailGuidance({
  email,
  returnTo = '/account',
}: {
  readonly email: string;
  readonly returnTo?: string;
}) {
  const inbox = emailInboxLink(email);
  const suggested = suggestedOidcProviderForEmail(email);
  const social = configuredOidcSocialProviders();
  const refreshProvider =
    suggested !== null && social.some((entry) => entry.id === suggested) ? suggested : null;
  const refreshHref = buildEmailVerificationSignInHref(returnTo, refreshProvider);
  const refreshLabel =
    refreshProvider === 'google'
      ? 'Sign in again with Google'
      : refreshProvider === 'microsoft'
        ? 'Sign in again with Microsoft'
        : 'Sign in again to refresh verification';

  const isGoogleMailbox =
    suggested === 'google' ||
    email.toLowerCase().endsWith('@gmail.com') ||
    email.toLowerCase().endsWith('@googlemail.com');

  return (
    <div className="flex flex-col gap-4">
      <Text size="body-sm">
        CERA needs a <strong className="font-semibold text-foreground">verified</strong> address for
        enquiries and orders: <span className="font-medium text-foreground">{email}</span>
      </Text>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Open your email (Gmail, Outlook, or your company inbox) and confirm you can read messages
          sent to this address.
        </li>
        {isGoogleMailbox ? (
          <li>
            In{' '}
            <AppLink href={googleAccountEmailSettingsUrl()} external className="font-medium">
              Google Account → Email
            </AppLink>
            , confirm this address shows as verified.
          </li>
        ) : (
          <li>Complete any verification email from your sign-in provider, if you received one.</li>
        )}
        <li>Return here and sign in again so CERA picks up the updated verification status.</li>
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {inbox !== null ? (
          <AppButtonLink
            href={inbox.href}
            variant="outline"
            size="sm"
            iconStart={<Mail aria-hidden className="size-4" />}
          >
            {inbox.label}
          </AppButtonLink>
        ) : null}
        {isGoogleMailbox ? (
          <AppButtonLink
            href={googleAccountEmailSettingsUrl()}
            variant="outline"
            size="sm"
            iconStart={<ExternalLink aria-hidden className="size-4" />}
          >
            Google email settings
          </AppButtonLink>
        ) : null}
        <AppButtonLink
          href={refreshHref}
          variant="primary"
          size="sm"
          iconStart={<RefreshCw aria-hidden className="size-4" />}
        >
          {refreshLabel}
        </AppButtonLink>
      </div>
      <Text size="body-sm" tone="muted">
        Email/password sign-in? Use the same address on the sign-in page and complete verification
        in the CERA sign-in screen if prompted.
      </Text>
    </div>
  );
}
