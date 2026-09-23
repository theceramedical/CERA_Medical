import { ComingSoon } from '../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about CERA Medical services and enquiries.',
};

export default function FaqsPage() {
  return (
    <ComingSoon
      title="Frequently Asked Questions"
      lede="Answers to the questions we are asked most often."
      plan="Phase 05 makes these editable in the CMS and Phase 07 renders them. They will be headings and text rather than an accordion by default: content that is collapsed is content that is not found, and a page this short has nothing to gain from hiding most of itself."
    />
  );
}
