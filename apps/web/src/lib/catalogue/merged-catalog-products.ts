import 'server-only';

import type { PublicProduct } from '@cera/contracts/projections';

import { catalogueProducts, productMediaFor } from '../../content/catalogue-products.ts';
import { HELD_PRODUCT_SKUS } from '../../content/public-revision.ts';

import { listPublicProducts } from './client.ts';

import type { CatalogProduct } from '../../content/products-catalog.ts';

function catalogRowFromApi(product: PublicProduct): CatalogProduct {
  return {
    sku: product.sku,
    category: 'catalogue',
    categoryLabel: 'Catalogue product',
    title: product.title,
    description: product.summary.length > 0 ? product.summary : product.description,
    specs: [product.availabilityText ?? 'Availability must be confirmed before dispatch.'],
    packLabel: '',
    listPriceMinor: null,
    checkoutEnabled: false,
    price: 'Price on enquiry',
    inStock: null,
    fulfillment: 'physical',
    ...(() => {
      const imageUrl = product.imageUrl ?? productMediaFor(product.sku)?.imageSrc;
      return imageUrl === undefined ? {} : { imageUrl };
    })(),
  };
}

/**
 * Live API rows win. Catalogue entries fill SKUs the API has not published yet
 * and never replace a live product with the same SKU.
 */
export async function listMergedCatalogProducts(): Promise<readonly CatalogProduct[]> {
  const { items } = await listPublicProducts({ revalidateSeconds: 30 });
  const allowed = new Set(catalogueProducts().map((product) => product.sku.toLowerCase()));
  const held = new Set<string>(HELD_PRODUCT_SKUS.map((sku) => sku.toLowerCase()));
  const allowedApiItems = items.filter((product) => {
    const sku = product.sku.toLowerCase();
    return allowed.has(sku) && !held.has(sku);
  });
  const known = new Set(allowedApiItems.map((product) => product.sku.toLowerCase()));
  const listed = [
    ...allowedApiItems,
    ...catalogueProducts().filter((product) => !known.has(product.sku.toLowerCase())),
  ].filter((product) => !held.has(product.sku.toLowerCase()));
  return listed.map(catalogRowFromApi).sort((a, b) => a.sku.localeCompare(b.sku));
}
