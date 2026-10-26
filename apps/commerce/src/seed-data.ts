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
  return {
    sku,
    ...entry,
    listPriceMinor: 0,
    displayPriceText: null,
  };
}

export const SEED_PHYSICAL_PRODUCTS: readonly SeedPhysicalProduct[] = [
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
    summary: 'Safety and efficacy testing in animal models, in cells and by computer simulation.',
    description:
      'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies are carried out in animal models, in cell-based systems or by computer simulation. Animal studies begin only after the institutional animal ethics committee has approved the written protocol, and all studies are designed, conducted and documented in line with the principles of Good Laboratory Practice. These are research services, not clinical care.',
    collectionSlug: 'laboratory-research',
    listPriceMinor: 0,
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: false,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'molecular-research',
    name: 'Molecular Research',
    summary: 'Molecular, biochemical and histological analysis of research samples.',
    description:
      'We provide molecular, biochemical and histological analysis of research samples in our Genomics, Histopathology and Microscopy Labs. Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
    collectionSlug: 'laboratory-research',
    listPriceMinor: 0,
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: false,
    enabled: true,
    internalNotes: null,
  },
  {
    slug: 'biomedical-data-analysis',
    name: 'Biomedical Data Analysis',
    summary: 'Metagenomic, health and omics data analysed through to publication-ready results.',
    description:
      "We analyse biomedical data from raw files through to publication-ready figures, tables and results text, with metagenomics as our speciality. Data are supplied de-identified, remain the client's property, are kept confidential and are deleted in line with our Data Retention Policy.",
    collectionSlug: 'bioinformatics',
    listPriceMinor: 0,
    displayPriceText: null,
    availabilityText: 'Scope, timeline and cost agreed in writing for each project',
    enquiryEnabled: true,
    checkoutEnabled: false,
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
  'metagenomic-data-analysis',
  'biomedical-omics-data-analysis',
  'evidence-synthesis-technical-reports',
] as const;
