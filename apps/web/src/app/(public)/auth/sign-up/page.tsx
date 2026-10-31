import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AuthSignInOptions } from '../../../../components/auth-sign-in-options.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { configuredOidcSocialProviders } from '../../../../lib/auth/oidc-social.ts';
import { oidcConfigured } from '../../../../lib/auth/oidc.ts';
import { customerReturnTo, safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  const configured = oidcConfigured('customer');

  return pageMetadata({
    title: 'Create account',
    description: configured
      ? 'Create a CERA account using the available secure sign-up option.'
      : 'Customer account registration is being set up. You can contact CERA without an account.',
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
  const safeNext = customerReturnTo(safeReturnTo(next ?? null));
  const session = await getSession();
  if (session !== null) {
    redirect(safeNext);
  }

  const socialProviders = configuredOidcSocialProviders();
  const authConfigured = oidcConfigured('customer');

  return (
    <AuthPageShell
      title="Create account"
      lede={
        authConfigured
          ? 'Register for a CERA account using the available secure sign-up option.'
          : 'Customer account registration is being set up. You can still submit a research request without an account.'
      }
      aside={
        <>
          <Heading level={2} size="h4">
            Already registered?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            {authConfigured
              ? 'Use the secure sign-in option to access your account.'
              : 'Customer account access is being set up. You can submit a research request without an account.'}
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
        heading={authConfigured ? 'Your CERA account' : 'Account registration is not available yet'}
        body={
          authConfigured
            ? 'Continue with the secure sign-up option below. Your identity provider verifies your account.'
            : 'Customer account access will be available here once setup is complete.'
        }
      />
      <AuthSignInOptions
        next={safeNext}
        socialProviders={socialProviders}
        mode="sign-up"
        configured={authConfigured}
      />
      <Text size="body-sm" tone="muted" className="mt-6">
        {authConfigured
          ? 'By continuing, you agree that CERA may contact you about your research requests.'
          : 'When account registration is available, CERA may contact you about your research requests.'}{' '}
        See our <AppLink href="/privacy">privacy notice</AppLink>.
      </Text>
    </AuthPageShell>
  );
}
