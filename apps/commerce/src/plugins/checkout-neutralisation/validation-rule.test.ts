import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { describe, expect, it } from 'vitest';

import { denyShopCheckoutRule } from './validation-rule.ts';

const schema = buildSchema(`
  type Order { id: ID! }
  type Product { id: ID! slug: String! }
  type Query { product(slug: String!): Product }
  type Mutation {
    addItemToOrder(productVariantId: ID!, quantity: Int!): Order
    product: Product
  }
`);

describe('denyShopCheckoutRule', () => {
  it('rejects addItemToOrder, including when aliased', () => {
    const aliased = parse(`mutation { sneak: addItemToOrder(productVariantId: "1", quantity: 1) { id } }`);
    const errors = validate(schema, aliased, [...specifiedRules, denyShopCheckoutRule]);
    expect(errors.some((error) => error.message === 'This operation is not available.')).toBe(true);
  });

  it('allows a catalogue query', () => {
    const query = parse(`query { product(slug: "cardiology") { slug } }`);
    const errors = validate(schema, query, [...specifiedRules, denyShopCheckoutRule]);
    expect(errors).toEqual([]);
  });
});
