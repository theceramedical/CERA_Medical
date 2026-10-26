import { Heading, Text } from '@cera/ui/typography';

import { AppButtonLink, AppLink } from '../link.tsx';

interface ServiceCategory {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly subservices: readonly { readonly label: string; readonly anchor: string }[];
}

const CATEGORIES: readonly ServiceCategory[] = [
  {
    slug: 'preclinical-studies',
    title: 'Preclinical Studies',
    summary: 'Safety and efficacy testing in animal models, in cells and by computer simulation.',
    subservices: [
      { label: 'In vivo studies', anchor: 'in-vivo-studies' },
      { label: 'In vitro studies', anchor: 'in-vitro-studies' },
      { label: 'In silico studies', anchor: 'in-silico-studies' },
    ],
  },
  {
    slug: 'molecular-research',
    title: 'Molecular Research',
    summary: 'Molecular, biochemical and histological analysis of research samples.',
    subservices: [
      { label: 'PCR and RT-qPCR', anchor: 'pcr-and-rt-qpcr' },
      { label: 'ELISA', anchor: 'elisa' },
      { label: 'Western blot', anchor: 'western-blot' },
      { label: 'Sequencing', anchor: 'sequencing' },
      { label: 'Histopathology', anchor: 'histopathology' },
      { label: 'Immunohistochemistry and immunofluorescence', anchor: 'immunohistochemistry-and-immunofluorescence' },
      { label: 'Biochemical assays', anchor: 'biochemical-assays' },
      { label: 'Nucleic acid extraction', anchor: 'nucleic-acid-extraction' },
    ],
  },
  {
    slug: 'biomedical-data-analysis',
    title: 'Biomedical Data Analysis',
    summary: 'Metagenomic, health and omics data analysed through to publication-ready results.',
    subservices: [
      { label: 'Metagenomics and microbiome analysis', anchor: 'metagenomics-and-microbiome-analysis' },
      { label: 'Health and clinical data analysis', anchor: 'health-and-clinical-data-analysis' },
      { label: 'Omics and genomic data analysis', anchor: 'omics-and-genomic-data-analysis' },
      { label: 'Evidence synthesis and technical reports', anchor: 'evidence-synthesis-and-technical-reports' },
      { label: 'Image and behaviour analysis', anchor: 'image-and-behaviour-analysis' },
    ],
  },
];

export function ServicePortfolio() {
  return (
    <>
      <header className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" tone="muted">CERA MEDICAL</Text>
          <Heading level={1} size="h1" className="mt-3">Our Services</Heading>
          <Text size="body-lg" tone="muted" measure className="mt-4">
            CERA Medical supports biomedical research in three areas: preclinical studies, molecular research and biomedical data analysis. For every project we agree the scope, timeline and cost in writing before work begins.
          </Text>
        </div>
      </header>
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <ul className="grid list-none gap-6 p-0 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            return (
              <li key={category.slug} className="flex flex-col rounded-lg border border-border border-t-4 border-t-primary-700 bg-surface p-6 shadow-card">
                <Heading level={2} size="h3">{category.title}</Heading>
                <Text tone="muted" className="mt-3">{category.summary}</Text>
                <ul className="mt-5 flex flex-wrap gap-2 p-0">
                  {category.subservices.map((subservice) => (
                    <li key={subservice.anchor} className="list-none">
                      <AppLink
                        href={`/services/${category.slug}#${subservice.anchor}`}
                        className="inline-flex rounded-full border border-border bg-surface-tint px-3 py-1.5 text-caption text-heading no-underline hover:bg-surface-tint-2"
                      >
                        {subservice.label}
                      </AppLink>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-5">
                  <AppButtonLink href={`/services/${category.slug}`} variant="outline">Learn More</AppButtonLink>
                  <AppButtonLink href={`/contact?service=${category.slug}#contact-form`} variant="primary">Request Scoping</AppButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 border-t border-border pt-8">
          <Text size="body-lg" tone="muted">Tell us what you are studying, the samples or data involved and the results you need.</Text>
          <AppButtonLink href="/contact#contact-form" variant="primary" className="mt-4">Make an Enquiry</AppButtonLink>
        </div>
      </div>
    </>
  );
}
