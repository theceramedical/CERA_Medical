/** Product rows are sourced from the public catalogue API, never marketing fixtures. */
export type ProductCategory = 'catalogue';

export interface CatalogProduct {
  readonly sku: string;
  readonly category: ProductCategory;
  readonly categoryLabel: string;
  readonly title: string;
  readonly description: string;
  readonly specs: readonly string[];
  readonly packLabel: string;
  readonly listPriceMinor: number | null;
  readonly checkoutEnabled?: boolean;
  /** Legacy internal fixture field; the catalogue UI never renders this value. */
  readonly price?: string;
  readonly bsl?: '1' | '2';
  /** Null means the catalogue has not supplied a stock status. */
  readonly inStock: boolean | null;
  readonly fulfillment: 'physical';
  readonly shippingNote?: string;
  readonly imageUrl?: string;
}

export const PRODUCT_CATEGORIES: readonly { id: 'all' | ProductCategory; label: string }[] = [
  { id: 'all', label: 'All Products' },
];

export function productEnquiryHref(sku: string): string {
  return `/enquiry?product=${encodeURIComponent(sku)}`;
}

export function productCatalogAnchorId(sku: string): string {
  return `product-${sku.toLowerCase()}`;
}

export function productCatalogHref(sku: string): string {
  return `/products#${productCatalogAnchorId(sku)}`;
}

export function productDetailPath(sku: string): string {
  return `/products/${encodeURIComponent(sku.toLowerCase())}`;
}

export function filterCatalog(
  products: readonly CatalogProduct[],
  params: {
    readonly q?: string;
    readonly category?: string;
    readonly bsl?: string;
    readonly inStock?: boolean;
  },
): CatalogProduct[] {
  const query = params.q?.trim().toLowerCase() ?? '';
  return products.filter((product) => {
    if (
      params.category !== undefined &&
      params.category !== 'all' &&
      product.category !== params.category
    ) {
      return false;
    }
    if (params.bsl === '1' && product.bsl !== '1') return false;
    if (params.bsl === '2' && product.bsl !== '2') return false;
    if (params.inStock === true && product.inStock !== true) return false;
    if (query.length === 0) return true;
    const haystack =
      `${product.sku} ${product.title} ${product.description} ${product.categoryLabel}`.toLowerCase();
    return haystack.includes(query);
  });
}
