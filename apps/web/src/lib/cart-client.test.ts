import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Cart } from '@cera/contracts';

import {
  addVerifiedCartLine,
  isCheckoutCurrency,
  mergeCartState,
  updateCartLine,
} from './cart-client.ts';

const line = {
  id: 'line-1',
  slug: 'CR-CEL-8402',
  title: 'CERA-GLIO-01',
  quantity: 1,
  unitPriceMinor: 13_440_000,
  lineTotalMinor: 13_440_000,
};

const cart: Cart = {
  currencyCode: 'PKR',
  lines: [line],
  subtotalMinor: line.lineTotalMinor,
  totalMinor: line.lineTotalMinor,
};

afterEach(() => vi.unstubAllGlobals());

describe('cart state', () => {
  it('accepts a fresh empty server cart instead of retaining a stale preview', () => {
    const empty: Cart = { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
    expect(mergeCartState(cart, empty)).toEqual(empty);
  });

  it('only enables checkout for the catalogue currency', () => {
    expect(isCheckoutCurrency(cart)).toBe(true);
    expect(isCheckoutCurrency({ ...cart, currencyCode: 'USD' })).toBe(false);
  });
});

describe('updateCartLine', () => {
  it('keeps a decrease from 2 to 1 after the cart is read back', async () => {
    const decreased: Cart = {
      ...cart,
      lines: [{ ...line, quantity: 1, lineTotalMinor: line.unitPriceMinor }],
      subtotalMinor: line.unitPriceMinor,
      totalMinor: line.unitPriceMinor,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(decreased), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(decreased), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateCartLine(line.id, 1)).resolves.toEqual(decreased);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(`/v1/cart/lines/${line.id}`);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ quantity: 1 }),
    });
  });

  it('rejects a decrease that the next read does not persist', async () => {
    const decreased: Cart = {
      ...cart,
      lines: [{ ...line, quantity: 1, lineTotalMinor: line.unitPriceMinor }],
      subtotalMinor: line.unitPriceMinor,
      totalMinor: line.unitPriceMinor,
    };
    const stale: Cart = {
      ...cart,
      lines: [{ ...line, quantity: 2, lineTotalMinor: line.unitPriceMinor * 2 }],
      subtotalMinor: line.unitPriceMinor * 2,
      totalMinor: line.unitPriceMinor * 2,
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(decreased), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(stale), { status: 200 })),
    );

    await expect(updateCartLine(line.id, 1)).rejects.toThrow('cart_not_saved');
  });
});

describe('addVerifiedCartLine', () => {
  it('returns the persisted cart after a successful add and read', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(cart), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(cart), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(addVerifiedCartLine(line.slug)).resolves.toEqual(cart);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ credentials: 'include' });
  });

  it('rejects an add that disappears on the next read', async () => {
    const empty: Cart = { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(cart), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(empty), { status: 200 })),
    );

    await expect(addVerifiedCartLine(line.slug)).rejects.toThrow('cart_not_saved');
  });

  it('rejects a USD cart before reporting success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...cart, currencyCode: 'USD' }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(addVerifiedCartLine(line.slug)).rejects.toThrow('cart_currency_mismatch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
