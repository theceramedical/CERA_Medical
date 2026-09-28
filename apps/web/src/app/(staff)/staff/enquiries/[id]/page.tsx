import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { revalidatePath } from 'next/cache';

import type { InternalStatus, StaffEnquiry } from '@cera/contracts';

import { PageHeader } from '../../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../../lib/auth/api.ts';

async function update(id: string, form: FormData) {
  'use server';
  const action = form.get('action');
  if (action === 'assign')
    await authenticatedApi(`/v1/ops/enquiries/${id}/assign`, { method: 'PATCH', body: {} });
  if (action === 'transition')
    await authenticatedApi(`/v1/ops/enquiries/${id}/transition`, {
      method: 'POST',
      body: { status: form.get('status') },
    });
  if (action === 'note')
    await authenticatedApi(`/v1/ops/enquiries/${id}/notes`, {
      method: 'POST',
      body: { body: form.get('body') },
    });
  revalidatePath(`/staff/enquiries/${id}`);
  revalidatePath('/staff');
}
export default async function StaffEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await authenticatedApi<StaffEnquiry & { permittedNext: InternalStatus[] }>(
    `/v1/ops/enquiries/${encodeURIComponent(id)}`,
  );
  const { items: notes } = await authenticatedApi<{ items: string[] }>(
    `/v1/ops/enquiries/${id}/notes`,
  );
  const { items: audit } = await authenticatedApi<{ items: { action: string; at: string }[] }>(
    `/v1/ops/enquiries/${id}/audit`,
  );
  const action = update.bind(null, id);
  return (
    <>
      <PageHeader title={e.reference} lede={e.serviceTitle} />
      <div className="mx-auto max-w-site px-6 py-12">
        <Text>
          {e.name} — {e.email}
        </Text>
        <Text>{e.message}</Text>
        <Text>Status: {e.internalStatus}</Text>
        <form action={action}>
          <Button name="action" value="assign" type="submit">
            Assign to me
          </Button>
        </form>
        {e.permittedNext.length > 0 && (
          <form action={action}>
            <label htmlFor="status">Next status</label>
            <select id="status" name="status">
              {e.permittedNext.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Button name="action" value="transition" type="submit">
              Update status
            </Button>
          </form>
        )}
        <form action={action}>
          <label htmlFor="note">Internal note</label>
          <textarea id="note" name="body" required maxLength={4000} />
          <Button name="action" value="note" type="submit">
            Add note
          </Button>
        </form>
        <h2>Internal notes</h2>
        <ul>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <h2>Audit history</h2>
        <ul>
          {audit.map((event) => (
            <li key={`${event.action}-${event.at}`}>
              {event.action} — {event.at}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
