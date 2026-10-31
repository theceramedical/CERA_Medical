import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, BarChart3, CheckCircle2, Microscope, ShieldCheck } from 'lucide-react';

import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
import { AppButtonLink, AppLink } from '../link.tsx';

interface ServicePillar {
  readonly slug: string;
  readonly pillarNumber: string;
  readonly title: string;
  readonly facilityTag: string;
  readonly badge: string;
  readonly summary: string;
  readonly keyCapabilities: readonly {
    readonly title: string;
    readonly description: string;
  }[];
  readonly anchors: readonly { readonly label: string; readonly anchor: string }[];
}

const SERVICE_PILLARS: readonly ServicePillar[] = [
  {
    slug: 'preclinical-studies',
    pillarNumber: '01',
    title: 'Preclinical Studies',
    facilityTag: 'Animal House Vivarium',
    badge: 'In Vivo • In Vitro • In Silico',
    summary:
      'Rigorous efficacy, pharmacokinetic, and safety profiling in rodent disease models, validated cell cultures, and GPU-driven molecular simulations.',
    keyCapabilities: [
      {
        title: 'In Vivo Rodent Disease Models',
        description:
          'Mus musculus SPF housing, behavioral tracking, neurotoxicity, and dose-response pharmacology.',
      },
      {
        title: 'In Vitro Cell Assays & Screening',
        description:
          'Primary cell cultures, glioblastoma models, cytotoxicity assays, and drug mechanism profiling.',
      },
      {
        title: 'In Silico GPU Molecular Dynamics',
        description:
          'NVIDIA Tesla V100 molecular docking, target binding affinity estimation, and 100ns trajectory simulations.',
      },
      {
        title: 'Ethical Protocol & IAEC Oversight',
        description:
          'Institutional Animal Ethics Committee oversight and GLP-aligned written study documentation.',
      },
    ],
    anchors: [
      { label: 'In vivo studies', anchor: 'in-vivo-studies' },
      { label: 'In vitro studies', anchor: 'in-vitro-studies' },
      { label: 'In silico studies', anchor: 'in-silico-studies' },
    ],
  },
  {
    slug: 'molecular-research',
    pillarNumber: '02',
    title: 'Molecular Research',
    facilityTag: 'BSL-2 Lab Core',
    badge: 'Genomics • Proteomics • Histology',
    summary:
      'Quantitative molecular assays, immunoassay cascades, histology, and nucleic acid sequencing for translational biomedical research.',
    keyCapabilities: [
      {
        title: 'Quantitative RT-qPCR & PCR',
        description:
          'Precision gene expression profiling, primer design, and validated target RNA/DNA quantitation.',
      },
      {
        title: 'ELISA Panels & Western Blotting',
        description:
          'Quantitative biomarker detection, protein electrophoresis, and validated antibody probing.',
      },
      {
        title: 'Histopathology & Fluorescent Imaging',
        description:
          'H&E, Nissl tissue staining, immunohistochemistry (IHC), and high-resolution fluorescence microscopy.',
      },
      {
        title: 'Sanger Sequencing & Extraction',
        description:
          'High-yield DNA/RNA extraction protocols followed by Sanger capillary sequencing verification.',
      },
    ],
    anchors: [
      { label: 'PCR and RT-qPCR', anchor: 'pcr-and-rt-qpcr' },
      { label: 'ELISA & Western blot', anchor: 'elisa' },
      { label: 'Histopathology & IHC', anchor: 'histopathology' },
      { label: 'Sanger Sequencing', anchor: 'sequencing' },
      { label: 'Biochemical assays', anchor: 'biochemical-assays' },
    ],
  },
  {
    slug: 'biomedical-data-analysis',
    pillarNumber: '03',
    title: 'Biomedical Data Analysis',
    facilityTag: 'GPU Compute Infrastructure',
    badge: 'Metagenomics • Biostatistics • Omics',
    summary:
      'End-to-end computational biology pipelines, clinical biostatistics, and PRISMA systematic evidence synthesis for publication-ready impact.',
    keyCapabilities: [
      {
        title: 'Metagenomics & Microbiome Profiling',
        description:
          'Whole-genome shotgun sequencing, 16S/ITS rRNA profiling, and alpha/beta taxonomic diversity analysis.',
      },
      {
        title: 'Health & Clinical Biostatistics',
        description:
          'Longitudinal cohort analytics, clinical trial biostatistics, and survival modeling for clinical studies.',
      },
      {
        title: 'Omics & Transcriptomics Pipelines',
        description:
          'RNA-seq differential expression, functional pathway enrichment, and public dataset re-analysis.',
      },
      {
        title: 'PRISMA Evidence Synthesis',
        description:
          'Systematic reviews, meta-analyses, and publication-ready scientific dossiers adhering to PRISMA.',
      },
    ],
    anchors: [
      { label: 'Metagenomics & microbiome', anchor: 'metagenomics-and-microbiome-analysis' },
      { label: 'Clinical biostatistics', anchor: 'health-and-clinical-data-analysis' },
      { label: 'Omics pipelines', anchor: 'omics-and-genomic-data-analysis' },
      { label: 'PRISMA reviews', anchor: 'evidence-synthesis-and-technical-reports' },
    ],
  },
];

export function ServicePortfolio() {
  return (
    <>
      <header className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-3 py-1 text-caption font-bold text-primary">
              <LabMouseIcon size={14} />
              PRECLINICAL • MOLECULAR • DATA
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-caption font-semibold text-muted">
              <ShieldCheck size={14} />
              AGREED WRITTEN PROTOCOLS
            </span>
          </div>
          <Heading level={1} size="h1" className="mt-4">
            Our Research Services
          </Heading>
          <Text size="body-lg" tone="muted" measure className="mt-4 leading-relaxed">
            CERA Medical supports biomedical research across three integrated divisions: preclinical
            rodent studies, wet-lab molecular research, and biomedical data analysis. For every
            project we agree the scope, timeline, milestones, and deliverables in writing before
            work begins.
          </Text>
        </div>
      </header>

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <ul className="grid list-none gap-8 p-0 lg:grid-cols-3 items-stretch">
          {SERVICE_PILLARS.map((pillar) => {
            const isPreclinical = pillar.slug === 'preclinical-studies';
            const isMolecular = pillar.slug === 'molecular-research';

            return (
              <li
                key={pillar.slug}
                className="flex h-full flex-col justify-between rounded-2xl border border-border border-t-4 border-t-primary bg-surface p-6 sm:p-7 shadow-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary shadow-xs">
                        {isPreclinical ? (
                          <LabMouseIcon size={22} />
                        ) : isMolecular ? (
                          <Microscope size={22} />
                        ) : (
                          <BarChart3 size={22} />
                        )}
                      </span>
                      <div>
                        <span className="text-[0.68rem] font-bold tracking-wider text-muted uppercase">
                          Pillar {pillar.pillarNumber}
                        </span>
                        <div className="text-[0.72rem] font-medium text-accent">{pillar.badge}</div>
                      </div>
                    </div>

                    {isPreclinical ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-2.5 py-1 text-[0.7rem] font-bold text-primary">
                        <LabMouseIcon size={13} />
                        {pillar.facilityTag}
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[0.7rem] font-semibold text-muted">
                        {pillar.facilityTag}
                      </span>
                    )}
                  </div>

                  <Heading level={2} size="h3" className="mt-5">
                    {pillar.title}
                  </Heading>
                  <Text tone="muted" className="mt-2.5 min-h-[3rem] text-body-sm leading-relaxed">
                    {pillar.summary}
                  </Text>

                  {/* Core Capabilities Structured Checklist */}
                  <div className="mt-6 border-t border-border/70 pt-5">
                    <div className="text-[0.68rem] font-bold tracking-wider text-heading uppercase">
                      Core Capabilities & Methods
                    </div>
                    <ul className="mt-3.5 space-y-3.5 list-none p-0">
                      {pillar.keyCapabilities.map((cap) => (
                        <li key={cap.title} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                            {isPreclinical ? (
                              <LabMouseIcon size={12} className="shrink-0 text-primary" />
                            ) : (
                              <CheckCircle2 size={13} className="shrink-0" />
                            )}
                          </span>
                          <div className="text-body-sm leading-snug">
                            <span className="font-semibold text-heading block">{cap.title}</span>
                            <span className="text-muted block text-caption mt-0.5 leading-normal">
                              {cap.description}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Methodology Deep Links */}
                  <div className="mt-6 border-t border-border/70 pt-4">
                    <div className="mb-2 text-[0.65rem] font-bold tracking-wider text-muted uppercase">
                      Explore Topics
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pillar.anchors.map((item) => (
                        <AppLink
                          key={item.anchor}
                          href={`/services/${pillar.slug}#${item.anchor}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-tint px-2.5 py-1 text-[0.72rem] font-medium text-heading no-underline transition-colors hover:border-primary hover:bg-surface-tint-2"
                        >
                          {item.label}
                        </AppLink>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons: Aligned across all 3 cards! */}
                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-5">
                  <AppButtonLink
                    href={`/services/${pillar.slug}`}
                    variant="outline"
                    className="w-full justify-center text-center text-body-sm font-semibold"
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
                    href={`/contact?service=${pillar.slug}#contact-form`}
                    variant="primary"
                    className="w-full justify-center text-center text-body-sm font-semibold"
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
        <div className="mt-14 rounded-2xl border border-primary/20 bg-surface-tint p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-primary uppercase">
                <ShieldCheck size={16} />
                Study Directors & Protocol Scoping
              </div>
              <Heading level={2} size="h3" className="mt-2">
                Need to initiate a study protocol?
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-1 max-w-2xl leading-relaxed">
                Tell us what you are studying, candidate compounds, samples or omics data involved.
                We provide agreed written scopes, ethical oversight, and transparent revision
                rounds.
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
