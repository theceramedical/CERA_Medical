import { describe, expect, it } from 'vitest';

/**
 * CAT-201 / ADR-005: a representative order mutation posted at /shop-api fails.
 *
 * Skipped without VENDURE_SHOP_API_URL so a checkout without Docker still runs
 * the unit deny-list. Against a running catalogue this is the proof that
 * layer 2 is actually wired, not merely unit-tested.
 */

const shopUrl = process.env.VENDURE_SHOP_API_URL;
const describeWithShop = shopUrl === undefined ? describe.skip : describe;

describeWithShop('Shop API checkout neutralisation', () => {
  it('rejects addItemToOrder', async () => {
    const response = await fetch(shopUrl!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation { addItemToOrder(productVariantId: "1", quantity: 1) { __typename } }',
      }),
    });

    const body = (await response.json()) as { errors?: readonly { message?: string }[] };
    expect(body.errors?.length).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toMatch(/"__typename":"Order"/);
  });
});
