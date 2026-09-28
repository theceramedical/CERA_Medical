import { Text } from '@cera/ui/typography';

import type { StaffEnquiry } from '@cera/contracts';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { authenticatedApi } from '../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enquiry queue' };
export default async function StaffQueuePage() {
  const { items } = await authenticatedApi<{ items: StaffEnquiry[] }>('/v1/ops/enquiries');
  return (
    <>
      <PageHeader title="Enquiry queue" lede="Enquiries received by the team." />
      <div className="mx-auto max-w-site px-6 py-12">
        <AppLink href="/staff/deliveries">Integration deliveries</AppLink>
        {items.length === 0 ? (
          <Text>No enquiries to show.</Text>
        ) : (
          <ul>
            {items.map((e) => (
              <li key={e.id} className="mb-6">
                <AppLink href={`/staff/enquiries/${e.id}`}>
                  {e.reference} — {e.name}
                </AppLink>
                <Text>{e.internalStatus}</Text>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
