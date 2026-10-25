import { catalogueProducts } from '../content/catalogue-products.ts';
import { HELD_PRODUCT_SKUS } from '../content/public-revision.ts';

import { listPublicProducts } from './catalogue/client.ts';

/** SKUs with a public catalogue record and a `/products/{sku}` page. */
export async function listIndexableProductSkus(): Promise<readonly string[]> {
  const catalogue = await listPublicProducts({ revalidateSeconds: 30 }).catch(() => ({
    items: [],
    degraded: true,
  }));
  const held = new Set<string>(HELD_PRODUCT_SKUS.map((sku) => sku.toLowerCase()));
  const allowed = new Set(catalogueProducts().map((product) => product.sku.toLowerCase()));
  const fromApi = catalogue.items
    .map((product) => product.sku.toLowerCase())
    .filter((sku) => allowed.has(sku) && !held.has(sku));
  return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b));
}
