import 'server-only';

import type { PublicProduct } from '@cera/contracts/projections';

import { listPublicProducts } from './client.ts';

import type { CatalogProduct } from '../../content/products-catalog.ts';

function catalogRowFromApi(product: PublicProduct): CatalogProduct {
  return {
    sku: product.sku,
    category: 'catalogue',
    categoryLabel: 'Catalogue product',
    title: product.title,
    description: product.summary.length > 0 ? product.summary : product.description,
    specs: product.availabilityText === null ? [] : [product.availabilityText],
    packLabel: '',
    listPriceMinor: product.listPriceMinor,
    checkoutEnabled: product.checkoutEnabled,
    price:
      product.checkoutEnabled && product.listPriceMinor !== null
        ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(
            product.listPriceMinor / 100,
          )
        : 'Price on enquiry',
    inStock: null,
    fulfillment: 'physical',
    ...(product.imageUrl === null ? {} : { imageUrl: product.imageUrl }),
  };
}

/**
 * Display only products returned by the public catalogue API. Marketing copy
 * must not create product inventory or override a live product by SKU.
 */
export async function listMergedCatalogProducts(): Promise<readonly CatalogProduct[]> {
  const { items } = await listPublicProducts({ revalidateSeconds: 30 });
  return items.map(catalogRowFromApi).sort((a, b) => a.sku.localeCompare(b.sku));
}
