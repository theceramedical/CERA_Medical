import { LanguageCode, PaymentMethodHandler, Logger } from '@vendure/core';

const logger = new Logger();

/**
 * Production card payments via Stripe PaymentIntents.
 * Requires STRIPE_SECRET_KEY. Metadata must include `paymentIntentId` from the client.
 */
export const ceraStripePaymentHandler = new PaymentMethodHandler({
  code: 'cera-stripe',
  description: [{ languageCode: LanguageCode.en, value: 'Card (Stripe)' }],
  args: {
    apiKey: { type: 'string', label: [{ languageCode: LanguageCode.en, value: 'API key' }] },
  },
  createPayment: async (_ctx, order, _amount, args, metadata) => {
    const apiKey = typeof args.apiKey === 'string' ? args.apiKey : process.env.STRIPE_SECRET_KEY;
    const paymentIntentId = (metadata as { paymentIntentId?: string }).paymentIntentId;
    const intentId = typeof paymentIntentId === 'string' ? paymentIntentId : null;

    if (apiKey === undefined || apiKey.length === 0) {
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Stripe is not configured',
      };
    }
    if (intentId === null) {
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Missing paymentIntentId',
      };
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}`, {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      logger.error(`Stripe intent lookup failed: ${String(response.status)}`);
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Payment verification failed',
      };
    }
    const body = (await response.json()) as { status?: string; id?: string };
    if (body.status !== 'succeeded') {
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Payment not completed',
      };
    }
    return {
      amount: order.totalWithTax,
      state: 'Settled',
      transactionId: body.id ?? intentId,
    };
  },
  settlePayment: () => ({ success: true }),
});
