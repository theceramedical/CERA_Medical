import 'server-only';

import type { PublicProduct } from '@cera/contracts/projections';

import { catalogueProducts, productMediaFor } from '../../content/catalogue-products.ts';

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
  const known = new Set(items.map((product) => product.sku.toLowerCase()));
  const listed = [
    ...items,
    ...catalogueProducts().filter((product) => !known.has(product.sku.toLowerCase())),
  ];
  return listed.map(catalogRowFromApi).sort((a, b) => a.sku.localeCompare(b.sku));
}
