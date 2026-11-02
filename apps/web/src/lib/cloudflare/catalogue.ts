import type { PublicProduct } from '@cera/contracts/projections';

import { VERIFIED_PORTFOLIO_PRODUCTS } from '../../content/products-catalog.ts';
import { formatCartMoney } from '../cart-money.ts';

import type { D1Database } from './runtime.ts';

interface CommerceProductRow {
  readonly sku: string;
  readonly price_minor: number;
  readonly enabled: number;
}

function publicProduct(
  sku: string,
  row: CommerceProductRow | undefined,
  checkoutGateEnabled: boolean,
): PublicProduct {
  const product = VERIFIED_PORTFOLIO_PRODUCTS.find(
    (candidate) => candidate.sku.toLowerCase() === sku.toLowerCase(),
  );

  if (!product) {
    throw new Error(`Unknown static catalogue SKU: ${sku}`);
  }

  const priceMinor = row?.price_minor ?? null;
  return {
    sku: product.sku,
    title: product.title,
    summary: product.description,
    description: product.description,
    displayPrice: priceMinor === null ? null : formatCartMoney(priceMinor, 'PKR'),
    availabilityText: null,
    listPriceMinor: priceMinor,
    checkoutEnabled: row?.enabled === 1 && checkoutGateEnabled,
    enquiryEnabled: true,
    imageUrl: null,
  };
}

async function readProductRows(
  db: D1Database,
  skus: readonly string[],
): Promise<ReadonlyMap<string, CommerceProductRow>> {
  if (skus.length === 0) return new Map();
  const placeholders = skus.map(() => '?').join(', ');
  const result = await db
    .prepare(
      `SELECT sku, price_minor, enabled FROM commerce_products WHERE sku IN (${placeholders})`,
    )
    .bind(...skus)
    .all<CommerceProductRow>();

  return new Map((result.results ?? []).map((row) => [row.sku.toLowerCase(), row]));
}

/** Projects the bounded, approved static catalogue using D1 as price and checkout authority. */
export async function listCloudflarePublicProducts(
  db: D1Database | null,
  checkoutGateEnabled: boolean,
): Promise<readonly PublicProduct[]> {
  const skus = VERIFIED_PORTFOLIO_PRODUCTS.map((product) => product.sku);
  const rows = db ? await readProductRows(db, skus) : new Map<string, CommerceProductRow>();
  return skus.map((sku) => publicProduct(sku, rows.get(sku.toLowerCase()), checkoutGateEnabled));
}

export async function getCloudflarePublicProduct(
  db: D1Database | null,
  sku: string,
  checkoutGateEnabled: boolean,
): Promise<PublicProduct | null> {
  const product = VERIFIED_PORTFOLIO_PRODUCTS.find(
    (candidate) => candidate.sku.toLowerCase() === sku.trim().toLowerCase(),
  );
  if (!product) return null;
  const rows = db
    ? await readProductRows(db, [product.sku])
    : new Map<string, CommerceProductRow>();
  return publicProduct(product.sku, rows.get(product.sku.toLowerCase()), checkoutGateEnabled);
}
