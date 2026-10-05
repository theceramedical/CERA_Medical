import type { ContentDocument, PublicService } from '@cera/contracts';

import {
  SERVICE_PORTFOLIO,
  type ServiceDomain,
  type ServicePortfolioLine,
} from '../content/service-portfolio.ts';

const COLLECTION_DOMAIN: Record<string, ServiceDomain> = {
  'laboratory-research': 'molecular',
  bioinformatics: 'omics',
  'evidence-reporting': 'evidence',
};

function domainForService(service: PublicService): ServiceDomain {
  const slug = service.category?.slug;
  if (slug !== undefined) {
    const domain = COLLECTION_DOMAIN[slug];
    if (domain !== undefined) return domain;
  }
  return 'molecular';
}

function lineFromCatalogue(
  service: PublicService,
  presentation: ContentDocument | undefined,
): ServicePortfolioLine {
  const highlights =
    presentation?.cardHighlights !== undefined && presentation.cardHighlights.length > 0
      ? presentation.cardHighlights
      : [service.summary].filter((item) => item.length > 0);

  return {
    slug: service.slug,
    line: 'SERVICE',
    title: presentation?.title ?? service.title,
    badge: service.availabilityText ?? 'Research service',
    description: presentation?.excerpt ?? service.summary,
    capabilities: highlights,
    note: service.displayPrice ?? 'Scope and timeline agreed per project',
    domain: domainForService(service),
    accent: 'primary',
  };
}

/**
 * Stitch portfolio cards: seeded layout rows win for known slugs; any other active
 * Vendure research service (not physical-products) appears once the catalogue API lists it.
 */
export function mergeServicePortfolioLines(
  catalogue: readonly PublicService[],
): readonly ServicePortfolioLine[] {
  const bySlug = new Map<string, ServicePortfolioLine>(
    SERVICE_PORTFOLIO.map((line) => [line.slug, line]),
  );

  for (const service of catalogue) {
    if (!bySlug.has(service.slug)) {
      bySlug.set(service.slug, lineFromCatalogue(service, undefined));
    }
  }

  const staticOrder = SERVICE_PORTFOLIO.map((line) => line.slug);
  const extra = [...bySlug.keys()]
    .filter((slug) => !staticOrder.includes(slug))
    .sort((a, b) => a.localeCompare(b));

  return [...staticOrder, ...extra]
    .map((slug) => bySlug.get(slug))
    .filter((line): line is ServicePortfolioLine => line !== undefined);
}

export function enrichPortfolioLine(
  line: ServicePortfolioLine,
  presentation: ContentDocument | undefined,
  service: PublicService | undefined,
): ServicePortfolioLine {
  if (presentation === undefined && service === undefined) return line;
  return {
    ...line,
    title: presentation?.title ?? service?.title ?? line.title,
    description: presentation?.excerpt ?? service?.summary ?? line.description,
    capabilities:
      presentation?.cardHighlights !== undefined && presentation.cardHighlights.length > 0
        ? presentation.cardHighlights
        : line.capabilities,
    note: service?.displayPrice ?? service?.availabilityText ?? line.note,
  };
}
