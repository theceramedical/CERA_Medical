/**
 * Re-derives the denied mutation list from a live Vendure schema.
 *
 * POSTs an introspection query to SHOP_API_URL (default localhost:3002/shop-api)
 * and fails if any Mutation field matching a deny-family is missing from
 * DENIED_SHOP_MUTATIONS. That is how a Vendure upgrade that adds
 * `addItemToOrderFromQuote` is caught rather than assumed absent.
 *
 * Skips (exit 0 with a message) when the Shop API is unreachable, so CI
 * without Docker still runs the snapshot unit test as the gate.
 */

import {
  DENIED_SHOP_MUTATION_SET,
  missingDeniedFields,
  SHOP_DENY_FAMILIES,
} from '../plugins/checkout-neutralisation/denied-fields.ts';

const INTROSPECTION = `
  query {
    __schema {
      mutationType {
        fields { name }
      }
    }
  }
`;

interface Introspection {
  readonly data?: {
    readonly __schema?: {
      readonly mutationType?: { readonly fields?: readonly { readonly name: string }[] };
    };
  };
}

async function main(): Promise<void> {
  const url = process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3002/shop-api';

  let body: Introspection;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: INTROSPECTION }),
    });
    if (!response.ok) {
      console.warn(`Shop API returned ${String(response.status)}; using the committed snapshot.`);
      return;
    }
    body = (await response.json()) as Introspection;
  } catch {
    console.warn('Shop API unreachable; using the committed snapshot.');
    return;
  }

  const fields = body.data?.__schema?.mutationType?.fields?.map((field) => field.name) ?? [];
  const missing = missingDeniedFields(fields, DENIED_SHOP_MUTATION_SET, SHOP_DENY_FAMILIES);

  if (missing.length > 0) {
    throw new Error(
      `Live Shop API has mutation fields that match a deny-family but are not denied:\n  ${missing.join('\n  ')}\nAdd them to DENIED_SHOP_MUTATIONS.`,
    );
  }

  console.warn(`Denied-field list covers all ${String(fields.length)} live Shop mutations.`);
}

await main();
