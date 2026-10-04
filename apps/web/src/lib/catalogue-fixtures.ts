import { PublicServiceSchema, type PublicService } from '@cera/contracts/projections';

/** Last-known catalogue copy when the shop API is unreachable (not used for marketing layout). */
const FIXTURE_ROWS: readonly { slug: string; title: string; summary: string }[] = [
  {
    slug: 'preclinical-studies',
    title: 'Preclinical Studies',
    summary:
      'Safety and efficacy testing in animal models, cells and computer simulations — scoped with ethics approval before samples move.',
  },
  {
    slug: 'molecular-research',
    title: 'Molecular Research',
    summary:
      'Molecular, biochemical and histological analysis of research samples conducted in validated biosafety environments.',
  },
  {
    slug: 'metagenomic-data-analysis',
    title: 'Metagenomic Data Analysis',
    summary:
      'Microbiome analysis from raw sequencing reads through QC, annotation, and publication-ready figures.',
  },
  {
    slug: 'biomedical-omics-data-analysis',
    title: 'Biomedical and Omics Data Analysis',
    summary:
      'Statistical and computational analysis of biological and clinical datasets with reproducible pipelines.',
  },
  {
    slug: 'evidence-synthesis-technical-reports',
    title: 'Evidence Synthesis and Technical Reports',
    summary:
      'Systematic reviews, meta-analyses, and technical reports that turn evidence into decisions.',
  },
];

export function fixturePublicServices(): PublicService[] {
  return FIXTURE_ROWS.map((row) =>
    PublicServiceSchema.parse({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      description: row.summary,
      category: null,
      displayPrice: null,
      availabilityText: null,
      enquiryEnabled: true,
      listPriceMinor: null,
      checkoutEnabled: false,
      mediaId: null,
    }),
  );
}

export const FIXTURE_SERVICE_SLUGS: readonly string[] = FIXTURE_ROWS.map((row) => row.slug);
