import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPublicProduct } = vi.hoisted(() => ({ getPublicProduct: vi.fn() }));
vi.mock('./catalogue/client.ts', () => ({ getPublicProduct }));

import { resolveProductDetail } from './resolve-product-detail.ts';

describe('product detail resolution', () => {
  beforeEach(() => getPublicProduct.mockReset());

  it('keeps the held product hidden even when the public API has no record', async () => {
    getPublicProduct.mockResolvedValue(null);
    const resolved = await resolveProductDetail('CR-CEL-8402');
    expect(resolved).toBeNull();
    expect(getPublicProduct).not.toHaveBeenCalled();
  });

  it('uses a published API record for an approved catalogue SKU', async () => {
    const product = { sku: 'CR-CEL-3091', title: 'Published admin title' };
    getPublicProduct.mockResolvedValue(product);
    expect(await resolveProductDetail('CR-CEL-3091')).toEqual({
      kind: 'catalogue',
      product: { ...product, checkoutEnabled: false },
    });
  });
});
