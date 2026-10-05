import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AuthSignInOptions } from '../../../../components/auth-sign-in-options.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { configuredOidcSocialProviders } from '../../../../lib/auth/oidc-social.ts';
import { safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Create account',
    description: 'Create a CERA Medical account to follow your enquiries and manage your profile.',
    path: '/auth/sign-up',
    noIndex: true,
  });
}

export default async function SignUpPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeReturnTo(next ?? null);
  const session = await getSession();
  if (session !== null) {
    redirect(safeNext);
  }

  const socialProviders = configuredOidcSocialProviders();

  return (
    <AuthPageShell
      title="Create account"
      lede="Register once to track enquiries, claim secure links, and update your contact details."
      aside={
        <>
          <Heading level={2} size="h4">
            Already registered?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            Use the same email you gave when you submitted an enquiry.
          </Text>
          <AppLink
            href={`/auth/sign-in?next=${encodeURIComponent(safeNext)}`}
            className="mt-6 inline-block font-medium"
          >
            Sign in instead
          </AppLink>
        </>
      }
    >
      <AuthPanelIntro
        heading="Your CERA account"
        body="Customers can register with Google or email. Staff accounts are created by an administrator in Authentik, not via this page."
      />
      <AuthSignInOptions next={safeNext} socialProviders={socialProviders} mode="sign-up" />
      <Text size="body-sm" tone="muted" className="mt-6">
        By continuing you agree that CERA may contact you about your research requests. See our{' '}
        <AppLink href="/privacy">privacy notice</AppLink>.
      </Text>
    </AuthPageShell>
  );
}
