import { getSession } from '../auth/session.ts';
import { rolesIncludeStaff } from '../auth/staff-roles.ts';

import { getCloudflareDatabase } from './runtime.ts';

export async function handleCloudflareStaffOrders(
  request: Request,
  update = false,
): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  const session = await getSession();
  if (!session || !rolesIncludeStaff(session.roles) || !session.mfa)
    return json({ error: 'forbidden' }, 403);
  const canRead = session.roles.some((role) =>
    ['operations_manager', 'administrator', 'auditor'].includes(role),
  );
  const canUpdate = session.roles.some((role) =>
    ['operations_manager', 'administrator'].includes(role),
  );
  if ((update && !canUpdate) || (!update && !canRead)) return json({ error: 'forbidden' }, 403);
  if (request.method !== (update ? 'POST' : 'GET'))
    return json({ error: 'method_not_allowed' }, 405);
  if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'forbidden' }, 403);

  if (!update) {
    const rows = await db
      .prepare(
        `SELECT id, order_code, customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, total_amount_minor, payment_method, fulfillment_status,
      courier_name, tracking_number, created_at FROM commerce_orders ORDER BY created_at DESC LIMIT 250`,
      )
      .all<OrderRow>();
    const orderRows = rows.results ?? [];
    const ids = orderRows.map((row) => row.id);
    const itemRows = await Promise.all(
      Array.from({ length: Math.ceil(ids.length / 100) }, (_, chunkIndex) => {
        const chunk = ids.slice(chunkIndex * 100, chunkIndex * 100 + 100);
        return db
          .prepare(
            `SELECT order_id, title, quantity, unit_price_minor FROM commerce_order_items
          WHERE order_id IN (${chunk.map(() => '?').join(',')}) ORDER BY created_at`,
          )
          .bind(...chunk)
          .all<{ order_id: string; title: string; quantity: number; unit_price_minor: number }>();
      }),
    );
    const byOrder = new Map<
      string,
      { title: string; quantity: number; unit_price_minor: number }[]
    >();
    for (const result of itemRows) {
      for (const item of result.results ?? []) {
        const existing = byOrder.get(item.order_id) ?? [];
        existing.push({
          title: item.title,
          quantity: item.quantity,
          unit_price_minor: item.unit_price_minor,
        });
        byOrder.set(item.order_id, existing);
      }
    }
    const orders = orderRows.map((row) => ({ ...row, items: byOrder.get(row.id) ?? [] }));
    return json({ ok: true, orders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_update' }, 400);
  }
  if (
    !isRecord(body) ||
    typeof body.orderId !== 'string' ||
    typeof body.orderCode !== 'string' ||
    !['UNFULFILLED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(String(body.status)) ||
    typeof body.courierName !== 'string' ||
    typeof body.trackingNumber !== 'string' ||
    body.courierName.length > 120 ||
    body.trackingNumber.length > 120
  )
    return json({ error: 'invalid_update' }, 400);
  const order = await db
    .prepare('SELECT id, fulfillment_status FROM commerce_orders WHERE id = ? AND order_code = ?')
    .bind(body.orderId, body.orderCode)
    .first<{ id: string; fulfillment_status: string }>();
  if (!order) return json({ error: 'not_found' }, 404);
  const updatedAt = Math.floor(Date.now() / 1000);
  const [result] = await db.batch([
    db
      .prepare(
        `UPDATE commerce_orders SET fulfillment_status = ?, courier_name = ?, tracking_number = ?, updated_at = ?
      WHERE id = ? AND order_code = ? AND fulfillment_status = ?`,
      )
      .bind(
        body.status,
        body.courierName.trim() || null,
        body.trackingNumber.trim() || null,
        updatedAt,
        order.id,
        body.orderCode,
        order.fulfillment_status,
      ),
    db
      .prepare(
        `INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, details_json, created_at)
      SELECT ?, ?, 'commerce.order.fulfillment_updated', 'commerce_order', ?, ?, ? WHERE changes() > 0`,
      )
      .bind(
        crypto.randomUUID(),
        session.sub,
        order.id,
        JSON.stringify({ from: order.fulfillment_status, to: body.status }),
        updatedAt,
      ),
  ]);
  if (!result?.meta?.changes) return json({ error: 'conflict' }, 409);
  return json({ ok: true });
}

interface OrderRow {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  total_amount_minor: number;
  payment_method: string;
  fulfillment_status: string;
  courier_name: string | null;
  tracking_number: string | null;
  created_at: number;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
