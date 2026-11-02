import { EmptyState } from '@cera/ui/empty-state';
import { InternalStatusBadge } from '@cera/ui/internal-status-badge';
import { Text } from '@cera/ui/typography';

import type { StaffEnquiry } from '@cera/contracts';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { authenticatedApi } from '../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Enquiry queue' };

export default async function StaffQueuePage() {
  const { items } = await authenticatedApi<{ items: StaffEnquiry[] }>('/v1/ops/enquiries', {
    returnTo: '/staff',
  });
  return (
    <>
      <PageHeader title="Enquiry queue" lede="Enquiries received by the team." />
      <div className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:py-16">
        <div className="border-b border-border pb-6">
          <Text tone="muted">Review, assign and progress incoming research requests.</Text>
        </div>
        {items.length === 0 ? (
          <EmptyState
            heading="The enquiry queue is clear"
            headingLevel={2}
            description="New requests will appear here as soon as they are received."
          />
        ) : (
          <ul className="mt-8 grid list-none gap-4 p-0">
            {items.map((enquiry) => (
              <li key={enquiry.id}>
                <AppLink
                  href={`/staff/enquiries/${encodeURIComponent(enquiry.id)}`}
                  className="group block rounded-lg border border-border bg-surface p-6 no-underline transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Text size="caption" tone="muted">
                        {enquiry.reference}
                      </Text>
                      <Text className="mt-1 font-semibold text-copy">{enquiry.name}</Text>
                      <Text size="body-sm" tone="muted" className="mt-1">
                        {enquiry.serviceTitle}
                      </Text>
                      <Text size="caption" tone="muted" className="mt-2">
                        {new Date(enquiry.createdAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {enquiry.ownerDisplayName
                          ? ` · Assigned to ${enquiry.ownerDisplayName}`
                          : ' · Unassigned'}
                      </Text>
                    </div>
                    <InternalStatusBadge status={enquiry.internalStatus} />
                  </div>
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
