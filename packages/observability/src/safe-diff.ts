import { type SafeDiff, SafeDiffSchema } from '@cera/contracts';

import { LOGGABLE_FIELDS, NEVER_LOGGABLE, redactValue } from './redact.ts';

/**
 * A field-level diff that is safe to persist on an `AuditEvent`.
 *
 * The audit table outlives the records it describes - enquiry retention is 24 months,
 * audit is kept longer - so writing the before-and-after of a free-text field would
 * create a second, longer-lived copy of the thing the retention policy is meant to
 * destroy. Fields that are not on the log allow-list, and every field on the deny-list,
 * are recorded as `{ changed: true }` with no values. Fields that are allow-listed
 * (identifiers, enumerated statuses, timestamps) keep `{ from, to }`, after `redactValue`.
 *
 * `safeDiff` is itself on the deny-list for *logs*, which looks contradictory and is not:
 * the audit row is the authorised home for this object, and putting it on a log line would
 * duplicate it into a 90-day aggregator that is readable by anyone with that access.
 */

function same(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === undefined && right === undefined) return true;
  if (left === null && right === null) return true;

  // Dates and ISO strings of the same instant are the same change, not two.
  const leftIso = left instanceof Date ? left.toISOString() : left;
  const rightIso = right instanceof Date ? right.toISOString() : right;
  if (leftIso === rightIso) return true;

  try {
    return JSON.stringify(leftIso) === JSON.stringify(rightIso);
  } catch {
    return false;
  }
}

function isValueSafe(key: string): boolean {
  return LOGGABLE_FIELDS.has(key) && !NEVER_LOGGABLE.has(key);
}

export function safeDiff(
  before: Readonly<Record<string, unknown>> | null | undefined,
  after: Readonly<Record<string, unknown>> | null | undefined,
): SafeDiff | null {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const diff: SafeDiff = {};

  for (const key of keys) {
    const from = before?.[key];
    const to = after?.[key];
    if (same(from, to)) continue;

    if (isValueSafe(key)) {
      diff[key] = { from: redactValue(from), to: redactValue(to) };
    } else {
      // Presence of the change, never the value. `{ changed: true }` is the only
      // shape `SafeDiffSchema` allows besides `{ from, to }`.
      diff[key] = { changed: true };
    }
  }

  if (Object.keys(diff).length === 0) return null;

  return SafeDiffSchema.parse(diff);
}
