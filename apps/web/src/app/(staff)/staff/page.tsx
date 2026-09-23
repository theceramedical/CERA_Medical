import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';

import type { Metadata } from 'next';

/**
 * The staff queue. Phase 12 builds it.
 *
 * Present for the same reason as the portal dashboard: the route has to exist for the proxy's redirect
 * to be observable rather than masked by a 404.
 */

export const metadata: Metadata = {
  title: 'Enquiry queue',
};

export default function StaffQueuePage() {
  return (
    <>
      <PageHeader title="Enquiry queue" lede="Open enquiries, in the order they arrived." />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Alert tone="info" title="This page is not finished yet">
          <Text size="body-sm">
            Phase 12 builds the queue, assignment, status transitions, internal notes, and the audit
            history. Phase 09 supplies the role checks that decide what each staff member can see.
          </Text>
        </Alert>
      </div>
    </>
  );
}
