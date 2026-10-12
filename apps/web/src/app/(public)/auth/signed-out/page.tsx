import { Heading, Text } from '@cera/ui/typography';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AppButtonLink, AppLink } from '../../../../components/link.tsx';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Signed out',
    description: 'You have been securely signed out of your CERA Medical account.',
    path: '/auth/signed-out',
    noIndex: true,
  });
}

export default async function SignedOutPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ audience?: string }>;
}) {
  const { audience } = await searchParams;
  const staff = audience === 'staff';
  return (
    <AuthPageShell
      title="You are signed out"
      lede={
        staff
          ? 'Your CERA Medical staff session has ended on this device.'
          : 'Your CERA Medical account session has ended on this device.'
      }
      aside={
        <>
          <Heading level={2} size="h4">
            Need to return?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            CERA keeps authentication on its secure identity service. Your password was not stored
            by this website.
          </Text>
          <AppLink href="/" className="mt-6 inline-block font-medium">
            Return to CERA Medical
          </AppLink>
        </>
      }
    >
      <AuthPanelIntro
        heading="Session closed securely"
        body="If you shared this device, close the browser window. You can start a new session whenever you are ready."
      />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <AppButtonLink href={staff ? '/staff/sign-in' : '/auth/sign-in'} variant="primary">
          {staff ? 'Sign in to staff console' : 'Sign in again'}
        </AppButtonLink>
        <AppButtonLink href="/" variant="outline">
          Back to website
        </AppButtonLink>
      </div>
    </AuthPageShell>
  );
}
