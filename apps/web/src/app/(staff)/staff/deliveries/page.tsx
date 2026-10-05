import { Alert } from '@cera/ui/alert';
import { Badge } from '@cera/ui/badge';
import { Button } from '@cera/ui/button';
import { Card } from '@cera/ui/card';
import { Text } from '@cera/ui/typography';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';
import { getSession } from '../../../../lib/auth/session.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Integration deliveries' };

interface DeliveryRow {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  attempt: number;
  lastError: string | null;
}

const DELIVERY_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  succeeded: 'success',
  pending: 'info',
  in_flight: 'info',
  failed: 'warning',
  dead_letter: 'danger',
};

async function retryDelivery(form: FormData) {
  'use server';
  const id = form.get('id');
  if (typeof id !== 'string') throw new Error('Missing delivery id');

  const session = await getSession();
  if (session === null || !session.roles.includes('administrator') || !session.mfa) {
    redirect('/staff/deliveries?error=retry_unauthorised');
  }

  try {
    await authenticatedApi(`/v1/ops/deliveries/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
    });
  } catch {
    redirect('/staff/deliveries?error=retry_failed');
  }
  revalidatePath('/staff/deliveries');
}

function deliveryStatusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}

export default async function StaffDeliveriesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  const canRetry = session !== null && session.roles.includes('administrator') && session.mfa;

  const { items } = await authenticatedApi<{ items: DeliveryRow[] }>('/v1/ops/deliveries');

  return (
    <>
      <PageHeader
        title="Integration deliveries"
        lede="Delivery results and failed work awaiting retry."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <AppLink
          href="/staff"
          className="mb-8 inline-flex items-center gap-2 text-body-sm font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to enquiry queue
        </AppLink>

        {error === 'retry_unauthorised' && (
          <Alert tone="warning" title="Retry not available" className="mb-8">
            Replaying a dead-letter delivery requires an administrator account with multi-factor
            authentication enabled for this sign-in.
          </Alert>
        )}
        {error === 'retry_failed' && (
          <Alert tone="danger" title="Retry could not be queued" className="mb-8">
            The delivery may no longer be in dead-letter state, or the worker queue could not be
            updated. Refresh the page and try again.
          </Alert>
        )}

        {items.length === 0 ? (
          <Text tone="muted">No integration deliveries have been recorded yet.</Text>
        ) : (
          <ul className="grid list-none gap-4 p-0">
            {items.map((d) => (
              <li key={d.id}>
                <Card as="article" className="gap-4 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Text size="caption" tone="muted" className="uppercase tracking-wide">
                        {d.provider}
                      </Text>
                      <Text className="mt-1 font-semibold text-copy">{d.eventType}</Text>
                      <Text size="body-sm" tone="muted" className="mt-2">
                        Attempt {d.attempt}
                        {d.lastError ? ` · ${d.lastError}` : null}
                      </Text>
                    </div>
                    <Badge tone={DELIVERY_TONE[d.status] ?? 'neutral'} srPrefix="Delivery status">
                      {deliveryStatusLabel(d.status)}
                    </Badge>
                  </div>
                  {d.status === 'dead_letter' && (
                    <div className="border-t border-border pt-4">
                      {canRetry ? (
                        <form action={retryDelivery} className="flex flex-wrap items-center gap-3">
                          <input type="hidden" name="id" value={d.id} />
                          <Button type="submit" variant="primary" size="sm">
                            <RefreshCw aria-hidden className="size-4" />
                            Retry delivery
                          </Button>
                          <Text size="body-sm" tone="muted">
                            Re-queues the outbox job; the worker will attempt the provider call
                            again.
                          </Text>
                        </form>
                      ) : (
                        <Text size="body-sm" tone="muted">
                          Dead-letter retries are limited to administrators who signed in with MFA.
                          Ask an administrator to replay this delivery.
                        </Text>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
