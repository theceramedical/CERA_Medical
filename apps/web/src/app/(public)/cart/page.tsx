import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { CartPageView } from '../../../components/cart-page-view.client.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { fetchCart } from '../../../lib/cart-client.ts';
import { checkoutEnabled } from '../../../lib/checkout-enabled.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Cart',
  description: 'Review physical products and research services before checkout.',
  path: '/cart',
  noIndex: true,
});

export default async function CartPage() {
  if (!checkoutEnabled()) notFound();

  let cart;
  try {
    cart = await fetchCart((await headers()).get('cookie'));
  } catch {
    cart = { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
  }

  return (
    <>
      <MarketingPageHeader
        title="Your cart"
        lede="Physical products and fixed-price service lines. Sign in after checkout to track orders at Account → Orders."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Cart' },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <CartPageView initialCart={cart} />
      </div>
    </>
  );
}
