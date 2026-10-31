import { Heading, Text } from '@cera/ui/typography';
import { CheckCircle2, Clock, Package, Printer, ShoppingBag, Truck } from 'lucide-react';

import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { VERIFIED_PORTFOLIO_PRODUCTS } from '../../../../content/products-catalog.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Fulfillment Queue',
  description: 'Manage natural wellness product orders, packing slips, and deliveries.',
};

interface OrderSummary {
  readonly id: string;
  readonly orderCode: string;
  readonly customerName: string;
  readonly customerCity: string;
  readonly customerPhone: string;
  readonly items: readonly { readonly title: string; readonly quantity: number }[];
  readonly totalPkr: string;
  readonly status: 'UNFULFILLED' | 'DISPATCHED' | 'DELIVERED';
  readonly paymentMethod: string;
  readonly date: string;
}

const SAMPLE_ORDERS: readonly OrderSummary[] = [
  {
    id: 'ord_1',
    orderCode: 'CERA-261031-MOS01',
    customerName: 'Fatima Al-Hassan',
    customerCity: 'Islamabad',
    customerPhone: '+92 300 5551234',
    items: [{ title: 'Mosscent: Plant-Based Mosquito Repellent (100ml)', quantity: 2 }],
    totalPkr: 'PKR 1,200',
    status: 'UNFULFILLED',
    paymentMethod: 'Cash on Delivery',
    date: '31 Oct 2026, 17:45',
  },
  {
    id: 'ord_2',
    orderCode: 'CERA-261031-ACT02',
    customerName: 'Tariq Mehmood',
    customerCity: 'Haripur',
    customerPhone: '+92 333 4445678',
    items: [{ title: 'Activ-P: Fast-Absorbing Pain-Relief Botanical Oil (60ml)', quantity: 1 }],
    totalPkr: 'PKR 1,400',
    status: 'DISPATCHED',
    paymentMethod: 'Bank Transfer (Verified)',
    date: '31 Oct 2026, 14:20',
  },
  {
    id: 'ord_3',
    orderCode: 'CERA-261031-ZES03',
    customerName: 'Amina Bibi',
    customerCity: 'Peshawar',
    customerPhone: '+92 312 9998877',
    items: [{ title: 'Zest: Inhalable Herbal Sinus Vapor (10ml)', quantity: 3 }],
    totalPkr: 'PKR 600',
    status: 'DELIVERED',
    paymentMethod: 'Cash on Delivery',
    date: '30 Oct 2026, 11:15',
  },
];

export default function StaffOrdersPage() {
  return (
    <>
      <PageHeader
        title="Product Orders & Fulfillment"
        lede="Review incoming natural wellness orders, print dispatch packing slips, and update courier tracking."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {/* Navigation tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-caption font-bold text-primary">
              All Orders ({SAMPLE_ORDERS.length})
            </span>
            <AppLink href="/staff" className="text-body-sm text-muted hover:text-heading">
              Enquiry Queue
            </AppLink>
            <AppLink
              href="/staff/deliveries"
              className="text-body-sm text-muted hover:text-heading"
            >
              Deliveries
            </AppLink>
          </div>
          <div className="flex items-center gap-2 text-caption text-muted">
            <ShoppingBag size={15} />
            Natural Wellness Portfolio ({VERIFIED_PORTFOLIO_PRODUCTS.length} active SKUs)
          </div>
        </div>

        {/* Orders Grid */}
        <div className="mt-8 grid list-none gap-5 p-0">
          {SAMPLE_ORDERS.map((order) => {
            const isUnfulfilled = order.status === 'UNFULFILLED';
            const isDispatched = order.status === 'DISPATCHED';

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-card transition-all hover:border-primary/40 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-body-sm font-bold text-primary">
                        {order.orderCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
                          isUnfulfilled
                            ? 'bg-amber-500/10 text-amber-700'
                            : isDispatched
                              ? 'bg-blue-500/10 text-blue-700'
                              : 'bg-emerald-500/10 text-emerald-700'
                        }`}
                      >
                        {isUnfulfilled ? (
                          <Clock size={12} />
                        ) : isDispatched ? (
                          <Truck size={12} />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        {order.status}
                      </span>
                    </div>

                    <Heading level={3} size="h4" className="mt-2 font-semibold">
                      {order.customerName} — {order.customerCity}
                    </Heading>
                    <Text size="caption" tone="muted" className="mt-0.5">
                      Phone: {order.customerPhone} • Placed on {order.date}
                    </Text>

                    <div className="mt-4 rounded-lg bg-surface-tint p-3 text-body-sm">
                      <div className="font-semibold text-heading">Items Ordered:</div>
                      <ul className="mt-1 list-disc pl-5 text-muted">
                        {order.items.map((item) => (
                          <li key={item.title}>
                            {item.quantity}x {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="text-right">
                      <div className="text-caption text-muted">Total Amount</div>
                      <div className="text-h3 font-bold text-heading">{order.totalPkr}</div>
                      <span className="text-caption text-muted">{order.paymentMethod}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-heading transition-colors hover:border-primary"
                      >
                        <Printer size={13} />
                        Packing Slip
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-caption font-semibold text-on-primary transition-opacity hover:opacity-90"
                      >
                        <Package size={13} />
                        {isUnfulfilled ? 'Mark as Dispatched' : 'Update Tracking'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
