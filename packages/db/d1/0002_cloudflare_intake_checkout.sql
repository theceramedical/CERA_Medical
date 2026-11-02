-- Additive schema required by Cloudflare D1 enquiry intake and COD checkout.
ALTER TABLE enquiries ADD COLUMN country TEXT;
ALTER TABLE enquiries ADD COLUMN consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN consent_version TEXT NOT NULL DEFAULT 'legacy-unknown';
ALTER TABLE enquiries ADD COLUMN sequencing_data_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN samples_compounds_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN health_data_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN updates_opt_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enquiries ADD COLUMN source TEXT NOT NULL DEFAULT 'web_general';

CREATE INDEX IF NOT EXISTS idx_enquiries_idempotency_key ON enquiries(idempotency_key);

CREATE TABLE IF NOT EXISTS enquiry_rate_limits (
    key_hash TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    updated_at INTEGER NOT NULL
);

-- Product rows are deliberately absent/disabled until an operator verifies the
-- D1 price and title against the current approved catalogue.
CREATE TABLE IF NOT EXISTS commerce_products (
    sku TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS commerce_carts (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS commerce_cart_items (
    cart_id TEXT NOT NULL REFERENCES commerce_carts(id) ON DELETE CASCADE,
    sku TEXT NOT NULL REFERENCES commerce_products(sku),
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    PRIMARY KEY (cart_id, sku)
);
