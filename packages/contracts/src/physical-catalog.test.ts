import { describe, expect, it } from 'vitest';

import {
  formatPkrListPrice,
  PHYSICAL_PRODUCT_PRICES,
  physicalProductListPriceMinor,
} from './physical-catalog.ts';

describe('physical catalog prices', () => {
  it('formats PKR list prices for the storefront', () => {
    expect(formatPkrListPrice(4_620_000)).toBe('PKR 46,200');
    expect(formatPkrListPrice(physicalProductListPriceMinor('CR-REG-1180'))).toBe('PKR 23,800');
  });

  it('defines one price row per shippable SKU', () => {
    expect(new Set(PHYSICAL_PRODUCT_PRICES.map((row) => row.sku)).size).toBe(
      PHYSICAL_PRODUCT_PRICES.length,
    );
  });
});
