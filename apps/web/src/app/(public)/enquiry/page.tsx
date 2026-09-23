import { ComingSoon } from '../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Make an Enquiry',
  description:
    'Submit an enquiry about a CERA Medical service and track it in your account. No clinical information is requested.',
};

export default function EnquiryPage() {
  return (
    <ComingSoon
      title="Make an Enquiry"
      lede="Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account."
      plan="Phase 08 builds the form, its validation, the consent record, and the reference number. It will not ask for symptoms, conditions, or any other clinical detail - PRD 3.2 puts clinical data out of scope for this platform, and the form is where that promise is either kept or broken."
    />
  );
}
