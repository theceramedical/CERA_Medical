import {
  AddCartLineBodySchema,
  UpdateCartLineBodySchema,
  CartSchema,
  CheckoutCompleteBodySchema,
  CheckoutCompleteResponseSchema,
} from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import {
  isEnquiryOnlyPhysicalSku,
  isUnapprovedSeedProductSku,
} from '../catalogue/unapproved-seed-products.ts';
import { sendApiError, sendCode } from '../http.ts';

import { createVendureShopClient } from './vendure-shop.ts';

import type { RecordCommerceOrderInput } from '../orders/postgres-store.ts';
import type { FastifyPluginCallback } from 'fastify';

export interface CheckoutRoutesOptions {
  readonly shopApiUrl: string;
  readonly recordOrder?: (input: RecordCommerceOrderInput) => Promise<void>;
}

export const VENDURE_TOKEN_COOKIE = 'cera_vendure_token';

function checkoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED === 'true';
}

function tokenFromRequest(request: { headers: { cookie?: string | undefined } }): string | null {
  const raw = request.headers.cookie;
  if (raw === undefined) return null;
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === VENDURE_TOKEN_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function vendureCookieDomain(): string {
  const site = process.env.CORS_ALLOWED_ORIGINS?.split(',')[0]?.trim();
  if (site === undefined || site.length === 0) return '';
  try {
    const host = new URL(site).hostname;
    if (host === 'localhost' || host.endsWith('.localhost')) return '';
    const parts = host.split('.');
    if (parts.length >= 2) return `; Domain=.${parts.slice(-2).join('.')}`;
  } catch {
    return '';
  }
  return '';
}

function setTokenCookie(
  reply: { header: (name: string, value: string) => void },
  token: string | null,
) {
  if (token === null || token.length === 0) return;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  reply.header(
    'set-cookie',
    `${VENDURE_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}${vendureCookieDomain()}`,
  );
}

export const checkoutRoutes = (options: CheckoutRoutesOptions): FastifyPluginCallback => {
  const shop = createVendureShopClient(options.shopApiUrl);
  const cartContainsEnquiryOnlyPhysicalProduct = async (
    session: { readonly token: string | null },
    cart: { readonly lines: readonly { readonly slug: string }[] },
  ): Promise<boolean> => {
    for (const line of cart.lines) {
      if (
        isEnquiryOnlyPhysicalSku(line.slug) ||
        isUnapprovedSeedProductSku(line.slug) ||
        (await shop.isPhysicalCatalogueSku(session, line.slug))
      ) {
        return true;
      }
    }
    return false;
  };

  return (app, _options, done) => {
    app.get('/v1/cart', async (request, reply) => {
      if (!checkoutEnabled()) {
        sendCode(request, reply, 'not_found');
        return;
      }
      try {
        const session = { token: tokenFromRequest(request) };
        const { cart, token } = await shop.getActiveCart(session);
        setTokenCookie(reply, token);
        if (cart !== null && (await cartContainsEnquiryOnlyPhysicalProduct(session, cart))) {
          sendCode(request, reply, 'not_found');
          return;
        }
        if (cart === null) {
          return reply.code(200).send(
            CartSchema.parse({
              currencyCode: 'PKR',
              lines: [],
              subtotalMinor: 0,
              totalMinor: 0,
            }),
          );
        }
        return reply.code(200).send(CartSchema.parse(cart));
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.post('/v1/cart/lines', async (request, reply) => {
      if (!checkoutEnabled()) {
        sendCode(request, reply, 'not_found');
        return;
      }
      const parsed = AddCartLineBodySchema.safeParse(request.body);
      if (!parsed.success) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      try {
        const session = { token: tokenFromRequest(request) };
        if (
          isEnquiryOnlyPhysicalSku(parsed.data.slug) ||
          isUnapprovedSeedProductSku(parsed.data.slug) ||
          (await shop.isPhysicalCatalogueSku(session, parsed.data.slug))
        ) {
          sendCode(request, reply, 'not_found');
          return;
        }
        const variantId = await shop.getVariantIdBySku(session, parsed.data.slug);
        const { cart, token } = await shop.addLine(session, variantId, parsed.data.quantity);
        setTokenCookie(reply, token);
        return reply.code(200).send(CartSchema.parse(cart));
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.patch('/v1/cart/lines/:lineId', async (request, reply) => {
      if (!checkoutEnabled()) {
        sendCode(request, reply, 'not_found');
        return;
      }
      const parsed = UpdateCartLineBodySchema.safeParse(request.body);
      if (!parsed.success) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      const lineId = (request.params as { lineId?: string }).lineId;
      if (lineId === undefined || lineId.length === 0) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      try {
        const session = { token: tokenFromRequest(request) };
        const { cart, token } = await shop.adjustLine(session, lineId, parsed.data.quantity);
        setTokenCookie(reply, token);
        if (await cartContainsEnquiryOnlyPhysicalProduct(session, cart)) {
          sendCode(request, reply, 'not_found');
          return;
        }
        return reply.code(200).send(CartSchema.parse(cart));
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.post('/v1/checkout/safepay/start', async (_request, reply) => {
      return reply.code(410).send({ error: 'checkout_method_unavailable' });
    });

    app.post('/v1/checkout/complete', async (request, reply) => {
      if (!checkoutEnabled()) {
        sendCode(request, reply, 'not_found');
        return;
      }
      const parsed = CheckoutCompleteBodySchema.safeParse(request.body);
      if (!parsed.success) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      const body = parsed.data;
      if (body.paymentMethod === 'test' && process.env.CERA_ENV !== 'local') {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      try {
        const vendureSession = { token: tokenFromRequest(request) };
        const { cart, token: cartToken } = await shop.getActiveCart(vendureSession);
        if (
          cart === null ||
          cart.lines.length === 0 ||
          (await cartContainsEnquiryOnlyPhysicalProduct(vendureSession, cart))
        ) {
          sendCode(request, reply, 'validation_failed');
          return;
        }
        const email = body.email.trim().toLowerCase();
        const result = await shop.completeCheckout(
          { token: cartToken },
          {
            email,
            fullName: body.fullName,
            countryCode: body.countryCode,
            deliveryAddress: body.deliveryAddress,
            billingAddress: body.billingAddress ?? body.deliveryAddress,
            paymentMethod: body.paymentMethod,
          },
        );
        setTokenCookie(reply, result.token);
        if (options.recordOrder !== undefined) {
          await options.recordOrder({
            orderCode: result.orderCode,
            email,
            fullName: body.fullName,
            paymentMethod: body.paymentMethod,
            cart,
            customerSubjectId: null,
          });
        }
        return reply
          .code(200)
          .send(CheckoutCompleteResponseSchema.parse({ orderCode: result.orderCode }));
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    done();
  };
};
