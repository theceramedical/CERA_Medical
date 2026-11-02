import type { PublicProduct } from '@cera/contracts/projections';

import { catalogueProductBySku } from '../content/catalogue-products.ts';

import { getPublicProduct } from './catalogue/client.ts';

export interface ResolvedProductDetail {
  readonly kind: 'catalogue';
  readonly product: PublicProduct;
}

export function isProductCheckoutAvailable(
  product: Pick<PublicProduct, 'checkoutEnabled'> | undefined,
  checkoutGateEnabled: boolean,
): boolean {
  return checkoutGateEnabled && product?.checkoutEnabled === true;
}

export async function resolveProductDetail(sku: string): Promise<ResolvedProductDetail | null> {
  const catalogue = await getPublicProduct(sku);
  if (catalogue !== null) return { kind: 'catalogue', product: catalogue };
  const listed = catalogueProductBySku(sku);
  if (listed === null) return null;
  return { kind: 'catalogue', product: listed };
}
