import { describe, expect, it } from 'vitest';

import { RejectCheckoutInterceptor } from './order-interceptor.js';

describe('RejectCheckoutInterceptor', () => {
  it('blocks every line-item mutation', () => {
    const interceptor = new RejectCheckoutInterceptor();
    expect(interceptor.willAddItemToOrder()).toMatch(/disabled/);
    expect(interceptor.willAdjustOrderLine()).toMatch(/disabled/);
    expect(interceptor.willRemoveItemFromOrder()).toMatch(/disabled/);
  });
});
