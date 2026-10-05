import { ApiError } from '@cera/contracts/errors';

import type { VendureProduct } from './types.ts';

const PRODUCT_FIELDS = `
  id
  slug
  name
  description
  enabled
  createdAt
  updatedAt
  featuredAsset { id }
  collections(options: { take: 1 }) { id slug name }
  customFields {
    availabilityText
    enquiryEnabled
    checkoutEnabled
    displayPriceText
    shortSummary
  }
  variants(options: { take: 1 }) {
    id
    sku
    price
    priceWithTax
  }
`;

interface GraphqlBody<T> {
  readonly data?: T;
  readonly errors?: readonly { readonly message?: string }[];
}

export interface VendureCatalogueClient {
  listProducts(): Promise<readonly VendureProduct[]>;
  getProduct(slug: string): Promise<VendureProduct | null>;
}

export function createVendureClient(
  shopApiUrl: string,
  fetchImpl: typeof fetch = fetch,
): VendureCatalogueClient {
  const query = async <T>(payload: {
    query: string;
    variables?: Record<string, unknown>;
  }): Promise<T> => {
    let response: Response;
    try {
      response = await fetchImpl(shopApiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError('upstream_unavailable', { internalDetail: 'vendure fetch failed' });
    }

    if (!response.ok) {
      throw new ApiError('upstream_unavailable', {
        internalDetail: `vendure HTTP ${String(response.status)}`,
      });
    }

    const body = (await response.json()) as GraphqlBody<T>;
    if (body.errors !== undefined && body.errors.length > 0) {
      const detail = body.errors[0]?.message;
      throw new ApiError(
        'upstream_unavailable',
        detail === undefined ? {} : { internalDetail: detail },
      );
    }
    if (body.data === undefined) {
      throw new ApiError('upstream_unavailable', { internalDetail: 'vendure empty data' });
    }
    return body.data;
  };

  return {
    async listProducts() {
      const data = await query<{ products: { items: VendureProduct[] } }>({
        query: `query { products(options: { take: 50 }) { items { ${PRODUCT_FIELDS} } } }`,
      });
      return data.products.items;
    },
    async getProduct(slug) {
      const data = await query<{ product: VendureProduct | null }>({
        query: `query ($slug: String!) { product(slug: $slug) { ${PRODUCT_FIELDS} } }`,
        variables: { slug },
      });
      return data.product;
    },
  };
}
