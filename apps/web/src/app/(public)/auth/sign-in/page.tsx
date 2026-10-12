import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AuthSignInOptions } from '../../../../components/auth-sign-in-options.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { configuredOidcSocialProviders } from '../../../../lib/auth/oidc-social.ts';
import { sessionHasStaffRole } from '../../../../lib/auth/portal-access.ts';
import { isStaffReturnTo, safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Sign In',
    description: 'Sign in to your CERA Medical account to follow your enquiries.',
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
  const socialProviders = staffPortal ? [] : configuredOidcSocialProviders();

  return (
    <AuthPageShell
      title={staffPortal ? 'Staff sign in' : 'Your account'}
      lede={
        staffPortal
          ? 'Use your provisioned CERA work account to access the secure staff workspace.'
          : 'Sign in to follow your enquiries, view eligible orders, and update your contact details.'
      }
      aside={
        staffPortal ? (
          <>
            <Heading level={2} size="h4">
              Customer account?
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-3">
              Staff accounts are created by a CERA administrator. Customer registration and Google
              sign-in are not available for this workspace.
            </Text>
            <div className="mt-6 flex flex-col gap-3">
              <AppLink href="/auth/sign-in?next=/account" className="font-medium">
                Go to customer sign in
              </AppLink>
              <AppLink href="/enquiry" className="text-body-sm text-muted">
                Make an enquiry without an account
              </AppLink>
            </div>
          </>
        ) : (
          <>
            <Heading level={2} size="h4">
              New to CERA?
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-3">
              Create an account to follow enquiries online, or submit a research request without
              signing up.
            </Text>
            <div className="mt-6 flex flex-col gap-3">
              <AppLink
                href={`/auth/sign-up?next=${encodeURIComponent(safeNext)}`}
                className="font-medium"
              >
                Create an account
              </AppLink>
              <AppLink href="/enquiry" className="text-body-sm text-muted">
                Make an enquiry without an account
              </AppLink>
            </div>
          </>
        )
      }
    >
      <AuthPanelIntro
        heading={staffPortal ? 'CERA staff workspace' : 'Welcome back'}
        body={
          staffPortal
            ? 'Use the work account an administrator created for you. Customer accounts cannot open staff records.'
            : 'Customers can use Google or email. CERA never stores your password on this website.'
        }
      />
      <AuthSignInOptions next={safeNext} socialProviders={socialProviders} mode="sign-in" />
    </AuthPageShell>
  );
}
