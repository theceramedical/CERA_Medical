import { ProductsCatalog } from '../../../components/products/products-catalog.tsx';
import { VERIFIED_PORTFOLIO_PRODUCTS } from '../../../content/products-catalog.ts';
import { listMergedCatalogProducts } from '../../../lib/catalogue/merged-catalog-products.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const revalidate = 30;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research & Wellness Products',
    description:
      'Explore CERA Medical natural wellness formulations alongside validated laboratory research reagents, assay kits, and preclinical rodent preparations.',
    path: '/products',
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const apiProducts = await listMergedCatalogProducts();
  const apiSkus = new Set(apiProducts.map((p) => p.sku.toLowerCase()));
  const mergedProducts = [
    ...apiProducts,
    ...VERIFIED_PORTFOLIO_PRODUCTS.filter((p) => !apiSkus.has(p.sku.toLowerCase())),
  ];

  return (
    <ProductsCatalog
      products={mergedProducts}
      {...(params.q === undefined ? {} : { query: params.q })}
      {...(params.category === undefined ? {} : { category: params.category })}
    />
  );
}
