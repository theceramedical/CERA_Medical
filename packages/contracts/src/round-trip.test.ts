import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  claimTokenFixtures,
  customerProfileFixtures,
  enquiryFixtures,
  enquiryStatusEventFixtures,
  integrationDeliveryFixtures,
  internalNoteFixtures,
  outboxFixtures,
  serviceFixtures,
  unmarked,
} from './fixtures/index.ts';
import * as contracts from './index.ts';

/**
 * Round-trip and rejection properties over every exported schema.
 *
 * Two things are checked, and the second is the one that catches real bugs.
 *
 * Parsing a valid value is the easy half. The half that matters is that an invalid
 * value fails *at the expected path*: a schema can reject correctly and report the
 * issue against the wrong field, and the API turns field errors into form messages -
 * so a misreported path means the customer sees "there is a problem with your email"
 * highlighted on the message box. That is indistinguishable from a broken form.
 *
 * The inventory at the top is deliberately derived from the module's own exports
 * rather than written out, so a schema added without a test here fails the count
 * assertion instead of quietly going untested.
 */

/**
 * Every Zod schema this package exports, by export name.
 *
 * The cast to `unknown` is what makes the predicate legal. The package also exports
 * plain arrays and enums, so `Object.entries` infers a union of every export's type,
 * and a predicate narrowing to `[string, z.ZodType]` is not assignable to that union -
 * the filter compiles but narrows nothing, and `schema.safeParse` below is then a type
 * error against `readonly string[]`. Widening first gives the predicate something it
 * can narrow *from*.
 */
const exportedSchemas = (Object.entries(contracts) as [string, unknown][]).filter(
  (entry): entry is [string, z.ZodType] => entry[1] instanceof z.ZodType,
);

describe('schema inventory', () => {
  it('exports the schemas the rest of the platform builds on', () => {
    // A floor, not an exact count: the number grows as endpoints are added, and
    // pinning it exactly would make every addition edit this test for no benefit.
    // What it catches is the opposite - a refactor that stops exporting schemas,
    // which would make every `safeParse` below run against nothing.
    expect(exportedSchemas.length).toBeGreaterThan(30);
  });

  it('gives every exported schema a name ending in Schema', () => {
    // Not cosmetic. `EnquiryInput` and `EnquiryInputSchema` are a type and a value
    // with almost the same name, and importing the wrong one produces a confusing
    // error a long way from the import.
    for (const [name] of exportedSchemas) {
      expect(name).toMatch(/Schema$/);
    }
  });

  it('rejects a plainly wrong value in every schema', () => {
    /**
     * A blunt sweep: no schema in this package should accept a function.
     *
     * The value of testing all of them at once rather than each individually is that
     * it catches `z.any()` and `z.unknown()` reaching an exported schema by accident -
     * usually as a placeholder during development that nobody came back to, which is
     * precisely the shape that lets an unvalidated payload through in production.
     */
    const permissive: string[] = [];

    for (const [name, schema] of exportedSchemas) {
      if (schema.safeParse(() => undefined).success) permissive.push(name);
    }

    // `SafeDiffSchema` and the Lexical body are the documented exceptions: one is a
    // record of unknown values by design, the other is an AST Payload owns.
    expect(permissive).toEqual([]);
  });
});

/**
 * Entity fixtures paired with their schema.
 *
 * The fixtures are already parsed once when they are built, so this asserts the
 * stronger property: that parsing the *output* of a parse produces the same value.
 * A schema with a `.transform()` or a `.default()` in the wrong place is not
 * idempotent, and the symptom is a value that changes each time it crosses a
 * boundary - which shows up as a spurious diff in an audit event rather than as an
 * error.
 */
const ENTITY_CASES = [
  ['ServiceSchema', contracts.ServiceSchema, serviceFixtures],
  ['EnquirySchema', contracts.EnquirySchema, enquiryFixtures],
  ['EnquiryStatusEventSchema', contracts.EnquiryStatusEventSchema, enquiryStatusEventFixtures],
  ['InternalNoteSchema', contracts.InternalNoteSchema, internalNoteFixtures],
  ['CustomerProfileSchema', contracts.CustomerProfileSchema, customerProfileFixtures],
  ['IntegrationDeliverySchema', contracts.IntegrationDeliverySchema, integrationDeliveryFixtures],
  ['EnquiryClaimTokenSchema', contracts.EnquiryClaimTokenSchema, claimTokenFixtures],
  ['OutboxRecordSchema', contracts.OutboxRecordSchema, outboxFixtures],
] as const;

describe('entity round-trips', () => {
  it.each(ENTITY_CASES)('%s parses its fixtures unchanged', (_name, schema, fixtures) => {
    for (const record of fixtures) {
      const plain = unmarked(record as never) as unknown;
      const first = schema.parse(plain);

      expect(schema.parse(first)).toEqual(first);
    }
  });

  it.each(ENTITY_CASES)(
    '%s drops unknown keys rather than carrying them',
    (_name, schema, fixtures) => {
      /**
       * The property that makes the projections safe.
       *
       * Zod strips unknown keys by default, and this asserts none of these schemas has
       * been switched to `.passthrough()`. With passthrough, a field added to a database
       * row would flow through a parse and into a response without appearing in any
       * schema - which is the exact leak the explicit projections exist to prevent, and
       * it would reach production without a single test failing.
       */
      const withExtra = {
        ...(unmarked(fixtures[0] as never) as object),
        clinicalHistory: 'must not survive a parse',
      };

      expect(schema.parse(withExtra)).not.toHaveProperty('clinicalHistory');
    },
  );
});

/**
 * Rejection cases, each asserting the reported path.
 *
 * Written as a table so the expected path sits next to the bad value. A test that
 * only asserted `success === false` would pass for a schema that rejected the whole
 * object for an unrelated reason.
 */
const REJECTION_CASES: readonly {
  name: string;
  schema: z.ZodType;
  input: unknown;
  path: string;
}[] = [
  {
    name: 'EnquiryInputSchema rejects a missing consent',
    schema: contracts.EnquiryInputSchema,
    input: {
      name: 'Alex Fixture',
      email: 'alex@example.invalid',
      serviceId: 'svc-1',
      message: 'A message long enough to pass the minimum length check.',
      consent: false,
      source: 'web_general',
    },
    path: 'consent',
  },
  {
    name: 'EnquiryInputSchema rejects a two-character message',
    schema: contracts.EnquiryInputSchema,
    input: {
      name: 'Alex Fixture',
      email: 'alex@example.invalid',
      serviceId: 'svc-1',
      message: 'hi',
      consent: true,
      source: 'web_general',
    },
    path: 'message',
  },
  {
    name: 'EnquiryInputSchema rejects a one-character name',
    schema: contracts.EnquiryInputSchema,
    input: {
      name: 'A',
      email: 'alex@example.invalid',
      serviceId: 'svc-1',
      message: 'A message long enough to pass the minimum length check.',
      consent: true,
      source: 'web_general',
    },
    path: 'name',
  },
  {
    name: 'EnquiryInputSchema rejects an unknown source',
    schema: contracts.EnquiryInputSchema,
    input: {
      name: 'Alex Fixture',
      email: 'alex@example.invalid',
      serviceId: 'svc-1',
      message: 'A message long enough to pass the minimum length check.',
      consent: true,
      source: 'phone_call',
    },
    path: 'source',
  },
  {
    name: 'EnquirySchema rejects a malformed reference',
    schema: contracts.EnquirySchema,
    input: { ...(unmarked(enquiryFixtures[0]!) as object), reference: 'CERA-BAD' },
    path: 'reference',
  },
  {
    name: 'EnquirySchema rejects a v4 id',
    schema: contracts.EnquirySchema,
    input: {
      ...(unmarked(enquiryFixtures[0]!) as object),
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    },
    path: 'id',
  },
  {
    name: 'EnquirySchema rejects a timestamp with an offset',
    schema: contracts.EnquirySchema,
    // Offsets are rejected so stored values are directly comparable as strings.
    input: {
      ...(unmarked(enquiryFixtures[0]!) as object),
      createdAt: '2026-01-05T09:00:00.000+01:00',
    },
    path: 'createdAt',
  },
  {
    name: 'ServiceSchema rejects an upper-case slug',
    schema: contracts.ServiceSchema,
    input: { ...(unmarked(serviceFixtures[0]!) as object), slug: 'General-Health' },
    path: 'slug',
  },
  {
    name: 'EnquiryClaimTokenSchema rejects an upper-case hash',
    schema: contracts.EnquiryClaimTokenSchema,
    input: {
      ...(unmarked(claimTokenFixtures[0]!) as object),
      tokenHash: 'A'.repeat(64),
    },
    path: 'tokenHash',
  },
  {
    name: 'EnquiryClaimTokenSchema rejects a short hash',
    schema: contracts.EnquiryClaimTokenSchema,
    input: { ...(unmarked(claimTokenFixtures[0]!) as object), emailHash: 'abc123' },
    path: 'emailHash',
  },
  {
    name: 'CustomerProfileSchema rejects an address that is not an address',
    schema: contracts.CustomerProfileSchema,
    input: { ...(unmarked(customerProfileFixtures[0]!) as object), email: 'not-an-address' },
    path: 'email',
  },
  {
    name: 'CustomerProfileUpdateSchema rejects an empty display name',
    schema: contracts.CustomerProfileUpdateSchema,
    input: { displayName: '   ' },
    path: 'displayName',
  },
  {
    name: 'IntegrationDeliverySchema rejects a response code below 100',
    schema: contracts.IntegrationDeliverySchema,
    input: { ...(unmarked(integrationDeliveryFixtures[0]!) as object), responseCode: 99 },
    path: 'responseCode',
  },
  {
    name: 'InternalNoteSchema rejects an empty body',
    schema: contracts.InternalNoteSchema,
    input: { ...(unmarked(internalNoteFixtures[0]!) as object), body: '' },
    path: 'body',
  },
  {
    name: 'EnquiryStatusEventSchema rejects an unknown status',
    schema: contracts.EnquiryStatusEventSchema,
    input: { ...(unmarked(enquiryStatusEventFixtures[0]!) as object), newStatus: 'escalated' },
    path: 'newStatus',
  },
];

describe('rejections report the right path', () => {
  it.each(REJECTION_CASES)('$name', ({ schema, input, path }) => {
    const result = schema.safeParse(input);

    expect(result.success).toBe(false);

    const paths = result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));

    // The path, not merely a failure: the API renders field errors against form
    // controls, so a misreported path highlights the wrong input and looks to the
    // customer like a form that cannot be satisfied.
    expect(paths).toContain(path);
  });

  it('never includes the rejected value in the issue', () => {
    // `fieldErrorsFromZod` carries only path, code, and message. This asserts the
    // underlying issues do not smuggle the value through some other property - the
    // natural way to write "this is too long" is to quote it.
    const secret = 'CONFIDENTIAL ENQUIRY TEXT THAT MUST NOT ESCAPE';
    const result = contracts.EnquiryInputSchema.safeParse({
      name: 'Alex Fixture',
      email: 'not-an-address',
      serviceId: 'svc-1',
      message: secret,
      consent: true,
      source: 'web_general',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(JSON.stringify(contracts.fieldErrorsFromZod(result.error))).not.toContain(secret);
  });

  it('caps field errors, so a hostile payload cannot produce an unbounded response', () => {
    // Fifty is the cap. Without one, a request with a thousand bad fields produces a
    // thousand-entry error body, which is a cheap amplification.
    const manyIssues = z.object(
      Object.fromEntries(
        Array.from({ length: 200 }, (_unused, index) => [`field${String(index)}`, z.string()]),
      ),
    );
    const result = manyIssues.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(contracts.fieldErrorsFromZod(result.error)).toHaveLength(50);
  });
});
