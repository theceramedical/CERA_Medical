import { ProductsCatalog } from '../../../components/products/products-catalog.tsx';
import { listMergedCatalogProducts } from '../../../lib/catalogue/merged-catalog-products.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const revalidate = 30;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Product Catalogue',
    description:
      'Browse published catalogue entries and enquire about product availability, documentation and terms.',
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
  const products = await listMergedCatalogProducts();
  return (
    <ProductsCatalog
      products={products}
      {...(params.q === undefined ? {} : { query: params.q })}
      {...(params.category === undefined ? {} : { category: params.category })}
    />
  );
}
