import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { createdAt, primaryId, subjectId, utcTimestamp } from './shared.ts';

export const commerceOrders = pgTable(
  'commerce_orders',
  {
    id: primaryId(),
    orderCode: varchar('order_code', { length: 48 }).notNull(),
    customerEmail: varchar('customer_email', { length: 254 }).notNull(),
    customerSubjectId: subjectId('customer_subject_id'),
    paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    totalMinor: integer('total_minor').notNull(),
    lines: jsonb('lines').notNull(),
    placedAt: utcTimestamp('placed_at').notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('commerce_orders_order_code_key').on(table.orderCode),
    index('commerce_orders_customer_subject_idx').on(
      table.customerSubjectId,
      table.placedAt.desc(),
    ),
    index('commerce_orders_customer_email_idx').on(table.customerEmail, table.placedAt.desc()),
    index('commerce_orders_email_lower_idx').on(sql`lower(${table.customerEmail})`),
  ],
);
