import { Heading, Text } from '@cera/ui/typography';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Microscope } from 'lucide-react';

import type { PublicProduct } from '@cera/contracts/projections';

import { FacilityMedia } from '../facility-media.tsx';
import { AppButtonLink, AppLink } from '../link.tsx';

import type { FeaturedProjectCard } from '../../lib/projects/getFeaturedProjects.ts';
import type { ReactNode } from 'react';

export interface HomeLandingCopy {
  readonly hero: {
    readonly eyebrow: string;
    readonly headlinePrimary: string;
    readonly headlineAccent: string;
    readonly body: string;
    readonly primaryLabel: string;
    readonly primaryHref: string;
    readonly secondaryLabel: string;
    readonly secondaryHref: string;
  };
  readonly services: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly body: string;
    readonly groups: readonly {
      readonly number: string;
      readonly title: string;
      readonly description: string;
      readonly href: string;
      readonly chips: readonly { readonly label: string; readonly href: string }[];
    }[];
  };
  readonly projects: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly body: string;
    readonly viewAllLabel: string;
    readonly viewAllHref: string;
    readonly emptyText: string;
  };
  readonly products: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly body: string;
    readonly viewAllLabel: string;
    readonly viewAllHref: string;
    readonly priceLabel: string;
    readonly emptyText: string;
  };
  readonly howWeWork: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly body: string;
    readonly linkLabel: string;
    readonly href: string;
  };
  readonly cta: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly body: string;
    readonly label: string;
    readonly href: string;
  };
}

export const DEFAULT_HOME_LANDING_COPY: HomeLandingCopy = {
  hero: {
    eyebrow: 'Biomedical research and development',
    headlinePrimary: 'Research that moves',
    headlineAccent: 'health forward',
    body: 'CERA Medical is an SECP-registered biomedical research and development company based in Haripur, Pakistan. We carry out preclinical and molecular laboratory studies and analyse biomedical and metagenomic data through to publication-ready results.',
    primaryLabel: 'Explore Services',
    primaryHref: '/services',
    secondaryLabel: 'Make an Enquiry',
    secondaryHref: '/contact#contact-form',
  },
  services: {
    eyebrow: 'Research services',
    heading: 'Our Services',
    body: '',
    groups: [
      {
        number: '01',
        title: 'Preclinical Studies',
        description:
          'Testing candidate treatments in animal models, in cells and by computer simulation.',
        href: '/services/preclinical-studies',
        chips: [
          { label: 'In vivo studies', href: '/services/preclinical-studies#in-vivo-studies' },
          { label: 'In vitro studies', href: '/services/preclinical-studies#in-vitro-studies' },
          { label: 'In silico studies', href: '/services/preclinical-studies#in-silico-studies' },
        ],
      },
      {
        number: '02',
        title: 'Molecular Research',
        description: 'Molecular, biochemical and histological analysis of research samples.',
        href: '/services/molecular-research',
        chips: [
          { label: 'PCR and RT-qPCR', href: '/services/molecular-research#pcr-and-rt-qpcr' },
          { label: 'ELISA', href: '/services/molecular-research#elisa' },
          { label: 'Western blot', href: '/services/molecular-research#western-blot' },
          { label: 'Sequencing', href: '/services/molecular-research#sequencing' },
          { label: 'Histopathology', href: '/services/molecular-research#histopathology' },
          {
            label: 'Immunohistochemistry',
            href: '/services/molecular-research#immunohistochemistry-and-immunofluorescence',
          },
        ],
      },
      {
        number: '03',
        title: 'Biomedical Data Analysis',
        description:
          'Metagenomic, health and omics data analysed through to publication-ready results.',
        href: '/services/biomedical-data-analysis',
        chips: [
          {
            label: 'Metagenomics',
            href: '/services/biomedical-data-analysis#metagenomics-and-microbiome-analysis',
          },
          {
            label: 'Health and clinical data',
            href: '/services/biomedical-data-analysis#health-and-clinical-data-analysis',
          },
          {
            label: 'Omics data',
            href: '/services/biomedical-data-analysis#omics-and-genomic-data-analysis',
          },
          {
            label: 'Evidence synthesis and reports',
            href: '/services/biomedical-data-analysis#evidence-synthesis-and-reports',
          },
        ],
      },
    ],
  },
  projects: {
    eyebrow: 'Research in practice',
    heading: 'Our Projects',
    body: 'Studies running in our laboratories and analyses we have completed.',
    viewAllLabel: 'View all projects',
    viewAllHref: '/projects',
    emptyText: 'Project features will appear here when published.',
  },
  products: {
    eyebrow: 'Research-use products',
    heading: 'Research Products',
    body: 'Research-use reagents, kits and cell preparations. Price on enquiry.',
    viewAllLabel: 'View catalogue',
    viewAllHref: '/products',
    priceLabel: 'Price on enquiry',
    emptyText: 'View the catalogue for currently listed research products.',
  },
  howWeWork: {
    eyebrow: 'How we work',
    heading: 'A clear path from scope to results',
    body: 'Every project starts with a written scope and protocol and ends with documented results and revision rounds. See how we work.',
    linkLabel: 'See the Methodology',
    href: '/methodology',
  },
  cta: {
    eyebrow: 'Start a conversation',
    heading: 'Ready to discuss your study?',
    body: 'Tell us about your samples, compounds or data. We reply within three working days.',
    label: 'Make an Enquiry',
    href: '/contact#contact-form',
  },
};

export function HomeLandingPage({
  projects,
  products,
  copy = DEFAULT_HOME_LANDING_COPY,
}: {
  readonly projects: readonly FeaturedProjectCard[];
  readonly products: readonly PublicProduct[];
  readonly copy?: HomeLandingCopy;
}) {
  return (
    <main>
      <section
        aria-labelledby="home-heading"
        className="relative isolate overflow-hidden bg-surface-tint"
      >
        <div className="mx-auto grid max-w-site items-center gap-10 px-6 py-14 sm:py-16 md:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-16 lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 text-eyebrow font-semibold tracking-[0.16em] text-accent uppercase">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              {copy.hero.eyebrow}
            </p>
            <Heading
              id="home-heading"
              level={1}
              size="display-1"
              className="max-w-[13ch] text-balance tracking-tight"
            >
              {copy.hero.headlinePrimary}{' '}
              <span className="text-primary">{copy.hero.headlineAccent}</span>
            </Heading>
            <Text size="body-lg" tone="muted" measure className="mt-6 max-w-2xl leading-relaxed">
              {copy.hero.body}
            </Text>
            <div className="mt-8 flex flex-wrap gap-3">
              <AppButtonLink
                href={copy.hero.primaryHref}
                variant="primary"
                size="lg"
                iconEnd={<ArrowRight size={17} aria-hidden="true" />}
              >
                {copy.hero.primaryLabel}
              </AppButtonLink>
              <AppButtonLink href={copy.hero.secondaryHref} variant="outline" size="lg">
                {copy.hero.secondaryLabel}
              </AppButtonLink>
            </div>
            <div className="mt-12 flex items-center gap-3 border-t border-border pt-5 text-caption font-medium text-muted">
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-primary">
                <Microscope size={17} aria-hidden="true" />
              </span>
              <span>Haripur, Pakistan</span>
              <span aria-hidden="true" className="text-border">
                /
              </span>
              <span>Research and development</span>
            </div>
          </div>

          <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[32rem]">
            <div className="absolute inset-[7%] rounded-full border border-primary/15" />
            <div className="absolute inset-[18%] rounded-full border border-primary/20" />
            <div className="absolute inset-[30%] rounded-full border border-accent/25" />
            <div className="absolute inset-[8%] rotate-45 rounded-[2.5rem] border border-primary/10" />
            <div className="absolute inset-[18%] -rotate-[30deg] rounded-[2.5rem] border border-accent/15" />
            <div className="absolute inset-[28%] flex flex-col items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
              <span className="font-wordmark text-5xl font-bold tracking-tight sm:text-6xl">
                CERA
              </span>
              <span className="mt-2 text-[0.65rem] font-semibold tracking-[0.3em] text-on-primary/80 uppercase">
                Medical
              </span>
            </div>
            <div className="absolute top-[13%] left-[18%] size-3 rounded-full bg-accent ring-8 ring-accent/10" />
            <div className="absolute right-[15%] bottom-[22%] size-2.5 rounded-full bg-primary ring-8 ring-primary/10" />
            <div className="absolute right-[12%] top-[30%] flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-sm">
              <ArrowUpRight size={19} />
            </div>
            <div className="absolute bottom-[9%] left-[24%] flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-primary shadow-sm">
              <ArrowDownRight size={19} />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="services-heading"
        className="border-t border-border bg-surface py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <SectionIntro
            eyebrow={copy.services.eyebrow}
            title={copy.services.heading}
            id="services-heading"
          >
            {copy.services.body}
          </SectionIntro>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {copy.services.groups.map((group) => (
              <article
                key={group.number}
                className="flex min-w-0 flex-col border-t-2 border-primary bg-surface-subtle p-5 sm:p-6"
              >
                <span className="font-wordmark text-sm font-semibold tracking-[0.14em] text-accent">
                  {group.number}
                </span>
                <Heading level={3} size="h4" className="mt-4">
                  {group.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2 min-h-[3.5rem]">
                  {group.description}
                </Text>
                <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                  {group.chips.map((chip) => (
                    <li key={chip.label}>
                      <AppLink
                        href={chip.href}
                        className="inline-flex min-h-9 items-center rounded-sm border border-border bg-surface px-3 py-1 text-caption font-medium text-primary no-underline transition-colors hover:border-primary hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {chip.label}
                      </AppLink>
                    </li>
                  ))}
                </ul>
                <AppLink
                  href={group.href}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold no-underline"
                >
                  Explore {group.title}
                  <ArrowRight size={16} aria-hidden="true" />
                </AppLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="projects-heading"
        className="border-t border-border bg-surface-tint-2 py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <SectionIntro
            eyebrow={copy.projects.eyebrow}
            title={copy.projects.heading}
            id="projects-heading"
            action={
              <AppLink
                href={copy.projects.viewAllHref}
                className="inline-flex min-h-11 items-center gap-2 font-semibold no-underline"
              >
                {copy.projects.viewAllLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </AppLink>
            }
          >
            {copy.projects.body}
          </SectionIntro>
          {projects.length > 0 ? (
            <ul className="mt-9 grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <li
                  key={project.id}
                  className="flex min-w-0 flex-col overflow-hidden border border-border bg-surface"
                >
                  {project.imageUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-subtle">
                      <FacilityMedia src={project.imageUrl} alt={project.imageAlt ?? ''} />
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex aspect-[16/9] items-end bg-primary p-5 text-on-primary"
                    >
                      <span className="font-wordmark text-4xl font-semibold tracking-tight opacity-80">
                        CERA / PROJECTS
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-2">
                      {project.category ? (
                        <span className="text-caption font-semibold text-accent">
                          {project.category}
                        </span>
                      ) : null}
                      {project.status ? (
                        <span className="rounded-sm border border-border px-2 py-0.5 text-caption text-muted">
                          {project.status}
                        </span>
                      ) : null}
                    </div>
                    <Heading level={3} size="h4" className="mt-3">
                      {project.title}
                    </Heading>
                    <Text size="body-sm" tone="muted" className="mt-2 flex-1">
                      {project.summary}
                    </Text>
                    <AppLink
                      href={project.href}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold no-underline"
                    >
                      View project
                      <ArrowRight size={16} aria-hidden="true" />
                    </AppLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-9 border border-border bg-surface px-5 py-6 text-body-sm text-muted">
              {copy.projects.emptyText}
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="products-heading"
        className="border-t border-border bg-surface py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <SectionIntro
            eyebrow={copy.products.eyebrow}
            title={copy.products.heading}
            id="products-heading"
            action={
              <AppLink
                href={copy.products.viewAllHref}
                className="inline-flex min-h-11 items-center gap-2 font-semibold no-underline"
              >
                {copy.products.viewAllLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </AppLink>
            }
          >
            {copy.products.body}
          </SectionIntro>
          {products.length > 0 ? (
            <ul className="mt-9 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => (
                <li
                  key={product.sku}
                  className="flex min-w-0 flex-col border border-border bg-surface"
                >
                  {product.imageUrl ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle">
                      <FacilityMedia src={product.imageUrl} alt="" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <Heading level={3} size="h4">
                      {product.title}
                    </Heading>
                    <Text size="body-sm" tone="muted" className="mt-2 flex-1">
                      {product.summary}
                    </Text>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="text-caption font-semibold text-accent">
                        {copy.products.priceLabel}
                      </span>
                      <AppLink
                        href={`/products/${encodeURIComponent(product.sku)}`}
                        className="inline-flex min-h-11 items-center gap-1 font-semibold no-underline"
                      >
                        Details
                        <ArrowRight size={15} aria-hidden="true" />
                      </AppLink>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-9 border border-border bg-surface-subtle px-5 py-6 text-body-sm text-muted">
              {copy.products.emptyText}
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="working-heading"
        className="border-t border-border bg-surface-tint py-12 sm:py-14"
      >
        <div className="mx-auto flex max-w-site flex-col gap-5 px-6 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <div>
            <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
              {copy.howWeWork.eyebrow}
            </Text>
            <Heading id="working-heading" level={2} size="h3" className="mt-2">
              {copy.howWeWork.heading}
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-2 max-w-3xl">
              {copy.howWeWork.body}
            </Text>
          </div>
          <AppButtonLink
            href={copy.howWeWork.href}
            variant="outline"
            iconEnd={<ArrowRight size={16} aria-hidden="true" />}
          >
            {copy.howWeWork.linkLabel}
          </AppButtonLink>
        </div>
      </section>

      <section
        aria-labelledby="contact-cta-heading"
        className="bg-primary py-14 text-on-primary sm:py-16"
      >
        <div className="mx-auto flex max-w-site flex-col gap-7 px-6 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <div className="max-w-2xl">
            <Text
              size="eyebrow"
              className="font-semibold tracking-[0.15em] text-on-primary/75 uppercase"
            >
              {copy.cta.eyebrow}
            </Text>
            <Heading id="contact-cta-heading" level={2} size="h2" className="mt-2 text-on-primary">
              {copy.cta.heading}
            </Heading>
            <Text size="body-lg" className="mt-3 text-on-primary/85">
              {copy.cta.body}
            </Text>
          </div>
          <AppButtonLink
            href={copy.cta.href}
            variant="on-dark"
            size="lg"
            iconEnd={<ArrowRight size={17} aria-hidden="true" />}
          >
            {copy.cta.label}
          </AppButtonLink>
        </div>
      </section>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  id,
  children,
  action,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly id: string;
  readonly children?: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
          {eyebrow}
        </Text>
        <Heading id={id} level={2} size="h2" className="mt-2">
          {title}
        </Heading>
        {children ? (
          <Text size="body-lg" tone="muted" className="mt-3 max-w-3xl">
            {children}
          </Text>
        ) : null}
      </div>
      {action}
    </div>
  );
}
