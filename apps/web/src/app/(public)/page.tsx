import { type LayoutBlock } from '../../components/cms-content-page.tsx';
import { CtaBandSection } from '../../components/home/cta-band-section.tsx';
import { HeroSection } from '../../components/home/hero-section.tsx';
import { HomeMarketingBlocks } from '../../components/home/home-marketing-blocks.tsx';
import { MetricsBand } from '../../components/home/metrics-band.tsx';
import {
  JsonLd,
  medicalBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from '../../components/json-ld.tsx';
import { listPublicServices } from '../../lib/catalogue/client.ts';
import { getCurrentDocument, listPublishedDocuments } from '../../lib/cms/client.ts';
import { pageMetadata } from '../../lib/seo.ts';
import { siteUrl } from '../../lib/site-url.ts';

import type { CtaContent } from '../../components/home/cta-band-section.tsx';
import type { HeroContent } from '../../components/home/hero-section.tsx';
import type { MetricHighlight } from '../../content/homepage.ts';
import type { Metadata } from 'next';

function stringField(block: LayoutBlock | undefined, field: string): string | undefined {
  const value = block?.[field];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function mediaField(block: LayoutBlock | undefined): { imageUrl?: string; imageAlt?: string } {
  const portrait = block?.portrait;
  if (portrait === null || typeof portrait !== 'object') return {};
  const media = portrait as { readonly url?: unknown; readonly alt?: unknown };
  return {
    ...(typeof media.url === 'string' && media.url.length > 0 ? { imageUrl: media.url } : {}),
    ...(typeof media.alt === 'string' && media.alt.length > 0 ? { imageAlt: media.alt } : {}),
  };
}

function trustLabelsFromHero(hero: LayoutBlock | undefined): readonly string[] | undefined {
  const raw = hero?.trustItems;
  if (!Array.isArray(raw)) return undefined;
  const labels = raw
    .map((item) => {
      if (item === null || typeof item !== 'object') return null;
      const label = (item as { label?: unknown }).label;
      return typeof label === 'string' && label.length > 0 ? label : null;
    })
    .filter((item): item is string => item !== null);
  return labels.length > 0 ? labels : undefined;
}

function metricsFromBlocks(blocks: readonly LayoutBlock[]): readonly MetricHighlight[] | undefined {
  const stats = blocks.find((block) => block.blockType === 'statistics');
  if (stats === undefined) return undefined;
  const raw = stats.items;
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((item) => {
      if (item === null || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const value = typeof row.value === 'string' ? row.value : '';
      const label = typeof row.label === 'string' ? row.label : '';
      const detail = typeof row.detail === 'string' ? row.detail : undefined;
      if (value.length === 0 || label.length === 0) return null;
      return { value, label, ...(detail !== undefined ? { detail } : {}) };
    })
    .filter((item): item is MetricHighlight => item !== null);
  return items.length > 0 ? items : undefined;
}

function pageContent(document: Awaited<ReturnType<typeof getCurrentDocument>>) {
  const blocks = Array.isArray(document?.layout) ? (document.layout as LayoutBlock[]) : [];
  const hero = blocks.find((block) => block.blockType === 'hero');
  const cta = blocks.find((block) => block.blockType === 'ctaBand');
  return {
    metrics: metricsFromBlocks(blocks),
    hero: {
      eyebrow: stringField(hero, 'eyebrow'),
      headlinePrimary: stringField(hero, 'headlinePrimary'),
      headlineAccent: stringField(hero, 'headlineAccent'),
      body: stringField(hero, 'body'),
      primaryHref: stringField(hero, 'primaryHref'),
      primaryLabel: stringField(hero, 'primaryLabel'),
      secondaryHref: stringField(hero, 'secondaryHref'),
      secondaryLabel: stringField(hero, 'secondaryLabel'),
      badgeTitle: stringField(hero, 'badgeTitle'),
      badgeBody: stringField(hero, 'badgeBody'),
      trustLabels: trustLabelsFromHero(hero),
      ...mediaField(hero),
    } satisfies HeroContent,
    cta: {
      heading: stringField(cta, 'headline'),
      body: stringField(cta, 'body'),
      href: stringField(cta, 'href'),
      label: stringField(cta, 'label'),
    } satisfies CtaContent,
  };
}

/**
 * The homepage, reproducing the reference image section for section.
 *
 * **The band order and their backgrounds are the layout,** per design-language.md section 4.1: hero on
 * `surface-tint`, services on white, process on `surface-tint-2`, articles on white, the gradient CTA,
 * then the footer. The alternation is what separates the bands - there are no dividing rules between
 * them - so reordering these five lines would put two white bands together and visually merge them.
 *
 * Each section owns its own background and padding rather than receiving them here, so a section can be
 * moved to another page without carrying a `className` that only made sense in this stack.
 *
 * Every section is a server component. The only client code on this page arrives through the header's
 * three islands, which is what keeps a content page's JavaScript to the router and the hydration
 * bootstrap.
 */

export async function generateMetadata(): Promise<Metadata> {
  const document = await getCurrentDocument('page', 'home');
  if (document !== null)
    return pageMetadata({
      title: document.seo.title ?? document.title,
      description: document.seo.description ?? document.excerpt ?? '',
      path: '/',
      noIndex: document.seo.noIndex,
    });
  return {
    /**
     * An absolute title, overriding the layout's `%s | CERA Medical` template.
     *
     * The homepage is the one page where the template produces the wrong result: "Home | CERA Medical"
     */
    title: { absolute: 'CERA Medical - Biomedical Research and Development' },
    description:
      'Preclinical studies, molecular research, metagenomic and omics data analysis, and evidence synthesis for research teams and health organisations.',
  };
}

const HOME_SHELL_BLOCKS = new Set(['hero', 'statistics', 'ctaBand']);

export default async function HomePage() {
  const origin = siteUrl().origin;
  const [document, presentations, posts, catalogue] = await Promise.all([
    getCurrentDocument('page', 'home'),
    listPublishedDocuments('servicePresentation'),
    listPublishedDocuments('post'),
    listPublicServices(),
  ]);
  if (document === null) {
    return (
      <>
        <JsonLd data={organizationJsonLd(origin)} />
        <JsonLd data={websiteJsonLd(origin)} />
        <JsonLd data={medicalBusinessJsonLd(origin)} />
        <HeroSection />
        <MetricsBand />
        <HomeMarketingBlocks
          blocks={[]}
          presentations={presentations}
          posts={posts}
          catalogue={catalogue.items}
        />
        <CtaBandSection />
      </>
    );
  }

  const content = pageContent(document);
  const layoutBlocks = Array.isArray(document.layout) ? (document.layout as LayoutBlock[]) : [];
  const marketingBlocks = layoutBlocks.filter(
    (block) => !HOME_SHELL_BLOCKS.has(block.blockType ?? ''),
  );

  return (
    <>
      <JsonLd data={organizationJsonLd(origin)} />
      <JsonLd data={websiteJsonLd(origin)} />
      <JsonLd data={medicalBusinessJsonLd(origin)} />
      <HeroSection content={content.hero} />
      <MetricsBand metrics={content.metrics} />
      <HomeMarketingBlocks
        blocks={marketingBlocks}
        presentations={presentations}
        posts={posts}
        catalogue={catalogue.items}
      />
      <CtaBandSection content={content.cta} />
    </>
  );
}
