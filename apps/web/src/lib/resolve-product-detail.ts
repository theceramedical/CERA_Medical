import type { PublicProduct } from '@cera/contracts/projections';

import { getPublicProduct } from './catalogue/client.ts';

export interface ResolvedProductDetail {
  readonly kind: 'catalogue';
  readonly product: PublicProduct;
}

export async function resolveProductDetail(sku: string): Promise<ResolvedProductDetail | null> {
  const catalogue = await getPublicProduct(sku);
  if (catalogue === null) return null;
  return { kind: 'catalogue', product: catalogue };
}
