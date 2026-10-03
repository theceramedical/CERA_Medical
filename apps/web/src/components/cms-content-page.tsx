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

function recordArray(block: LayoutBlock, key: string): readonly LayoutBlock[] {
  const value = block[key];
  return Array.isArray(value)
    ? value.filter((item): item is LayoutBlock => item !== null && typeof item === 'object')
    : [];
}

function CmsLayout({ blocks }: { readonly blocks: readonly LayoutBlock[] }) {
  return blocks.map((block, index) => {
    const key =
      block.id === undefined ? `${block.blockType ?? 'block'}-${index}` : String(block.id);
    if (block.blockType === 'richText') return <RichText key={key} body={block.content} />;
    if (block.blockType === 'sectionHeading')
      return (
        <section key={key} className="bg-surface px-6 py-12 md:px-10 lg:py-16">
          <div className="mx-auto max-w-site">
            {stringField(block, 'eyebrow') ? (
              <Text size="eyebrow" tone="muted">
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading level={2} size="h2" className="mt-3">
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text size="body-lg" tone="muted" measure className="mt-4">
                {stringField(block, 'body')}
              </Text>
            ) : null}
          </div>
        </section>
      );
    if (block.blockType === 'featureGrid')
      return (
        <section key={key} className="bg-surface-tint px-6 py-12 md:px-10 lg:py-16">
          <div className="mx-auto max-w-site">
            {stringField(block, 'eyebrow') ? (
              <Text size="eyebrow" tone="muted">
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading level={2} size="h2" className="mt-3">
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text size="body-lg" tone="muted" measure className="mt-4">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            <ul className="mt-10 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
              {recordArray(block, 'features').map((feature, featureIndex) => (
                <li
                  key={`${stringField(feature, 'title')}-${String(featureIndex)}`}
                  className="rounded-lg border border-border bg-surface p-6 shadow-card"
                >
                  <Heading level={3} size="h4">
                    {stringField(feature, 'title')}
                  </Heading>
                  <Text tone="muted" className="mt-3">
                    {stringField(feature, 'description')}
                  </Text>
                  {stringField(feature, 'href') ? (
                    <AppLink
                      href={stringField(feature, 'href')}
                      className="mt-5 inline-flex font-medium"
                    >
                      {stringField(feature, 'linkLabel') || 'Learn more'}
                    </AppLink>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    if (block.blockType === 'processSteps')
      return (
        <section key={key} className="bg-surface px-6 py-12 md:px-10 lg:py-16">
          <div className="mx-auto max-w-site">
            {stringField(block, 'eyebrow') ? (
              <Text size="eyebrow" tone="muted">
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading level={2} size="h2" className="mt-3">
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text size="body-lg" tone="muted" measure className="mt-4">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            <ol className="mt-10 grid list-none gap-5 p-0 md:grid-cols-2">
              {recordArray(block, 'steps').map((step, stepIndex) => (
                <li
                  key={`${stringField(step, 'title')}-${String(stepIndex)}`}
                  className="flex gap-5 rounded-lg border border-border p-6"
                >
                  <Text size="eyebrow" className="shrink-0 text-accent">
                    {String(stepIndex + 1).padStart(2, '0')}
                  </Text>
                  <div>
                    <Heading level={3} size="h4">
                      {stringField(step, 'title')}
                    </Heading>
                    <Text tone="muted" className="mt-2">
                      {stringField(step, 'description')}
                    </Text>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    if (block.blockType === 'statistics')
      return (
        <section key={key} className="bg-primary px-6 py-12 text-on-primary md:px-10 lg:py-16">
          <div className="mx-auto max-w-site">
            {stringField(block, 'heading') ? (
              <Heading level={2} size="h2" tone="on-dark">
                {stringField(block, 'heading')}
              </Heading>
            ) : null}
            {stringField(block, 'body') ? (
              <Text tone="on-dark" measure className="mt-3">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recordArray(block, 'items').map((item, itemIndex) => (
                <div key={`${stringField(item, 'label')}-${String(itemIndex)}`}>
                  <dt className="text-display-1 font-semibold">{stringField(item, 'value')}</dt>
                  <dd className="mt-2 text-body font-medium">{stringField(item, 'label')}</dd>
                  {stringField(item, 'detail') ? (
                    <dd className="mt-1 text-body-sm text-on-primary">
                      {stringField(item, 'detail')}
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
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
