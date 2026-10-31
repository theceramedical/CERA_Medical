import type { ContentDocument } from '@cera/contracts';
import type { PublicProduct } from '@cera/contracts/projections';

import { HomeLandingPage } from '../../components/home/home-landing-page.tsx';
import {
  DEFAULT_HOME_LANDING_COPY,
  type HomeLandingCopy,
} from '../../components/home/home-landing-page.tsx';
import {
  JsonLd,
  medicalBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from '../../components/json-ld.tsx';
import { VERIFIED_PORTFOLIO_PRODUCTS } from '../../content/products-catalog.ts';
import { listPublicProducts } from '../../lib/catalogue/client.ts';
import { getCurrentDocument } from '../../lib/cms/client.ts';
import { getFeaturedProjects } from '../../lib/projects/getFeaturedProjects.ts';
import { pageMetadata } from '../../lib/seo.ts';
import { siteUrl } from '../../lib/site-url.ts';

import type { Metadata } from 'next';

type HomeBlock = Readonly<Record<string, unknown>> & { readonly blockType?: string };

function blocksOf(document: ContentDocument | null): readonly HomeBlock[] {
  return Array.isArray(document?.layout)
    ? document.layout.filter(
        (block): block is HomeBlock => block !== null && typeof block === 'object',
      )
    : [];
}

function field(block: HomeBlock | undefined, name: string): string | undefined {
  const value = block?.[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function findBlock(blocks: readonly HomeBlock[], blockType: string): HomeBlock | undefined {
  return blocks.find((block) => block.blockType === blockType);
}

function internalHref(value: string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  if (value === '/enquiry') return '/contact#contact-form';
  if (value.startsWith('/enquiry?'))
    return `/contact${value.slice('/enquiry'.length)}#contact-form`;
  return value;
}

/** Resolve editorial copy from published Payload layout blocks; the six-band template stays typed. */
function homeCopyFromDocument(document: ContentDocument | null): HomeLandingCopy {
  const blocks = blocksOf(document);
  const hero = findBlock(blocks, 'hero');
  const services = findBlock(blocks, 'servicesShowcase');
  const projects = findBlock(blocks, 'articlesPreview');
  const products = blocks.find(
    (block) =>
      block.blockType === 'sectionHeading' && field(block, 'heading') === 'Research Products',
  );
  const work = blocks.find(
    (block) =>
      block.blockType === 'processSteps' &&
      (field(block, 'heading')?.toLowerCase().includes('work') ?? false),
  );
  const cta = findBlock(blocks, 'ctaBand');
  const base = DEFAULT_HOME_LANDING_COPY;

  return {
    ...base,
    hero: {
      ...base.hero,
      eyebrow: field(hero, 'eyebrow') ?? base.hero.eyebrow,
      headlinePrimary: field(hero, 'headlinePrimary') ?? base.hero.headlinePrimary,
      headlineAccent: field(hero, 'headlineAccent') ?? base.hero.headlineAccent,
      body: field(hero, 'body') ?? base.hero.body,
      primaryLabel: field(hero, 'primaryLabel') ?? base.hero.primaryLabel,
      primaryHref: internalHref(field(hero, 'primaryHref'), base.hero.primaryHref),
      secondaryLabel: field(hero, 'secondaryLabel') ?? base.hero.secondaryLabel,
      secondaryHref: internalHref(field(hero, 'secondaryHref'), base.hero.secondaryHref),
    },
    services: {
      ...base.services,
      heading:
        field(services, 'heading') === 'Research Services'
          ? base.services.heading
          : (field(services, 'heading') ?? base.services.heading),
      body:
        field(services, 'body') ===
        'Five integrated service lines — each with enquiry enabled on the catalogue so you can request scoping without leaving the site.'
          ? base.services.body
          : (field(services, 'body') ?? base.services.body),
    },
    projects: {
      ...base.projects,
      heading:
        field(projects, 'heading') === 'Research Updates'
          ? base.projects.heading
          : (field(projects, 'heading') ?? base.projects.heading),
      body:
        field(projects, 'body') ===
        'Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.'
          ? base.projects.body
          : (field(projects, 'body') ?? base.projects.body),
      viewAllHref: internalHref(
        field(projects, 'viewAllHref') === '/articles' ? undefined : field(projects, 'viewAllHref'),
        base.projects.viewAllHref,
      ),
      viewAllLabel:
        field(projects, 'viewAllLabel') === 'View All Articles'
          ? base.projects.viewAllLabel
          : (field(projects, 'viewAllLabel') ?? base.projects.viewAllLabel),
    },
    products: {
      ...base.products,
      heading: field(products, 'heading') ?? base.products.heading,
      body: field(products, 'body') ?? base.products.body,
    },
    howWeWork: {
      ...base.howWeWork,
      heading: field(work, 'heading') ?? base.howWeWork.heading,
      body:
        field(work, 'body') ===
        'A consistent workflow from first conversation to delivered results, with quality checks at each stage.'
          ? base.howWeWork.body
          : (field(work, 'body') ?? base.howWeWork.body),
    },
    cta: {
      ...base.cta,
      heading: field(cta, 'headline') ?? base.cta.heading,
      body: field(cta, 'body') ?? base.cta.body,
      label: field(cta, 'label') ?? base.cta.label,
      href: internalHref(field(cta, 'href'), base.cta.href),
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const document = await getCurrentDocument('page', 'home');
  return pageMetadata({
    title:
      document?.seo.title ??
      document?.title ??
      'CERA Medical - Biomedical Research and Development',
    description:
      document?.seo.description ??
      document?.excerpt ??
      'CERA Medical is an SECP-registered biomedical research and development company based in Haripur, Pakistan.',
    path: '/',
    ...(document === null ? {} : { noIndex: document.seo.noIndex }),
  });
}

export default async function HomePage() {
  const origin = siteUrl().origin;
  const [document, projects, products] = await Promise.all([
    getCurrentDocument('page', 'home'),
    getFeaturedProjects(3),
    listPublicProducts(),
  ]);

  const apiItems = products.items;
  const knownSkus = new Set(apiItems.map((p) => p.sku.toLowerCase()));
  const fallbackProducts: PublicProduct[] = VERIFIED_PORTFOLIO_PRODUCTS.map((p) => ({
    sku: p.sku,
    title: p.title,
    summary: p.description,
    description: p.description,
    displayPrice:
      p.price ??
      (p.listPriceMinor !== null
        ? `PKR ${(p.listPriceMinor / 100).toLocaleString()}`
        : 'Price on enquiry'),
    availabilityText: p.inStock ? 'In stock • Dispatched from Haripur' : 'Price on enquiry',
    listPriceMinor: p.listPriceMinor,
    checkoutEnabled: p.checkoutEnabled ?? false,
    enquiryEnabled: true,
    imageUrl: p.imageUrl?.startsWith('http') ? p.imageUrl : null,
  }));

  const mergedProducts = [
    ...apiItems,
    ...fallbackProducts.filter((p) => !knownSkus.has(p.sku.toLowerCase())),
  ];

  return (
    <>
      <JsonLd data={organizationJsonLd(origin)} />
      <JsonLd data={websiteJsonLd(origin)} />
      <JsonLd data={medicalBusinessJsonLd(origin)} />
      <HomeLandingPage
        projects={projects}
        products={mergedProducts.slice(0, 3)}
        copy={homeCopyFromDocument(document)}
      />
    </>
  );
}
