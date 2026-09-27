import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions about CERA Medical services and enquiries.',
    path: '/faqs',
  });
}

const FAQS = [
  {
    question: 'Do I need an account to make an enquiry?',
    answer:
      'No. You can submit an enquiry without signing in. We email you a reference, and you can claim it later if you want to follow progress.',
  },
  {
    question: 'Will you ask for medical details?',
    answer:
      'No. We never ask for symptoms, conditions, or test results. There is nowhere in this platform for that information to be stored.',
  },
  {
    question: 'Can I book an appointment here?',
    answer:
      'This site is for information and enquiries only. We do not take bookings, payments, or prescriptions.',
  },
] as const;

export default function FaqsPage() {
  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        lede="Answers to the questions we are asked most often."
      />
      <div className="mx-auto max-w-measure px-6 py-12 md:px-10 lg:py-16">
        <div className="space-y-4">
          {FAQS.map((item) => (
            <details key={item.question} className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer font-semibold">{item.question}</summary>
              <Text className="mt-3">{item.answer}</Text>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
