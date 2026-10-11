import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPublicProduct } = vi.hoisted(() => ({ getPublicProduct: vi.fn() }));
vi.mock('./catalogue/client.ts', () => ({ getPublicProduct }));

import { resolveProductDetail } from './resolve-product-detail.ts';

describe('product detail resolution', () => {
  beforeEach(() => getPublicProduct.mockReset());

  it('does not serve a former static SKU when the public API has no record', async () => {
    getPublicProduct.mockResolvedValue(null);
    expect(await resolveProductDetail('CR-CEL-8402')).toBeNull();
    expect(getPublicProduct).toHaveBeenCalledWith('CR-CEL-8402');
  });

  it('uses a published API record even for a former static SKU', async () => {
    const product = { sku: 'CR-CEL-8402', title: 'Published admin title' };
    getPublicProduct.mockResolvedValue(product);
    expect(await resolveProductDetail('CR-CEL-8402')).toEqual({ kind: 'catalogue', product });
  });
});
