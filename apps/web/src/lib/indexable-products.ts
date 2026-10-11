import { listPublicProducts } from './catalogue/client.ts';

/** SKUs with a public catalogue record and a `/products/{sku}` page. */
export async function listIndexableProductSkus(): Promise<readonly string[]> {
  const catalogue = await listPublicProducts({ revalidateSeconds: 30 }).catch(() => ({
    items: [],
    degraded: true,
  }));
  const fromApi = catalogue.items.map((product) => product.sku.toLowerCase());
  return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b));
}
