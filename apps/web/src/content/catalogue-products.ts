import { formatPkrListPrice, physicalProductListPriceMinor } from '@cera/contracts';

import type { PublicProduct } from '@cera/contracts/projections';

/**
 * Shippable catalogue entries. Used when the public product API has not
 * returned a row yet, so the homepage can still show the catalogue.
 */
const CATALOGUE_ROWS: readonly { sku: string; title: string; summary: string }[] = [
  {
    sku: 'CR-CEL-8402',
    title: 'CERA-GLIO-01: Authenticated Human Glioblastoma Multiforme Primary Cell Cohort',
    summary: 'Authenticated human glioblastoma primary cell cohort for research-use assays.',
  },
  {
    sku: 'CR-MOL-1021',
    title: 'CERA-QPCR-100: High-Fidelity SybrGreen qPCR Master Mix (2X)',
    summary: 'SybrGreen qPCR master mix for 96- and 384-well plates.',
  },
  {
    sku: 'CR-CEL-3091',
    title: 'CERA-CELL-MG: Rat Striatal Primary Neuronal Culture Prep Kit',
    summary: 'Cryopreserved E18 primary neurons with validated recovery.',
  },
  {
    sku: 'CR-MOL-3012',
    title: 'CERA-16S-LIB: 16S rRNA Amplicon Library Preparation Kit (96 Preps)',
    summary: 'Physical 16S/ITS library prep kit for Illumina workflows.',
  },
  {
    sku: 'CR-MOL-2045',
    title: 'CERA-EXT-96: High-Yield Tissue & FFPE Nucleic Acid Extraction Kit',
    summary: 'FFPE and fibrous tissue nucleic acid extraction kit.',
  },
  {
    sku: 'CR-PRE-5510',
    title: 'CERA-NEURO-IC: Neurotoxicity Assay & Biomarker Standard Panel',
    summary: 'Lyophilized neurotoxicity calibrator panel for assay validation.',
  },
  {
    sku: 'CR-REG-1180',
    title: 'CERA-BUF-RNA: RNase-Free Nucleic Acid Storage & Transport Buffer',
    summary: 'Sterile RNase-free buffer for specimen cold-chain transfer.',
  },
];

export function catalogueProducts(): readonly PublicProduct[] {
  return CATALOGUE_ROWS.map((row) => {
    const listPriceMinor = physicalProductListPriceMinor(row.sku);
    return {
      sku: row.sku,
      title: row.title,
      summary: row.summary,
      description: row.summary,
      displayPrice: formatPkrListPrice(listPriceMinor),
      availabilityText: 'Research use only. Availability is confirmed before dispatch.',
      listPriceMinor,
      checkoutEnabled: false,
      enquiryEnabled: true,
      imageUrl: null,
    };
  });
}

export function catalogueProductBySku(sku: string): PublicProduct | null {
  const normalized = sku.trim().toLowerCase();
  return catalogueProducts().find((product) => product.sku.toLowerCase() === normalized) ?? null;
}

export interface ProductMedia {
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly videoSrc?: string;
}

/**
 * Photographs and clips that show the material itself: reagents, tubes, or the
 * assay those products are used for. Instruments and procedures stay off this map.
 */
export const PRODUCT_MEDIA: Readonly<Record<string, ProductMedia>> = {
  'CR-MOL-1021': {
    imageSrc: '/images/products/qpcr-assay.jpg',
    imageAlt: 'qPCR amplification plot and plate map from a master-mix run.',
    videoSrc: '/videos/products/qpcr-assay.mp4',
  },
  'CR-MOL-2045': {
    imageSrc: '/images/products/sample-tubes.jpg',
    imageAlt: 'Capped sample tubes loaded for nucleic acid extraction.',
    videoSrc: '/videos/products/sample-tubes.mp4',
  },
  'CR-MOL-3012': {
    imageSrc: '/images/products/tube-preparation.jpg',
    imageAlt: 'Labelled tubes prepared before library construction.',
    videoSrc: '/videos/products/tube-preparation.mp4',
  },
  'CR-REG-1180': {
    imageSrc: '/images/products/weighed-reagent.jpg',
    imageAlt: 'Weighed laboratory reagent in a capped bottle.',
    videoSrc: '/videos/products/weighed-reagent.mp4',
  },
  'CR-PRE-5510': {
    imageSrc: '/images/facility/plate-reader.jpg',
    imageAlt: 'Microplate reader used to read the biomarker panel.',
  },
  'CR-CEL-8402': {
    imageSrc: '/images/products/cell-imaging.jpg',
    imageAlt: 'Microscopy workstation reviewing a prepared cell sample.',
    videoSrc: '/videos/products/cell-imaging.mp4',
  },
  'CR-CEL-3091': {
    imageSrc: '/images/facility/molecular-bench.jpg',
    imageAlt: 'Tubes and reagents laid out for a cell-preparation workflow.',
  },
};

export function productMediaFor(sku: string): ProductMedia | undefined {
  return PRODUCT_MEDIA[sku.trim().toUpperCase()];
}
