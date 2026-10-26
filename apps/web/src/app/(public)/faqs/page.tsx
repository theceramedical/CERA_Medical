import { Text } from '@cera/ui/typography';

import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

const APPROVED_FAQS = [
  {
    question: 'Which services does CERA Medical provide?',
    answer:
      'Our services cover three areas: preclinical studies, molecular research and biomedical data analysis, which includes metagenomics, health and omics data analysis, and evidence synthesis and technical reports.',
  },
  {
    question: 'How long does metagenomic analysis take?',
    answer:
      'Metagenomic analysis is typically delivered within three weeks. The exact timeline is confirmed during project scoping.',
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCurrentDocument('page', 'faqs');
  return pageMetadata({
    title: page?.seo.title ?? page?.title ?? 'Research Service FAQs',
    description: page?.seo.description ?? 'Answers about CERA Medical services and project timing.',
    path: '/faqs',
    ...(page === null ? {} : { noIndex: page.seo.noIndex }),
  });
}

export default function FaqsPage() {
  return (
    <>
      <MarketingPageHeader
        title="Research Service FAQs"
        lede="Answers about CERA Medical services and project timing."
        eyebrow="FAQs"
      />
      <div className="mx-auto max-w-measure px-6 py-12 md:px-10 lg:py-16">
        <div className="space-y-4">
          {APPROVED_FAQS.map((item) => (
            <details key={item.question} className="group border border-border bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-heading focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-accent transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <Text className="border-t border-border px-5 py-4" tone="muted">
                {item.answer}
              </Text>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
