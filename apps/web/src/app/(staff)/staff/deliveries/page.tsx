import { Button } from '@cera/ui/button';
import { revalidatePath } from 'next/cache';

import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Integration deliveries' };
async function retry(form: FormData) {
  'use server';
  const id = form.get('id');
  if (typeof id !== 'string') throw new Error('Missing delivery id');
  await authenticatedApi(`/v1/ops/deliveries/${encodeURIComponent(id)}/retry`, { method: 'POST' });
  revalidatePath('/staff/deliveries');
}
export default async function StaffDeliveriesPage() {
  const { items } = await authenticatedApi<{
    items: {
      id: string;
      provider: string;
      eventType: string;
      status: string;
      attempt: number;
      lastError: string | null;
    }[];
  }>('/v1/ops/deliveries');
  return (
    <>
      <PageHeader
        title="Integration deliveries"
        lede="Delivery results and failed work awaiting retry."
      />
      <div className="mx-auto max-w-site px-6 py-12">
        <ul>
          {items.map((d) => (
            <li key={d.id} className="mb-6">
              {d.provider} — {d.eventType}: {d.status} (attempt {d.attempt}) {d.lastError}
              {d.status === 'dead_letter' && (
                <form action={retry}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit">Retry delivery</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
