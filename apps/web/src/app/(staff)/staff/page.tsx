import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { getSession } from '../../../lib/auth/session.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enquiry queue',
};

export default async function StaffQueuePage() {
  const session = await getSession();

  return (
    <>
      <PageHeader title="Enquiry queue" lede="Open enquiries, in the order they arrived." />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {session === null ? (
          <Text>
            <AppLink href="/auth/sign-in?next=/staff">Sign in</AppLink> with a staff account to see
            the queue.
          </Text>
        ) : (
          <EmptyState
            heading="No open enquiries in this view"
            description="Assignment, transitions, and internal notes are taken on each enquiry. Customers never see those notes."
            action={<AppLink href="/staff/deliveries">Integration deliveries</AppLink>}
          />
        )}
      </div>
    </>
  );
}
