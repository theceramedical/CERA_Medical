import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

import type { ContentDocument } from '@cera/contracts';

import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
import { AppButtonLink, AppLink } from '../link.tsx';

interface ServiceSection {
  readonly anchor: string;
  readonly heading: string;
  readonly description?: string;
  readonly points?: readonly string[];
}

interface ServiceCategoryPage {
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly ServiceSection[];
}

const PAGES: Readonly<Record<string, ServiceCategoryPage>> = {
  'preclinical-studies': {
    title: 'Preclinical Studies',
    intro:
      'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies are carried out in animal models, in cell-based systems or by computer simulation. Animal studies begin only after the institutional animal ethics committee has approved the written protocol, and all studies are designed, conducted and documented in line with the principles of Good Laboratory Practice. These are research services, not clinical care.',
    sections: [
      {
        anchor: 'in-vivo-studies',
        heading: 'In vivo studies',
        description: 'Studies in animal models of disease, carried out in our Animal House.',
        points: [
          'Safety assessment: systematic evaluation of adverse effects and risk profiling',
          'Efficacy testing: measurement of treatment effect under controlled laboratory conditions',
          'Toxicology: toxic thresholds and dose-response relationships',
          'Behavioural testing: memory, anxiety-like behaviour and locomotor activity',
          'Available research animals: mice, rats, rabbits and guinea pigs.',
        ],
      },
      {
        anchor: 'in-vitro-studies',
        heading: 'In vitro studies',
        description: 'Cell-based models of disease, run in our Cell Culture Lab.',
        points: [
          'Cell-based disease models that reproduce the disease environment',
          'Cellular assays of viability, proliferation and function',
          'Pathway analysis of signalling cascades and disease mechanisms',
          'Therapeutic screening of natural products and other candidate treatments',
          'Available cell lines: glioblastoma and other cell lines held in the Cell Culture Lab.',
        ],
      },
      {
        anchor: 'in-silico-studies',
        heading: 'In silico studies',
        description:
          'Computational prediction of how a compound interacts with its protein targets, run on our GPU infrastructure.',
        points: [
          'Target selection from the disease pathway, prepared from published structures',
          'Molecular docking to predict binding site, pose and affinity, validated against known reference ligands',
          'Molecular dynamics to test whether the predicted complex is stable over time',
          'Binding energy analysis to estimate binding free energy and the residues that contribute most',
        ],
      },
      {
        anchor: 'why-it-matters',
        heading: 'Why it matters',
        description:
          'Preclinical testing reduces risk before human trials, identifies suitable dosing strategies, generates data that can support regulatory submissions and shortens drug development timelines.',
      },
    ],
  },
  'molecular-research': {
    title: 'Molecular Research',
    intro:
      'We provide molecular, biochemical and histological analysis of research samples in our Genomics, Histopathology and Microscopy Labs. Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
    sections: [
      {
        anchor: 'pcr-and-rt-qpcr',
        heading: 'PCR and RT-qPCR',
        description:
          'Quantification of gene expression by RT-qPCR, and PCR-based characterisation of genetic variants associated with disease.',
      },
      {
        anchor: 'elisa',
        heading: 'ELISA',
        description:
          'Quantification of protein biomarkers, including inflammatory markers, in serum, tissue homogenates and cell samples.',
      },
      {
        anchor: 'western-blot',
        heading: 'Western blot',
        description:
          'Detection and semi-quantitative analysis of protein expression in tissue and cell lysates.',
      },
      {
        anchor: 'sequencing',
        heading: 'Sequencing',
        description:
          'Sanger sequencing for confirmation of PCR products and targeted genetic variants.',
      },
      {
        anchor: 'histopathology',
        heading: 'Histopathology',
        description:
          'Tissue processing and sectioning, H&E and Nissl staining, and quantitative image analysis of tissue sections.',
      },
      {
        anchor: 'immunohistochemistry-and-immunofluorescence',
        heading: 'Immunohistochemistry and immunofluorescence',
        description:
          'Detection and localisation of target proteins in tissue sections, imaged by brightfield and fluorescence microscopy.',
      },
      {
        anchor: 'biochemical-assays',
        heading: 'Biochemical assays',
        description:
          'Detection and quantification of biomarkers in tissue, serum and cell samples, including markers of oxidative stress and inflammation.',
      },
      {
        anchor: 'nucleic-acid-extraction',
        heading: 'Nucleic acid extraction',
        description:
          'DNA and RNA extraction from tissue, cells and blood, with quality control before downstream analysis.',
      },
      {
        anchor: 'sending-samples',
        heading: 'Sending samples',
        description:
          'Please contact us before sending any material so that we can confirm the samples, hazards, shipping arrangements and timing for your project. Remaining samples are returned on request or destroyed under our Data Retention Policy.',
      },
    ],
  },
  'biomedical-data-analysis': {
    title: 'Biomedical Data Analysis',
    intro:
      "We analyse biomedical data from raw files through to publication-ready figures, tables and results text, with metagenomics as our speciality. Data are supplied de-identified, remain the client's property, are kept confidential and are deleted in line with our Data Retention Policy.",
    sections: [
      {
        anchor: 'metagenomics-and-microbiome-analysis',
        heading: 'Metagenomics and microbiome analysis',
        description: 'Metagenomics is our speciality.',
        points: [
          'Whole metagenome shotgun: full characterisation of the microbial community from raw reads',
          'Genome-resolved metagenomics: recovery, quality assessment and classification of metagenome-assembled genomes',
          '16S and ITS amplicon analysis: taxonomic profiling of bacteria, fungi and eukaryotes',
          'Functional annotation: pathway and gene ontology mapping of microbial communities',
          'Comparative metagenomics: alpha and beta diversity and differential abundance across sample groups',
          'Data deposition: preparation and submission of raw reads and metadata to NCBI SRA',
        ],
      },
      {
        anchor: 'from-your-data-to-your-manuscript',
        heading: 'From your data to your manuscript',
        points: [
          "Data retrieval: we download the data directly from your sequencing provider's server or cloud link, or from public repositories such as NCBI SRA and ENA by accession number. You do not need to transfer files yourself.",
          'Analysis: quality control, profiling, statistics and visualisation with the pipeline agreed for your study.',
          'Delivery: publication-ready figures, result tables, a methods text and a written description of the results, typically within three weeks.',
          'Revisions: figures, analyses and text are revised with you over multiple rounds.',
          'Support until completion: we remain available for questions from co-authors and journal reviewers until the work is completed.',
          'Data we work with: shotgun reads from Illumina and DNBSEQ platforms; 16S rRNA and ITS amplicon reads; human gut, oral and salivary samples and environmental samples; cross-sectional and longitudinal cohorts; new data from a sequencing provider and published datasets for re-analysis or meta-analysis. Accepted formats are FASTQ, FASTA or SRA accession numbers, with sample metadata in a spreadsheet.',
        ],
      },
      {
        anchor: 'health-and-clinical-data-analysis',
        heading: 'Health and clinical data analysis',
        points: [
          'Biostatistics of patient, cohort, survey and laboratory datasets',
          'Programme and survey data analysed for technical and donor reports, with charts, maps and annexed tables',
          'Predictive models and biomarker panels with documented validation',
        ],
      },
      {
        anchor: 'omics-and-genomic-data-analysis',
        heading: 'Omics and genomic data analysis',
        points: [
          'Genomic variant analysis: annotation and prioritisation of variants from whole-genome and exome sequencing against clinical and population databases',
          'Transcriptomic and other omics data: RNA-seq differential expression and pathway analysis, and other omics on request',
          'Public dataset re-analysis: retrieval and re-analysis of published datasets for new questions and meta-analyses',
        ],
      },
      {
        anchor: 'evidence-synthesis-and-technical-reports',
        heading: 'Evidence synthesis and technical reports',
        points: [
          'Systematic reviews and meta-analyses reported to the PRISMA standard',
          'Situation analyses and health-sector assessments of a health problem, service or facility',
          "Technical and donor reports written in the client's format",
          'Policy briefs: short, evidence-based summaries for decision-makers',
        ],
      },
      {
        anchor: 'image-and-behaviour-analysis',
        heading: 'Image and behaviour analysis',
        description:
          'Automated quantification of histology images and of animal behaviour recordings.',
      },
      {
        anchor: 'who-this-is-for',
        heading: 'Who this is for',
        description:
          'Research groups and professors with data awaiting analysis; hospitals and clinical laboratories; pharmaceutical and biotech companies; public health institutions; UN agencies, international NGOs, ministries and donor-funded programmes.',
      },
    ],
  },
};

function ServiceSection({ section }: { readonly section: ServiceSection }) {
  const isVivo = section.anchor === 'in-vivo-studies';

  return (
    <section
      id={section.anchor}
      className="scroll-mt-28 rounded-2xl border border-border bg-surface p-6 shadow-2xs sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2} size="h3">
          {section.heading}
        </Heading>
        {isVivo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-3 py-1 text-caption font-bold text-primary">
            <LabMouseIcon size={14} />
            Mus musculus Vivarium
          </span>
        ) : null}
      </div>

      {section.description ? (
        <Text tone="muted" measure className="mt-3 text-body leading-relaxed">
          {section.description}
        </Text>
      ) : null}

      {section.points ? (
        <ul className="mt-5 grid gap-2.5 p-0 sm:grid-cols-1">
          {section.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-subtle p-3.5"
            >
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-accent" />
              <span className="text-body-sm font-medium text-copy">{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}

function cmsSections(
  document: ContentDocument | null | undefined,
): readonly ServiceSection[] | null {
  if (!Array.isArray(document?.layout)) return null;
  const layout: readonly unknown[] = document.layout as readonly unknown[];
  const block = layout.find((item) => isRecord(item) && item.blockType === 'serviceSections');
  if (!isRecord(block) || !Array.isArray(block.sections)) return null;
  const sections = block.sections.flatMap((item): ServiceSection[] => {
    if (!isRecord(item) || typeof item.anchor !== 'string' || typeof item.heading !== 'string')
      return [];
    const points = Array.isArray(item.points)
      ? item.points.flatMap((point): string[] =>
          isRecord(point) && typeof point.text === 'string' ? [point.text] : [],
        )
      : undefined;
    return [
      {
        anchor: item.anchor,
        heading: item.heading,
        ...(typeof item.description === 'string' ? { description: item.description } : {}),
        ...(points === undefined || points.length === 0 ? {} : { points }),
      },
    ];
  });
  return sections.length > 0 ? sections : null;
}

function pageContent(slug: string, document?: ContentDocument | null): ServiceCategoryPage | null {
  const page = PAGES[slug];
  if (!page) return null;
  const sections = cmsSections(document);
  if (sections === null) return page;
  const title = document?.title.trim();
  const intro = document?.excerpt?.trim();
  return {
    title: title === undefined || title.length === 0 ? page.title : title,
    intro: intro === undefined || intro.length === 0 ? page.intro : intro,
    sections,
  };
}

export function CategoryServiceDetails({
  slug,
  document,
}: {
  readonly slug: string;
  readonly document?: ContentDocument | null;
}) {
  const page = pageContent(slug, document);
  if (!page) return null;
  const isPreclinical = slug === 'preclinical-studies';

  return (
    <>
      <header className="border-b border-border bg-gradient-to-b from-surface-tint via-surface to-surface-tint-2">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <AppLink href="/services" className="text-body-sm font-semibold text-primary">
            ← All Research Divisions
          </AppLink>

          {isPreclinical ? (
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/25 bg-surface px-3.5 py-1 text-caption font-semibold text-heading shadow-xs">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary-50 text-primary">
                <LabMouseIcon size={13} />
              </span>
              <span className="text-primary font-bold">SPF Animal Vivarium</span>
              <span className="text-muted">•</span>
              <span className="text-accent font-semibold">Mus musculus Disease Models</span>
              <span className="text-muted">•</span>
              <span className="text-muted">IAEC Ethical Review</span>
            </div>
          ) : null}

          <Heading level={1} size="h1" className="mt-3 max-w-3xl">
            {page.title}
          </Heading>

          <Text size="body-lg" tone="muted" measure className="mt-4 max-w-3xl leading-relaxed">
            {page.intro}
          </Text>

          {/* Quick jump anchor navigator */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border/70 pt-6">
            <span className="text-[0.72rem] font-bold tracking-wider text-muted uppercase">
              Jump to capability:
            </span>
            {page.sections.map((section) => (
              <a
                key={section.anchor}
                href={`#${section.anchor}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[0.75rem] font-semibold text-heading no-underline transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
              >
                {section.anchor === 'in-vivo-studies' ? (
                  <LabMouseIcon size={12} className="text-primary" />
                ) : null}
                {section.heading}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="max-w-4xl space-y-8">
          {page.sections.map((section) => (
            <ServiceSection key={section.anchor} section={section} />
          ))}

          {isPreclinical ? (
            <div className="rounded-2xl border border-primary/25 bg-surface-tint p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface text-primary shadow-xs">
                  <LabMouseIcon size={22} />
                </span>
                <div>
                  <div className="font-bold text-heading text-lg">
                    Current In Vivo Research Cohorts & Studies
                  </div>
                  <div className="text-caption text-muted">
                    Explore active mouse models of addiction, stress, and natural product
                    neuroprotection
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <AppButtonLink
                  href="/projects"
                  variant="primary"
                  iconStart={<LabMouseIcon size={15} />}
                  iconEnd={<ArrowRight size={16} aria-hidden="true" />}
                >
                  View Active Animal House Projects
                </AppButtonLink>
              </div>
            </div>
          ) : null}

          {/* Canonical 5-stage methodology callout */}
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xs">
            <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-accent uppercase">
              <Sparkles size={16} />
              Quality & Ethical Rigor
            </div>
            <Heading level={2} size="h3" className="mt-2">
              Our 5-Stage Scientific Methodology
            </Heading>
            <Text tone="muted" className="mt-3 leading-relaxed">
              Every project starts with a written scope and protocol and ends with documented
              results and revision rounds. Animal studies begin only after Institutional Animal
              Ethics Committee (IAEC) protocol review.
            </Text>
            <div className="mt-4">
              <AppLink href="/methodology" className="inline-flex font-semibold text-primary">
                Explore our 5-Stage Methodology →
              </AppLink>
            </div>
          </section>

          {/* Enquiry Action Band */}
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-r from-surface to-surface-tint p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-primary uppercase">
              <ShieldCheck size={16} />
              Study Initiation
            </div>
            <Heading level={2} size="h3" className="mt-2">
              Ready to scope your {page.title.toLowerCase()} study?
            </Heading>
            <Text tone="muted" className="mt-3 max-w-2xl leading-relaxed">
              Tell us about your candidate compounds, cell lines, or dataset specifications. Our
              study directors reply within three working days with a detailed protocol scope.
            </Text>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <AppButtonLink
                href={`/contact?service=${slug}#contact-form`}
                variant="primary"
                size="lg"
                iconStart={
                  <LabMouseIcon size={16} className="transition-transform group-hover:scale-110" />
                }
                iconEnd={<ArrowRight size={16} aria-hidden="true" />}
              >
                Scope Your Study
              </AppButtonLink>
              <AppButtonLink href="/projects" variant="outline" size="lg">
                Browse Projects
              </AppButtonLink>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export function serviceCategoryMetadata(
  slug: string,
  document?: ContentDocument | null,
): Pick<ServiceCategoryPage, 'title' | 'intro'> | null {
  const page = pageContent(slug, document);
  return page === null ? null : { title: page.title, intro: page.intro };
}
