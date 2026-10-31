import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AuthSignInOptions } from '../../../../components/auth-sign-in-options.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { configuredOidcSocialProviders } from '../../../../lib/auth/oidc-social.ts';
import { oidcConfigured } from '../../../../lib/auth/oidc.ts';
import { sessionHasStaffRole } from '../../../../lib/auth/portal-access.ts';
import { isStaffReturnTo, safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  const configured = oidcConfigured('customer');

  return pageMetadata({
    title: 'Sign In',
    description: configured
      ? 'Sign in to your CERA account using the available secure sign-in option.'
      : 'Customer account sign-in is being set up. You can contact CERA without an account.',
    path: '/auth/sign-in',
    noIndex: true,
  });
}

export default async function SignInPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string; staff?: string }>;
}) {
  const { next, staff } = await searchParams;
  const safeNext = safeReturnTo(next ?? null);
  const session = await getSession();
  if (session !== null) {
    redirect(
      sessionHasStaffRole(session) && !session.roles.includes('customer') ? '/staff' : safeNext,
    );
  }

  const staffPortal = staff === '1' || staff === 'true' || isStaffReturnTo(safeNext);
  if (staffPortal) {
    redirect(`/staff/sign-in?next=${encodeURIComponent(safeNext)}`);
  }
  const socialProviders = configuredOidcSocialProviders();
  const authConfigured = oidcConfigured('customer');

  return (
    <AuthPageShell
      title="Your account"
      lede={
        authConfigured
          ? 'Sign in to your CERA account using the available secure sign-in option.'
          : 'Customer account sign-in is being set up. You can still send an enquiry without an account.'
      }
      aside={
        <>
          <Heading level={2} size="h4">
            New to CERA?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            {authConfigured
              ? 'Create a customer account using the secure sign-up option, or submit a research request without an account.'
              : 'Account registration is being set up. You can submit a research request without an account.'}
          </Text>
          <div className="mt-6 flex flex-col gap-3">
            <AppLink
              href={`/auth/sign-up?next=${encodeURIComponent(safeNext)}`}
              className="font-medium"
            >
              {authConfigured ? 'Create an account' : 'Account registration status'}
            </AppLink>
            <AppLink href="/enquiry" className="text-body-sm text-muted">
              Make an enquiry without an account
            </AppLink>
          </div>
        </>
      }
    >
      <AuthPanelIntro
        heading={authConfigured ? 'Welcome back' : 'Customer sign-in is not available yet'}
        body={
          authConfigured
            ? 'Continue with the secure sign-in option below. Your identity provider verifies your account.'
            : 'CERA does not store passwords on this website.'
        }
      />
      <AuthSignInOptions
        next={safeNext}
        socialProviders={socialProviders}
        mode="sign-in"
        configured={authConfigured}
      />
    </AuthPageShell>
  );
}
