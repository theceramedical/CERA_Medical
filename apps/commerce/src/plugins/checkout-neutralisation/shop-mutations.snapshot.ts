/**
 * Shop API Mutation fields as of Vendure 3.7.3.
 *
 * Re-derived by `pnpm --filter commerce denied-fields` against a running
 * instance. A field added by an upgrade that matches a deny-family and is not
 * in `DENIED_SHOP_MUTATIONS` fails the unit test, which is how ADR-005's
 * "caught rather than assumed absent" rule is enforced without Docker in CI.
 */
export const SHOP_MUTATION_SNAPSHOT = [
  'addItemToOrder',
  'addItemsToOrder',
  'adjustOrderLine',
  'removeOrderLine',
  'removeAllOrderLines',
  'applyCouponCode',
  'removeCouponCode',
  'setOrderShippingMethod',
  'setOrderShippingAddress',
  'setOrderBillingAddress',
  'setOrderCustomFields',
  'setCustomerForOrder',
  'transitionOrderToState',
  'addPaymentToOrder',
  'registerCustomerAccount',
  'verifyCustomerAccount',
  'refreshCustomerVerification',
  'requestPasswordReset',
  'resetPassword',
  'updateCustomerPassword',
  'updateCustomer',
  'createCustomerAddress',
  'updateCustomerAddress',
  'deleteCustomerAddress',
  'requestUpdateCustomerEmailAddress',
  'updateCustomerEmailAddress',
  'authenticate',
  'login',
  'logout',
  // Not denied — catalogue and session-adjacent reads/writes we do not use
  // but that are not an order or payment path.
  'setOrderCustomer',
  'addMultipleItemsToOrder',
  'adjustOrderLines',
  'removeItemFromOrder',
  'removeItemsFromOrder',
] as const;
