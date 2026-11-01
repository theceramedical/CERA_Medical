import {
  AddCartLineBodySchema,
  CheckoutCompleteBodySchema,
  UpdateCartLineBodySchema,
} from '@cera/contracts';

import { getCloudflareDatabase } from './runtime.ts';

const CART_COOKIE = '__Host-cera_cart';
const CART_TTL_SECONDS = 30 * 24 * 60 * 60;

interface ProductRow {
  sku: string;
  title: string;
  price_minor: number;
}
type CartRow = ProductRow & { quantity: number };

export async function handleCloudflareCart(
  request: Request,
  lineId?: string,
): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'forbidden' }, 403);
  if (request.method !== 'GET' && process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== 'true')
    return json({ error: 'checkout_unavailable' }, 503);

  let addLine: { slug: string; quantity: number } | null = null;
  if (request.method === 'POST') {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json({ error: 'invalid_cart_line' }, 400);
    }
    const parsed = AddCartLineBodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: 'invalid_cart_line' }, 400);
    const product = await db
      .prepare('SELECT sku FROM commerce_products WHERE sku = ? AND enabled = 1')
      .bind(parsed.data.slug)
      .first();
    if (!product) return json({ error: 'product_unavailable' }, 404);
    addLine = parsed.data;
  }

  let cartId = readCookie(request, CART_COOKIE);
  let setCookie: string | null = null;
  if (request.method === 'POST' || (request.method === 'GET' && cartId)) {
    const cart = cartId
      ? await db
          .prepare(
            'SELECT id, checked_out_order_id FROM commerce_carts WHERE id = ? AND expires_at > ?',
          )
          .bind(cartId, now())
          .first<{ id: string; checked_out_order_id: string | null }>()
      : null;
    if (!cart || cart.checked_out_order_id) cartId = null;
  }
  if (request.method === 'POST' && !cartId) {
    cartId = crypto.randomUUID();
    await db
      .prepare('INSERT INTO commerce_carts (id, expires_at) VALUES (?, ?)')
      .bind(cartId, now() + CART_TTL_SECONDS)
      .run();
    setCookie = cartCookie(cartId);
  }
  if (!cartId && request.method === 'GET') return json(emptyCart());
  if (!cartId) return json({ error: 'cart_unavailable' }, 503);

  if (request.method === 'POST') {
    if (!addLine) return json({ error: 'invalid_cart_line' }, 400);
    await db
      .prepare(
        `INSERT INTO commerce_cart_items (cart_id, sku, quantity) VALUES (?, ?, ?)
      ON CONFLICT(cart_id, sku) DO UPDATE SET quantity = MIN(99, commerce_cart_items.quantity + excluded.quantity)`,
      )
      .bind(cartId, addLine.slug, addLine.quantity)
      .run();
  } else if (request.method === 'PATCH') {
    if (!lineId) return json({ error: 'not_found' }, 404);
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json({ error: 'invalid_cart_line' }, 400);
    }
    const parsed = UpdateCartLineBodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: 'invalid_cart_line' }, 400);
    if (parsed.data.quantity === 0) {
      await db
        .prepare('DELETE FROM commerce_cart_items WHERE cart_id = ? AND sku = ?')
        .bind(cartId, lineId)
        .run();
    } else {
      const result = await db
        .prepare('UPDATE commerce_cart_items SET quantity = ? WHERE cart_id = ? AND sku = ?')
        .bind(parsed.data.quantity, cartId, lineId)
        .run();
      if (!result.meta?.changes) return json({ error: 'not_found' }, 404);
    }
  } else if (request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const result = await db
    .prepare(
      `SELECT p.sku, p.title, p.price_minor, i.quantity
    FROM commerce_cart_items i JOIN commerce_products p ON p.sku = i.sku
    WHERE i.cart_id = ? AND p.enabled = 1 ORDER BY p.title`,
    )
    .bind(cartId)
    .all<CartRow>();
  const lines = (result.results ?? []).map((row) => ({
    id: row.sku,
    slug: row.sku,
    title: row.title,
    quantity: row.quantity,
    unitPriceMinor: row.price_minor,
    lineTotalMinor: row.price_minor * row.quantity,
  }));
  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return json(
    { currencyCode: 'PKR', lines, subtotalMinor, totalMinor: subtotalMinor },
    200,
    setCookie,
  );
}

export async function handleCloudflareCheckout(request: Request): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  if (process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== 'true')
    return json({ error: 'checkout_unavailable' }, 503);
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'forbidden' }, 403);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'invalid_checkout' }, 400);
  }
  const body = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  const normalized = body
    ? {
        ...body,
        email: typeof body.email === 'string' ? body.email.trim() : body.email,
        fullName: typeof body.fullName === 'string' ? body.fullName.trim() : body.fullName,
      }
    : raw;
  const parsed = CheckoutCompleteBodySchema.safeParse(normalized);
  if (!parsed.success) return json({ error: 'invalid_checkout' }, 422);
  if (!parsed.data.fullName) return json({ error: 'invalid_checkout' }, 422);
  if (parsed.data.billingAddress !== undefined)
    return json({ error: 'billing_address_not_supported' }, 422);
  if (parsed.data.paymentMethod !== 'cod') return json({ error: 'cash_on_delivery_only' }, 422);
  const cartId = readCookie(request, CART_COOKIE);
  if (!cartId) return json({ error: 'empty_cart' }, 409);
  const existing = await db
    .prepare(
      `SELECT o.order_code FROM commerce_carts c
    JOIN commerce_orders o ON o.id = c.checked_out_order_id WHERE c.id = ?`,
    )
    .bind(cartId)
    .first<{ order_code: string }>();
  if (existing) return json({ orderCode: existing.order_code });
  const salt = process.env.ENQUIRY_RATE_LIMIT_SALT;
  if (!salt) return json({ error: 'checkout_unavailable' }, 503);
  const emailHash = await sha256(
    `${salt}:checkout-email:${parsed.data.email.trim().toLowerCase()}`,
  );
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipHash = await sha256(`${salt}:checkout-ip:${ip}`);
  const currentHour = Math.floor(Date.now() / 3_600_000) * 3600;
  const currentTime = now();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at)
          VALUES (?, ?, 1, ?) ON CONFLICT(key_hash) DO UPDATE SET
          request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
            THEN enquiry_rate_limits.request_count + 1 ELSE 1 END,
          window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`checkout-email:${emailHash}`, currentHour, currentTime),
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at)
          VALUES (?, ?, 1, ?) ON CONFLICT(key_hash) DO UPDATE SET
          request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
            THEN enquiry_rate_limits.request_count + 1 ELSE 1 END,
          window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`checkout-ip:${ipHash}`, currentHour, currentTime),
    ]);
    const limits = await db
      .prepare(
        `SELECT
          (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS email_count,
          (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS ip_count`,
      )
      .bind(`checkout-email:${emailHash}`, currentHour, `checkout-ip:${ipHash}`, currentHour)
      .first<{ email_count: number; ip_count: number }>();
    if ((limits?.email_count ?? 0) > 5 || (limits?.ip_count ?? 0) > 10)
      return json({ error: 'rate_limited' }, 429);
    await db
      .prepare('DELETE FROM enquiry_rate_limits WHERE updated_at < ?')
      .bind(currentTime - 86400)
      .run();
  } catch {
    return json({ error: 'checkout_unavailable' }, 503);
  }
  const cart = await db
    .prepare(
      `SELECT p.sku, p.title, p.price_minor, i.quantity FROM commerce_cart_items i
    JOIN commerce_products p ON p.sku = i.sku WHERE i.cart_id = ? AND p.enabled = 1`,
    )
    .bind(cartId)
    .all<CartRow>();
  const items = cart.results ?? [];
  if (!items.length) return json({ error: 'empty_cart' }, 409);
  const address = parsed.data.deliveryAddress;
  const total = items.reduce((sum, item) => sum + item.price_minor * item.quantity, 0);
  const orderId = crypto.randomUUID();
  const orderCode = `CERA-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
  const created = now();
  const statements = [
    db
      .prepare(
        `INSERT INTO commerce_orders
    (id, order_code, customer_name, customer_email, customer_phone, shipping_address, shipping_city,
     total_amount_minor, currency, payment_method, payment_status, fulfillment_status, customer_user_id, checkout_cart_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PKR', 'CASH_ON_DELIVERY', 'PENDING', 'UNFULFILLED', ?, ?, ?, ?)`,
      )
      .bind(
        orderId,
        orderCode,
        parsed.data.fullName,
        parsed.data.email.toLowerCase(),
        address.phoneNumber,
        [
          address.streetLine1,
          address.streetLine2,
          address.city,
          address.province,
          address.postalCode,
          parsed.data.countryCode,
        ]
          .filter(Boolean)
          .join(', '),
        address.city,
        total,
        null,
        cartId,
        created,
        created,
      ),
    ...items.map((item) =>
      db
        .prepare(
          `INSERT INTO commerce_order_items (id, order_id, sku, title, unit_price_minor, quantity, total_minor)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          orderId,
          item.sku,
          item.title,
          item.price_minor,
          item.quantity,
          item.price_minor * item.quantity,
        ),
    ),
    db
      .prepare(
        'UPDATE commerce_carts SET checked_out_order_id = ?, updated_at = ? WHERE id = ? AND checked_out_order_id IS NULL',
      )
      .bind(orderId, created, cartId),
    db
      .prepare(
        `INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, 'commerce.order.created', 'commerce_order', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        null,
        orderId,
        JSON.stringify({ paymentMethod: 'CASH_ON_DELIVERY', totalMinor: total }),
        created,
      ),
  ];
  try {
    await db.batch(statements);
    return json({ orderCode });
  } catch {
    // A concurrent retry can win the unique cart checkout; return its order instead of duplicating it.
    const winner = await db
      .prepare(
        `SELECT o.order_code FROM commerce_carts c JOIN commerce_orders o
      ON o.id = c.checked_out_order_id WHERE c.id = ?`,
      )
      .bind(cartId)
      .first<{ order_code: string }>();
    return winner
      ? json({ orderCode: winner.order_code })
      : json({ error: 'checkout_unavailable' }, 503);
  }
}

/** Confirms success only when this browser's cart cookie is linked to the persisted order. */
export async function handleCloudflareCheckoutConfirmation(
  request: Request,
): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  if (process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== 'true')
    return json({ error: 'checkout_unavailable' }, 503);

  const orderCode = new URL(request.url).searchParams.get('order');
  const cartId = readCookie(request, CART_COOKIE);
  if (!orderCode || orderCode.length > 64 || !cartId)
    return json({ error: 'order_not_found' }, 404);

  try {
    const order = await db
      .prepare(
        `SELECT o.order_code FROM commerce_carts c
        JOIN commerce_orders o ON o.id = c.checked_out_order_id AND o.checkout_cart_id = c.id
        WHERE c.id = ? AND o.order_code = ?`,
      )
      .bind(cartId, orderCode)
      .first<{ order_code: string }>();
    if (!order) return json({ error: 'order_not_found' }, 404);
    return json({ orderCode: order.order_code });
  } catch {
    return json({ error: 'confirmation_unavailable' }, 503);
  }
}

function emptyCart() {
  return { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
}
function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get('cookie') ?? '';
  const value = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
function cartCookie(id: string): string {
  return `${CART_COOKIE}=${id}; Path=/; Max-Age=${CART_TTL_SECONDS}; HttpOnly; SameSite=Lax; Secure`;
}
function now(): number {
  return Math.floor(Date.now() / 1000);
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function json(body: unknown, status = 200, cookie: string | null = null): Response {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  if (cookie) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}
