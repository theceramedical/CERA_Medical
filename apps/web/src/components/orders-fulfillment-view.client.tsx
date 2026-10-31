'use client';

import { Heading, Text } from '@cera/ui/typography';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Package,
  Printer,
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
  readonly courierName?: string;
  readonly trackingNumber?: string;
}

const COURIER_OPTIONS = [
  { id: 'TCS', name: 'TCS Express' },
  { id: 'LEOPARDS', name: 'Leopards Courier' },
  { id: 'TRAX', name: 'Trax Logistics' },
  { id: 'POSTEX', name: 'PostEx' },
  { id: 'MNP', name: 'M&P Express' },
  { id: 'RIDER', name: 'Direct Rider / Staff Dispatch' },
] as const;

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
    courierName: 'TCS Express',
    trackingNumber: '',
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
    courierName: 'TCS Express',
    trackingNumber: '7721984210',
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
    courierName: 'Leopards Courier',
    trackingNumber: 'LEO-9918234',
  },
];

const LOCAL_STORAGE_KEY = 'cera_staff_orders_overrides_v1';

export function OrdersFulfillmentView({ totalSkus }: { readonly totalSkus: number }) {
  const [orders, setOrders] = useState<readonly OrderSummary[]>(DEFAULT_ORDERS);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<OrderSummary | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderSummary | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNFULFILLED' | 'DISPATCHED' | 'DELIVERED'>('ALL');

  // Form states inside tracking modal
  const [modalCourier, setModalCourier] = useState('TCS Express');
  const [modalTracking, setModalTracking] = useState('');
  const [modalStatus, setModalStatus] = useState<'UNFULFILLED' | 'DISPATCHED' | 'DELIVERED'>(
    'DISPATCHED',
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load from D1 or LocalStorage fallback
  useEffect(() => {
    async function loadLiveOrders() {
      try {
        let baseOrders: OrderSummary[] = [...DEFAULT_ORDERS];

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
              courier_name?: string;
              tracking_number?: string;
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
              courierName: o.courier_name ?? 'TCS Express',
              trackingNumber: o.tracking_number ?? '',
            }));
            baseOrders = [...mapped, ...DEFAULT_ORDERS];
          }
        }

        // Apply local overrides if saved
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            try {
              const overrides = JSON.parse(saved) as Record<string, Partial<OrderSummary>>;
              baseOrders = baseOrders.map((o) => {
                const match = overrides[o.id] ?? overrides[o.orderCode];
                return match ? { ...o, ...match } : o;
              });
            } catch {
              // Ignore invalid storage
            }
          }
        }

        setOrders(baseOrders);
      } catch {
        // Retain default orders
      }
    }

    void loadLiveOrders();
  }, []);

  const persistOrderUpdate = async (
    orderId: string,
    orderCode: string,
    newStatus: OrderSummary['status'],
    courierName: string,
    trackingNumber: string,
  ) => {
    // 1. Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderCode === orderCode
          ? { ...o, status: newStatus, courierName, trackingNumber }
          : o,
      ),
    );

    // 2. Save in localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const existing = raw ? (JSON.parse(raw) as Record<string, Partial<OrderSummary>>) : {};
        existing[orderId] = { status: newStatus, courierName, trackingNumber };
        existing[orderCode] = { status: newStatus, courierName, trackingNumber };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
      } catch {
        // Storage full/sandboxed
      }
    }

    // 3. Post to D1 backend
    try {
      await fetch('/api/staff/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderCode,
          status: newStatus,
          courierName,
          trackingNumber,
        }),
      });
    } catch {
      // Offline / fallback handled optimistically
    }
  };

  const openTrackingModal = (order: OrderSummary, targetStatus?: OrderSummary['status']) => {
    setTrackingModalOrder(order);
    setModalCourier(order.courierName ?? 'TCS Express');
    setModalTracking(order.trackingNumber ?? '');
    setModalStatus(targetStatus ?? order.status);
  };

  const handleSaveTrackingModal = async () => {
    if (!trackingModalOrder) return;
    setIsSaving(true);
    await persistOrderUpdate(
      trackingModalOrder.id,
      trackingModalOrder.orderCode,
      modalStatus,
      modalCourier,
      modalTracking.trim(),
    );
    setIsSaving(false);
    setTrackingModalOrder(null);
  };

  const handleQuickMarkDelivered = async (order: OrderSummary) => {
    await persistOrderUpdate(
      order.id,
      order.orderCode,
      'DELIVERED',
      order.courierName ?? 'TCS Express',
      order.trackingNumber ?? '',
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator.clipboard !== 'undefined') {
      void navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  const unfulfilledCount = orders.filter((o) => o.status === 'UNFULFILLED').length;
  const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <>
      {/* On-screen view container */}
      <div className="print:hidden">
        {/* Navigation tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`rounded-full px-3.5 py-1 text-caption font-bold transition-colors ${
                filter === 'ALL'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-tint text-muted hover:text-heading'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNFULFILLED')}
              className={`rounded-full px-3.5 py-1 text-caption font-bold transition-colors ${
                filter === 'UNFULFILLED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-surface-tint text-muted hover:text-heading'
              }`}
            >
              Unfulfilled ({unfulfilledCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('DISPATCHED')}
              className={`rounded-full px-3.5 py-1 text-caption font-bold transition-colors ${
                filter === 'DISPATCHED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-tint text-muted hover:text-heading'
              }`}
            >
              In Transit ({dispatchedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('DELIVERED')}
              className={`rounded-full px-3.5 py-1 text-caption font-bold transition-colors ${
                filter === 'DELIVERED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-tint text-muted hover:text-heading'
              }`}
            >
              Delivered ({deliveredCount})
            </button>

            <span className="mx-2 text-neutral-300 dark:text-neutral-700">|</span>

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
          {filteredOrders.map((order) => {
            const isUnfulfilled = order.status === 'UNFULFILLED';
            const isDispatched = order.status === 'DISPATCHED';
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:border-primary/40 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    {/* Header: Code & Status */}
                    <div className="flex flex-wrap items-center gap-3">
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

                    {/* Customer Info */}
                    <Heading level={3} size="h4" className="mt-2 font-semibold">
                      {order.customerName} — {order.customerCity}
                    </Heading>
                    <Text size="caption" tone="muted" className="mt-0.5">
                      Phone: {order.customerPhone} • Placed on {order.date}
                    </Text>

                    {/* Items Box */}
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

                    {/* Logical Courier Tracking Strip */}
                    {isDispatched || isDelivered ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-tint/60 px-3.5 py-2.5 text-xs text-muted">
                        <span className="flex items-center gap-1.5 font-semibold text-heading">
                          <Truck
                            size={14}
                            className={isDispatched ? 'text-blue-600' : 'text-emerald-600'}
                          />
                          {order.courierName ?? 'Courier Assigned'}
                        </span>
                        <span className="text-border">•</span>
                        <span>Tracking:</span>
                        {order.trackingNumber ? (
                          <span className="flex items-center gap-1.5 font-mono font-bold text-heading">
                            {order.trackingNumber}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.trackingNumber ?? '', order.id)}
                              className="cursor-pointer text-muted transition-colors hover:text-heading"
                              title="Copy tracking number"
                            >
                              {copiedId === order.id ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </span>
                        ) : (
                          <span className="italic text-muted">No tracking number added yet</span>
                        )}

                        {isDelivered ? (
                          <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Delivered
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                        <AlertCircle size={13} />
                        Pending packing & courier handover
                      </div>
                    )}
                  </div>

                  {/* Financials & Logical Action Buttons */}
                  <div className="flex flex-col items-start gap-3 sm:items-end sm:min-w-[200px]">
                    <div className="text-left sm:text-right">
                      <div className="text-caption text-muted">Total Amount</div>
                      <div className="text-h3 font-bold text-heading">{order.totalPkr}</div>
                      <span className="text-caption text-muted">{order.paymentMethod}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 sm:justify-end">
                      {/* 1. Always accessible: Print Parcel Slip & Invoice */}
                      <button
                        type="button"
                        onClick={() => setSelectedSlipOrder(order)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-caption font-semibold text-primary transition-all hover:bg-primary/10 hover:border-primary"
                      >
                        <FileText size={14} />
                        Packing Slip
                      </button>

                      {/* 2. UNFULFILLED State: Primary Action is Dispatch & Track */}
                      {isUnfulfilled ? (
                        <button
                          type="button"
                          onClick={() => openTrackingModal(order, 'DISPATCHED')}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-caption font-semibold text-on-primary transition-opacity hover:opacity-90 shadow-xs"
                        >
                          <Truck size={13} />
                          Dispatch Order
                        </button>
                      ) : null}

                      {/* 3. DISPATCHED State: Primary Action is Mark Delivered, Secondary is Edit Tracking */}
                      {isDispatched ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openTrackingModal(order)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-muted transition-colors hover:text-heading hover:border-primary/50"
                          >
                            <Package size={13} />
                            Edit Tracking
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuickMarkDelivered(order)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-caption font-semibold text-white transition-opacity hover:opacity-90 shadow-xs"
                          >
                            <CheckCircle2 size={13} />
                            Mark Delivered
                          </button>
                        </>
                      ) : null}

                      {/* 4. DELIVERED State: Option to view/adjust tracking details */}
                      {isDelivered ? (
                        <button
                          type="button"
                          onClick={() => openTrackingModal(order)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-caption font-medium text-muted transition-colors hover:text-heading"
                        >
                          <Package size={13} />
                          Tracking Details
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRACKING & DISPATCH MODAL */}
      {trackingModalOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                <h3 className="text-base font-bold text-heading">
                  {trackingModalOrder.status === 'UNFULFILLED'
                    ? 'Dispatch Order & Assign Courier'
                    : 'Update Courier & Tracking'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="cursor-pointer rounded-lg p-1 text-muted hover:text-heading"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Order Info Banner */}
              <div className="rounded-lg bg-surface-tint p-3 text-xs leading-relaxed text-muted">
                Order:{' '}
                <strong className="font-mono text-heading">{trackingModalOrder.orderCode}</strong>
                <br />
                Customer:{' '}
                <strong className="text-heading">{trackingModalOrder.customerName}</strong> (
                {trackingModalOrder.customerCity})
              </div>

              {/* Courier Selection */}
              <div>
                <label
                  htmlFor="modal-courier-select"
                  className="block text-xs font-semibold text-heading"
                >
                  Courier Service
                </label>
                <select
                  id="modal-courier-select"
                  value={modalCourier}
                  onChange={(e) => setModalCourier(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-heading shadow-xs focus:border-primary focus:outline-none"
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consignment / Tracking Number */}
              <div>
                <label
                  htmlFor="modal-tracking-input"
                  className="block text-xs font-semibold text-heading"
                >
                  Consignment / Tracking Number (CN#)
                </label>
                <input
                  id="modal-tracking-input"
                  type="text"
                  placeholder="e.g. 7721984210"
                  value={modalTracking}
                  onChange={(e) => setModalTracking(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-heading shadow-xs focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted">
                  The tracking number provided by the courier when the parcel was booked.
                </p>
              </div>

              {/* Fulfillment Status */}
              <div>
                <label
                  htmlFor="modal-status-select"
                  className="block text-xs font-semibold text-heading"
                >
                  Fulfillment Stage
                </label>
                <select
                  id="modal-status-select"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as OrderSummary['status'])}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-heading shadow-xs focus:border-primary focus:outline-none"
                >
                  <option value="UNFULFILLED">Unfulfilled (Ready for Dispatch)</option>
                  <option value="DISPATCHED">Dispatched (In Transit with Courier)</option>
                  <option value="DELIVERED">Delivered (Handed over to customer)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="cursor-pointer rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-heading"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSaveTrackingModal()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check size={14} />
                {isSaving ? 'Saving...' : 'Save & Confirm Tracking'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PAKISTANI COURIER PARCEL PACKING SLIP & INVOICE MODAL */}
      {selectedSlipOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs print:static print:p-0 print:bg-transparent">
          {/* Print CSS Injection to guarantee 100% single-page isolation with ZERO background clutter */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
                height: 100% !important;
              }
              body * {
                visibility: hidden !important;
              }
              #pakistan-courier-invoice,
              #pakistan-courier-invoice * {
                visibility: visible !important;
              }
              #pakistan-courier-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 4mm !important;
                box-sizing: border-box !important;
                background: white !important;
                display: block !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
            }}
          />

          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white text-neutral-900 shadow-2xl print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Modal Action Header (Hidden in Print) */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-3.5 print:hidden">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                <FileText size={17} className="text-primary" />
                Pakistan Courier Parcel Slip & COD Invoice
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <Printer size={14} />
                  Print 1-Page Courier Slip (A4 / Thermal)
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

            {/* Standard Pakistani Courier COD Dispatch Label & Invoice Document */}
            <div
              id="pakistan-courier-invoice"
              className="p-6 sm:p-8 text-neutral-900 font-sans print:p-2 bg-white"
            >
              <div className="border-2 border-neutral-900 rounded-lg p-4 print:p-3">
                {/* 1. Header: Merchant Brand + Service & Courier Tracking */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b-2 border-neutral-900 pb-3">
                  <div>
                    <div className="text-xl font-black tracking-tight text-neutral-900 uppercase">
                      CERA MEDICAL LABORATORIES
                    </div>
                    <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      Biomedical Research & Natural Health Formulations
                    </div>
                    <div className="text-[10px] text-neutral-600">
                      Fulfillment Hub: Plot 12-C, Phase 2 Ext, DHA, Karachi • Helpline: +92 21 3456
                      7890
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l-2 border-neutral-900 pt-2 sm:pt-0 sm:pl-4">
                    <div className="inline-block rounded bg-neutral-900 text-white px-2.5 py-0.5 text-[11px] font-black tracking-wider uppercase">
                      {selectedSlipOrder.paymentMethod.toLowerCase().includes('cash')
                        ? 'CASH ON DELIVERY (COD)'
                        : 'PREPAID SHIPMENT'}
                    </div>
                    <div className="mt-1 font-mono text-xs font-black text-neutral-900">
                      COURIER: {selectedSlipOrder.courierName ?? 'TCS Express'}
                    </div>
                    <div className="font-mono text-xs font-bold text-neutral-700">
                      CN: {selectedSlipOrder.trackingNumber ?? '7721984210'}
                    </div>
                  </div>
                </div>

                {/* 2. Routing City Strip + Barcode (Critical for TCS / Leopards / Trax) */}
                <div className="my-3 grid grid-cols-2 sm:grid-cols-3 items-center border border-neutral-900 bg-neutral-100 p-2.5 rounded">
                  <div>
                    <div className="text-[9px] font-bold uppercase text-neutral-500">
                      Origin City
                    </div>
                    <div className="text-sm font-black text-neutral-900">KARACHI (KHI)</div>
                  </div>

                  <div className="text-center col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-x border-neutral-300 pt-1 sm:pt-0">
                    <div className="text-[9px] font-bold uppercase text-neutral-500">
                      Consignment Barcode
                    </div>
                    <div className="font-mono text-base tracking-widest text-neutral-900 font-bold leading-tight">
                      ||| | |||| | || | ||| |||| |
                    </div>
                    <div className="font-mono text-[9px] text-neutral-600 font-bold">
                      {selectedSlipOrder.trackingNumber ?? selectedSlipOrder.orderCode}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase text-neutral-500">
                      Destination City
                    </div>
                    <div className="text-base sm:text-lg font-black uppercase text-neutral-900">
                      {selectedSlipOrder.customerCity}
                    </div>
                  </div>
                </div>

                {/* 3. Shipper & Consignee 2-Column Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 border border-neutral-900 rounded divide-y sm:divide-y-0 sm:divide-x divide-neutral-900 text-xs">
                  {/* SHIPPER */}
                  <div className="p-3 bg-neutral-50/50">
                    <div className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                      SHIPPER (Return If Undelivered):
                    </div>
                    <div className="mt-1 font-bold text-neutral-900">
                      CERA Medical Fulfillment Hub
                    </div>
                    <div className="mt-0.5 text-neutral-700 leading-tight text-[11px]">
                      Plot 12-C, Phase 2 Ext, Commercial Area, DHA
                      <br />
                      Karachi, Sindh 75500, Pakistan
                      <br />
                      <strong>Contact:</strong> 021-34567890 / 0300-5551234
                    </div>
                  </div>

                  {/* CONSIGNEE (CUSTOMER) */}
                  <div className="p-3 bg-neutral-50/50">
                    <div className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                      CONSIGNEE (Customer Delivery):
                    </div>
                    <div className="mt-1 font-extrabold text-sm text-neutral-900">
                      {selectedSlipOrder.customerName}
                    </div>
                    <div className="mt-1 text-neutral-800 leading-tight text-[11px]">
                      <strong>Address:</strong>{' '}
                      {selectedSlipOrder.customerAddress ?? 'Delivery Address on file'}
                      <br />
                      <strong>City:</strong>{' '}
                      <span className="font-bold uppercase">{selectedSlipOrder.customerCity}</span>,
                      Pakistan
                      <br />
                      <span className="inline-block mt-1 bg-yellow-100 border border-neutral-400 px-1.5 py-0.5 rounded font-mono font-black text-xs text-neutral-900">
                        📞 Phone: {selectedSlipOrder.customerPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Order Information Strip */}
                <div className="my-2 flex flex-wrap items-center justify-between border-y border-neutral-300 py-1.5 text-[11px] text-neutral-700">
                  <div>
                    Order Ref:{' '}
                    <strong className="font-mono text-neutral-900">
                      {selectedSlipOrder.orderCode}
                    </strong>
                  </div>
                  <div>
                    Booking Date: <strong>{selectedSlipOrder.date}</strong>
                  </div>
                  <div>
                    Total Pieces:{' '}
                    <strong>
                      {selectedSlipOrder.items.reduce((s, i) => s + i.quantity, 0)} Pcs
                    </strong>
                  </div>
                </div>

                {/* 5. Products Table */}
                <div className="border border-neutral-900 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-900 font-bold uppercase text-[10px] text-neutral-800">
                        <th className="py-1.5 px-2 w-8">#</th>
                        <th className="py-1.5 px-2">Item Description & Product Title</th>
                        <th className="py-1.5 px-2 text-center w-14">Qty</th>
                        <th className="py-1.5 px-2 text-right w-24">Price (PKR)</th>
                        <th className="py-1.5 px-2 text-right w-24">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300 text-[11px]">
                      {selectedSlipOrder.items.map((item, idx) => (
                        <tr key={item.title}>
                          <td className="py-1.5 px-2 text-neutral-600 font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-semibold text-neutral-900">
                            {item.title}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-1.5 px-2 text-right text-neutral-700">
                            {item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-neutral-900">
                            {item.unitPrice
                              ? `PKR ${(item.unitPrice * item.quantity).toLocaleString()}`
                              : selectedSlipOrder.totalPkr}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 6. Standard Pakistani COD Highlight Block (Crucial for Couriers & Riders) */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                  <div className="border-2 border-neutral-900 rounded p-2.5 bg-neutral-50 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-neutral-800">
                        RIDER CASH COLLECTION NOTICE
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-700 leading-tight">
                        {selectedSlipOrder.paymentMethod.toLowerCase().includes('cash')
                          ? '⚠️ CASH ON DELIVERY: Please collect the full COD cash amount shown on the right before parcel handover. Do not deliver without receiving payment.'
                          : '✓ PREPAID ORDER: Payment already verified online. Zero cash collection required from consignee.'}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-neutral-500 italic">
                      Special Courier Note: Fragile botanical health extract. Handle with care.
                    </div>
                  </div>

                  <div className="border-2 border-neutral-900 bg-neutral-100 rounded p-3 text-center sm:text-right flex flex-col justify-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      COD AMOUNT TO COLLECT:
                    </div>
                    <div className="text-2xl font-black text-neutral-900 font-mono tracking-tight mt-0.5">
                      {selectedSlipOrder.totalPkr}/-
                    </div>
                    <div className="text-[10px] font-bold text-neutral-600 uppercase mt-0.5">
                      (Courier Shipping Fee Included)
                    </div>
                  </div>
                </div>

                {/* 7. Footer Signatures Strip */}
                <div className="mt-3 pt-2 border-t border-neutral-400 grid grid-cols-2 gap-4 text-[10px] text-neutral-600">
                  <div>
                    <div className="border-b border-neutral-400 pb-1 w-40 font-mono text-neutral-400">
                      Rider Signature & Stamp
                    </div>
                    <div className="mt-0.5 text-[9px]">Delivered By / CN Booking Agent</div>
                  </div>

                  <div className="text-right">
                    <div className="border-b border-neutral-400 pb-1 ml-auto w-40 font-mono text-neutral-400 text-center">
                      Consignee Signature
                    </div>
                    <div className="mt-0.5 text-[9px]">Received in Good Condition</div>
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
