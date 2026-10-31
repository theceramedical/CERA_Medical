import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 1. Better-Auth Tables (Authentication, SSO, Passkeys, Roles)
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('customer'), // 'owner', 'staff', 'customer'
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const passkeys = sqliteTable('passkey', {
  id: text('id').primaryKey(),
  name: text('name'),
  publicKey: text('public_key').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  webauthnUserId: text('webauthn_user_id').notNull(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('device_type').notNull(),
  backedUp: integer('backed_up', { mode: 'boolean' }).notNull().default(false),
  transports: text('transports'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 2. Enquiries & Study Requests (Research & Preclinical Clients)
export const enquiries = sqliteTable(
  'enquiries',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(), // e.g. CERA-261031-ABCDE
    fingerprint: text('fingerprint'),
    idempotencyKey: text('idempotency_key'),
    version: integer('version').notNull().default(1),
    customerUserId: text('customer_user_id').references(() => users.id),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    organisation: text('organisation'),
    serviceSlug: text('service_slug').notNull(),
    summary: text('summary').notNull(),
    candidateCompound: text('candidate_compound'),
    sampleType: text('sample_type'),
    desiredTimeline: text('desired_timeline'),
    regulatoryFramework: text('regulatory_framework'),
    budgetRange: text('budget_range'),
    internalStatus: text('internal_status').notNull().default('TRIAGED'),
    assignedStaffId: text('assigned_staff_id').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_enquiries_reference').on(table.reference),
    index('idx_enquiries_status').on(table.internalStatus),
    index('idx_enquiries_email').on(table.email),
  ],
);

export const enquiryStatusEvents = sqliteTable('enquiry_status_events', {
  id: text('id').primaryKey(),
  enquiryId: text('enquiry_id')
    .notNull()
    .references(() => enquiries.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status').notNull(),
  toStatus: text('to_status').notNull(),
  actorUserId: text('actor_user_id').references(() => users.id),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const internalNotes = sqliteTable('internal_notes', {
  id: text('id').primaryKey(),
  enquiryId: text('enquiry_id')
    .notNull()
    .references(() => enquiries.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 3. E-Commerce & Natural Wellness Orders
export const commerceOrders = sqliteTable(
  'commerce_orders',
  {
    id: text('id').primaryKey(),
    orderCode: text('order_code').notNull().unique(), // e.g. CERA-ORD-261031-1001
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingCity: text('shipping_city').notNull(),
    totalAmountMinor: integer('total_amount_minor').notNull(),
    currency: text('currency').notNull().default('PKR'),
    paymentMethod: text('payment_method').notNull().default('CASH_ON_DELIVERY'),
    paymentStatus: text('payment_status').notNull().default('PENDING'),
    fulfillmentStatus: text('fulfillment_status').notNull().default('UNFULFILLED'),
    trackingNumber: text('tracking_number'),
    courierName: text('courier_name'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_commerce_orders_code').on(table.orderCode),
    index('idx_commerce_orders_status').on(table.fulfillmentStatus),
  ],
);

export const commerceOrderItems = sqliteTable('commerce_order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => commerceOrders.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull(),
  title: text('title').notNull(),
  unitPriceMinor: integer('unit_price_minor').notNull(),
  quantity: integer('quantity').notNull().default(1),
  totalMinor: integer('total_minor').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 4. Customer Profiles & Suppressions
export const customerProfiles = sqliteTable('customer_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .unique()
    .references(() => users.id),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  institution: text('institution'),
  department: text('department'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const emailSuppressions = sqliteTable('email_suppressions', {
  email: text('email').primaryKey(),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 5. Audit & Security Events
export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  detailsJson: text('details_json'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});
