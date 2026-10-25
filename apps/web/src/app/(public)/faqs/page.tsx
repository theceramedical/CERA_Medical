import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';

import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument, getPublicGlobal } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Service FAQs',
    description: 'Answers about CERA Medical research services and project enquiries.',
    path: '/faqs',
  });
}

export default async function FaqsPage() {
  const [settings, page] = await Promise.all([
    getPublicGlobal<{
      faqs?: readonly { question: string; answer: string }[];
    }>('site-settings'),
    getCurrentDocument('page', 'faqs'),
  ]);
  if (page === null) return <CmsPageUnavailable slug="faqs" />;

  const hero = sectionHeadingFromLayout(page.layout);
  const items = settings?.faqs ?? [];

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? page.title}
        lede={hero?.lede ?? page.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Support'}
      />
      <div className="mx-auto max-w-measure px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No FAQs published"
            description="Add frequently asked questions under Site → Site settings in Payload CMS."
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <details
                key={item.question}
                className="rounded-md border border-border bg-surface p-4"
              >
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                <Text className="mt-3">{item.answer}</Text>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
