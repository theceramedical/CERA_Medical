import { EmptyState } from '@cera/ui/empty-state';
import { InternalStatusBadge } from '@cera/ui/internal-status-badge';
import { Text } from '@cera/ui/typography';
import { ArrowRight, ClipboardList, Send } from 'lucide-react';

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
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-end">
          <Text tone="muted">Review, assign and progress incoming research requests.</Text>
          <AppLink href="/staff/deliveries" className="inline-flex items-center gap-2 font-medium">
            <Send aria-hidden className="size-4" /> Integration deliveries
          </AppLink>
        </div>
        {items.length === 0 ? (
          <EmptyState
            heading="The enquiry queue is clear"
            headingLevel={2}
            description="New requests will appear here as soon as they are received."
            action={<AppLink href="/staff/deliveries">Review delivery activity</AppLink>}
          />
        ) : (
          <ul className="mt-8 grid list-none gap-4 p-0">
            {items.map((e) => (
              <li key={e.id}>
                <AppLink
                  href={`/staff/enquiries/${e.id}`}
                  className="group block rounded-lg border border-border bg-surface p-6 no-underline transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <ClipboardList aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                      <div>
                        <Text size="caption" tone="muted">
                          {e.reference}
                        </Text>
                        <Text className="mt-1 font-semibold text-copy">{e.name}</Text>
                        <Text size="body-sm" tone="muted" className="mt-1">
                          Open request and staff workflow details.
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <InternalStatusBadge status={e.internalStatus} />
                      <ArrowRight
                        aria-hidden
                        className="size-5 text-primary transition-transform group-hover:translate-x-1"
                      />
                    </div>
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
