import {
  internalStatusLabel,
  isTerminalStatus,
  type InternalStatus,
  type StaffEnquiry,
} from '@cera/contracts';
import { Alert } from '@cera/ui/alert';
import { Button } from '@cera/ui/button';
import { Card } from '@cera/ui/card';
import { InternalStatusBadge } from '@cera/ui/internal-status-badge';
import { Text } from '@cera/ui/typography';
import { ArrowLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';

import { AppLink } from '../../../../../components/link.tsx';
import { PageHeader } from '../../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../../lib/auth/api.ts';
import { getSession } from '../../../../../lib/auth/session.ts';

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function consentLine(accepted: boolean): string {
  return accepted ? 'Accepted' : 'Not applicable';
}

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
  const session = await getSession();
  const e = await authenticatedApi<StaffEnquiry & { permittedNext: InternalStatus[] }>(
    `/v1/ops/enquiries/${encodeURIComponent(id)}`,
  );
  const { items: notes } = await authenticatedApi<{ items: string[] }>(
    `/v1/ops/enquiries/${id}/notes`,
  );
  const { items: audit } = await authenticatedApi<{ items: { action: string; at: string }[] }>(
    `/v1/ops/enquiries/${id}/audit`,
  );

  const terminal = isTerminalStatus(e.internalStatus);
  const ownedByMe = session !== null && e.ownerId === session.sub;
  const canAssign = !terminal && !ownedByMe && e.ownerId === null;
  const canReassign = !terminal && !ownedByMe && e.ownerId !== null;
  const action = update.bind(null, id);

  return (
    <>
      <PageHeader title={e.reference} lede={e.serviceTitle} />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <AppLink
          href="/staff"
          className="mb-8 inline-flex items-center gap-2 text-body-sm font-medium no-underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to enquiry queue
        </AppLink>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <div className="flex flex-col gap-8">
            <Card as="section" className="gap-4 p-6" aria-labelledby="contact-heading">
              <h2 id="contact-heading" className="text-h4 text-heading">
                Contact
              </h2>
              <dl className="grid gap-3 text-body-sm">
                <div>
                  <dt className="font-medium text-copy">Name</dt>
                  <dd className="text-copy-muted">{e.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-copy">Email</dt>
                  <dd>
                    <a
                      className="text-primary underline-offset-2 hover:underline"
                      href={`mailto:${e.email}`}
                    >
                      {e.email}
                    </a>
                  </dd>
                </div>
                {e.institution ? (
                  <div>
                    <dt className="font-medium text-copy">Institution</dt>
                    <dd className="text-copy-muted">{e.institution}</dd>
                  </div>
                ) : null}
                {e.country ? (
                  <div>
                    <dt className="font-medium text-copy">Country</dt>
                    <dd className="text-copy-muted">{e.country}</dd>
                  </div>
                ) : null}
                {e.phone ? (
                  <div>
                    <dt className="font-medium text-copy">Phone</dt>
                    <dd className="text-copy-muted">{e.phone}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            <Card as="section" className="gap-4 p-6" aria-labelledby="message-heading">
              <h2 id="message-heading" className="text-h4 text-heading">
                Request
              </h2>
              <Text className="whitespace-pre-wrap text-copy">{e.message}</Text>
            </Card>

            <Card as="section" className="gap-4 p-6" aria-labelledby="consent-heading">
              <h2 id="consent-heading" className="text-h4 text-heading">
                Consent evidence
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-body-sm text-copy-muted">
                <li>
                  Service request: accepted {formatDateTime(e.consentAt)} ({e.consentVersion})
                </li>
                <li>
                  Sequencing data and sample metadata:{' '}
                  {consentLine(e.sequencingDataConsent ?? false)}
                </li>
                <li>
                  Samples and test compounds: {consentLine(e.samplesCompoundsConsent ?? false)}
                </li>
                <li>
                  Health, clinical and programme data: {consentLine(e.healthDataConsent ?? false)}
                </li>
                <li>Service updates: {e.updatesOptIn ? 'Opted in' : 'Not opted in'}</li>
              </ul>
            </Card>
          </div>

          <aside className="flex flex-col gap-6">
            <Card as="section" className="gap-5 p-6" aria-labelledby="workflow-heading">
              <div className="flex flex-col gap-3">
                <h2 id="workflow-heading" className="text-h4 text-heading">
                  Workflow
                </h2>
                <InternalStatusBadge status={e.internalStatus} />
              </div>

              {terminal ? (
                <Alert tone="info" title="This enquiry is closed">
                  Status changes and assignment are not available for{' '}
                  {internalStatusLabel(e.internalStatus).toLowerCase()} enquiries. You can still add
                  internal notes below.
                </Alert>
              ) : (
                <>
                  <Text size="body-sm" tone="muted">
                    {ownedByMe
                      ? 'You are the owner of this enquiry.'
                      : e.ownerId
                        ? `Assigned to ${e.ownerDisplayName ?? 'another team member'}.`
                        : 'Not yet assigned.'}
                  </Text>
                  {(canAssign || canReassign) && (
                    <form action={action}>
                      <Button
                        name="action"
                        value="assign"
                        type="submit"
                        variant="primary"
                        fullWidth
                      >
                        {canReassign ? 'Take over assignment' : 'Assign to me'}
                      </Button>
                    </form>
                  )}
                  {e.permittedNext.length > 0 && (
                    <form action={action} className="flex flex-col gap-3">
                      <label className="text-body-sm font-medium text-copy" htmlFor="status">
                        Move to
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-copy"
                        defaultValue={e.permittedNext[0]}
                      >
                        {e.permittedNext.map((s) => (
                          <option key={s} value={s}>
                            {internalStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                      <Button name="action" value="transition" type="submit" variant="outline">
                        Update status
                      </Button>
                    </form>
                  )}
                </>
              )}
            </Card>

            <Card as="section" className="gap-4 p-6" aria-labelledby="notes-form-heading">
              <h2 id="notes-form-heading" className="text-h4 text-heading">
                Internal note
              </h2>
              <form action={action} className="flex flex-col gap-3">
                <label className="sr-only" htmlFor="note">
                  Note body
                </label>
                <textarea
                  id="note"
                  name="body"
                  required
                  maxLength={4000}
                  rows={4}
                  className="resize-y rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-copy"
                  placeholder="Visible to staff only — not shown to the customer."
                />
                <Button name="action" value="note" type="submit" variant="outline">
                  Add note
                </Button>
              </form>
            </Card>
          </aside>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card as="section" className="gap-4 p-6" aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="text-h4 text-heading">
              Internal notes
            </h2>
            {notes.length === 0 ? (
              <Text tone="muted" size="body-sm">
                No internal notes yet.
              </Text>
            ) : (
              <ul className="list-none space-y-3 p-0">
                {notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-md border border-border bg-surface-subtle px-4 py-3 text-body-sm whitespace-pre-wrap text-copy"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" className="gap-4 p-6" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="text-h4 text-heading">
              Audit history
            </h2>
            <ul className="list-none space-y-2 p-0 text-body-sm">
              {audit.map((event) => (
                <li
                  key={`${event.action}-${event.at}`}
                  className="flex flex-col gap-0.5 sm:flex-row sm:gap-3"
                >
                  <span className="font-medium text-copy">{event.action}</span>
                  <span className="text-copy-muted">{formatDateTime(event.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
