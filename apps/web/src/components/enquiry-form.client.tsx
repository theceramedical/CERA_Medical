'use client';

import { Button } from '@cera/ui/button';
import { Checkbox } from '@cera/ui/choice';
import { Field } from '@cera/ui/field';
import { Input, Select, Textarea } from '@cera/ui/input';
import { Heading, Text } from '@cera/ui/typography';
import { useActionState, useEffect, useId, useRef, useState } from 'react';

import {
  submitEnquiryAction,
  type EnquiryFieldValues,
  type EnquiryFormState,
} from '../lib/enquiry/actions.ts';

import { AppLink } from './link.tsx';

export const ENQUIRABLE_SERVICES = [
  { slug: 'preclinical-studies', title: 'Preclinical Studies' },
  { slug: 'molecular-research', title: 'Molecular Research' },
  { slug: 'metagenomic-data-analysis', title: 'Metagenomic Data Analysis' },
  { slug: 'biomedical-omics-data-analysis', title: 'Biomedical and Omics Data Analysis' },
  {
    slug: 'evidence-synthesis-technical-reports',
    title: 'Evidence Synthesis and Technical Reports',
  },
  { slug: 'research-collaboration', title: 'Research collaboration' },
  { slug: 'other-enquiry', title: 'Other enquiry' },
] as const;

function serviceConsent(
  serviceId: string,
  error: string | undefined,
  values: EnquiryFieldValues | undefined,
) {
  const name =
    serviceId === 'metagenomic-data-analysis'
      ? 'sequencingDataConsent'
      : serviceId === 'preclinical-studies' || serviceId === 'molecular-research'
        ? 'samplesCompoundsConsent'
        : serviceId === 'biomedical-omics-data-analysis' ||
            serviceId === 'evidence-synthesis-technical-reports'
          ? 'healthDataConsent'
          : null;
  if (name === null) return null;

  const statements =
    name === 'sequencingDataConsent'
      ? [
          'I am authorised to share these data with CERA Medical for analysis and, where I ask CERA Medical to download them from a server or repository, to give it access for that purpose.',
          'Where the data derive from human participants, the study holds the necessary ethical approval and participant consent, and that consent permits analysis by an external service provider.',
          'The files and metadata are de-identified and contain no names, contact details, national identity numbers, medical record numbers or other direct identifiers.',
          'I understand that sequencing reads from human samples may contain human genetic material, which CERA Medical removes during quality control and does not analyse for any other purpose.',
          'CERA Medical may store and process the data for this analysis and will delete them as set out in the Data Retention Policy.',
        ]
      : name === 'samplesCompoundsConsent'
        ? [
            'I own these materials or am authorised to send them to CERA Medical for the agreed study.',
            'Where samples derive from human donors, the necessary ethical approval and donor consent are in place, and the samples are coded and carry no names or other direct identifiers.',
            'I have disclosed every known hazard of the materials, including infectious, toxic and radioactive hazards, and will supply a safety data sheet for each test compound.',
            'CERA Medical may use the materials only for the agreed study and will return or destroy any remainder as set out in the Data Retention Policy.',
            'I understand that animal studies begin only after the protocol has been approved by the animal ethics committee.',
          ]
        : [
            'My organisation owns these data or is authorised to share them with CERA Medical for analysis.',
            'The data were collected with the consent and approvals required for their use in analysis and reporting.',
            'The dataset has been de-identified and contains no names, national identity numbers, medical record numbers, telephone numbers, addresses or household coordinates, or, where identifiers are needed for the analysis, a data sharing agreement will be signed before any data are transferred.',
            "CERA Medical may use the data only for the agreed analysis and report, will follow my organisation's data protection requirements, and will return or delete the data as set out in the Data Retention Policy or in the data sharing agreement.",
          ];

  return (
    <div>
      <Checkbox
        name={name}
        id={`enquiry-${name}`}
        required
        defaultChecked={values?.[name] ?? false}
        error={error}
        label="I confirm the statements below."
      />
      <ul className="ml-8 list-disc space-y-1 text-body-sm text-copy">
        {statements.map((statement) => (
          <li key={statement}>{statement}</li>
        ))}
      </ul>
    </div>
  );
}

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
  const [selectedService, setSelectedService] = useState(
    defaultServiceId ?? ENQUIRABLE_SERVICES[0].slug,
  );
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
  const consentServiceId = values?.serviceId ?? selectedService;
  const errorFor = (path: string) =>
    state.status === 'error'
      ? state.fieldErrors.find((error) => error.path === path)?.message
      : undefined;

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
      <Field
        label="Email address"
        required
        error={errorFor('email')}
        id="enquiry-email"
        hint="We use this address to reply to your request."
      >
        <Input name="email" type="email" autoComplete="email" defaultValue={values?.email ?? ''} />
      </Field>
      <Field label="Phone" error={errorFor('phone')} id="enquiry-phone">
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={values?.phone ?? ''} />
      </Field>
      <Field label="Institution" error={errorFor('institution')} id="enquiry-institution">
        <Input
          name="institution"
          autoComplete="organization"
          defaultValue={values?.institution ?? ''}
        />
      </Field>
      <Field label="Country" error={errorFor('country')} id="enquiry-country">
        <Input name="country" autoComplete="country-name" defaultValue={values?.country ?? ''} />
      </Field>
      <Field
        label="Service required"
        required
        error={errorFor('serviceId')}
        id="enquiry-serviceId"
        hint={serviceLocked ? 'This enquiry is for the service you were reading about.' : undefined}
      >
        <Select
          name="serviceId"
          defaultValue={values?.serviceId ?? defaultServiceId ?? ENQUIRABLE_SERVICES[0].slug}
          disabled={serviceLocked}
          onChange={(event) => setSelectedService(event.currentTarget.value)}
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
        label="Project description"
        required
        hint="Describe your samples, compounds or data, timeline and what you need. Do not include patient names or other identifying details."
        error={errorFor('message')}
        id="enquiry-message"
      >
        <Textarea name="message" rows={6} defaultValue={values?.message ?? ''} />
      </Field>

      <Checkbox
        name="consent"
        id="enquiry-consent"
        required
        error={errorFor('consent')}
        defaultChecked={values?.consent ?? false}
        label={
          <>
            I have read the <AppLink href="/privacy">Privacy Terms</AppLink> and I agree that CERA
            Medical may use the information I provide in this form to respond to my request and to
            deliver the service I have asked for.
          </>
        }
      />
      {serviceConsent(
        consentServiceId,
        errorFor('sequencingDataConsent') ??
          errorFor('samplesCompoundsConsent') ??
          errorFor('healthDataConsent'),
        values,
      )}
      <Checkbox
        name="updatesOptIn"
        id="enquiry-updatesOptIn"
        defaultChecked={values?.updatesOptIn ?? false}
        label="I would like to receive occasional updates from CERA Medical about its services and products. I can unsubscribe at any time."
      />
      <Text size="caption" tone="muted">
        The details you enter here are used only to answer your enquiry. See the{' '}
        <AppLink href="/data-retention">Data Retention Policy</AppLink> for how long they are kept.
      </Text>

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
        CERA Medical aims to reply within three working days. Contact{' '}
        <a className="text-primary underline" href="mailto:contact@ceramedical.org">
          contact@ceramedical.org
        </a>{' '}
        if you need to follow up. You can also create an account with this email to follow progress
        and claim the enquiry.
      </Text>
    </div>
  );
}
