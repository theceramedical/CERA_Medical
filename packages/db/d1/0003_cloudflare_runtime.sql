-- Runtime support for Cloudflare customer, operations, and COD flows.
-- Product prices match the explicitly priced wellness portfolio in the web catalogue.
CREATE TABLE IF NOT EXISTS integration_deliveries (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (aggregate_type, aggregate_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_integration_deliveries_status
  ON integration_deliveries(status, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enquiries_idempotency_unique
  ON enquiries(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS enquiry_claim_tokens (
  token_hash TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  email_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consumed_by TEXT REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  email TEXT PRIMARY KEY,
  confirmation_token_hash TEXT NOT NULL,
  unsubscribe_token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

ALTER TABLE commerce_orders ADD COLUMN customer_user_id TEXT REFERENCES user(id);
ALTER TABLE commerce_orders ADD COLUMN checkout_cart_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commerce_orders_checkout_cart ON commerce_orders(checkout_cart_id);
ALTER TABLE commerce_carts ADD COLUMN checked_out_order_id TEXT REFERENCES commerce_orders(id);

INSERT INTO commerce_products (sku, title, price_minor, enabled, updated_at) VALUES
  ('CERA-WELL-01', 'Mosscent: Plant-Based Mosquito Repellent', 60000, 1, unixepoch()),
  ('CERA-WELL-02', 'Activ-P: Fast-Absorbing Pain-Relief Botanical Oil', 140000, 1, unixepoch()),
  ('CERA-WELL-03', 'Zest: Inhalable Herbal Sinus & Nasal Relief Vapor', 20000, 1, unixepoch())
ON CONFLICT(sku) DO UPDATE SET
  title = excluded.title,
  price_minor = excluded.price_minor,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;
