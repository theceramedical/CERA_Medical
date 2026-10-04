import { ButtonLink } from '@cera/ui/button';
import { Heading, Text } from '@cera/ui/typography';
import { MapPin } from 'lucide-react';

import type { ContentDocument } from '@cera/contracts';

import { AppLink } from './link.tsx';
import { PageHeader } from './page-header.tsx';
import { RichText } from './rich-text.tsx';

export interface LayoutBlock {
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

function sectionToneClass(block: LayoutBlock): string {
  const tone = block.tone;
  if (tone === 'surface-tint') return 'bg-surface-tint';
  if (tone === 'surface-tint-2') return 'bg-surface-tint-2';
  return 'bg-surface';
}

function featureHighlights(feature: LayoutBlock): readonly string[] {
  return recordArray(feature, 'highlights')
    .map((row) => stringField(row, 'text'))
    .filter((line) => line.length > 0);
}

function booleanField(block: LayoutBlock, key: string): boolean {
  return block[key] === true;
}

export function CmsLayout({
  blocks,
  embedded = false,
}: {
  readonly blocks: readonly LayoutBlock[];
  readonly embedded?: boolean;
}) {
  const sectionPad = embedded ? 'py-0' : 'px-6 py-14 md:px-10 lg:py-20';
  const sectionPadSm = embedded ? 'py-0' : 'px-6 py-12 md:px-10 lg:py-16';
  return blocks.map((block, index) => {
    const key =
      block.id === undefined ? `${block.blockType ?? 'block'}-${index}` : String(block.id);
    if (block.blockType === 'richText') return <RichText key={key} body={block.content} />;
    if (block.blockType === 'sectionHeading')
      return (
        <section key={key} className={embedded ? 'space-y-3' : `bg-surface ${sectionPadSm}`}>
          <div className={embedded ? undefined : 'mx-auto max-w-site'}>
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
        <section
          key={key}
          className={embedded ? 'space-y-6' : `${sectionToneClass(block)} ${sectionPad}`}
        >
          <div className={embedded ? undefined : 'mx-auto max-w-site'}>
            {stringField(block, 'eyebrow') ? (
              <Text
                size="eyebrow"
                tone="muted"
                className={
                  booleanField(block, 'centered')
                    ? 'text-center uppercase tracking-widest'
                    : undefined
                }
              >
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading
              level={2}
              size="h2"
              className={booleanField(block, 'centered') ? 'mt-2 text-center' : 'mt-3'}
            >
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text
                size="body-lg"
                tone="muted"
                measure
                className={booleanField(block, 'centered') ? 'mx-auto mt-4 text-center' : 'mt-4'}
              >
                {stringField(block, 'body')}
              </Text>
            ) : null}
            <ul
              className={
                embedded
                  ? 'mt-6 grid list-none gap-4 p-0 md:grid-cols-2'
                  : 'mt-10 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3'
              }
            >
              {recordArray(block, 'features').map((feature, featureIndex) => {
                const highlights = featureHighlights(feature);
                return (
                  <li
                    key={`${stringField(feature, 'title')}-${String(featureIndex)}`}
                    className={
                      highlights.length > 0
                        ? 'flex flex-col gap-4 rounded-lg bg-surface-subtle p-7 ring-1 ring-border'
                        : 'rounded-lg border border-border bg-surface p-6 shadow-card'
                    }
                  >
                    <Heading level={3} size="h4">
                      {stringField(feature, 'title')}
                    </Heading>
                    <Text tone="muted" className={highlights.length > 0 ? undefined : 'mt-3'}>
                      {stringField(feature, 'description')}
                    </Text>
                    {highlights.length > 0 ? (
                      <ul className="mt-2 flex list-none flex-col gap-2 border-t border-border pt-4 p-0">
                        {highlights.map((line) => (
                          <li key={line} className="flex gap-2 text-body-sm text-copy">
                            <span
                              aria-hidden
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                            />
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {stringField(feature, 'href') ? (
                      <AppLink
                        href={stringField(feature, 'href')}
                        className="mt-5 inline-flex font-medium"
                      >
                        {stringField(feature, 'linkLabel') || 'Learn more'}
                      </AppLink>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      );
    if (block.blockType === 'processSteps') {
      const variant = stringField(block, 'variant') || 'grid';
      const steps = recordArray(block, 'steps');
      const stepsList =
        variant === 'timeline' ? (
          <ol
            className={`relative mt-8 list-none space-y-6 border-s-2 border-border p-0 ps-6 ${embedded ? '' : ''}`}
          >
            {steps.map((step, stepIndex) => (
              <li key={`${stringField(step, 'title')}-${String(stepIndex)}`} className="relative">
                <span
                  aria-hidden
                  className="absolute -start-[1.6rem] top-1.5 size-3 rounded-full bg-accent ring-4 ring-surface"
                />
                <Text size="eyebrow" className="text-accent">
                  Stage {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Heading level={3} size="h4" className="mt-1">
                  {stringField(step, 'title')}
                </Heading>
                <Text tone="muted" size="body-sm" className="mt-2">
                  {stringField(step, 'description')}
                </Text>
              </li>
            ))}
          </ol>
        ) : variant === 'numbered' ? (
          <ol className="mt-8 flex list-none flex-col gap-3 p-0">
            {steps.map((step, stepIndex) => (
              <li
                key={`${stringField(step, 'title')}-${String(stepIndex)}`}
                className="flex gap-4 rounded-lg border border-border bg-surface p-4 shadow-card"
              >
                <Text
                  size="eyebrow"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-tint font-bold text-primary"
                >
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <div>
                  <Heading level={3} size="h4">
                    {stringField(step, 'title')}
                  </Heading>
                  <Text tone="muted" size="body-sm" className="mt-1">
                    {stringField(step, 'description')}
                  </Text>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="mt-10 grid list-none gap-5 p-0 md:grid-cols-2">
            {steps.map((step, stepIndex) => (
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
        );
      return (
        <section
          key={key}
          className={embedded ? 'space-y-4' : `${sectionToneClass(block)} ${sectionPad}`}
        >
          <div className={embedded ? undefined : 'mx-auto max-w-site'}>
            {stringField(block, 'eyebrow') ? (
              <Text size="eyebrow" tone="muted">
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading
              level={2}
              size="h2"
              className={embedded ? 'border-b border-border pb-3' : 'mt-3'}
            >
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text size="body-sm" tone="muted" measure className="mt-2">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            {stepsList}
          </div>
        </section>
      );
    }
    if (block.blockType === 'keyValueList')
      return (
        <section key={key} className={embedded ? 'space-y-4' : `bg-surface ${sectionPadSm}`}>
          <div className={embedded ? undefined : 'mx-auto max-w-site'}>
            <Heading level={2} size="h3">
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text tone="muted" className="mt-2">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface p-5 shadow-card">
              {recordArray(block, 'items').map((item, itemIndex) => (
                <li
                  key={`${stringField(item, 'label')}-${String(itemIndex)}`}
                  className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Text className="font-semibold text-copy">{stringField(item, 'label')}</Text>
                  {stringField(item, 'detail') ? (
                    <Text size="body-sm" tone="muted" className="font-mono sm:text-end">
                      {stringField(item, 'detail')}
                    </Text>
                  ) : null}
                </li>
              ))}
            </ul>
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
    if (
      block.blockType === 'serviceHero' ||
      block.blockType === 'servicesCatalogue' ||
      block.blockType === 'serviceEnquiryAside' ||
      block.blockType === 'serviceSidebarCard'
    )
      return null;
    if (block.blockType === 'servicesShowcase' || block.blockType === 'articlesPreview') {
      return null;
    }
    if (block.blockType === 'faqList')
      return (
        <section key={key} className="bg-surface-tint-2 px-6 py-14 md:px-10 lg:py-20">
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
              <Text tone="muted" measure className="mt-4">
                {stringField(block, 'body')}
              </Text>
            ) : null}
            {stringField(block, 'linkHref') ? (
              <AppLink
                href={stringField(block, 'linkHref')}
                className="mt-4 inline-flex font-medium"
              >
                {stringField(block, 'linkLabel') || 'View all'}
              </AppLink>
            ) : null}
            <div className="mt-10 space-y-4">
              {recordArray(block, 'items').map((item, itemIndex) => (
                <details
                  key={`${stringField(item, 'question')}-${String(itemIndex)}`}
                  className="rounded-lg border border-border bg-surface p-5 shadow-card"
                >
                  <summary className="cursor-pointer font-semibold">
                    {stringField(item, 'question')}
                  </summary>
                  <Text tone="muted" className="mt-3">
                    {stringField(item, 'answer')}
                  </Text>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    if (block.blockType === 'calloutBand')
      return (
        <section key={key} className="border-y border-border bg-surface-tint px-6 py-12 md:px-10">
          <div className="mx-auto max-w-site rounded-2xl border border-border bg-surface p-8 md:p-10">
            {stringField(block, 'eyebrow') ? (
              <Text
                size="eyebrow"
                tone="muted"
                className="inline-flex items-center gap-1.5 uppercase tracking-widest"
              >
                <MapPin aria-hidden className="size-4 text-accent" />
                {stringField(block, 'eyebrow')}
              </Text>
            ) : null}
            <Heading level={2} size="h3" className="mt-3">
              {stringField(block, 'heading')}
            </Heading>
            {stringField(block, 'body') ? (
              <Text tone="muted" measure className="mt-3">
                {stringField(block, 'body')}
              </Text>
            ) : null}
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

export function CmsContentPage({
  document,
  skipPageHeader = false,
}: {
  readonly document: ContentDocument;
  readonly skipPageHeader?: boolean;
}) {
  const blocks = Array.isArray(document.layout) ? (document.layout as LayoutBlock[]) : [];
  if (blocks.length > 0) {
    return (
      <>
        <CmsLayout blocks={blocks} />
        {document.body ? (
          <div className="mx-auto max-w-site px-6 pb-12 md:px-10 lg:pb-16">
            <RichText body={document.body} />
          </div>
        ) : null}
      </>
    );
  }
  return (
    <>
      {skipPageHeader ? null : <PageHeader title={document.title} lede={document.excerpt ?? ''} />}
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <RichText body={document.body} />
      </div>
    </>
  );
}
