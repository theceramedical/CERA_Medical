import type { PublicProduct } from '@cera/contracts/projections';

import { catalogueProductBySku } from '../content/catalogue-products.ts';
import { HELD_PRODUCT_SKUS } from '../content/public-revision.ts';

import { getPublicProduct } from './catalogue/client.ts';

export interface ResolvedProductDetail {
  readonly kind: 'catalogue';
  readonly product: PublicProduct;
}

export async function resolveProductDetail(sku: string): Promise<ResolvedProductDetail | null> {
  const normalizedSku = sku.trim().toLowerCase();
  if (HELD_PRODUCT_SKUS.some((heldSku) => heldSku.toLowerCase() === normalizedSku)) {
    return null;
  }
  const listed = catalogueProductBySku(normalizedSku);
  if (listed === null) return null;

  const catalogue = await getPublicProduct(sku);
  if (catalogue !== null && catalogue.sku.toLowerCase() === normalizedSku) {
    return { kind: 'catalogue', product: { ...catalogue, checkoutEnabled: false } };
  }
  return { kind: 'catalogue', product: listed };
}
