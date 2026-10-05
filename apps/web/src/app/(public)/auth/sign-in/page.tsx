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
    redirect(safeNext);
  }

  const staffPortal =
    staff === '1' || staff === 'true' || safeNext === '/staff' || safeNext.startsWith('/staff/');
  const socialProviders = staffPortal ? [] : configuredOidcSocialProviders();

  return (
    <AuthPageShell
      title="Sign in"
      lede="Access your enquiries, orders, and profile. Authentication is handled by CERA's secure identity service."
      aside={
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
      }
    >
      <AuthPanelIntro
        heading="Welcome back"
        body={
          staffPortal
            ? 'Staff sign-in uses your @ceramedical.org email and password. Multi-factor authentication is required.'
            : 'Customers can use Google or email. Staff should use email and password (open sign-in from the staff console link).'
        }
      />
      <AuthSignInOptions next={safeNext} socialProviders={socialProviders} mode="sign-in" />
    </AuthPageShell>
  );
}
