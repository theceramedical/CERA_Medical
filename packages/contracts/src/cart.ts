import { z } from 'zod';

import { SlugSchema } from './primitives.ts';

export const CartLineSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  title: z.string().min(1).max(160),
  quantity: z.number().int().min(1).max(99),
  unitPriceMinor: z.number().int().nonnegative(),
  lineTotalMinor: z.number().int().nonnegative(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartSchema = z.object({
  currencyCode: z.string().length(3),
  lines: z.array(CartLineSchema),
  subtotalMinor: z.number().int().nonnegative(),
  totalMinor: z.number().int().nonnegative(),
});
export type Cart = z.infer<typeof CartSchema>;

export const AddCartLineBodySchema = z.object({
  slug: SlugSchema,
  quantity: z.number().int().min(1).max(99).default(1),
});

export const CheckoutCompleteBodySchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().min(1).max(160),
  countryCode: z.string().length(2).default('PK'),
  paymentIntentId: z.string().max(200).optional(),
});

export const CheckoutCompleteResponseSchema = z.object({
  orderCode: z.string().min(1),
});
