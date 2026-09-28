import { GraphQLError, type ValidationContext, type ValidationRule } from 'graphql';

import { DENIED_ADMIN_MUTATION_SET, DENIED_SHOP_MUTATION_SET } from './denied-fields.js';

/**
 * Rejects a GraphQL operation that selects a denied root mutation field.
 *
 * A validation rule, not a resolver guard: it runs before execution, and
 * `node.name.value` is the schema field, not the alias. Fragments that spread
 * onto Mutation are still visited with parent type Mutation.
 */
export function denyRootMutations(denied: ReadonlySet<string>): ValidationRule {
  return (context: ValidationContext) => ({
    Field(node) {
      const parent = context.getParentType()?.name;
      if (parent !== 'Mutation') return;
      if (!denied.has(node.name.value)) return;

      context.reportError(new GraphQLError('This operation is not available.'));
    },
  });
}

export const denyShopCheckoutRule: ValidationRule = denyRootMutations(DENIED_SHOP_MUTATION_SET);
export const denyAdminPaymentRule: ValidationRule = denyRootMutations(DENIED_ADMIN_MUTATION_SET);
