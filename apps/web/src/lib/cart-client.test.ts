import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Cart } from '@cera/contracts';

import { addVerifiedCartLine, isCheckoutCurrency, mergeCartState } from './cart-client.ts';

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
