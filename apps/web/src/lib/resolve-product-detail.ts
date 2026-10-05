import type { PublicProduct } from '@cera/contracts/projections';

import { findCatalogEntry, type CatalogEntry } from '../content/products-catalog.ts';

import { getPublicProduct } from './catalogue/client.ts';

export type ResolvedProductDetail =
  CatalogEntry | { readonly kind: 'catalogue'; readonly product: PublicProduct };

export async function resolveProductDetail(sku: string): Promise<ResolvedProductDetail | null> {
  const staticEntry = findCatalogEntry(sku);
  if (staticEntry !== null) return staticEntry;

  const catalogue = await getPublicProduct(sku);
  if (catalogue === null) return null;
  return { kind: 'catalogue', product: catalogue };
}
