import { randomUUID } from 'node:crypto';

import {
  CustomerOrderSchema,
  customerOrderPaymentLabel,
  type Cart,
  type CustomerOrder,
} from '@cera/contracts';
import { z } from 'zod';

import type { Pool } from 'pg';

const PaymentMethodSchema = z.enum(['cod', 'safepay', 'test']);

export interface RecordCommerceOrderInput {
  readonly orderCode: string;
  readonly email: string;
  readonly fullName: string;
  readonly paymentMethod: z.infer<typeof PaymentMethodSchema>;
  readonly cart: Cart;
  readonly customerSubjectId: string | null;
}

interface OrderRow {
  readonly order_code: string;
  readonly placed_at: Date;
  readonly payment_method: string;
  readonly currency_code: string;
  readonly total_minor: number;
  readonly lines: unknown;
}

function mapRow(row: OrderRow): CustomerOrder {
  const method = PaymentMethodSchema.parse(row.payment_method);
  const lines = z
    .array(
      z.object({
        slug: z.string(),
        title: z.string(),
        quantity: z.number(),
        lineTotalMinor: z.number(),
      }),
    )
    .parse(row.lines);
  return CustomerOrderSchema.parse({
    orderCode: row.order_code,
    placedAt: row.placed_at.toISOString(),
    paymentMethod: method,
    paymentLabel: customerOrderPaymentLabel(method),
    currencyCode: row.currency_code,
    totalMinor: row.total_minor,
    lines: lines.map((line) => ({
      slug: line.slug,
      title: line.title,
      quantity: line.quantity,
      lineTotalMinor: line.lineTotalMinor,
    })),
  });
}

export function postgresCommerceOrderStore(pool: Pool) {
  return {
    async record(input: RecordCommerceOrderInput): Promise<void> {
      const id = randomUUID();
      const lines = input.cart.lines.map((line) => ({
        slug: line.slug,
        title: line.title,
        quantity: line.quantity,
        lineTotalMinor: line.lineTotalMinor,
      }));
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO commerce_orders (
            id, order_code, customer_email, customer_subject_id,
            payment_method, currency_code, total_minor, lines
          ) VALUES ($1,$2,lower($3),$4,$5,$6,$7,$8)`,
          [
            id,
            input.orderCode,
            input.email,
            input.customerSubjectId,
            input.paymentMethod,
            input.cart.currencyCode,
            input.cart.totalMinor,
            JSON.stringify(lines),
          ],
        );
        await client.query(
          `INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload)
           VALUES ($1,'commerce_order',$2,'erpnext.order.upsert',$3)`,
          [
            randomUUID(),
            id,
            JSON.stringify({
              orderId: id,
              customerName: input.fullName,
            }),
          ],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async listForAccount(email: string, subjectId: string): Promise<CustomerOrder[]> {
      const result = await pool.query<OrderRow>(
        `SELECT order_code, placed_at, payment_method, currency_code, total_minor, lines
         FROM commerce_orders
         WHERE customer_subject_id = $1
            OR (customer_subject_id IS NULL AND lower(customer_email) = lower($2))
         ORDER BY placed_at DESC
         LIMIT 100`,
        [subjectId, email],
      );
      return result.rows.map(mapRow);
    },

    async getForAccount(
      email: string,
      subjectId: string,
      orderCode: string,
    ): Promise<CustomerOrder | null> {
      const result = await pool.query<OrderRow>(
        `SELECT order_code, placed_at, payment_method, currency_code, total_minor, lines
         FROM commerce_orders
         WHERE order_code = $1
           AND (customer_subject_id = $2
             OR (customer_subject_id IS NULL AND lower(customer_email) = lower($3)))
         LIMIT 1`,
        [orderCode, subjectId, email],
      );
      const row = result.rows[0];
      return row === undefined ? null : mapRow(row);
    },
  };
}

export type CommerceOrderStore = ReturnType<typeof postgresCommerceOrderStore>;
