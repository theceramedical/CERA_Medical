import { formatPkrListPrice, physicalProductListPriceMinor } from '@cera/contracts';

/** Shippable laboratory products (RUO). Scoped research work lives under /services. */
export type ProductCategory =
  'cell-lines' | 'molecular' | 'preclinical' | 'reagents' | 'consumables';

export interface CatalogProduct {
  readonly sku: string;
  readonly category: ProductCategory;
  readonly categoryLabel: string;
  readonly title: string;
  readonly description: string;
  readonly specs: readonly string[];
  readonly packLabel: string;
  /** Vendure / checkout list price (PKR minor units). */
  readonly listPriceMinor: number;
  readonly price: string;
  readonly bsl?: '1' | '2';
  readonly inStock: boolean;
  /** Always physical goods: kits, cell lines, reagents, standards — not scoped services. */
  readonly fulfillment: 'physical';
  readonly shippingNote?: string;
  /** Vendure featured asset when the row comes from the live catalogue API. */
  readonly imageUrl?: string;
}

function catalogPrice(sku: string): { listPriceMinor: number; price: string } {
  const listPriceMinor = physicalProductListPriceMinor(sku);
  return { listPriceMinor, price: formatPkrListPrice(listPriceMinor) };
}

const featuredPrice = catalogPrice('CR-CEL-8402');

export const FEATURED_PRODUCT = {
  sku: 'CR-CEL-8402',
  title: 'CERA-GLIO-01: Authenticated Human Glioblastoma Multiforme Primary Cell Cohort',
  description:
    'Characterized panel comprising U87-MG & LN229 matched lineages. Sourced with complete donor consent, confirmed free of mycoplasma, bacteria, and viral contamination. Ideal for BBB penetrance, temozolomide resistance assays, and high-throughput drug screening.',
  badges: ['BSL-2', 'Cryogenic (-196°C)', 'STR Authenticated', 'Shippable'] as const,
  specs: [
    { label: 'Viability Post-Thaw', value: '> 92.4% (Trypan Blue)' },
    { label: 'Passage Number', value: 'Passage 4 (Documented)' },
    { label: 'Storage Condition', value: 'Vapor Phase LN2' },
    { label: 'Doubling Time', value: '~ 28.5 Hours' },
    { label: 'Format', value: '1.5 mL Cryovial (1.2×10⁶ cells)' },
    { label: 'Documentation', value: 'Complete CoA + STR Profile' },
  ] as const,
  listPriceMinor: featuredPrice.listPriceMinor,
  price: featuredPrice.price,
  priceNote: '(Checkout total in PKR; tiered academic pricing on request)',
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
    ...catalogPrice('CR-MOL-1021'),
    bsl: '1',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Ambient or cold-pack dispatch',
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
    ...catalogPrice('CR-CEL-3091'),
    bsl: '2',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Dry ice / LN₂ vapor shipper',
  },
  {
    sku: 'CR-MOL-3012',
    category: 'molecular',
    categoryLabel: 'Molecular Biology',
    title: 'CERA-16S-LIB: 16S rRNA Amplicon Library Preparation Kit (96 Preps)',
    description:
      'Physical spin-column library prep kit for Illumina-compatible 16S/ITS amplicon sequencing. Includes indexed adapters, bead cleanup reagents, and batch-matched QC controls.',
    specs: [
      '96 Reactions · Dual Indexing',
      'Validated on Illumina MiSeq / NovaSeq',
      'CoA with Lot-Matched Control Amplicons',
    ],
    packLabel: '96-Prep Kit',
    ...catalogPrice('CR-MOL-3012'),
    bsl: '1',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Cold-chain 2–8°C',
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
    ...catalogPrice('CR-MOL-2045'),
    bsl: '1',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Ambient shipping',
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
    ...catalogPrice('CR-PRE-5510'),
    bsl: '1',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Cold-pack dispatch',
  },
  {
    sku: 'CR-REG-1180',
    category: 'consumables',
    categoryLabel: 'Laboratory Consumables',
    title: 'CERA-BUF-RNA: RNase-Free Nucleic Acid Storage & Transport Buffer',
    description:
      'Sterile, DEPC-treated buffer for short-term nucleic acid stabilization during cold-chain specimen transfer between collaborating laboratories.',
    specs: [
      '500 mL Sterile PET Bottle',
      'Validated RNase/DNase-Free',
      'Compatible with Clinical Specimen Tubes',
    ],
    packLabel: '500 mL',
    ...catalogPrice('CR-REG-1180'),
    bsl: '1',
    inStock: true,
    fulfillment: 'physical',
    shippingNote: 'Ambient shipping',
  },
];

export const CATALOG_PRODUCT_COUNT = CATALOG_PRODUCTS.length;

/** SKUs that must exist in Vendure (`SEED_PHYSICAL_PRODUCTS`). */
export const PHYSICAL_PRODUCT_SKUS: readonly string[] = [
  FEATURED_PRODUCT.sku,
  ...CATALOG_PRODUCTS.map((product) => product.sku),
];

export const PRODUCT_CATEGORIES: readonly { id: 'all' | ProductCategory; label: string }[] = [
  { id: 'all', label: `All Products (${String(CATALOG_PRODUCT_COUNT)})` },
  { id: 'cell-lines', label: 'Primary & Tumor Cell Lines' },
  { id: 'molecular', label: 'Molecular & qPCR Assay Kits' },
  { id: 'preclinical', label: 'Preclinical Formulations' },
  { id: 'reagents', label: 'Antibodies & Reagents' },
  { id: 'consumables', label: 'Laboratory Consumables' },
];

export function productEnquiryHref(sku: string): string {
  return `/enquiry?product=${encodeURIComponent(sku)}`;
}

/** In-page anchor for a catalog card (`/products#…`). */
export function productCatalogAnchorId(sku: string): string {
  return `product-${sku.toLowerCase()}`;
}

export function productCatalogHref(sku: string): string {
  return `/products#${productCatalogAnchorId(sku)}`;
}

/** SEO-friendly product URL (`/products/cr-cel-8402`). */
export function productDetailPath(sku: string): string {
  return `/products/${encodeURIComponent(sku.toLowerCase())}`;
}

export function listCatalogSlugs(): readonly string[] {
  return [...new Set(PHYSICAL_PRODUCT_SKUS.map((sku) => sku.toLowerCase()))];
}

export type CatalogEntry =
  | {
      readonly kind: 'featured';
      readonly sku: string;
      readonly title: string;
      readonly description: string;
    }
  | { readonly kind: 'catalog'; readonly product: CatalogProduct };

export function findCatalogEntry(slug: string): CatalogEntry | null {
  const normalized = slug.trim().toLowerCase();
  if (normalized.length === 0) return null;
  if (FEATURED_PRODUCT.sku.toLowerCase() === normalized) {
    return {
      kind: 'featured',
      sku: FEATURED_PRODUCT.sku,
      title: FEATURED_PRODUCT.title,
      description: FEATURED_PRODUCT.description,
    };
  }
  const product = CATALOG_PRODUCTS.find((row) => row.sku.toLowerCase() === normalized);
  if (product === undefined) return null;
  return { kind: 'catalog', product };
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
