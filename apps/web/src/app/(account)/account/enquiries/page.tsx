import { EmptyState } from '@cera/ui/empty-state';

import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your enquiries' };

export default function AccountEnquiriesPage() {
  return (
    <>
      <PageHeader title="Your enquiries" lede="Every enquiry claimed to this account." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <EmptyState
          heading="No enquiries yet"
          description="When you submit or claim an enquiry it will appear here with a customer-safe status."
          action={<AppLink href="/enquiry">Make an enquiry</AppLink>}
        />
      </div>
    </>
  );
}
