/**
 * Checkout list prices for shippable physical SKUs (PKR minor units, ×100).
 * Marketing copy lives in web/commerce seed; amounts must match everywhere.
 */

export interface PhysicalProductPrice {
  readonly sku: string;
  readonly listPriceMinor: number;
}

export const PHYSICAL_PRODUCT_PRICES: readonly PhysicalProductPrice[] = [
  { sku: 'CR-CEL-8402', listPriceMinor: 13_440_000 },
  { sku: 'CR-MOL-1021', listPriceMinor: 4_620_000 },
  { sku: 'CR-CEL-3091', listPriceMinor: 9_520_000 },
  { sku: 'CR-MOL-3012', listPriceMinor: 11_760_000 },
  { sku: 'CR-MOL-2045', listPriceMinor: 5_880_000 },
  { sku: 'CR-PRE-5510', listPriceMinor: 8_260_000 },
  { sku: 'CR-REG-1180', listPriceMinor: 2_380_000 },
];

export function physicalProductListPriceMinor(sku: string): number {
  const row = PHYSICAL_PRODUCT_PRICES.find((entry) => entry.sku === sku);
  if (row === undefined) {
    throw new Error(`Unknown physical product SKU: ${sku}`);
  }
  return row.listPriceMinor;
}

/** Public catalogue and Vendure display string (channel currency PKR). */
export function formatPkrListPrice(listPriceMinor: number): string {
  const major = listPriceMinor / 100;
  return `PKR ${major.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}
