import { LanguageCode, PaymentMethodHandler } from '@vendure/core';

/** Cash on delivery — order is placed; payment collected offline. */
export const ceraCodPaymentHandler = new PaymentMethodHandler({
  code: 'cera-cod',
  description: [{ languageCode: LanguageCode.en, value: 'Cash on delivery' }],
  args: {},
  createPayment: (_ctx, order) => ({
    amount: order.totalWithTax,
    state: 'Authorized',
    transactionId: `COD-${order.code}`,
  }),
  settlePayment: () => ({ success: true }),
});
