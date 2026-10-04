import { formatPkrListPrice, physicalProductListPriceMinor } from '@cera/contracts';

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
  /** Variant list price in minor currency units (channel default). */
  readonly listPriceMinor: number;
  readonly displayPriceText: string | null;
  readonly availabilityText: string | null;
  readonly enquiryEnabled: boolean;
  readonly checkoutEnabled: boolean;
  readonly enabled: boolean;
  readonly internalNotes: string | null;
}

export const SEED_COLLECTIONS: readonly SeedCollection[] = [
  { slug: 'laboratory-research', name: 'Laboratory Research' },
  { slug: 'bioinformatics', name: 'Bioinformatics and Data Analysis' },
  { slug: 'evidence-reporting', name: 'Evidence and Reporting' },
  { slug: 'physical-products', name: 'Physical Products & Reagents' },
];

/** Shippable catalogue SKUs — keep in sync with `apps/web/src/content/products-catalog.ts`. */
export interface SeedPhysicalProduct {
  readonly sku: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly listPriceMinor: number;
  readonly displayPriceText: string | null;
  readonly stockOnHand: number;
}

function physicalProductSeed(
  sku: string,
  entry: Omit<SeedPhysicalProduct, 'sku' | 'listPriceMinor' | 'displayPriceText'>,
): SeedPhysicalProduct {
  const listPriceMinor = physicalProductListPriceMinor(sku);
  return {
    sku,
    ...entry,
    listPriceMinor,
    displayPriceText: formatPkrListPrice(listPriceMinor),
  };
}

export const SEED_PHYSICAL_PRODUCTS: readonly SeedPhysicalProduct[] = [
  physicalProductSeed('CR-CEL-8402', {
    name: 'CERA-GLIO-01: Authenticated Human Glioblastoma Multiforme Primary Cell Cohort',
    summary: 'Authenticated human glioblastoma primary cell cohort for RUO assays.',
    description:
      'Characterized panel comprising U87-MG and LN229 matched lineages with STR authentication, mycoplasma-free release, and cold-chain dispatch documentation.',
    stockOnHand: 12,
  }),
  physicalProductSeed('CR-MOL-1021', {
    name: 'CERA-QPCR-100: High-Fidelity SybrGreen qPCR Master Mix (2X)',
    summary: 'SybrGreen qPCR master mix for 96/384-well plates.',
    description:
      'Formulated with inert blue visualization dye for accurate plate loading. Chemical hot-start Taq polymerase with high sensitivity down to 2 template copies.',
    stockOnHand: 80,
  }),
  physicalProductSeed('CR-CEL-3091', {
    name: 'CERA-CELL-MG: Rat Striatal Primary Neuronal Culture Prep Kit',
    summary: 'Cryopreserved E18 primary neurons with validated recovery.',
    description:
      'Cryopreserved E18 primary neurons harvested under aseptic microdissection. Validated via Tuj1 and MAP2 immunofluorescence.',
    stockOnHand: 24,
  }),
  physicalProductSeed('CR-MOL-3012', {
    name: 'CERA-16S-LIB: 16S rRNA Amplicon Library Preparation Kit (96 Preps)',
    summary: 'Physical 16S/ITS library prep kit for Illumina workflows.',
    description:
      'Spin-column library prep kit for Illumina-compatible 16S/ITS amplicon sequencing with indexed adapters and batch-matched QC controls.',
    stockOnHand: 36,
  }),
  physicalProductSeed('CR-MOL-2045', {
    name: 'CERA-EXT-96: High-Yield Tissue & FFPE Nucleic Acid Extraction Kit',
    summary: 'FFPE and fibrous tissue nucleic acid extraction kit.',
    description:
      'Optimized for archived formalin-fixed paraffin-embedded biopsies and tough fibrous tissues with superior DIN/RIN recovery.',
    stockOnHand: 60,
  }),
  physicalProductSeed('CR-PRE-5510', {
    name: 'CERA-NEURO-IC: Neurotoxicity Assay & Biomarker Standard Panel',
    summary: 'Lyophilized neurotoxicity calibrator panel for assay validation.',
    description:
      'Striatal dopamine turnover, neuroinflammation indices, and microglial activation marker calibrators with HPLC-verified purity.',
    stockOnHand: 40,
  }),
  physicalProductSeed('CR-REG-1180', {
    name: 'CERA-BUF-RNA: RNase-Free Nucleic Acid Storage & Transport Buffer',
    summary: 'Sterile RNase-free buffer for specimen cold-chain transfer.',
    description:
      'Sterile, DEPC-treated buffer for short-term nucleic acid stabilization during cold-chain specimen transfer between laboratories.',
    stockOnHand: 120,
  }),
];

export const SEED_SERVICES: readonly SeedService[] = [
  {
    slug: 'preclinical-studies',
    name: 'Preclinical Studies',
    summary: 'Safety and efficacy testing in animal models, cells and computer simulations.',
    description:
      'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies may be in vivo in animal models, in vitro in cell-based systems, or in silico through computer simulation. Services include safety assessment, efficacy testing, toxicology, behavioural testing, cellular assays, pathway analysis, molecular docking, molecular dynamics and binding-energy analysis. Animal studies are designed and documented under a written protocol approved by the institutional animal ethics committee before work begins. Available research animals include mice, rats, rabbits and guinea pigs; available cell lines include glioblastoma and other cell lines held by the Cell Culture Lab. Current research areas include methamphetamine-induced neurotoxicity, social isolation stress, morphine dependence, nicotine, synthetic compounds in neuroscience, gut-induced depression, natural products in glioblastoma and in silico target studies. These are research services, not clinical care.',
    collectionSlug: 'laboratory-research',
    listPriceMinor: 450_000,
    displayPriceText: 'PKR 4,500',
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: true,
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
    listPriceMinor: 385_000,
    displayPriceText: 'PKR 3,850',
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: true,
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
    listPriceMinor: 295_000,
    displayPriceText: 'PKR 2,950',
    availabilityText: 'Typical delivery target: within 3 weeks, subject to project scope',
    enquiryEnabled: true,
    checkoutEnabled: true,
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
    listPriceMinor: 325_000,
    displayPriceText: 'PKR 3,250',
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: true,
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
    listPriceMinor: 275_000,
    displayPriceText: 'PKR 2,750',
    availabilityText: 'Proposal, timeline and cost agreed for each project',
    enquiryEnabled: true,
    checkoutEnabled: true,
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
