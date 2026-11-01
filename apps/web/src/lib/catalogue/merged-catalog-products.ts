import 'server-only';

import type { PublicProduct } from '@cera/contracts/projections';

import {
  catalogueProducts,
  getVerifiedPortfolioProductBySku,
  productMediaFor,
} from '../../content/catalogue-products.ts';

import { listPublicProducts } from './client.ts';

import type { CatalogProduct } from '../../content/products-catalog.ts';

function catalogRowFromApi(product: PublicProduct): CatalogProduct {
  const verifiedPortfolioProduct = getVerifiedPortfolioProductBySku(product.sku);
  return {
    ...(verifiedPortfolioProduct ?? {}),
    sku: product.sku,
    category: verifiedPortfolioProduct?.category ?? 'catalogue',
    categoryLabel: verifiedPortfolioProduct?.categoryLabel ?? 'Catalogue product',
    title: verifiedPortfolioProduct?.title ?? product.title,
    description:
      verifiedPortfolioProduct?.description ??
      (product.summary.length > 0 ? product.summary : product.description),
    specs:
      verifiedPortfolioProduct?.specs ??
      (product.availabilityText === null ? [] : [product.availabilityText]),
    packLabel: verifiedPortfolioProduct?.packLabel ?? '',
    listPriceMinor: product.listPriceMinor,
    checkoutEnabled: product.checkoutEnabled,
    price: product.displayPrice ?? 'Price on enquiry',
    inStock: null,
    fulfillment: verifiedPortfolioProduct?.fulfillment ?? 'physical',
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
