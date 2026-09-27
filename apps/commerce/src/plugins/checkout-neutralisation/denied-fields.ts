/**
 * Shop API root mutations that must never resolve (ADR-005 layer 2).
 *
 * Vendure has no switch that removes order and payment fields from the schema.
 * This list is the deny-list a GraphQL validation rule walks before resolution,
 * so aliasing and fragments cannot sneak a mutation through.
 *
 * Families covered: order lines, coupons, shipping, billing, payments,
 * customer registration, and session. A Vendure upgrade that adds a sibling
 * field is caught by `derive-denied-fields.ts` against a live schema, not by
 * hoping someone notices.
 */

export const DENIED_SHOP_MUTATIONS = [
  'addItemToOrder',
  'addItemsToOrder',
  'addMultipleItemsToOrder',
  'adjustOrderLine',
  'adjustOrderLines',
  'removeOrderLine',
  'removeItemFromOrder',
  'removeItemsFromOrder',
  'removeAllOrderLines',
  'applyCouponCode',
  'removeCouponCode',
  'setOrderShippingMethod',
  'setOrderShippingAddress',
  'setOrderBillingAddress',
  'setOrderCustomFields',
  'setOrderCustomer',
  'setCustomerForOrder',
  'transitionOrderToState',
  'addPaymentToOrder',
  'setOrderShippingMethod',
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
] as const;

export type DeniedShopMutation = (typeof DENIED_SHOP_MUTATIONS)[number];

export const DENIED_SHOP_MUTATION_SET: ReadonlySet<string> = new Set(DENIED_SHOP_MUTATIONS);

/**
 * Admin API mutations that would re-open a payment path.
 *
 * Layer 1 empties `paymentMethodHandlers`. This stops an administrator creating
 * a PaymentMethod row that would then have nothing to run - and, worse, a
 * future handler being wired by accident and immediately usable.
 */
export const DENIED_ADMIN_MUTATIONS = [
  'createPaymentMethod',
  'updatePaymentMethod',
  'deletePaymentMethod',
  'createPaymentMethods',
] as const;

export const DENIED_ADMIN_MUTATION_SET: ReadonlySet<string> = new Set(DENIED_ADMIN_MUTATIONS);

/**
 * Name families that must stay denied as Vendure adds siblings.
 *
 * Used by the derive script: any live Mutation field matching these prefixes
 * must appear in the corresponding deny-list, or the script fails.
 */
export const SHOP_DENY_FAMILIES = [
  'addItem',
  'addItems',
  'addMultipleItems',
  'adjustOrder',
  'removeOrder',
  'removeItem',
  'removeAllOrder',
  'applyCoupon',
  'removeCoupon',
  'setOrder',
  'setCustomerForOrder',
  'transitionOrder',
  'addPayment',
  'registerCustomer',
  'verifyCustomer',
  'refreshCustomer',
  'requestPassword',
  'resetPassword',
  'updateCustomer',
  'createCustomer',
  'deleteCustomer',
  'requestUpdateCustomer',
  'authenticate',
  'login',
  'logout',
] as const;

export const ADMIN_DENY_FAMILIES = [
  'createPaymentMethod',
  'updatePaymentMethod',
  'deletePaymentMethod',
] as const;

export function matchesFamily(name: string, families: readonly string[]): boolean {
  return families.some((family) => name === family || name.startsWith(family));
}

export function missingDeniedFields(
  liveFields: readonly string[],
  denied: ReadonlySet<string>,
  families: readonly string[],
): string[] {
  return liveFields.filter((name) => matchesFamily(name, families) && !denied.has(name));
}
