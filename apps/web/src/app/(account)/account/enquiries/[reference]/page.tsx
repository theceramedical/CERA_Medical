import { Timeline, TimelineItem } from '@cera/ui/timeline';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../../../components/page-header.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enquiry detail' };

export default async function AccountEnquiryDetailPage({
  params,
}: {
  readonly params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return (
    <>
      <PageHeader title={reference} lede="Progress on this enquiry, without internal notes or staff statuses." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Text tone="muted">If this reference is not linked to your account, it will not be shown.</Text>
        <div className="mt-8">
          <Timeline>
            <TimelineItem dateTime="2026-01-05T09:00:00.000Z" dateLabel="5 January 2026" title="Enquiry received" isLast />
          </Timeline>
        </div>
      </div>
    </>
  );
}
