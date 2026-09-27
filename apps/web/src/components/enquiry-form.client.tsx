'use client';

import { Button } from '@cera/ui/button';
import { Checkbox } from '@cera/ui/choice';
import { Field } from '@cera/ui/field';
import { Input, Select, Textarea } from '@cera/ui/input';
import { Heading, Text } from '@cera/ui/typography';
import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { submitEnquiryAction, type EnquiryFormState } from '../lib/enquiry/actions.ts';

export const ENQUIRABLE_SERVICES = [
  { slug: 'general-health', title: 'General Health' },
  { slug: 'cardiology', title: 'Cardiology' },
  { slug: 'orthopaedics', title: 'Orthopaedics' },
  { slug: 'womens-health', title: "Women's Health" },
  { slug: 'wellness-preventive-care', title: 'Wellness & Preventive Care' },
] as const;

const INITIAL: EnquiryFormState = { status: 'idle' };

export interface EnquiryFormProps {
  readonly startedAt: string;
  readonly defaultServiceId?: string;
  readonly source?: 'web_service_page' | 'web_contact_page' | 'web_general';
  readonly serviceLocked?: boolean;
}

export function EnquiryForm({
  startedAt,
  defaultServiceId,
  source = 'web_general',
  serviceLocked = false,
}: EnquiryFormProps) {
  const [state, action, pending] = useActionState(submitEnquiryAction, INITIAL);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const summaryRef = useRef<HTMLDivElement>(null);
  const summaryId = useId();

  useEffect(() => {
    if (state.status === 'error') {
      summaryRef.current?.focus();
    }
  }, [state]);

  if (state.status === 'success') {
    return <EnquiryConfirmation reference={state.reference} />;
  }

  const values = state.status === 'error' ? state.values : undefined;
  const errorFor = (path: string) =>
    state.status === 'error' ? state.fieldErrors.find((error) => error.path === path)?.message : undefined;

  return (
    <form action={action} className="flex max-w-measure flex-col gap-6" noValidate>
      {state.status === 'error' ? (
        <div
          ref={summaryRef}
          id={summaryId}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-danger-500 bg-surface px-4 py-3"
        >
          <Text size="body-sm">{state.message}</Text>
          {state.fieldErrors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {state.fieldErrors.map((error) => (
                <li key={error.path}>
                  <a href={`#enquiry-${error.path}`} className="text-primary underline">
                    {error.message}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {state.retryable ? (
            <Text size="caption" tone="muted" className="mt-2">
              You can submit the same details again.
            </Text>
          ) : null}
        </div>
      ) : null}

      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <Field label="Name" required error={errorFor('name')} id="enquiry-name">
        <Input name="name" autoComplete="name" defaultValue={values?.name ?? ''} />
      </Field>
      <Field label="Email" required error={errorFor('email')} id="enquiry-email">
        <Input name="email" type="email" autoComplete="email" defaultValue={values?.email ?? ''} />
      </Field>
      <Field label="Phone" error={errorFor('phone')} id="enquiry-phone">
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={values?.phone ?? ''} />
      </Field>
      <Field
        label="Service"
        required
        error={errorFor('serviceId')}
        id="enquiry-serviceId"
        hint={serviceLocked ? 'This enquiry is for the service you were reading about.' : undefined}
      >
        <Select
          name="serviceId"
          defaultValue={values?.serviceId ?? defaultServiceId ?? ENQUIRABLE_SERVICES[0].slug}
          disabled={serviceLocked}
        >
          {ENQUIRABLE_SERVICES.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.title}
            </option>
          ))}
        </Select>
      </Field>
      {serviceLocked && defaultServiceId !== undefined ? (
        <input type="hidden" name="serviceId" value={defaultServiceId} />
      ) : null}
      <Field
        label="Message"
        required
        hint="Do not include symptoms, conditions, test results, or other clinical information."
        error={errorFor('message')}
        id="enquiry-message"
      >
        <Textarea name="message" rows={6} defaultValue={values?.message ?? ''} />
      </Field>

      <Checkbox
        name="consent"
        required
        error={errorFor('consent')}
        label="I agree to be contacted by CERA Medical about this enquiry, including by email, and I understand my details will be used only to handle this request."
      />

      <div aria-hidden="true" className="hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button type="submit" variant="primary" loading={pending}>
        Submit enquiry
      </Button>
    </form>
  );
}

function EnquiryConfirmation({ reference }: { readonly reference: string }) {
  return (
    <div role="status" className="flex max-w-measure flex-col gap-4">
      <Heading level={2} size="h3">
        Enquiry received
      </Heading>
      <Text>
        Your reference is{' '}
        <strong className="font-semibold tracking-wide" data-testid="enquiry-reference">
          {reference}
        </strong>
        . Quote it if you contact us, and keep a copy for your records.
      </Text>
      <Text tone="muted">
        We will email a confirmation shortly. Create an account with the same email to follow
        progress and claim this enquiry.
      </Text>
    </div>
  );
}
