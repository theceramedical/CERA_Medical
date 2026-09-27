'use server';

import { submitEnquiry } from './submit.ts';

export interface EnquiryFieldValues {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly serviceId: string;
  readonly message: string;
}

export type EnquiryFormState =
  | { status: 'idle' }
  | { status: 'success'; reference: string }
  | {
      status: 'error';
      message: string;
      retryable: boolean;
      fieldErrors: readonly { path: string; message: string }[];
      values: EnquiryFieldValues;
    };

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function submitEnquiryAction(
  _previous: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const values: EnquiryFieldValues = {
    name: formString(formData, 'name'),
    email: formString(formData, 'email'),
    phone: formString(formData, 'phone'),
    serviceId: formString(formData, 'serviceId'),
    message: formString(formData, 'message'),
  };

  const result = await submitEnquiry({
    body: {
      ...values,
      phone: values.phone.length > 0 ? values.phone : null,
      consent: formData.get('consent') === 'on',
      source: formString(formData, 'source') || 'web_general',
    },
    idempotencyKey: formString(formData, 'idempotencyKey') || null,
    honeypot: formString(formData, 'company') || null,
    startedAt: formString(formData, 'startedAt') || null,
  });

  if (result.ok && result.body !== undefined) {
    return { status: 'success', reference: result.body.reference };
  }

  return {
    status: 'error',
    message: result.message,
    retryable: result.retryable,
    fieldErrors: result.fieldErrors,
    values,
  };
}
