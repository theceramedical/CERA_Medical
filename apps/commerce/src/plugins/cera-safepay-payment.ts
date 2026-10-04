import { LanguageCode, Logger, PaymentMethodHandler } from '@vendure/core';

import { resolveSafepayEnvironment, safepayTrackerCompleted } from '../lib/safepay.ts';

const logger = new Logger();

/**
 * Online payments via Safepay hosted checkout.
 * Requires SAFEPAY_MERCHANT_SECRET. Metadata must include `safepayTracker` after redirect.
 */
export const ceraSafepayPaymentHandler = new PaymentMethodHandler({
  code: 'cera-safepay',
  description: [{ languageCode: LanguageCode.en, value: 'Pay online (Safepay)' }],
  args: {},
  createPayment: async (_ctx, order, _amount, _args, metadata) => {
    const secret = process.env.SAFEPAY_MERCHANT_SECRET;
    const tracker = (metadata as { safepayTracker?: string }).safepayTracker;
    const trackerToken = typeof tracker === 'string' ? tracker : null;

    if (secret === undefined || secret.length === 0) {
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Safepay is not configured',
      };
    }
    if (trackerToken === null) {
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Missing safepayTracker',
      };
    }

    try {
      const completed = await safepayTrackerCompleted(
        trackerToken,
        secret,
        resolveSafepayEnvironment(),
      );
      if (!completed) {
        return {
          amount: order.totalWithTax,
          state: 'Declined',
          errorMessage: 'Payment not completed',
        };
      }
    } catch (error) {
      logger.error(`Safepay tracker lookup failed: ${String(error)}`);
      return {
        amount: order.totalWithTax,
        state: 'Declined',
        errorMessage: 'Payment verification failed',
      };
    }

    return {
      amount: order.totalWithTax,
      state: 'Settled',
      transactionId: trackerToken,
    };
  },
  settlePayment: () => ({ success: true }),
});
