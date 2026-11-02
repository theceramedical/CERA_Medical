import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkoutRoutes } from './routes.ts';

import type { RecordCommerceOrderInput } from '../orders/postgres-store.ts';

const codBody = {
  email: 'buyer@example.test',
  fullName: 'Buyer Example',
  countryCode: 'PK',
  paymentMethod: 'cod',
  deliveryAddress: {
    streetLine1: '12 Main Road',
    city: 'Haripur',
    province: 'Khyber Pakhtunkhwa',
    postalCode: '22620',
    phoneNumber: '03001234567',
  },
};

function vendureFetch() {
  const calls: { query: string; headers: RequestInit['headers'] }[] = [];
  const fetchImpl: typeof fetch = (_input, init) => {
    if (typeof init?.body !== 'string') throw new Error('Expected Vendure query body');
    const body = JSON.parse(init.body) as { query: string };
    calls.push({ query: body.query, headers: init?.headers ?? {} });

    let data: Record<string, unknown>;
    if (body.query.includes('activeOrder')) {
      data = {
        activeOrder: {
          id: 'order-1',
          currencyCode: 'PKR',
          subTotalWithTax: 1000,
          totalWithTax: 1000,
          lines: [
            {
              id: 'line-1',
              quantity: 1,
              linePriceWithTax: 1000,
              productVariant: {
                id: 'variant-1',
                sku: 'APPROVED-BUFFER-001',
                name: 'Laboratory kit',
              },
            },
          ],
        },
      };
    } else if (body.query.includes('products(options: { take: $take')) {
      data = { products: { items: [] } };
    } else if (body.query.includes('setCustomerForOrder')) {
      data = { setCustomerForOrder: { __typename: 'Order', id: 'order-1' } };
    } else if (body.query.includes('eligibleShippingMethods')) {
      data = { eligibleShippingMethods: [{ id: 'ship-1', code: 'laboratory-shipping' }] };
    } else if (body.query.includes('addPaymentToOrder')) {
      data = { addPaymentToOrder: { __typename: 'Order', code: 'CERA-GUEST-COD-01' } };
    } else if (body.query.includes('setOrderShippingAddress')) {
      data = { setOrderShippingAddress: { __typename: 'Order' } };
    } else if (body.query.includes('setOrderBillingAddress')) {
      data = { setOrderBillingAddress: { __typename: 'Order' } };
    } else if (body.query.includes('setOrderShippingMethod')) {
      data = { setOrderShippingMethod: { __typename: 'Order' } };
    } else if (body.query.includes('transitionOrderToState')) {
      data = { transitionOrderToState: { __typename: 'Order', state: 'ArrangingPayment' } };
    } else {
      throw new Error(`Unexpected Vendure query: ${body.query}`);
    }

    return Promise.resolve(
      Response.json({ data }, { headers: { 'vendure-auth-token': 'guest-order-token' } }),
    );
  };
  return { fetchImpl, calls };
}

describe('legacy API guest checkout', () => {
  beforeEach(() => {
    vi.stubEnv('CHECKOUT_ENABLED', 'true');
    vi.stubEnv('CERA_ENV', 'production');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('completes COD checkout without a customer session and records no customer subject', async () => {
    const { fetchImpl, calls } = vendureFetch();
    vi.stubGlobal('fetch', fetchImpl);
    const app = Fastify({ logger: false });
    const recordOrder = vi.fn<(input: RecordCommerceOrderInput) => Promise<void>>();
    await app.register(
      checkoutRoutes({ shopApiUrl: 'https://vendure.example/shop-api', recordOrder }),
    );

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/checkout/complete',
        headers: { cookie: 'cera_vendure_token=guest-cart-token' },
        payload: codBody,
      });

      expect(response.statusCode, response.body).toBe(200);
      expect(response.json()).toEqual({ orderCode: 'CERA-GUEST-COD-01' });
      expect(recordOrder).toHaveBeenCalledOnce();
      expect(recordOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'buyer@example.test',
          fullName: 'Buyer Example',
          paymentMethod: 'cod',
          customerSubjectId: null,
        }),
      );
      expect(calls[0]?.headers).toMatchObject({ authorization: 'Bearer guest-cart-token' });
      expect(calls.some((call) => call.query.includes('addPaymentToOrder'))).toBe(true);
    } finally {
      await app.close();
      vi.unstubAllGlobals();
    }
  });

  it('rejects the local test payment method outside local development', async () => {
    const { fetchImpl } = vendureFetch();
    vi.stubGlobal('fetch', fetchImpl);
    const app = Fastify({ logger: false });
    await app.register(checkoutRoutes({ shopApiUrl: 'https://vendure.example/shop-api' }));

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/checkout/complete',
        payload: { ...codBody, paymentMethod: 'test' },
      });

      expect(response.statusCode, response.body).toBe(400);
      expect(response.json()).toMatchObject({ error: { code: 'validation_failed' } });
    } finally {
      await app.close();
      vi.unstubAllGlobals();
    }
  });
});
