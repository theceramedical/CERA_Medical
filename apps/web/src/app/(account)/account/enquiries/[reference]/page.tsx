import { Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import type { CustomerEnquiry } from '@cera/contracts';

import { PageHeader } from '../../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enquiry detail' };
export default async function AccountEnquiryDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  let e: CustomerEnquiry;
  try {
    e = await authenticatedApi<CustomerEnquiry>(
      `/v1/me/enquiries/${encodeURIComponent(reference)}`,
      { returnTo: `/account/enquiries/${encodeURIComponent(reference)}` },
    );
  } catch {
    notFound();
  }
  return (
    <>
      <PageHeader title={e.reference} lede={e.serviceTitle} />
      <div className="mx-auto max-w-site px-6 py-12">
        <Text>Status: {e.status}</Text>
        <ul>
          {e.timeline.map((event) => (
            <li key={`${event.status}-${event.at}`}>
              <Text>
                {event.status} — {event.at}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
