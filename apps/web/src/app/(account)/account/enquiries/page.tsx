import { StatusBadge } from '@cera/ui/status-badge';
import { Text } from '@cera/ui/typography';

import type { CustomerEnquiry } from '@cera/contracts';

import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your enquiries' };
export default async function AccountEnquiriesPage() {
  const { items } = await authenticatedApi<{ items: CustomerEnquiry[] }>('/v1/me/enquiries');
  return (
    <>
      <PageHeader title="Your enquiries" lede="Every enquiry claimed to this account." />
      <div className="mx-auto max-w-site px-6 py-12">
        {items.length === 0 ? (
          <Text>
            No enquiries yet. <AppLink href="/account/claim">Claim an existing enquiry</AppLink>
          </Text>
        ) : (
          <ul>
            {items.map((e) => (
              <li key={e.reference} className="mb-6">
                <AppLink href={`/account/enquiries/${e.reference}`}>
                  {e.reference} — {e.serviceTitle}
                </AppLink>{' '}
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
