import type { PublicProduct } from '@cera/contracts/projections';

export function catalogueProducts(): readonly PublicProduct[] {
  return [];
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
export const PRODUCT_MEDIA: Readonly<Record<string, ProductMedia>> = {};

export function productMediaFor(sku: string): ProductMedia | undefined {
  return PRODUCT_MEDIA[sku.trim().toUpperCase()];
}
