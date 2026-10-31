import { OrdersFulfillmentView } from '../../../../components/orders-fulfillment-view.client.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { VERIFIED_PORTFOLIO_PRODUCTS } from '../../../../content/products-catalog.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Fulfillment Queue',
  description: 'Manage natural wellness product orders, packing slips, and deliveries.',
};

export default function StaffOrdersPage() {
  return (
    <>
      <PageHeader
        title="Product Orders & Fulfillment"
        lede="Review incoming natural wellness orders, print dispatch packing slips, and update courier tracking."
      />
      <div className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:py-16">
        <OrdersFulfillmentView totalSkus={VERIFIED_PORTFOLIO_PRODUCTS.length} />
      </div>
    </>
  );
}
