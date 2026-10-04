import { EmptyState } from '@cera/ui/empty-state';
import { StatusBadge } from '@cera/ui/status-badge';
import { Text } from '@cera/ui/typography';
import { ArrowRight, FileText, Plus } from 'lucide-react';

import type { CustomerEnquiry } from '@cera/contracts';

import { AppLink, AppButtonLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your enquiries' };
export default async function AccountEnquiriesPage() {
  const { items: rawItems } = await authenticatedApi<{ items: CustomerEnquiry[] }>(
    '/v1/me/enquiries',
    {
      returnTo: '/account/enquiries',
    },
  );
  const items = Array.isArray(rawItems) ? rawItems : [];
  return (
    <>
      <PageHeader title="Your enquiries" lede="Every enquiry claimed to this account." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No enquiries in your account yet"
            headingLevel={2}
            description="Submit a new request or claim an enquiry sent from this email address."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <AppButtonLink href="/enquiry" variant="primary" iconStart={<Plus aria-hidden />}>
                  Make an enquiry
                </AppButtonLink>
                <AppButtonLink href="/account/claim" variant="outline">
                  Claim an enquiry
                </AppButtonLink>
              </div>
            }
          />
        ) : (
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <Text tone="muted">
                {items.length} {items.length === 1 ? 'enquiry' : 'enquiries'} linked to this
                account.
              </Text>
              <AppButtonLink href="/enquiry" variant="primary" size="sm">
                Make an enquiry
              </AppButtonLink>
            </div>
            <ul className="mt-8 grid list-none gap-4 p-0">
              {items.map((e) => (
                <li key={e.reference}>
                  <AppLink
                    href={`/account/enquiries/${e.reference}`}
                    className="group block rounded-lg border border-border bg-surface p-6 no-underline transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <FileText aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                        <div>
                          <Text as="span" size="caption" tone="muted" className="block">
                            Reference {e.reference}
                          </Text>
                          <Text as="span" className="mt-1 block font-semibold text-copy">
                            {e.serviceTitle}
                          </Text>
                          <Text as="span" size="body-sm" tone="muted" className="mt-1 block">
                            View the enquiry details and its current progress.
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={e.status} />
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
          </div>
        )}
      </div>
    </>
  );
}
