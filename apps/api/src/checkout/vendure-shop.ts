import { ApiError } from '@cera/contracts/errors';

import type { Cart, CartLine } from '@cera/contracts';

const AUTH_HEADER = 'vendure-auth-token';

interface GraphqlError {
  readonly message?: string;
}

interface ShopResponse<T> {
  readonly data?: T;
  readonly errors?: readonly GraphqlError[];
}

export interface ShopSession {
  readonly token: string | null;
}

export function createVendureShopClient(shopApiUrl: string, fetchImpl: typeof fetch = fetch) {
  const post = async <T>(
    session: ShopSession,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<{ data: T; token: string | null }> => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
    };
    if (session.token !== null && session.token.length > 0) {
      headers.authorization = `Bearer ${session.token}`;
    }

    let response: Response;
    try {
      response = await fetchImpl(shopApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });
    } catch {
      throw new ApiError('upstream_unavailable', { internalDetail: 'vendure shop fetch failed' });
    }

    const nextToken = response.headers.get(AUTH_HEADER) ?? session.token;
    if (!response.ok) {
      throw new ApiError('upstream_unavailable', {
        internalDetail: `vendure shop HTTP ${String(response.status)}`,
      });
    }

    const body = (await response.json()) as ShopResponse<T>;
    if (body.errors !== undefined && body.errors.length > 0) {
      throw new ApiError('upstream_unavailable', {
        internalDetail: body.errors[0]?.message ?? 'vendure shop error',
      });
    }
    if (body.data === undefined) {
      throw new ApiError('upstream_unavailable', { internalDetail: 'vendure shop empty data' });
    }
    return { data: body.data, token: nextToken };
  };

  return {
    async getVariantIdBySku(session: ShopSession, sku: string): Promise<string> {
      const { data } = await post<{
        productVariants: { items: { id: string; sku: string }[] };
      }>(
        session,
        `query ($sku: String!) {
          productVariants(options: { filter: { sku: { eq: $sku } }, take: 1 }) {
            items { id sku }
          }
        }`,
        { sku },
      );
      const variant = data.productVariants.items[0];
      if (variant === undefined) {
        throw new ApiError('not_found', { internalDetail: `no variant for ${sku}` });
      }
      return variant.id;
    },

    async getActiveCart(
      session: ShopSession,
    ): Promise<{ cart: Cart | null; token: string | null }> {
      const { data, token } = await post<{ activeOrder: VendureOrder | null }>(
        session,
        `query {
          activeOrder {
            id
            currencyCode
            subTotalWithTax
            totalWithTax
            lines {
              id
              quantity
              linePriceWithTax
              productVariant { id sku name }
            }
          }
        }`,
      );
      if (data.activeOrder === null) return { cart: null, token };
      return { cart: mapOrder(data.activeOrder), token };
    },

    async addLine(
      session: ShopSession,
      variantId: string,
      quantity: number,
    ): Promise<{ cart: Cart; token: string | null }> {
      const { data, token } = await post<{ addItemToOrder: VendureOrder | { errorCode: string } }>(
        session,
        `mutation ($id: ID!, $qty: Int!) {
          addItemToOrder(productVariantId: $id, quantity: $qty) {
            __typename
            ... on Order {
              id currencyCode subTotalWithTax totalWithTax
              lines {
                id quantity linePriceWithTax
                productVariant { id sku name }
              }
            }
            ... on ErrorResult { errorCode message }
          }
        }`,
        { id: variantId, qty: quantity },
      );
      const result = data.addItemToOrder;
      if (typeof result !== 'object' || !('id' in result)) {
        throw new ApiError('validation_failed', { internalDetail: 'addItemToOrder failed' });
      }
      return { cart: mapOrder(result as VendureOrder), token };
    },

    async completeCheckout(
      session: ShopSession,
      input: {
        email: string;
        fullName: string;
        countryCode: string;
        paymentMethod: 'cod' | 'safepay' | 'test';
        safepayTracker?: string | undefined;
      },
    ): Promise<{ orderCode: string; token: string | null }> {
      const address = {
        fullName: input.fullName,
        streetLine1: 'CERA Medical — online order',
        city: 'Haripur',
        province: 'KPK',
        postalCode: '22620',
        countryCode: input.countryCode,
      };

      let token = session.token;
      const setCustomer = await post<{ setCustomerForOrder: VendureOrder | { errorCode: string } }>(
        { token },
        `mutation ($input: CreateCustomerInput!) {
          setCustomerForOrder(input: $input) {
            __typename
            ... on Order { id code }
            ... on ErrorResult { errorCode message }
          }
        }`,
        {
          input: {
            emailAddress: input.email,
            firstName: input.fullName.split(' ')[0] ?? input.fullName,
            lastName: input.fullName.split(' ').slice(1).join(' ') || input.fullName,
          },
        },
      );
      token = setCustomer.token;

      await post(
        { token },
        `mutation ($input: CreateAddressInput!) {
          setOrderShippingAddress(input: $input) { __typename }
        }`,
        { input: address },
      );

      const methods = await post<{
        eligibleShippingMethods: { id: string; name: string }[];
      }>({ token }, `query { eligibleShippingMethods { id name } }`);
      const methodId = methods.data.eligibleShippingMethods[0]?.id;
      if (methodId === undefined) {
        throw new ApiError('upstream_unavailable', { internalDetail: 'no shipping method' });
      }

      await post(
        { token },
        `mutation ($id: ID!) {
          setOrderShippingMethod(shippingMethodId: $id) { __typename }
        }`,
        { id: methodId },
      );

      const paymentCode =
        input.paymentMethod === 'cod'
          ? 'cera-cod'
          : input.paymentMethod === 'safepay'
            ? 'cera-safepay'
            : 'cera-test-payment';

      const metadata: Record<string, string> = {};
      if (input.paymentMethod === 'safepay' && input.safepayTracker !== undefined) {
        metadata.safepayTracker = input.safepayTracker;
      }

      const payment = await post<{ addPaymentToOrder: { __typename: string; code?: string } }>(
        { token },
        `mutation ($input: PaymentInput!) {
          addPaymentToOrder(input: $input) {
            __typename
            ... on Order { code }
            ... on ErrorResult { errorCode message }
          }
        }`,
        {
          input: {
            method: paymentCode,
            metadata,
          },
        },
      );
      token = payment.token;
      const order = payment.data.addPaymentToOrder;
      if (typeof order !== 'object' || !('code' in order)) {
        throw new ApiError('validation_failed', { internalDetail: 'payment failed' });
      }
      const orderCode = (order as { code: string }).code;
      return { orderCode, token };
    },
  };
}

interface VendureOrder {
  readonly currencyCode: string;
  readonly subTotalWithTax: number;
  readonly totalWithTax: number;
  readonly lines: readonly {
    readonly id: string;
    readonly quantity: number;
    readonly linePriceWithTax: number;
    readonly productVariant: { readonly id: string; readonly sku: string; readonly name: string };
  }[];
}

function mapOrder(order: VendureOrder): Cart {
  const lines: CartLine[] = order.lines.map((line) => ({
    id: line.id,
    slug: line.productVariant.sku,
    title: line.productVariant.name,
    quantity: line.quantity,
    unitPriceMinor: Math.round(line.linePriceWithTax / line.quantity),
    lineTotalMinor: line.linePriceWithTax,
  }));
  return {
    currencyCode: order.currencyCode,
    lines,
    subtotalMinor: order.subTotalWithTax,
    totalMinor: order.totalWithTax,
  };
}
