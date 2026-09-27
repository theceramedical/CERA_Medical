import { Alert } from '@cera/ui/alert';
import { StatusBadge } from '@cera/ui/status-badge';
import { Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { getSession } from '../../../lib/auth/session.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your account',
};

export default async function AccountDashboardPage() {
  const session = await getSession();

  return (
    <>
      <PageHeader title="Your account" lede="Your enquiries and their progress, in one place." />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {session === null ? (
          <Alert tone="info" title="Sign in to see your enquiries">
            <Text size="body-sm">
              <AppLink href="/auth/sign-in?next=/account">Sign in</AppLink> with the email you used on
              the enquiry form, then claim any existing references.
            </Text>
          </Alert>
        ) : (
          <div className="flex flex-col gap-6">
            <Text>
              Signed in as {session.email}.{' '}
              <AppLink href="/account/profile">Update your profile</AppLink>
              {' · '}
              <AppLink href="/account/claim">Claim an enquiry</AppLink>
              {' · '}
              <AppLink href="/auth/signout">Sign out</AppLink>
            </Text>
            <StatusBadge status="received" />
            <Text tone="muted">Open enquiries appear here once they are claimed to this account.</Text>
          </div>
        )}
      </div>
    </>
  );
}
