import { ProductsCatalog } from '../../../components/products/products-catalog.tsx';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Physical Products & Laboratory Reagents',
    description:
      'Shippable research-use-only reagents, cell lines, assay kits, and standards from CERA Medical — distinct from scoped research services.',
    path: '/products',
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    q?: string;
    category?: string;
    bsl?: string;
    inStock?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <ProductsCatalog
      {...(params.q === undefined ? {} : { query: params.q })}
      {...(params.category === undefined ? {} : { category: params.category })}
      {...(params.bsl === undefined ? {} : { bsl: params.bsl })}
      {...(params.inStock === '1' ? { inStockOnly: true } : {})}
    />
  );
}
