import { EmptyState } from '@cera/ui/empty-state';

import { PageHeader } from '../../../../components/page-header.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Integration deliveries' };

export default function StaffDeliveriesPage() {
  return (
    <>
      <PageHeader title="Integration deliveries" lede="Zoho and Resend deliveries, including the dead letter queue." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <EmptyState
          heading="No deliveries to show"
          description="Failed deliveries stay visible here. Retrying uses the same idempotency key."
        />
      </div>
    </>
  );
}
