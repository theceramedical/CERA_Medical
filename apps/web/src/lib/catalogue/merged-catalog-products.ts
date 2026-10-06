import 'server-only';

import type { PublicProduct } from '@cera/contracts/projections';

import { CATALOG_PRODUCTS, type CatalogProduct } from '../../content/products-catalog.ts';

import { listPublicProducts } from './client.ts';

function catalogRowFromApi(product: PublicProduct): CatalogProduct {
  const listPriceMinor = product.listPriceMinor ?? 0;
  return {
    sku: product.sku,
    category: 'consumables',
    categoryLabel: 'Catalogue product',
    title: product.title,
    description: product.summary.length > 0 ? product.summary : product.description,
    specs: product.availabilityText === null ? [] : [product.availabilityText],
    packLabel: 'RUO',
    listPriceMinor,
    price: product.displayPrice ?? 'Price on enquiry',
    inStock: true,
    fulfillment: 'physical',
    ...(product.imageUrl === null ? {} : { imageUrl: product.imageUrl }),
  };
}

/**
 * Marketing grid rows: rich static catalog entries win on SKU clash; Vendure
 * `physical-products` fill in anything added in admin after deploy.
 */
export async function listMergedCatalogProducts(): Promise<readonly CatalogProduct[]> {
  const bySku = new Map(
    CATALOG_PRODUCTS.map((product) => [product.sku.toUpperCase(), product] as const),
  );
  const { items } = await listPublicProducts({ revalidateSeconds: 30 });
  for (const product of items) {
    const key = product.sku.toUpperCase();
    if (!bySku.has(key)) {
      bySku.set(key, catalogRowFromApi(product));
    }
  }
  return [...bySku.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}
