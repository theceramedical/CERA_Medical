import { LanguageCode, PaymentMethodHandler } from '@vendure/core';

/**
 * Immediate settlement for local and staging. Never enable in production unless
 * CERA_ENV is local/staging and PAYMENT_DRIVER=test.
 */
export const ceraTestPaymentHandler = new PaymentMethodHandler({
  code: 'cera-test-payment',
  description: [{ languageCode: LanguageCode.en, value: 'Test payment (development)' }],
  args: {},
  createPayment: (_ctx, order) => ({
    amount: order.totalWithTax,
    state: 'Settled',
    transactionId: `TEST-${order.code}`,
  }),
  settlePayment: () => ({ success: true }),
});
