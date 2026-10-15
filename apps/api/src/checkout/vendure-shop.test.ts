import { describe, expect, it } from 'vitest';

import { createVendureShopClient } from './vendure-shop.ts';

function orderResponse(quantity: number, mutation: 'adjustOrderLine' | 'removeOrderLine') {
  const order = {
    id: 'order-1',
    currencyCode: 'PKR',
    subTotalWithTax: 100 * quantity,
    totalWithTax: 100 * quantity,
    lines:
      quantity === 0
        ? []
        : [
            {
              id: 'line-1',
              quantity,
              linePriceWithTax: 100 * quantity,
              productVariant: { id: 'variant-1', sku: 'CR-CEL-8402', name: 'Laboratory kit' },
            },
          ],
  };
  return {
    data: { [mutation]: order },
  };
}

describe('adjustLine', () => {
  it('sets an absolute quantity of 1 instead of adding another unit', async () => {
    const fetchImpl: typeof fetch = (_url, init) => {
      if (typeof init?.body !== 'string') return Promise.reject(new Error('expected string body'));
      const body = JSON.parse(init.body) as { query: string; variables: { qty?: number } };
      expect(body.query).toContain('adjustOrderLine');
      expect(body.variables.qty).toBe(1);
      return Promise.resolve(
        new Response(JSON.stringify(orderResponse(1, 'adjustOrderLine')), {
          status: 200,
          headers: { 'vendure-auth-token': 'token-1' },
        }),
      );
    };
    const shop = createVendureShopClient('http://vendure.test/shop-api', fetchImpl);
    const { cart } = await shop.adjustLine({ token: 'token-1' }, 'line-1', 1);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.quantity).toBe(1);
    expect(cart.totalMinor).toBe(100);
  });

  it('removes the line when quantity is zero', async () => {
    const fetchImpl: typeof fetch = (_url, init) => {
      if (typeof init?.body !== 'string') return Promise.reject(new Error('expected string body'));
      const body = JSON.parse(init.body) as { query: string };
      expect(body.query).toContain('removeOrderLine');
      return Promise.resolve(
        new Response(JSON.stringify(orderResponse(0, 'removeOrderLine')), { status: 200 }),
      );
    };
    const shop = createVendureShopClient('http://vendure.test/shop-api', fetchImpl);
    const { cart } = await shop.adjustLine({ token: null }, 'line-1', 0);
    expect(cart.lines).toEqual([]);
    expect(cart.totalMinor).toBe(0);
  });
});
