import { listCatalogSlugs } from '../content/products-catalog.ts';

import { listPublicProducts } from './catalogue/client.ts';

/** SKUs that have a public `/products/{sku}` page (static catalog + Vendure physical products). */
export async function listIndexableProductSkus(): Promise<readonly string[]> {
  const [staticSkus, catalogue] = await Promise.all([
    Promise.resolve(listCatalogSlugs()),
    listPublicProducts({ revalidateSeconds: 30 }).catch(() => ({ items: [], degraded: true })),
  ]);
  const fromApi = catalogue.items.map((product) => product.sku.toLowerCase());
  return [...new Set([...staticSkus, ...fromApi])].sort((a, b) => a.localeCompare(b));
}
