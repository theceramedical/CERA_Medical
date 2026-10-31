import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, BarChart3, Microscope, ShieldCheck } from 'lucide-react';

import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
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
      {
        label: 'Immunohistochemistry and immunofluorescence',
        anchor: 'immunohistochemistry-and-immunofluorescence',
      },
      { label: 'Biochemical assays', anchor: 'biochemical-assays' },
      { label: 'Nucleic acid extraction', anchor: 'nucleic-acid-extraction' },
    ],
  },
  {
    slug: 'biomedical-data-analysis',
    title: 'Biomedical Data Analysis',
    summary: 'Metagenomic, health and omics data analysed through to publication-ready results.',
    subservices: [
      {
        label: 'Metagenomics and microbiome analysis',
        anchor: 'metagenomics-and-microbiome-analysis',
      },
      { label: 'Health and clinical data analysis', anchor: 'health-and-clinical-data-analysis' },
      { label: 'Omics and genomic data analysis', anchor: 'omics-and-genomic-data-analysis' },
      {
        label: 'Evidence synthesis and technical reports',
        anchor: 'evidence-synthesis-and-technical-reports',
      },
      { label: 'Image and behaviour analysis', anchor: 'image-and-behaviour-analysis' },
    ],
  },
];

export function ServicePortfolio() {
  return (
    <>
      <header className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" tone="muted">
            CERA MEDICAL
          </Text>
          <Heading level={1} size="h1" className="mt-3">
            Our Services
          </Heading>
          <Text size="body-lg" tone="muted" measure className="mt-4">
            CERA Medical supports biomedical research in three areas: preclinical studies, molecular
            research and biomedical data analysis. For every project we agree the scope, timeline
            and cost in writing before work begins.
          </Text>
        </div>
      </header>
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <ul className="grid list-none gap-6 p-0 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const isPreclinical = category.slug === 'preclinical-studies';
            const isMolecular = category.slug === 'molecular-research';

            return (
              <li
                key={category.slug}
                className="flex flex-col rounded-2xl border border-border border-t-4 border-t-primary bg-surface p-6 sm:p-7 shadow-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    {isPreclinical ? (
                      <LabMouseIcon size={20} />
                    ) : isMolecular ? (
                      <Microscope size={20} />
                    ) : (
                      <BarChart3 size={20} />
                    )}
                  </span>

                  {isPreclinical ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-2.5 py-1 text-[0.7rem] font-bold text-primary">
                      <LabMouseIcon size={13} />
                      Animal House Vivarium
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[0.7rem] font-semibold text-muted">
                      {isMolecular ? 'BSL-2 Lab Core' : 'GPU Compute'}
                    </span>
                  )}
                </div>

                <Heading level={2} size="h3" className="mt-4">
                  {category.title}
                </Heading>
                <Text tone="muted" className="mt-3 min-h-[3rem] leading-relaxed">
                  {category.summary}
                </Text>

                <ul className="mt-5 flex flex-wrap gap-2 p-0">
                  {category.subservices.map((subservice) => (
                    <li key={subservice.anchor} className="list-none">
                      <AppLink
                        href={`/services/${category.slug}#${subservice.anchor}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-tint px-3 py-1.5 text-caption font-medium text-heading no-underline transition-colors hover:border-primary hover:bg-surface-tint-2"
                      >
                        {isPreclinical && subservice.anchor === 'in-vivo-studies' ? (
                          <LabMouseIcon size={12} className="text-primary" />
                        ) : null}
                        {subservice.label}
                      </AppLink>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-5">
                  <AppButtonLink
                    href={`/services/${category.slug}`}
                    variant="outline"
                    iconStart={
                      isPreclinical ? (
                        <LabMouseIcon
                          size={14}
                          className="transition-transform group-hover:scale-110"
                        />
                      ) : undefined
                    }
                  >
                    Learn More
                  </AppButtonLink>
                  <AppButtonLink
                    href={`/contact?service=${category.slug}#contact-form`}
                    variant="primary"
                    iconStart={
                      isPreclinical ? (
                        <LabMouseIcon
                          size={14}
                          className="transition-transform group-hover:scale-110"
                        />
                      ) : undefined
                    }
                    iconEnd={<ArrowRight size={14} aria-hidden="true" />}
                  >
                    Request Scoping
                  </AppButtonLink>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Bottom Banner */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-surface-tint p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-primary uppercase">
                <ShieldCheck size={16} />
                Study Directors & Protocol Scoping
              </div>
              <Heading level={2} size="h3" className="mt-2">
                Need to initiate a study protocol?
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-1 max-w-2xl">
                Tell us what you are studying, candidate compounds, samples or omics data involved.
                We provide agreed written scopes and revision rounds.
              </Text>
            </div>
            <AppButtonLink
              href="/contact#contact-form"
              variant="primary"
              size="lg"
              iconStart={
                <LabMouseIcon size={16} className="transition-transform group-hover:scale-110" />
              }
              iconEnd={<ArrowRight size={16} aria-hidden="true" />}
            >
              Make an Enquiry
            </AppButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
