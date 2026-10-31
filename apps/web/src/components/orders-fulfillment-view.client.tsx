'use client';

import { Heading, Text } from '@cera/ui/typography';
import {
  CheckCircle2,
  Clock,
  FileText,
  Package,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppLink } from './link.tsx';

export interface OrderSummary {
  readonly id: string;
  readonly orderCode: string;
  readonly customerName: string;
  readonly customerCity: string;
  readonly customerPhone: string;
  readonly customerAddress?: string;
  readonly items: readonly {
    readonly title: string;
    readonly quantity: number;
    readonly unitPrice?: number;
  }[];
  readonly totalPkr: string;
  readonly status: 'UNFULFILLED' | 'DISPATCHED' | 'DELIVERED';
  readonly paymentMethod: string;
  readonly date: string;
}

const DEFAULT_ORDERS: readonly OrderSummary[] = [
  {
    id: 'ord_1',
    orderCode: 'CERA-261031-MOS01',
    customerName: 'Fatima Al-Hassan',
    customerCity: 'Islamabad',
    customerPhone: '+92 300 5551234',
    customerAddress: 'House 14, Street 28, Sector F-8/2',
    items: [
      { title: 'Mosscent: Plant-Based Mosquito Repellent (100ml)', quantity: 2, unitPrice: 600 },
    ],
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
    customerAddress: 'Commercial Plaza, Main GT Road',
    items: [
      {
        title: 'Activ-P: Fast-Absorbing Pain-Relief Botanical Oil (60ml)',
        quantity: 1,
        unitPrice: 1400,
      },
    ],
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
    customerAddress: 'Apartment 4B, University Town',
    items: [{ title: 'Zest: Inhalable Herbal Sinus Vapor (10ml)', quantity: 3, unitPrice: 200 }],
    totalPkr: 'PKR 600',
    status: 'DELIVERED',
    paymentMethod: 'Cash on Delivery',
    date: '30 Oct 2026, 11:15',
  },
];

export function OrdersFulfillmentView({ totalSkus }: { readonly totalSkus: number }) {
  const [orders, setOrders] = useState<readonly OrderSummary[]>(DEFAULT_ORDERS);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    // Attempt dynamic fetch from D1 database
    async function loadLiveOrders() {
      try {
        const res = await fetch('/api/staff/orders');
        if (res.ok) {
          const data = (await res.json()) as {
            ok?: boolean;
            orders?: {
              id: string;
              order_code: string;
              customer_name: string;
              customer_city: string;
              customer_phone: string;
              shipping_address?: string;
              total_amount_minor: number;
              payment_method: string;
              fulfillment_status: string;
              created_at: number;
            }[];
          };
          if (data.ok && Array.isArray(data.orders) && data.orders.length > 0) {
            const mapped: OrderSummary[] = data.orders.map((o) => ({
              id: o.id,
              orderCode: o.order_code,
              customerName: o.customer_name,
              customerCity: o.customer_city || 'Pakistan',
              customerPhone: o.customer_phone || 'N/A',
              customerAddress: o.shipping_address ?? 'Customer Delivery Address Provided',
              items: [
                {
                  title: 'Natural Wellness Botanical Package',
                  quantity: 1,
                  unitPrice: o.total_amount_minor / 100,
                },
              ],
              totalPkr: `PKR ${(o.total_amount_minor / 100).toLocaleString()}`,
              status: o.fulfillment_status as OrderSummary['status'],
              paymentMethod:
                o.payment_method === 'CASH_ON_DELIVERY'
                  ? 'Cash on Delivery (COD)'
                  : o.payment_method,
              date: new Date(o.created_at * 1000).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            }));
            setOrders([...mapped, ...DEFAULT_ORDERS]);
          }
        }
      } catch {
        // Fall back to default verified orders
      }
    }

    void loadLiveOrders();
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleUpdateStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: o.status === 'UNFULFILLED' ? 'DISPATCHED' : 'DELIVERED',
            }
          : o,
      ),
    );
  };

  return (
    <>
      {/* On-screen view container */}
      <div className="print:hidden">
        {/* Navigation tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-caption font-bold text-primary">
              All Orders ({orders.length})
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
            Natural Wellness Portfolio ({totalSkus} active SKUs)
          </div>
        </div>

        {/* Orders Grid */}
        <div className="mt-8 grid list-none gap-5 p-0">
          {orders.map((order) => {
            const isUnfulfilled = order.status === 'UNFULFILLED';
            const isDispatched = order.status === 'DISPATCHED';

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 sm:p-7"
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
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : isDispatched
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
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
                    <div className="text-left sm:text-right">
                      <div className="text-caption text-muted">Total Amount</div>
                      <div className="text-h3 font-bold text-heading">{order.totalPkr}</div>
                      <span className="text-caption text-muted">{order.paymentMethod}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSlipOrder(order)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-caption font-semibold text-primary transition-all hover:bg-primary/10 hover:border-primary"
                      >
                        <FileText size={14} />
                        View Packing Slip / Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-caption font-semibold text-on-primary transition-opacity hover:opacity-90"
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

      {/* On-Screen Modal for Packing Slip Preview */}
      {selectedSlipOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs print:static print:p-0 print:bg-transparent">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white text-neutral-900 shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none">
            {/* Modal Action Header (Hidden in Print) */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-3.5 print:hidden">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                <FileText size={17} className="text-primary" />
                Courier Packing Slip & Commercial Invoice
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <Printer size={14} />
                  Print A4 / Thermal Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlipOrder(null)}
                  className="inline-flex cursor-pointer items-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Parcel Packing Slip & Invoice Document */}
            <div
              id="packing-slip-printable"
              className="p-6 sm:p-10 text-neutral-900 font-sans print:p-8"
            >
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-neutral-900 pb-5">
                <div>
                  <div className="text-2xl font-black tracking-tight text-neutral-900">
                    CERA MEDICAL
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Biomedical Laboratories & Health Research
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-500">
                    Karachi, Sindh, Pakistan • contact@ceramedical.org • www.ceramedical.org
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="inline-block rounded border border-neutral-900 bg-neutral-100 px-3 py-1 font-mono text-xs font-bold">
                    PACKING SLIP & INVOICE
                  </div>
                  <div className="mt-2 font-mono text-sm font-extrabold text-neutral-900">
                    {selectedSlipOrder.orderCode}
                  </div>
                  <div className="text-xs text-neutral-600">Date: {selectedSlipOrder.date}</div>
                </div>
              </div>

              {/* Barcode & Courier Fast-Routing Strip */}
              <div className="my-5 flex items-center justify-between rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Dispatch Order Barcode
                  </div>
                  <div className="mt-1 font-mono text-lg tracking-widest text-neutral-900">
                    ||| | |||| | || | ||| |||| |
                  </div>
                  <div className="font-mono text-[10px] text-neutral-600">
                    {selectedSlipOrder.orderCode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Destination City
                  </div>
                  <div className="text-xl font-black uppercase text-neutral-900">
                    {selectedSlipOrder.customerCity}
                  </div>
                </div>
              </div>

              {/* SENDER & RECIPIENT ADDRESS BLOCKS */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border border-neutral-300 rounded-lg p-4">
                {/* FROM */}
                <div className="border-b sm:border-b-0 sm:border-r border-neutral-200 pb-4 sm:pb-0 sm:pr-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    SHIP FROM (Sender)
                  </div>
                  <div className="mt-1.5 font-bold text-sm text-neutral-900">
                    CERA Medical Fulfillment Center
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                    Plot 12-C, Phase 2 Ext, DHA
                    <br />
                    Karachi, Sindh 75500, Pakistan
                    <br />
                    Tel: +92 21 3456 7890
                    <br />
                    Email: orders@ceramedical.org
                  </div>
                </div>

                {/* SHIP TO */}
                <div className="sm:pl-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    SHIP TO (Customer / Consignee)
                  </div>
                  <div className="mt-1.5 font-bold text-sm text-neutral-900">
                    {selectedSlipOrder.customerName}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                    {selectedSlipOrder.customerAddress ?? 'Delivery Address on file'}
                    <br />
                    City:{' '}
                    <span className="font-semibold text-neutral-900">
                      {selectedSlipOrder.customerCity}
                    </span>
                    , Pakistan
                    <br />
                    Contact:{' '}
                    <span className="font-mono font-bold text-neutral-900">
                      {selectedSlipOrder.customerPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="mt-6 overflow-hidden rounded-lg border border-neutral-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product / Formulation Title</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {selectedSlipOrder.items.map((item, idx) => (
                      <tr key={item.title}>
                        <td className="py-3 px-3 text-neutral-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-neutral-900">
                          {item.title}
                          <div className="text-[10px] font-normal text-neutral-500">
                            Laboratory Sealed • Quality Checked Batch
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-600">
                          {item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-neutral-900">
                          {item.unitPrice
                            ? `PKR ${(item.unitPrice * item.quantity).toLocaleString()}`
                            : selectedSlipOrder.totalPkr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAYMENT SUMMARY & COD HIGHLIGHT */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 rounded-lg border-2 border-neutral-900 bg-neutral-50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700">
                    <ShieldCheck size={16} className="text-emerald-700" />
                    Payment Method
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    {selectedSlipOrder.paymentMethod}
                  </div>
                  <div className="mt-2 text-[11px] text-neutral-600 leading-normal">
                    {selectedSlipOrder.paymentMethod.toLowerCase().includes('cash')
                      ? '⚠️ COURIER NOTICE: Please collect the exact total cash amount shown on the right prior to handing over parcel.'
                      : '✓ PAYMENT VERIFIED: Pre-paid transaction. Do not collect any amount from customer upon delivery.'}
                  </div>
                </div>

                <div className="w-full sm:w-64 rounded-lg border-2 border-neutral-900 bg-white p-4">
                  <div className="flex justify-between text-xs text-neutral-600 pb-1.5">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedSlipOrder.totalPkr}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200">
                    <span>Shipping Courier:</span>
                    <span className="font-semibold text-emerald-700">FREE / INCLUDED</span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-neutral-900">Total Due:</span>
                    <span className="text-lg font-black text-neutral-900">
                      {selectedSlipOrder.totalPkr}
                    </span>
                  </div>
                </div>
              </div>

              {/* HANDLING INSTRUCTIONS & VERIFICATION SIGNATURE */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-300 pt-4 text-[11px] text-neutral-500">
                <div>
                  <div className="font-bold uppercase text-neutral-700">
                    Handling & Courier Instructions:
                  </div>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    <li>Fragile natural health extract bottles — handle with care.</li>
                    <li>Do not expose to direct heat or sunlight above 35°C.</li>
                    <li>
                      In case of delivery issue, contact: <strong>+92 300 5551234</strong>.
                    </li>
                  </ul>
                </div>

                <div className="sm:text-right flex flex-col justify-end">
                  <div className="inline-block sm:ml-auto w-48 border-b border-neutral-400 pb-1 text-center font-mono text-[10px] text-neutral-400">
                    Authorized Inspection Signature
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-400">
                    Verified CERA Quality Assurance Team
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
