/** CERA Medical's client-supplied public research service catalogue. */

export interface SeedCollection {
  readonly slug: string;
  readonly name: string;
}

export interface SeedService {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly collectionSlug: string;
  readonly displayPriceText: string | null;
  readonly availabilityText: string | null;
  readonly enquiryEnabled: boolean;
  readonly enabled: boolean;
  readonly internalNotes: string | null;
}

export const SEED_COLLECTIONS: readonly SeedCollection[] = [
  { slug: 'laboratory-research', name: 'Laboratory Research' },
  { slug: 'bioinformatics', name: 'Bioinformatics and Data Analysis' },
  { slug: 'evidence-reporting', name: 'Evidence and Reporting' },
];

export const SEED_SERVICES: readonly SeedService[] = [
  {
    slug: 'preclinical-studies',
    name: 'Preclinical Studies',
    summary: 'Safety and efficacy testing in animal models, cells and computer simulations.',
    description:
      'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies may be in vivo in animal models, in vitro in cell-based systems, or in silico through computer simulation. Services include safety assessment, efficacy testing, toxicology, behavioural testing, cellular assays, pathway analysis, molecular docking, molecular dynamics and binding-energy analysis. Animal studies are designed and documented under a written protocol approved by the institutional animal ethics committee before work begins. Available research animals include mice, rats, rabbits and guinea pigs; available cell lines include glioblastoma and other cell lines held by the Cell Culture Lab. Current research areas include methamphetamine-induced neurotoxicity, social isolation stress, morphine dependence, nicotine, synthetic compounds in neuroscience, gut-induced depression, natural products in glioblastoma and in silico target studies. These are research services, not clinical care.',
    collectionSlug: 'laboratory-research',
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'molecular-research',
    name: 'Molecular Research',
    summary: 'Molecular, biochemical and histological analysis of research samples.',
    description:
      'Wet-lab services are available as part of a study or on samples supplied by a client. Work includes Sanger sequencing, PCR-based genomic variant characterisation, RT-PCR gene-expression measurement, Western blot and ELISA protein analysis, biochemical assays for biomarkers including oxidative stress and inflammation, histopathology, microscopy, compound characterisation and method development. Methods can be developed and validated for project requirements, with protocols and performance data included in the agreed outputs. Samples are logged on receipt and handled under the conditions required by the assay. Human-derived samples must be coded and supplied without direct identifiers, with the required ethical approval and donor consent in place.',
    collectionSlug: 'laboratory-research',
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'metagenomic-data-analysis',
    name: 'Metagenomic Data Analysis',
    summary: 'Microbiome analysis from raw sequencing reads to publication-ready results.',
    description:
      'Metagenomic analysis covers whole-metagenome shotgun profiling, genome-resolved analysis and recovery of metagenome-assembled genomes, 16S and ITS amplicon analysis, functional annotation, comparative analysis and custom pipelines. Data can be retrieved from a sequencing provider, a secure link or a public repository such as NCBI SRA or ENA. Accepted inputs include FASTQ, FASTA or SRA accession numbers with sample metadata. Outputs can include quality-control reports, taxonomy and pathway tables, diversity and differential-abundance analyses, figures, methods text and a written report. The client copy gives a typical delivery target of three weeks; confirm the timeline during project scoping. Revisions and reviewer support are discussed and agreed for each project. Client data and human genetic material are handled only for the agreed analysis.',
    collectionSlug: 'bioinformatics',
    displayPriceText: null,
    availabilityText: 'Typical delivery target: within 3 weeks, subject to project scope',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'biomedical-omics-data-analysis',
    name: 'Biomedical and Omics Data Analysis',
    summary: 'Statistical and computational analysis of biological and clinical datasets.',
    description:
      'Analysis services include whole-genome and exome variant annotation and prioritisation, clinical and laboratory biostatistics, predictive modelling and biomarker panels with documented validation, image and video analysis, transcriptomic and other omics datasets, and re-analysis of public datasets. The project pipeline covers scoping, data intake and audit, cleaning and quality control, processing and annotation, statistical analysis and modelling, validation, reporting and revisions. Intended clients include research groups, hospitals and clinical laboratories, biotechnology and pharmaceutical companies, and public health institutions. Supply de-identified data unless a data-sharing agreement has been agreed before transfer.',
    collectionSlug: 'bioinformatics',
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'evidence-synthesis-technical-reports',
    name: 'Evidence Synthesis and Technical Reports',
    summary: 'Reviews, assessments and reports that turn evidence into decisions.',
    description:
      'CERA Medical prepares systematic reviews and meta-analyses reported to PRISMA standards, situation analyses and health-sector assessments, technical and donor reports, policy briefs, and analysis of survey and programme data. Work may draw on published literature, official statistics and client programme data. Outputs are tailored to the research question and agreed client format. Intended clients include United Nations agencies, international non-governmental organisations, ministries and health departments, hospitals, research consortia and donor-funded programmes. Health, clinical, survey and programme datasets should be de-identified unless a data-sharing agreement is in place before transfer.',
    collectionSlug: 'evidence-reporting',
    displayPriceText: null,
    availabilityText: 'Proposal, timeline and cost agreed for each project',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: null,
  },
];

/** Old demonstration catalogue entries are disabled during an idempotent reseed. */
export const RETIRED_SERVICE_SLUGS = [
  'general-health',
  'cardiology',
  'orthopaedics',
  'womens-health',
  'diagnostic-tests',
  'wellness-preventive-care',
  'travel-vaccinations',
] as const;
