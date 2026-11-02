import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPublicProduct } = vi.hoisted(() => ({ getPublicProduct: vi.fn() }));
vi.mock('./catalogue/client.ts', () => ({ getPublicProduct }));

import { isProductCheckoutAvailable, resolveProductDetail } from './resolve-product-detail.ts';

describe('product detail resolution', () => {
  beforeEach(() => getPublicProduct.mockReset());

  it('hides unapproved prototype products when the public API has no record', async () => {
    getPublicProduct.mockResolvedValue(null);
    const resolved = await resolveProductDetail('CR-CEL-8402');
    expect(resolved).toBeNull();
    expect(getPublicProduct).toHaveBeenCalledWith('CR-CEL-8402');
  });

  it('uses a published API record even for a former static SKU', async () => {
    const product = { sku: 'CR-CEL-8402', title: 'Published admin title' };
    getPublicProduct.mockResolvedValue(product);
    expect(await resolveProductDetail('CR-CEL-8402')).toEqual({ kind: 'catalogue', product });
  });

  it('never allows portfolio fallback content to enable checkout without a runtime product', () => {
    expect(isProductCheckoutAvailable(undefined, true)).toBe(false);
    expect(isProductCheckoutAvailable({ checkoutEnabled: false }, true)).toBe(false);
    expect(isProductCheckoutAvailable({ checkoutEnabled: true }, true)).toBe(true);
    expect(isProductCheckoutAvailable({ checkoutEnabled: true }, false)).toBe(false);
  });
});
