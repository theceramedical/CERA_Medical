-- ============================================================================
-- CERA MEDICAL: Cloudflare D1 Database Initial Schema (0001_initial_schema.sql)
-- Target: Cloudflare D1 Serverless Relational Database (cera-production-db)
-- ============================================================================

-- 1. Better-Auth Tables (Authentication, SSO, Passkeys, Roles)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'customer', -- 'owner', 'staff', 'customer'
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    expires_at INTEGER,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS passkey (
    id TEXT PRIMARY KEY,
    name TEXT,
    public_key TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    webauthn_user_id TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    device_type TEXT NOT NULL,
    backed_up INTEGER NOT NULL DEFAULT 0,
    transports TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. Enquiries & Study Requests (Research & Preclinical Clients)
CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE, -- e.g. CERA-261031-ABCDE
    fingerprint TEXT,
    idempotency_key TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    customer_user_id TEXT REFERENCES user(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organisation TEXT,
    service_slug TEXT NOT NULL, -- 'preclinical-studies', 'molecular-research', 'biomedical-data-analysis'
    summary TEXT NOT NULL,
    candidate_compound TEXT,
    sample_type TEXT,
    desired_timeline TEXT,
    regulatory_framework TEXT, -- e.g. 'GLP', 'IAEC', 'Research'
    budget_range TEXT,
    internal_status TEXT NOT NULL DEFAULT 'TRIAGED', -- 'TRIAGED', 'UNDER_REVIEW', 'PROTOCOL_DRAFTED', 'CLOSED'
    assigned_staff_id TEXT REFERENCES user(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS enquiry_status_events (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    actor_user_id TEXT REFERENCES user(id),
    note TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS internal_notes (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    author_user_id TEXT NOT NULL REFERENCES user(id),
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. E-Commerce & Natural Wellness Orders (Mosscent, Activ-P, Zest)
CREATE TABLE IF NOT EXISTS commerce_orders (
    id TEXT PRIMARY KEY,
    order_code TEXT NOT NULL UNIQUE, -- e.g. CERA-ORD-261031-1001
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    total_amount_minor INTEGER NOT NULL, -- in PKR paisas (e.g. 60000 = PKR 600)
    currency TEXT NOT NULL DEFAULT 'PKR',
    payment_method TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY', -- 'CASH_ON_DELIVERY', 'BANK_TRANSFER', 'CARD'
    payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'REFUNDED'
    fulfillment_status TEXT NOT NULL DEFAULT 'UNFULFILLED', -- 'UNFULFILLED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
    tracking_number TEXT,
    courier_name TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS commerce_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
    sku TEXT NOT NULL, -- 'CERA-WELL-01' (Mosscent), 'CERA-WELL-02' (Activ-P), 'CERA-WELL-03' (Zest)
    title TEXT NOT NULL,
    unit_price_minor INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_minor INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 4. Customer Profiles & Suppressions
CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES user(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    institution TEXT,
    department TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS email_suppressions (
    email TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5. Audit & Security Events
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indices for instant query lookup
CREATE INDEX IF NOT EXISTS idx_enquiries_reference ON enquiries(reference);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(internal_status);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_code ON commerce_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status ON commerce_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
