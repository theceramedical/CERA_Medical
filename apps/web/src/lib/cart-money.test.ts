import { describe, expect, it } from 'vitest';

import { formatCartMoney } from './cart-money.ts';

describe('formatCartMoney', () => {
  it('names PKR explicitly to match the catalogue price', () => {
    expect(formatCartMoney(13_440_000, 'PKR')).toBe('PKR\u00a0134,400');
  });

  it('keeps the backend currency visible when it differs from PKR', () => {
    expect(formatCartMoney(13_440_000, 'USD')).toBe('USD\u00a0134,400');
  });
});
