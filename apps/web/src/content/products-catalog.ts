export type ProductCategory =
  'cell-lines' | 'molecular' | 'preclinical' | 'bioinformatics' | 'reagents';

export interface CatalogProduct {
  readonly sku: string;
  readonly category: ProductCategory;
  readonly categoryLabel: string;
  readonly title: string;
  readonly description: string;
  readonly specs: readonly string[];
  readonly packLabel: string;
  readonly price: string;
  readonly bsl?: '1' | '2';
  readonly inStock: boolean;
}

export const PRODUCT_CATEGORIES: readonly { id: 'all' | ProductCategory; label: string }[] = [
  { id: 'all', label: 'All Products (28)' },
  { id: 'cell-lines', label: 'Primary & Tumor Cell Lines' },
  { id: 'molecular', label: 'Molecular & qPCR Assay Kits' },
  { id: 'preclinical', label: 'Preclinical Formulations' },
  { id: 'bioinformatics', label: 'Bioinformatics Nextflow Workflows' },
  { id: 'reagents', label: 'Antibodies & Reagents' },
];

export const FEATURED_PRODUCT = {
  sku: 'CR-CEL-8402',
  title: 'CERA-GLIO-01: Authenticated Human Glioblastoma Multiforme Primary Cell Cohort',
  description:
    'Characterized panel comprising U87-MG & LN229 matched lineages. Sourced with complete donor consent, confirmed free of mycoplasma, bacteria, and viral contamination. Ideal for BBB penetrance, temozolomide resistance assays, and high-throughput drug screening.',
  badges: ['BSL-2', 'Cryogenic (-196°C)', 'STR Authenticated'] as const,
  specs: [
    { label: 'Viability Post-Thaw', value: '> 92.4% (Trypan Blue)' },
    { label: 'Passage Number', value: 'Passage 4 (Documented)' },
    { label: 'Storage Condition', value: 'Vapor Phase LN2' },
    { label: 'Doubling Time', value: '~ 28.5 Hours' },
    { label: 'Format', value: '1.5 mL Cryovial (1.2×10⁶ cells)' },
    { label: 'Documentation', value: 'Complete CoA + STR Profile' },
  ] as const,
  price: '$480.00',
  priceNote: '(Tiered Academic Pricing)',
  imageSrc: '/images/article-cover-lab.svg',
  imageCaption: 'Automated Micromanipulation Suite',
} as const;

export const CATALOG_PRODUCTS: readonly CatalogProduct[] = [
  {
    sku: 'CR-MOL-1021',
    category: 'molecular',
    categoryLabel: 'Molecular Biology',
    title: 'CERA-QPCR-100: High-Fidelity SybrGreen qPCR Master Mix (2X)',
    description:
      'Formulated with inert blue visualization dye for accurate 96/384-well plate loading. Features chemical hot-start Taq polymerase with high sensitivity down to 2 template copies.',
    specs: [
      '500 Reactions (5 × 1 mL)',
      '-20°C Stability: 18 Months',
      'Universal ROX Reference Compatibility',
    ],
    packLabel: 'Standard Pack',
    price: '$165.00',
    bsl: '1',
    inStock: true,
  },
  {
    sku: 'CR-CEL-3091',
    category: 'cell-lines',
    categoryLabel: 'Cellular Models',
    title: 'CERA-CELL-MG: Rat Striatal Primary Neuronal Culture Prep Kit',
    description:
      'Cryopreserved E18 primary neurons harvested under aseptic microdissection. Validated via Tuj1 and MAP2 immunofluorescence with 95% post-thaw recovery rate.',
    specs: [
      '1×10⁶ Viable Neurons / Cryovial',
      'Complete Neurobasal Plus Supplement',
      'GLP Phenotype Quality Certificate',
    ],
    packLabel: 'Vial + Supplements',
    price: '$340.00',
    bsl: '2',
    inStock: true,
  },
  {
    sku: 'CR-BIO-9014',
    category: 'bioinformatics',
    categoryLabel: 'Bioinformatics',
    title: 'CERA-FLOW-PIPE: Clinical 16S/ITS Metagenomics Nextflow Pipeline v2.4',
    description:
      'Containerized reproducible pipeline (Docker / Singularity). Fully supports Illumina paired-end and Oxford Nanopore reads with automated GATK4 and QIIME2 reporting.',
    specs: [
      'POSIX/SLURM/AWS Batch Ready',
      'MultiQC Interactive Report Generator',
      'Includes 1-Year Pipeline Patch Support',
    ],
    packLabel: 'Lab Enterprise License',
    price: '$890.00',
    inStock: true,
  },
  {
    sku: 'CR-MOL-2045',
    category: 'reagents',
    categoryLabel: 'Reagents & Kits',
    title: 'CERA-EXT-96: High-Yield Tissue & FFPE Nucleic Acid Extraction Kit',
    description:
      'Optimized for archived formalin-fixed paraffin-embedded biopsies and tough fibrous tissues. Delivers superior DIN/RIN recovery with minimal cross-linking residues.',
    specs: [
      '96 Preparations Spin-Column Format',
      'Optimized De-crosslinking Buffers',
      'Validated on Qubit 4 Fluorometer',
    ],
    packLabel: '96 Preps',
    price: '$210.00',
    bsl: '1',
    inStock: true,
  },
  {
    sku: 'CR-PRE-5510',
    category: 'preclinical',
    categoryLabel: 'Assay Standards',
    title: 'CERA-NEURO-IC: Neurotoxicity Assay & Biomarker Standard Panel',
    description:
      'Designed for striatal dopamine turnover, neuroinflammation indices, and microglial activation markers (Iba-1 & GFAP quantification).',
    specs: [
      '6 Recombinant Calibrator Standards',
      'Lyophilized at < 2% Moisture',
      'HPLC-Verified Purity > 98.5%',
    ],
    packLabel: 'Panel Kit',
    price: '$295.00',
    bsl: '1',
    inStock: true,
  },
  {
    sku: 'CR-BIO-4102',
    category: 'bioinformatics',
    categoryLabel: 'In Silico Tools',
    title: 'CERA-PRISMA-TOOL: Molecular Docking & MD Simulation Scripts',
    description:
      'Curated and tested automation framework for GROMACS 2024, AutoDock Vina, and MM-PBSA energetic decomposition across high-performance GPU clusters.',
    specs: [
      'Automated RMSD/RMSF Parsing',
      'Python 3.11 Conda Environment Manifest',
      'Pre-configured SLURM Job Schedulers',
    ],
    packLabel: 'Digital Download License',
    price: '$320.00',
    inStock: true,
  },
];

export function productEnquiryHref(sku: string): string {
  return `/enquiry?product=${encodeURIComponent(sku)}`;
}

export function filterCatalog(
  products: readonly CatalogProduct[],
  params: {
    readonly q?: string;
    readonly category?: string;
    readonly bsl?: string;
    readonly inStock?: boolean;
  },
): CatalogProduct[] {
  const query = params.q?.trim().toLowerCase() ?? '';
  return products.filter((product) => {
    if (
      params.category !== undefined &&
      params.category !== 'all' &&
      product.category !== params.category
    ) {
      return false;
    }
    if (params.bsl === '1' && product.bsl !== '1') return false;
    if (params.bsl === '2' && product.bsl !== '2') return false;
    if (params.inStock === true && !product.inStock) return false;
    if (query.length === 0) return true;
    const haystack =
      `${product.sku} ${product.title} ${product.description} ${product.categoryLabel}`.toLowerCase();
    return haystack.includes(query);
  });
}
