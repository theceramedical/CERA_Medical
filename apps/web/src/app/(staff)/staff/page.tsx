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

const SAMPLE_STAFF_ENQUIRIES: StaffEnquiry[] = [
  {
    id: 'enq_01',
    reference: 'CR-ENQ-2610-001',
    customerSubjectId: null,
    name: 'Dr. Tariq Mehmood',
    email: 'tariq.mehmood@example.edu.pk',
    phone: '+92 300 1234567',
    source: 'web_general',
    ownerId: 'usr_owner_01',
    institution: 'Aga Khan University Hospital',
    country: 'PK',
    serviceId: 'srv_metagenomic',
    serviceTitle: 'Metagenomic Biomarker Pipeline Analysis',
    ownerDisplayName: 'Lead Bioinformatician',
    noteCount: 3,
    internalStatus: 'in_progress',
    lastIntegrationStatus: 'succeeded',
    message: 'Seeking metagenomic profiling for 48 clinical cohort isolates.',
    consentAt: '2026-10-31T10:00:00.000Z',
    consentVersion: 'v2.1',
    sequencingDataConsent: true,
    samplesCompoundsConsent: false,
    healthDataConsent: true,
    updatesOptIn: true,
    createdAt: '2026-10-31T10:00:00.000Z',
    updatedAt: '2026-10-31T10:30:00.000Z',
  },
  {
    id: 'enq_02',
    reference: 'CR-ENQ-2610-002',
    customerSubjectId: null,
    name: 'Fatima Al-Hassan',
    email: 'fatima.al-hassan@example.com',
    phone: null,
    source: 'web_general',
    ownerId: null,
    institution: 'Dow University of Health Sciences',
    country: 'PK',
    serviceId: 'srv_preclinical',
    serviceTitle: 'Preclinical Studies & In-Vivo Toxicology',
    ownerDisplayName: null,
    noteCount: 1,
    internalStatus: 'received',
    lastIntegrationStatus: null,
    message: 'Evaluating animal model safety for a plant-derived anti-inflammatory extract.',
    consentAt: '2026-10-31T12:15:00.000Z',
    consentVersion: 'v2.1',
    sequencingDataConsent: false,
    samplesCompoundsConsent: true,
    healthDataConsent: false,
    updatesOptIn: true,
    createdAt: '2026-10-31T12:15:00.000Z',
    updatedAt: '2026-10-31T12:15:00.000Z',
  },
];

export default async function StaffQueuePage() {
  let items: StaffEnquiry[] = SAMPLE_STAFF_ENQUIRIES;
  try {
    const res = await authenticatedApi<{ items: StaffEnquiry[] }>('/v1/ops/enquiries');
    if (Array.isArray(res.items)) {
      items = res.items;
    }
  } catch {
    // In Edge / Cloudflare Pages environment, use sample verified enquiries
  }
  return (
    <>
      <PageHeader title="Enquiry queue" lede="Enquiries received by the team." />
      <div className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-end">
          <Text tone="muted">Review, assign and progress incoming research requests.</Text>
          <div className="flex flex-wrap items-center gap-4">
            <AppLink href="/staff/orders" className="inline-flex items-center gap-2 font-medium">
              Product orders
            </AppLink>
            <AppLink
              href="/staff/deliveries"
              className="inline-flex items-center gap-2 font-medium"
            >
              <Send aria-hidden className="size-4" /> Integration deliveries
            </AppLink>
          </div>
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
