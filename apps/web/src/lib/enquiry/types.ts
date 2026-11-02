export interface EnquiryFieldValues {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly institution: string;
  readonly country: string;
  readonly serviceId: string;
  readonly message: string;
  readonly consent: boolean;
  readonly consentVersion: string;
  readonly sequencingDataConsent: boolean;
  readonly samplesCompoundsConsent: boolean;
  readonly healthDataConsent: boolean;
  readonly updatesOptIn: boolean;
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
