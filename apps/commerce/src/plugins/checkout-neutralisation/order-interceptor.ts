import type { OrderInterceptor } from '@vendure/core';

const MESSAGE = 'Checkout is disabled on this catalogue.';

/**
 * Layer 2 stop for anyone who calls OrderService directly (jobs, plugins, the
 * dashboard) rather than going through the Shop API validation rule.
 *
 * Returning a string is Vendure's documented "prevent this mutation" signal.
 * Throwing would become an unexpected 500; this becomes OrderInterceptorError.
 */
export class RejectCheckoutInterceptor implements OrderInterceptor {
  willAddItemToOrder(): string {
    return MESSAGE;
  }

  willAdjustOrderLine(): string {
    return MESSAGE;
  }

  willRemoveItemFromOrder(): string {
    return MESSAGE;
  }
}
