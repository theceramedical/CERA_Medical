import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildSnapshot, compareSnapshots, type SchemaSnapshot } from './snapshot.ts';

/**
 * Proves the detector detects.
 *
 * A gate that has never been shown to fail is indistinguishable from one that always
 * passes, and this one guards a failure mode that only appears during a deploy - an old
 * client against a new server - which is the worst place to find out it was broken.
 * Each case below is a change that would have caused a real outage.
 */

function snapshotOf(schemas: Record<string, z.ZodType>): SchemaSnapshot {
  return {
    version: 1,
    schemas: Object.fromEntries(
      Object.entries(schemas).map(([name, schema]) => [
        name,
        z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any', reused: 'inline' }),
      ]),
    ),
  };
}

describe('buildSnapshot', () => {
  it('covers every exported schema', () => {
    // Derived from `import * as`, so a new schema is covered the moment it is exported.
    // A hand-maintained list would be one edit away from a schema nobody checks.
    expect(Object.keys(buildSnapshot().schemas).length).toBeGreaterThan(30);
  });

  it('is stable across calls', () => {
    // A snapshot that varied between runs would make the committed file churn and the
    // check meaningless.
    expect(buildSnapshot()).toEqual(buildSnapshot());
  });

  it('includes the real entity schemas by name', () => {
    const { schemas } = buildSnapshot();

    expect(schemas).toHaveProperty('EnquirySchema');
    expect(schemas).toHaveProperty('CustomerEnquirySchema');
    expect(schemas).toHaveProperty('ZohoLeadPayloadSchema');
  });
});

describe('compareSnapshots detects breaks', () => {
  it('flags a removed schema', () => {
    const before = snapshotOf({ Gone: z.object({ a: z.string() }) });
    const after: SchemaSnapshot = { version: 1, schemas: {} };

    const breaks = compareSnapshots(before, after);

    expect(breaks).toHaveLength(1);
    expect(breaks[0]!.kind).toBe('schema_removed');
    expect(breaks[0]!.at).toBe('Gone');
  });

  it('flags a removed property', () => {
    // The commonest break by far: a field tidied out of a response while a deployed
    // client is still reading it.
    const before = snapshotOf({ S: z.object({ keep: z.string(), drop: z.string() }) });
    const after = snapshotOf({ S: z.object({ keep: z.string() }) });

    const breaks = compareSnapshots(before, after);

    expect(breaks).toHaveLength(1);
    expect(breaks[0]!.kind).toBe('property_removed');
    expect(breaks[0]!.at).toBe('S.drop');
  });

  it('flags a property that became required', () => {
    // Breaks in both directions: requests from an old client are rejected, and rows
    // already stored without the field stop parsing.
    const before = snapshotOf({ S: z.object({ a: z.string().optional() }) });
    const after = snapshotOf({ S: z.object({ a: z.string() }) });

    const breaks = compareSnapshots(before, after);

    expect(breaks.map((entry) => entry.kind)).toContain('property_became_required');
  });

  it('flags a removed enum value', () => {
    // The one that corrupts reads rather than writes: an internal status removed from
    // the enum makes every stored row carrying it unparseable.
    const before = snapshotOf({ S: z.enum(['a', 'b', 'c']) });
    const after = snapshotOf({ S: z.enum(['a', 'b']) });

    const breaks = compareSnapshots(before, after);

    expect(breaks).toHaveLength(1);
    expect(breaks[0]!.kind).toBe('enum_value_removed');
    expect(breaks[0]!.detail).toContain('"c"');
  });

  it('flags a changed primitive type', () => {
    const before = snapshotOf({ S: z.object({ count: z.number() }) });
    const after = snapshotOf({ S: z.object({ count: z.string() }) });

    const breaks = compareSnapshots(before, after);

    expect(breaks.map((entry) => entry.kind)).toContain('type_changed');
  });

  it('flags a break nested inside an object', () => {
    // Recursion matters: most of the real schemas nest, and a comparison that only
    // looked at the top level would miss a field removed from `seo` or `category`.
    const before = snapshotOf({
      S: z.object({ nested: z.object({ inner: z.string(), gone: z.string() }) }),
    });
    const after = snapshotOf({ S: z.object({ nested: z.object({ inner: z.string() }) }) });

    const breaks = compareSnapshots(before, after);

    expect(breaks).toHaveLength(1);
    expect(breaks[0]!.at).toBe('S.nested.gone');
  });

  it('flags a break inside an array element', () => {
    const before = snapshotOf({
      S: z.object({ items: z.array(z.object({ id: z.string(), label: z.string() })) }),
    });
    const after = snapshotOf({ S: z.object({ items: z.array(z.object({ id: z.string() })) }) });

    expect(compareSnapshots(before, after).length).toBeGreaterThan(0);
  });
});

describe('compareSnapshots allows safe changes', () => {
  it('allows an added schema', () => {
    const before = snapshotOf({ A: z.object({ a: z.string() }) });
    const after = snapshotOf({ A: z.object({ a: z.string() }), B: z.object({ b: z.string() }) });

    expect(compareSnapshots(before, after)).toEqual([]);
  });

  it('allows an added optional property', () => {
    // Invisible to a client that does not read it, which is the whole basis for the
    // expand-then-contract rule PRD 10 requires.
    const before = snapshotOf({ S: z.object({ a: z.string() }) });
    const after = snapshotOf({ S: z.object({ a: z.string(), b: z.string().optional() }) });

    expect(compareSnapshots(before, after)).toEqual([]);
  });

  it('allows an added enum value', () => {
    const before = snapshotOf({ S: z.enum(['a']) });
    const after = snapshotOf({ S: z.enum(['a', 'b']) });

    expect(compareSnapshots(before, after)).toEqual([]);
  });

  it('allows a required property becoming optional', () => {
    // Widening. An old client sending it is still accepted, and an old client reading
    // it already handles the value being there.
    const before = snapshotOf({ S: z.object({ a: z.string() }) });
    const after = snapshotOf({ S: z.object({ a: z.string().optional() }) });

    expect(compareSnapshots(before, after)).toEqual([]);
  });

  it('reports nothing when nothing changed', () => {
    const snapshot = buildSnapshot();

    expect(compareSnapshots(snapshot, snapshot)).toEqual([]);
  });

  it('reports every break rather than stopping at the first', () => {
    // A gate that reports one problem per run turns a five-field rename into five CI
    // cycles.
    const before = snapshotOf({
      A: z.object({ x: z.string(), y: z.string() }),
      B: z.enum(['p', 'q']),
    });
    const after = snapshotOf({ A: z.object({ x: z.string() }), B: z.enum(['p']) });

    expect(compareSnapshots(before, after)).toHaveLength(2);
  });
});

describe('the committed snapshot', () => {
  it('matches the current schemas, with no breaking drift', async () => {
    /**
     * The same assertion CI makes, run locally.
     *
     * Here as well as in CI because the feedback loop matters: finding this on a push
     * means a context switch, whereas finding it in `pnpm test` means fixing it while
     * the change is still in your head.
     */
    const committed = (await import('../../contract-snapshot.json', {
      with: { type: 'json' },
    })) as { default: SchemaSnapshot };

    expect(compareSnapshots(committed.default, buildSnapshot())).toEqual([]);
  });
});
