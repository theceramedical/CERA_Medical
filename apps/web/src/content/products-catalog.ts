export type ProductCategory = 'catalogue' | 'wellness' | 'reagents' | 'preclinical';

export interface CatalogProduct {
  readonly sku: string;
  readonly category: ProductCategory;
  readonly categoryLabel: string;
  readonly title: string;
  readonly description: string;
  readonly specs: readonly string[];
  readonly packLabel: string;
  readonly listPriceMinor: number | null;
  readonly checkoutEnabled?: boolean;
  readonly price?: string;
  readonly bsl?: '1' | '2';
  readonly inStock: boolean | null;
  readonly fulfillment: 'physical';
  readonly shippingNote?: string;
  readonly imageUrl?: string;
  readonly ingredients?: readonly string[];
  readonly keyBenefits?: readonly string[];
  readonly directions?: string;
  readonly isMouseModel?: boolean;
}

export const PRODUCT_CATEGORIES: readonly { id: 'all' | ProductCategory; label: string }[] = [
  { id: 'all', label: 'All Products' },
  { id: 'wellness', label: 'Natural Wellness Range' },
  { id: 'reagents', label: 'Laboratory Reagents & Kits' },
  { id: 'preclinical', label: 'Preclinical & Animal Research' },
];

export const VERIFIED_PORTFOLIO_PRODUCTS: readonly CatalogProduct[] = [
  {
    sku: 'CERA-WELL-01',
    category: 'wellness',
    categoryLabel: 'Natural Wellness Range',
    title: 'Mosscent: Plant-Based Mosquito Repellent',
    description:
      'Plant-based, DEET-free repellent engineered for long-lasting protection with a gentle herbal aroma. Formulated with soothing botanical extracts in a smooth spray matrix. Gentle on skin and family-safe (ages 3+).',
    specs: [
      'Plant-based & 100% DEET-Free',
      'Smooth Xanthan Gum Spray Matrix',
      '7-8 Hour Outdoor Protection',
      'Gentle & Family-Safe (Ages 3+)',
    ],
    packLabel: '100ml Spray Bottle',
    price: 'PKR 600',
    listPriceMinor: 60000,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
    ingredients: [
      'Natural aromatic plant extracts',
      'Xanthan gum spray matrix',
      'Botanical herbal essences',
    ],
    keyBenefits: [
      'Repels mosquitoes & biting insects',
      'Zero synthetic DEET or harsh chemicals',
      'Lightweight, pleasant herbal scent for outdoor & home use',
    ],
    directions:
      'Apply evenly to exposed skin and clothing before going outdoors. Reapply every 7-8 hours or as needed.',
  },
  {
    sku: 'CERA-WELL-02',
    category: 'wellness',
    categoryLabel: 'Natural Wellness Range',
    title: 'Activ-P: Fast-Absorbing Pain-Relief Botanical Oil',
    description:
      'Fast-absorbing topical therapeutic oil crafted to comfort sore muscles, occupational strain, and stiff joints. The warming-cooling botanical blend supports microcirculation with massage and leaves zero sticky residue.',
    specs: [
      'Clove (Laung) & Ginger Essential Oil',
      'Cold-Pressed Virgin Olive Oil Base',
      'Effective for Occupational Strain & Spasms',
      'Rapid Cutaneous Absorption, Non-Sticky',
    ],
    packLabel: '60ml Dropper Bottle',
    price: 'PKR 1,400',
    listPriceMinor: 140000,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
    ingredients: [
      'Clove (laung) extract',
      'Ginger oil',
      'Virgin olive oil',
      'Botanical therapeutic extracts',
    ],
    keyBenefits: [
      'Soothes muscular tension & joint stiffness',
      'Relief for occupational pain and associated spasms',
      'Supports healthy circulation through targeted massage',
    ],
    directions:
      'Massage a few drops onto affected area (neck, knees, back, shoulders) 2-3 times daily until fully absorbed.',
  },
  {
    sku: 'CERA-WELL-03',
    category: 'wellness',
    categoryLabel: 'Natural Wellness Range',
    title: 'Zest: Inhalable Herbal Sinus & Nasal Relief Vapor',
    description:
      'Non-drowsy aromatic inhalable vapor delivering quick relief to help clear nasal stuffiness, sinus pressure, and seasonal airway congestion within minutes. Non-oral, pocket-friendly aromatic relief.',
    specs: [
      'Pure Menthol & Thyme Extract',
      'Refreshing Eucalyptus Essential Oil',
      'Green Tea Extract Antioxidant Aroma',
      'Non-Drowsy Daytime & Nighttime Formula',
    ],
    packLabel: 'Pocket Inhaler',
    price: 'PKR 200',
    listPriceMinor: 20000,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
    ingredients: ['Menthol', 'Thyme extract', 'Eucalyptus oil', 'Green tea extract aroma'],
    keyBenefits: [
      'Clears nasal congestion within minutes',
      'Eases sinus pressure & tension headaches',
      'Compact, non-drowsy aromatherapy on the go',
    ],
    directions:
      'Open cap and inhale vapors deeply through each nostril as needed. Non-oral; for external inhalation only.',
  },
  {
    sku: 'CR-MOL-1021',
    category: 'reagents',
    categoryLabel: 'Molecular Reagents',
    title: 'CERA-QPCR-100: High-Fidelity SybrGreen qPCR Master Mix (2X)',
    description:
      '2X concentrated SybrGreen real-time PCR master mix formulated with inert blue loading visualization dye and chemical hot-start Taq polymerase. Validated sensitivity down to 2 template copies for accurate gene expression profiling.',
    specs: [
      'Chemical Hot-Start Taq Polymerase',
      'Inert Blue Visual Loading Dye',
      'Broad Dynamic Range (7 orders of magnitude)',
      'Compatible with 96/384-Well Real-Time Instruments',
    ],
    packLabel: '200 Reactions (2 x 1.25 ml)',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
  },
  {
    sku: 'CR-MOL-3012',
    category: 'reagents',
    categoryLabel: 'Metagenomic Kits',
    title: 'CERA-16S-LIB: 16S rRNA Amplicon Library Preparation Kit (96 Preps)',
    description:
      'Complete spin-column library preparation kit for dual-indexed Illumina sequencing targeting hypervariable regions (V3-V4). Includes high-fidelity proofreading polymerase and batch-matched mock community QC controls.',
    specs: [
      'Dual-Indexed Illumina Adapter System',
      'Includes Batch-Matched QC Controls',
      'Validated on Gut, Oral, and Soil Microbiomes',
      'High-Fidelity Library Construction',
    ],
    packLabel: '96 Reactions',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
  },
  {
    sku: 'CR-MOL-2045',
    category: 'reagents',
    categoryLabel: 'Nucleic Acid Extraction',
    title: 'CERA-EXT-96: High-Yield Tissue & FFPE Nucleic Acid Extraction Kit',
    description:
      'Magnetic bead-based extraction system optimized for archived formalin-fixed paraffin-embedded (FFPE) biopsies and fibrous animal tissues with superior DIN/RIN recovery for Next-Gen sequencing.',
    specs: [
      'Optimized for Formalin-Fixed Tissues',
      'High DIN/RIN Recovery for NGS & Sanger',
      'Reverses Formalin-Induced Crosslinks',
      'Automation & Manual Protocol Ready',
    ],
    packLabel: '96 Preps',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
  },
  {
    sku: 'CR-CEL-3091',
    category: 'preclinical',
    categoryLabel: 'Preclinical & In Vivo',
    title: 'CERA-CELL-MG: Primary Rodent Neural Cell Prep & Culture System',
    description:
      'Cryopreserved primary rodent neural cells harvested under microdissection from validated SPF animal house colonies (Mus musculus / Rattus norvegicus). Validated post-thaw viability > 85% with Tuj1 and MAP2 immunofluorescence.',
    specs: [
      'Harvested from Certified SPF Rodent Colonies',
      'Post-Thaw Viability > 85%',
      'Validated by Tuj1/MAP2 Immunofluorescence',
      'Batch-Tested for In Vitro Neurotoxicity Assays',
    ],
    packLabel: '1 x 10^6 Viable Cells/Vial',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
    isMouseModel: true,
  },
  {
    sku: 'CR-PRE-5510',
    category: 'preclinical',
    categoryLabel: 'Preclinical & In Vivo',
    title: 'CERA-NEURO-IC: In Vivo Neurotoxicity & Addiction Biomarker Panel',
    description:
      'Lyophilized neurotoxicity and drug-dependence biomarker calibrator panel for assay validation in rodent behavioral and pharmacological models (methamphetamine exposure, morphine dependence, and stress paradigms).',
    specs: [
      'Striatal Dopamine Turnover Standard (DOPAC/HVA)',
      'Neuroinflammation Indices (TNF-alpha, IL-1beta)',
      'HPLC-Verified Standard Purity (> 98%)',
      'Calibrated for Behavioral Rodent Model Readouts',
    ],
    packLabel: 'Assay Calibrator Set',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
    isMouseModel: true,
  },
  {
    sku: 'CR-REG-1180',
    category: 'reagents',
    categoryLabel: 'Specimen Buffers',
    title: 'CERA-BUF-RNA: RNase-Free Nucleic Acid Storage & Transport Buffer',
    description:
      'Sterile, DEPC-treated stabilization buffer for short-term nucleic acid stabilization during cold-chain specimen transfer between laboratories and field collection sites.',
    specs: [
      'DEPC-Treated & Certified RNase/DNase-Free',
      'Specimen Cold-Chain Stabilization',
      'Maintains RNA Integrity Score (RIN > 8)',
      'Autoclaved & Sterile Filtered (0.22 um)',
    ],
    packLabel: '500 ml Bottle',
    price: 'Price on enquiry',
    listPriceMinor: null,
    checkoutEnabled: false,
    inStock: true,
    fulfillment: 'physical',
  },
];

export function productEnquiryHref(sku: string): string {
  return `/contact?product=${encodeURIComponent(sku)}#contact-form`;
}

export function productCatalogAnchorId(sku: string): string {
  return `product-${sku.toLowerCase()}`;
}

export function productCatalogHref(sku: string): string {
  return `/products#${productCatalogAnchorId(sku)}`;
}

export function productDetailPath(sku: string): string {
  return `/products/${encodeURIComponent(sku.toLowerCase())}`;
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
    if (params.inStock === true && product.inStock !== true) return false;
    if (query.length === 0) return true;
    const haystack =
      `${product.sku} ${product.title} ${product.description} ${product.categoryLabel} ${product.specs.join(' ')}`.toLowerCase();
    return haystack.includes(query);
  });
}
