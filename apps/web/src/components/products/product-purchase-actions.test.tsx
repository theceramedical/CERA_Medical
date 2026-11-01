import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ProductPurchaseActions } from './product-purchase-actions.tsx';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement('a', { href, ...props }, children),
}));

describe('ProductPurchaseActions', () => {
  it('renders enquiry only when checkout is unavailable', () => {
    const markup = renderToStaticMarkup(
      createElement(ProductPurchaseActions, {
        sku: 'TEST-SKU',
        enquiryHref: '/contact?product=TEST-SKU#contact-form',
        checkoutAvailable: false,
        label: 'Enquire about product',
      }),
    );

    expect(markup).toContain('href="/contact?product=TEST-SKU#contact-form"');
    expect(markup).toContain('Enquire about product');
    expect(markup).not.toContain('type="number"');
    expect(markup).not.toContain('Add to cart');
  });

  it('renders quantity and add-to-cart controls when checkout is available', () => {
    const markup = renderToStaticMarkup(
      createElement(ProductPurchaseActions, {
        sku: 'TEST-SKU',
        enquiryHref: '/contact?product=TEST-SKU#contact-form',
        checkoutAvailable: true,
      }),
    );

    expect(markup).toContain('type="number"');
    expect(markup).toContain('aria-label="Quantity for TEST-SKU"');
    expect(markup).toContain('min="1"');
    expect(markup).toContain('max="99"');
    expect(markup).toContain('Add to cart');
  });
});
