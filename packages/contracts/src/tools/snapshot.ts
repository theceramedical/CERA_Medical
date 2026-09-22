import { z } from 'zod';

import * as contracts from '../index.ts';

/**
 * A structural snapshot of every exported schema, and the rules for what may change.
 *
 * The problem this solves: `apps/web`, `apps/api`, and `apps/worker` are deployed as
 * separate containers, so for a window during every deploy an old client is talking to
 * a new server. A field removed from a response schema is not a compile error anywhere
 * - both sides type-check against their own copy of the contract - it is a runtime
 * failure in whichever client has not been replaced yet.
 *
 * So the check is not "did the contract change", which would flag every addition and
 * be turned off within a week. It is "did the contract change in a way that breaks a
 * caller that has not been redeployed": a removed field, a field that became required,
 * an enum value that disappeared. Additions pass silently, because adding a field or an
 * enum member is safe for an old client that ignores it.
 */

export interface SchemaSnapshot {
  /** Bumped only if the snapshot format itself changes, not the schemas. */
  version: 1;
  schemas: Record<string, unknown>;
}

/**
 * Builds the snapshot from the package's own exports.
 *
 * Derived from `import * as contracts` rather than a hand-maintained list, so a new
 * schema is covered the moment it is exported. A list would be one edit away from a
 * schema that is never checked, and nobody notices an absent entry.
 */
export function buildSnapshot(): SchemaSnapshot {
  const schemas: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(contracts)) {
    if (!(value instanceof z.ZodType)) continue;

    /**
     * `io: 'output'` because the output shape is what a client consumes.
     *
     * The distinction is real for any schema with a `.default()`: a defaulted field is
     * optional on input and always present on output, and it is the output contract a
     * client depends on. `unrepresentable: 'any'` keeps a schema that JSON Schema
     * cannot express - a transform, a refinement - from aborting the whole snapshot.
     */
    schemas[name] = z.toJSONSchema(value, {
      io: 'output',
      unrepresentable: 'any',
      reused: 'inline',
    });
  }

  return { version: 1, schemas };
}

export type BreakKind =
  | 'schema_removed'
  | 'property_removed'
  | 'property_became_required'
  | 'enum_value_removed'
  | 'type_changed';

export interface Break {
  kind: BreakKind;
  /** Dotted location, for example `EnquirySchema.phone` or `ContentDocumentSchema.seo.title`. */
  at: string;
  detail: string;
}

interface JsonSchemaNode {
  type?: unknown;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  enum?: unknown[];
  items?: JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
}

function asNode(value: unknown): JsonSchemaNode | undefined {
  // Every property on `JsonSchemaNode` is optional, so the narrowing to a non-null
  // object satisfies it without a cast.
  return typeof value === 'object' && value !== null ? value : undefined;
}

/**
 * Compares two snapshots and reports only the changes that break an existing caller.
 *
 * Deliberately one-directional. `compare(before, after)` asks what `after` took away,
 * and says nothing about what it added - because an added field is invisible to a
 * client that does not read it, and an added enum member is only a problem if the
 * client switches exhaustively, which TypeScript already catches at build time in this
 * monorepo.
 */
export function compareSnapshots(before: SchemaSnapshot, after: SchemaSnapshot): Break[] {
  const breaks: Break[] = [];

  for (const [name, beforeSchema] of Object.entries(before.schemas)) {
    const afterSchema = after.schemas[name];

    if (afterSchema === undefined) {
      breaks.push({
        kind: 'schema_removed',
        at: name,
        detail: `${name} is no longer exported. Any app importing it fails to build.`,
      });
      continue;
    }

    compareNode(name, asNode(beforeSchema), asNode(afterSchema), breaks);
  }

  return breaks;
}

function compareNode(
  path: string,
  before: JsonSchemaNode | undefined,
  after: JsonSchemaNode | undefined,
  breaks: Break[],
): void {
  if (before === undefined || after === undefined) return;

  if (
    before.type !== undefined &&
    after.type !== undefined &&
    JSON.stringify(before.type) !== JSON.stringify(after.type)
  ) {
    breaks.push({
      kind: 'type_changed',
      at: path,
      detail: `type changed from ${JSON.stringify(before.type)} to ${JSON.stringify(after.type)}`,
    });
  }

  compareEnum(path, before, after, breaks);
  compareProperties(path, before, after, breaks);

  if (before.items !== undefined) {
    compareNode(`${path}.items`, before.items, after.items, breaks);
  }
}

function compareEnum(
  path: string,
  before: JsonSchemaNode,
  after: JsonSchemaNode,
  breaks: Break[],
): void {
  if (before.enum === undefined) return;

  const afterValues = new Set((after.enum ?? []).map((value) => JSON.stringify(value)));

  for (const value of before.enum) {
    if (afterValues.has(JSON.stringify(value))) continue;

    breaks.push({
      kind: 'enum_value_removed',
      at: path,
      detail:
        `${JSON.stringify(value)} was removed. Rows already stored with that value ` +
        'stop parsing, which turns existing data into a read error.',
    });
  }
}

function compareProperties(
  path: string,
  before: JsonSchemaNode,
  after: JsonSchemaNode,
  breaks: Break[],
): void {
  if (before.properties === undefined) return;

  const beforeRequired = new Set(before.required ?? []);
  const afterRequired = new Set(after.required ?? []);

  for (const [key, beforeProperty] of Object.entries(before.properties)) {
    const afterProperty = after.properties?.[key];

    if (afterProperty === undefined) {
      breaks.push({
        kind: 'property_removed',
        at: `${path}.${key}`,
        detail: `${key} was removed. A client still reading it receives undefined.`,
      });
      continue;
    }

    if (!beforeRequired.has(key) && afterRequired.has(key)) {
      breaks.push({
        kind: 'property_became_required',
        at: `${path}.${key}`,
        detail:
          `${key} became required. Requests from a client that does not send it are ` +
          'rejected, and existing rows without it stop parsing.',
      });
    }

    compareNode(`${path}.${key}`, beforeProperty, afterProperty, breaks);
  }
}
