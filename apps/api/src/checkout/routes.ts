import {
  AddCartLineBodySchema,
  CartSchema,
  CheckoutCompleteBodySchema,
  CheckoutCompleteResponseSchema,
  SafepayCheckoutStartBodySchema,
  SafepayCheckoutStartResponseSchema,
} from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { authorize } from '../auth/authorize.ts';
import { sendApiError, sendCode } from '../http.ts';

import { createSafepayHostedCheckout } from './safepay.ts';
import { createVendureShopClient } from './vendure-shop.ts';

import type { SessionClaims } from '../auth/session.ts';
import type { RecordCommerceOrderInput } from '../orders/postgres-store.ts';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';

export interface CheckoutRoutesOptions {
  readonly shopApiUrl: string;
  readonly recordOrder?: (input: RecordCommerceOrderInput) => Promise<void>;
  readonly readSession?: (request: FastifyRequest) => Promise<SessionClaims | null>;
}

export const VENDURE_TOKEN_COOKIE = 'cera_vendure_token';

function checkoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED === 'true';
}

function allowedRedirectOrigin(url: string): boolean {
  const origins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  try {
    const origin = new URL(url).origin;
    return origins.some((allowed) => allowed === origin);
  } catch {
    return false;
  }
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

  const requireVerifiedCustomer = async (request: FastifyRequest) => {
    if (options.readSession === undefined) throw new ApiError('unauthenticated');
    const session = await options.readSession(request);
    const path = request.url.split('?')[0] ?? request.url;
    const decision = authorize({ method: request.method, path, session });
    if (!decision.ok) throw decision.error;
    if (decision.session === null) throw new ApiError('unauthenticated');
    return decision.session;
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

    app.post('/v1/checkout/safepay/start', async (request, reply) => {
      if (!checkoutEnabled()) {
        sendCode(request, reply, 'not_found');
        return;
      }
      const parsed = SafepayCheckoutStartBodySchema.safeParse(request.body);
      if (!parsed.success) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      if (
        !allowedRedirectOrigin(parsed.data.redirectUrl) ||
        !allowedRedirectOrigin(parsed.data.cancelUrl)
      ) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      try {
        await requireVerifiedCustomer(request);
        const session = { token: tokenFromRequest(request) };
        const { cart, token } = await shop.getActiveCart(session);
        setTokenCookie(reply, token);
        if (cart === null || cart.lines.length === 0 || cart.totalMinor <= 0) {
          sendCode(request, reply, 'validation_failed');
          return;
        }
        const { checkoutUrl, tracker } = await createSafepayHostedCheckout({
          amountMinor: cart.totalMinor,
          currency: cart.currencyCode,
          redirectUrl: parsed.data.redirectUrl,
          cancelUrl: parsed.data.cancelUrl,
        });
        return reply
          .code(200)
          .send(SafepayCheckoutStartResponseSchema.parse({ checkoutUrl, tracker }));
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
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
      if (body.paymentMethod === 'safepay' && body.safepayTracker === undefined) {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      if (body.paymentMethod === 'test' && (process.env.CERA_ENV ?? 'local') === 'production') {
        sendCode(request, reply, 'validation_failed');
        return;
      }
      try {
        const customer = await requireVerifiedCustomer(request);
        const vendureSession = { token: tokenFromRequest(request) };
        const { cart, token: cartToken } = await shop.getActiveCart(vendureSession);
        if (cart === null || cart.lines.length === 0) {
          sendCode(request, reply, 'validation_failed');
          return;
        }
        const email = customer.email;
        if (body.email.toLowerCase() !== email.toLowerCase()) {
          sendCode(request, reply, 'validation_failed');
          return;
        }
        const result = await shop.completeCheckout(
          { token: cartToken },
          {
            email,
            fullName: body.fullName,
            countryCode: body.countryCode,
            paymentMethod: body.paymentMethod,
            ...(body.safepayTracker !== undefined ? { safepayTracker: body.safepayTracker } : {}),
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
            customerSubjectId: customer.sub,
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
