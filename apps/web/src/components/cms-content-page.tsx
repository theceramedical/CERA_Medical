import { ButtonLink } from '@cera/ui/button';
import { Heading, Text } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

import { AppLink } from './link.tsx';
import { PageHeader } from './page-header.tsx';
import { RichText } from './rich-text.tsx';

interface LayoutBlock {
  readonly blockType?: string;
  readonly id?: string | number;
  readonly [key: string]: unknown;
}

function stringField(block: LayoutBlock, key: string): string {
  return typeof block[key] === 'string' ? block[key] : '';
}

function CmsLayout({ blocks }: { readonly blocks: readonly LayoutBlock[] }) {
  return blocks.map((block, index) => {
    const key =
      block.id === undefined ? `${block.blockType ?? 'block'}-${index}` : String(block.id);
    if (block.blockType === 'richText') return <RichText key={key} body={block.content} />;
    if (block.blockType === 'hero')
      return (
        <section key={key} className="bg-surface-tint px-6 py-16 md:px-10 lg:py-24">
          <div className="mx-auto max-w-site">
            <Text size="eyebrow" tone="muted">
              {stringField(block, 'eyebrow')}
            </Text>
            <Heading level={1} size="h1" className="mt-3">
              {stringField(block, 'headlinePrimary')}{' '}
              <span className="text-primary">{stringField(block, 'headlineAccent')}</span>
            </Heading>
            <Text className="mt-5 max-w-measure">{stringField(block, 'body')}</Text>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink
                href={stringField(block, 'primaryHref') || '/services'}
                as={AppLink}
                variant="primary"
              >
                {stringField(block, 'primaryLabel')}
              </ButtonLink>
              <ButtonLink
                href={stringField(block, 'secondaryHref') || '/enquiry'}
                as={AppLink}
                variant="outline"
              >
                {stringField(block, 'secondaryLabel')}
              </ButtonLink>
            </div>
          </div>
        </section>
      );
    if (block.blockType === 'ctaBand')
      return (
        <section key={key} className="bg-primary px-6 py-12 text-on-primary md:px-10">
          <div className="mx-auto flex max-w-site flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Heading level={2} size="h2">
                {stringField(block, 'headline')}
              </Heading>
              <Text className="mt-2">{stringField(block, 'body')}</Text>
            </div>
            <ButtonLink
              href={stringField(block, 'href') || '/enquiry'}
              as={AppLink}
              variant="on-dark"
            >
              {stringField(block, 'label')}
            </ButtonLink>
          </div>
        </section>
      );
    return null;
  });
}

export function CmsContentPage({ document }: { readonly document: ContentDocument }) {
  const blocks = Array.isArray(document.layout) ? (document.layout as LayoutBlock[]) : [];
  if (blocks.length > 0) return <CmsLayout blocks={blocks} />;
  return (
    <>
      <PageHeader title={document.title} lede={document.excerpt ?? ''} />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <RichText body={document.body} />
      </div>
    </>
  );
}
