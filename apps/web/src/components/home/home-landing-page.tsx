import { Heading, Text } from '@cera/ui/typography';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Dna,
  Microscope,
  ShieldCheck,
} from 'lucide-react';

import type { PublicProduct } from '@cera/contracts/projections';

import { FacilityMedia } from '../facility-media.tsx';
import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
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
    eyebrow: 'Biomedical Research and Development',
    headlinePrimary: 'Research that moves',
    headlineAccent: 'health forward',
    body: 'CERA Medical is an SECP-registered biomedical research and development company based in Haripur, Pakistan. We carry out specialized preclinical in vivo rodent and animal studies, molecular genetics work, and analyse biomedical and metagenomic data through to publication-ready results.',
    primaryLabel: 'Explore In Vivo & Lab Services',
    primaryHref: '/services',
    secondaryLabel: 'Request Preclinical Scoping',
    secondaryHref: '/contact#contact-form',
  },
  services: {
    eyebrow: 'Research Divisions',
    heading: 'Our Services',
    body: 'Three integrated research divisions covering in vivo animal models, molecular diagnostics, and publication-ready bioinformatic analysis.',
    groups: [
      {
        number: '01',
        title: 'Preclinical Studies',
        description:
          'Specialized animal models of disease, in vivo behavioural and drug testing in our Animal House, cell culture, and GPU simulations.',
        href: '/services/preclinical-studies',
        chips: [
          {
            label: 'In vivo rodent & mouse models',
            href: '/services/preclinical-studies#in-vivo-studies',
          },
          { label: 'In vitro cell assays', href: '/services/preclinical-studies#in-vitro-studies' },
          {
            label: 'In silico GPU dynamics',
            href: '/services/preclinical-studies#in-silico-studies',
          },
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
    body: 'Studies running in our animal house and molecular laboratories, alongside completed metagenomic cohorts.',
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
    eyebrow: 'Methodology & Ethics',
    heading: 'A disciplined path from protocol to publication',
    body: 'Every project starts with an agreed written scope and protocol, animal ethics review where in vivo models are involved, and documented revision rounds.',
    linkLabel: 'See our Methodology',
    href: '/methodology',
  },
  cta: {
    eyebrow: 'Preclinical & Study Scoping',
    heading: 'Ready to scope your in vivo or molecular study?',
    body: 'Tell us about your candidate compounds, animal model specifications, or sequencing datasets. We reply within three working days.',
    label: 'Start Study Scoping',
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
        className="relative isolate overflow-hidden border-b border-border bg-gradient-to-b from-surface-tint via-surface to-surface-tint-2"
      >
        <div className="relative mx-auto grid max-w-site items-center gap-12 px-6 py-14 sm:py-20 md:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-14 lg:py-24">
          <div className="relative z-10 max-w-3xl">
            {/* Live Vivarium & Ethics Status Bar */}
            <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/25 bg-surface px-4 py-1.5 text-caption font-semibold text-heading shadow-xs">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
              </span>
              <span className="text-primary font-bold">SPF Rodent Vivarium (Mus musculus)</span>
              <span className="text-muted">•</span>
              <span className="text-muted">BSL-2</span>
              <span className="text-muted">•</span>
              <span className="text-accent font-semibold">Institutional Ethics (IAEC)</span>
              <span className="text-muted">•</span>
              <span className="text-muted">SECP Registered</span>
            </div>

            <Heading
              id="home-heading"
              level={1}
              size="display-1"
              className="max-w-[14ch] text-balance tracking-tight"
            >
              {copy.hero.headlinePrimary}{' '}
              <span className="text-primary">{copy.hero.headlineAccent}</span>
            </Heading>

            <Text size="body-lg" tone="muted" measure className="mt-6 max-w-2xl leading-relaxed">
              {copy.hero.body}
            </Text>

            {/* Action buttons with touching laboratory research mouse badge */}
            <div className="mt-8 flex flex-col gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-surface px-3.5 py-1.5 shadow-xs">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <LabMouseIcon size={15} />
                </span>
                <span className="text-caption font-semibold tracking-tight text-foreground">
                  In Vivo Animal Models & Mus Musculus Research Facility
                </span>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-bold text-accent uppercase">
                  Animal House
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AppButtonLink
                  href={copy.hero.primaryHref}
                  variant="primary"
                  size="lg"
                  iconStart={
                    <LabMouseIcon
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                  }
                  iconEnd={<ArrowRight size={17} aria-hidden="true" />}
                >
                  {copy.hero.primaryLabel}
                </AppButtonLink>
                <AppButtonLink
                  href={copy.hero.secondaryHref}
                  variant="outline"
                  size="lg"
                  iconEnd={<ArrowRight size={16} aria-hidden="true" />}
                >
                  {copy.hero.secondaryLabel}
                </AppButtonLink>
              </div>

              {/* Research Model Focus Navigator Inspired by Charles River & JAX */}
              <div className="mt-2 flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[0.72rem] font-bold tracking-wider text-muted uppercase">
                  Focus Models:
                </span>
                <AppLink
                  href="/projects#methamphetamine-induced-neurotoxicity"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[0.75rem] font-semibold text-heading no-underline transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                >
                  <LabMouseIcon size={13} className="text-primary" />
                  Methamphetamine Neurotoxicity (Mouse Model)
                </AppLink>
                <AppLink
                  href="/projects#morphine-dependence"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[0.75rem] font-semibold text-heading no-underline transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                >
                  <LabMouseIcon size={13} className="text-primary" />
                  Morphine Dependence & Withdrawal
                </AppLink>
                <AppLink
                  href="/projects#social-isolation-stress"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[0.75rem] font-semibold text-heading no-underline transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                >
                  <LabMouseIcon size={13} className="text-primary" />
                  Social Isolation Stress
                </AppLink>
                <AppLink
                  href="/projects#natural-products-in-glioblastoma"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[0.75rem] font-semibold text-heading no-underline transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
                >
                  <Dna size={13} className="text-accent" />
                  Glioblastoma Therapeutics
                </AppLink>
              </div>
            </div>

            {/* 4 Pillars research capability strip */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-50 text-primary">
                  <LabMouseIcon size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-caption font-semibold text-heading">In Vivo Models</div>
                  <div className="truncate text-[0.72rem] text-muted">Mice & Rodents</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-50 text-primary">
                  <Microscope size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-caption font-semibold text-heading">Molecular Lab</div>
                  <div className="truncate text-[0.72rem] text-muted">Sanger & RT-qPCR</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-50 text-primary">
                  <Cpu size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-caption font-semibold text-heading">Tesla V100 GPU</div>
                  <div className="truncate text-[0.72rem] text-muted">In Silico Dynamics</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-50 text-primary">
                  <Building2 size={17} />
                </span>
                <div className="min-w-0">
                  <div className="text-caption font-semibold text-heading">SECP Registered</div>
                  <div className="truncate text-[0.72rem] text-muted">PAF-IAST Haripur</div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact Interactive Vivarium & Research Core Dashboard */}
          <div className="relative mx-auto w-full max-w-[28rem] rounded-2xl border border-primary/25 bg-surface p-6 shadow-xl lg:max-w-none">
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <LabMouseIcon size={18} />
                </div>
                <div>
                  <div className="text-caption font-bold tracking-tight text-heading">
                    CERA Vivarium & Research Core
                  </div>
                  <div className="text-[0.68rem] text-muted">Haripur, Pakistan • PAF-IAST</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary">
                <span className="size-1.5 rounded-full bg-accent" />
                Active Facilities
              </span>
            </div>

            {/* 3 Core Facilities Live Blocks */}
            <div className="mt-4 space-y-3">
              {/* Block 1: In Vivo Mus musculus Animal House */}
              <div className="rounded-xl border border-primary/20 bg-surface-subtle p-3.5 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary-50 text-primary">
                      <LabMouseIcon size={16} />
                    </span>
                    <span className="text-caption font-bold text-heading">
                      In Vivo Vivarium & Rodent Facility
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                    Mus musculus
                  </span>
                </div>
                <p className="mt-2 text-[0.75rem] text-copy">
                  SPF rodent barrier housing, open field & elevated plus maze behavioural tracking,
                  morphine & methamphetamine drug dependence models.
                </p>
                <div className="mt-2.5 flex items-center gap-3 border-t border-border/60 pt-2 text-[0.7rem] font-medium text-muted">
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 size={12} /> IAEC Ethics Approved
                  </span>
                  <span>•</span>
                  <span>GLP In Vivo Protocols</span>
                </div>
              </div>

              {/* Block 2: Molecular Core */}
              <div className="rounded-xl border border-border bg-surface-subtle p-3.5 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-teal-50 text-accent">
                      <Microscope size={16} />
                    </span>
                    <span className="text-caption font-bold text-heading">
                      Genomics & Histology Core
                    </span>
                  </div>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-bold text-accent">
                    BSL-2
                  </span>
                </div>
                <p className="mt-2 text-[0.75rem] text-copy">
                  Sanger sequencing, RT-qPCR gene expression, H&E & Nissl staining, Western blot,
                  and immunohistochemistry in PAF-IAST laboratories.
                </p>
                <div className="mt-2.5 flex items-center gap-3 border-t border-border/60 pt-2 text-[0.7rem] font-medium text-muted">
                  <span className="flex items-center gap-1 text-accent">
                    <Activity size={12} /> High-Throughput
                  </span>
                  <span>•</span>
                  <span>Validated Assays</span>
                </div>
              </div>

              {/* Block 3: Tesla V100 GPU Core */}
              <div className="rounded-xl border border-border bg-surface-subtle p-3.5 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary-50 text-primary">
                      <Cpu size={16} />
                    </span>
                    <span className="text-caption font-bold text-heading">
                      NVIDIA Tesla V100 Compute
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                    In Silico
                  </span>
                </div>
                <p className="mt-2 text-[0.75rem] text-copy">
                  Molecular docking, 100ns molecular dynamics simulations, and PRISMA systematic
                  evidence reviews.
                </p>
                <div className="mt-2.5 flex items-center gap-3 border-t border-border/60 pt-2 text-[0.7rem] font-medium text-muted">
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 size={12} /> Publication-Ready
                  </span>
                  <span>•</span>
                  <span>3-Week Delivery</span>
                </div>
              </div>
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-tint p-3 text-[0.72rem]">
              <span className="flex items-center gap-1.5 font-semibold text-heading">
                <ShieldCheck size={15} className="text-primary" />
                SECP Registered & GLP Principles
              </span>
              <AppLink
                href="/methodology"
                className="font-semibold text-primary no-underline hover:underline"
              >
                Our 5-Stage Methodology →
              </AppLink>
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
                className="flex min-w-0 flex-col border-t-2 border-primary bg-surface-subtle p-5 sm:p-6 shadow-2xs transition-shadow hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-wordmark text-sm font-semibold tracking-[0.14em] text-accent">
                    {group.number}
                  </span>
                  {group.number === '01' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-2.5 py-0.5 text-[0.7rem] font-bold text-primary">
                      <LabMouseIcon size={13} />
                      Animal House
                    </span>
                  ) : null}
                </div>
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
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-1 text-caption font-medium text-primary no-underline transition-colors hover:border-primary hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {group.number === '01' && chip.label.toLowerCase().includes('in vivo') ? (
                          <LabMouseIcon size={13} />
                        ) : null}
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
                  {group.number === '01' ? (
                    <LabMouseIcon
                      size={16}
                      className="text-primary transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <ArrowRight size={16} aria-hidden="true" />
                  )}
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
                      {project.category === 'Preclinical Studies' ||
                      project.title.toLowerCase().includes('neurotoxicity') ||
                      project.title.toLowerCase().includes('morphine') ||
                      project.title.toLowerCase().includes('stress') ||
                      project.title.toLowerCase().includes('nicotine') ||
                      project.title.toLowerCase().includes('gut-induced') ? (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-primary/20 bg-primary-50 px-2 py-0.5 text-caption font-semibold text-primary">
                          <LabMouseIcon size={12} />
                          Mouse Model
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
            <ul className="mt-9 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => {
                const isWellness = product.sku.startsWith('CERA-WELL');
                const isPreclinical =
                  product.sku.includes('PRE') ||
                  product.title.toLowerCase().includes('mouse') ||
                  product.title.toLowerCase().includes('animal');

                return (
                  <li
                    key={product.sku}
                    className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xs transition-all hover:border-primary/40 hover:shadow-card"
                  >
                    {/* Category Accent Stripe */}
                    <div
                      className={`h-1.5 w-full ${
                        isWellness ? 'bg-accent' : isPreclinical ? 'bg-primary' : 'bg-primary-300'
                      }`}
                    />

                    {product.imageUrl ? (
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle">
                        <FacilityMedia src={product.imageUrl} alt="" />
                      </div>
                    ) : null}

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[0.7rem] text-muted">#{product.sku}</span>
                        {isPreclinical ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary-50 px-2 py-0.5 text-[0.68rem] font-bold text-primary">
                            <LabMouseIcon size={12} />
                            In Vivo Rodent
                          </span>
                        ) : isWellness ? (
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.68rem] font-bold text-accent">
                            Botanical Wellness
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[0.68rem] font-semibold text-muted">
                            Laboratory Reagent
                          </span>
                        )}
                      </div>

                      <Heading level={3} size="h4" className="mt-3">
                        {product.title}
                      </Heading>

                      <Text size="body-sm" tone="muted" className="mt-2 flex-1 line-clamp-3">
                        {product.summary || product.description}
                      </Text>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <div>
                          <span className="text-[0.65rem] font-semibold tracking-wider text-muted uppercase">
                            Price
                          </span>
                          <div className="text-sm font-bold text-primary sm:text-base">
                            {product.displayPrice ?? 'Price on enquiry'}
                          </div>
                        </div>

                        <AppButtonLink
                          href={`/products/${encodeURIComponent(product.sku)}`}
                          variant="outline"
                          size="sm"
                          iconStart={
                            <LabMouseIcon
                              size={14}
                              className="text-primary transition-transform group-hover:scale-110"
                            />
                          }
                          iconEnd={<ArrowRight size={14} aria-hidden="true" />}
                        >
                          Enquire / View
                        </AppButtonLink>
                      </div>
                    </div>
                  </li>
                );
              })}
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
        aria-label="Institutional Collaborations"
        className="border-y border-border bg-surface-subtle py-10"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <span className="text-caption font-semibold tracking-[0.14em] text-muted uppercase">
              Institutional Collaborations & Partners
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <div className="flex items-center gap-3">
                <img
                  src="/images/partners/vet-tec.jpg"
                  alt="Vet Tec Health Care"
                  className="h-8 w-auto object-contain opacity-85 transition-opacity hover:opacity-100"
                  loading="lazy"
                />
                <span className="text-caption font-medium text-heading">Vet Tec Health Care</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/images/partners/sequel-pharma.png"
                  alt="Sequel Pharma"
                  className="h-7 w-auto object-contain opacity-85 transition-opacity hover:opacity-100"
                  loading="lazy"
                />
                <span className="text-caption font-medium text-heading">Sequel Pharma</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/images/partners/dost-kp.png"
                  alt="DG Science & Technology KP"
                  className="h-7 w-auto object-contain opacity-85 transition-opacity hover:opacity-100"
                  loading="lazy"
                />
                <span className="text-caption font-medium text-heading">DG Science & Tech KP</span>
              </div>
            </div>
          </div>
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
            iconStart={
              <LabMouseIcon size={19} className="transition-transform group-hover:scale-110" />
            }
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
