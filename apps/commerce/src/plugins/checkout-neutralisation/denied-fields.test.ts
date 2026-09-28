import { describe, expect, it } from 'vitest';

import {
  DENIED_ADMIN_MUTATION_SET,
  DENIED_SHOP_MUTATION_SET,
  missingDeniedFields,
  SHOP_DENY_FAMILIES,
} from './denied-fields.js';
import { SHOP_MUTATION_SNAPSHOT } from './shop-mutations.snapshot.js';

describe('denied Shop API mutations', () => {
  it('covers every order, payment, shipping, and registration field in the snapshot', () => {
    expect(
      missingDeniedFields(SHOP_MUTATION_SNAPSHOT, DENIED_SHOP_MUTATION_SET, SHOP_DENY_FAMILIES),
    ).toEqual([]);
  });

  it('includes the representative mutation the contract test posts', () => {
    expect(DENIED_SHOP_MUTATION_SET.has('addItemToOrder')).toBe(true);
  });

  it('does not deny catalogue reads', () => {
    expect(DENIED_SHOP_MUTATION_SET.has('product')).toBe(false);
    expect(DENIED_SHOP_MUTATION_SET.has('products')).toBe(false);
  });
});

describe('denied Admin payment-method mutations', () => {
  it('blocks creating a payment method, so layer 1 cannot be undone in the dashboard', () => {
    expect(DENIED_ADMIN_MUTATION_SET.has('createPaymentMethod')).toBe(true);
  });
});
