import { z } from 'zod';

import { ApiError } from './errors.ts';
import { UtcTimestampSchema, Uuidv7Schema } from './primitives.ts';

/**
 * Cursor pagination for every list endpoint.
 *
 * Keyset, not offset. `OFFSET n` makes the database count and discard n rows, so
 * page 40 of the staff queue costs forty times page 1, and a row inserted while
 * someone pages will shift every subsequent page - which in a work queue means an
 * enquiry can be skipped entirely and never worked. A keyset cursor reads from an
 * index at constant cost and is stable under concurrent inserts.
 */

/** The maximum any caller may request. Enforced server-side, not merely documented. */
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;

/**
 * The sort key. Every paginated table is ordered by `(created_at desc, id desc)`
 * and has a matching index.
 *
 * `id` is the tiebreaker because `createdAt` is not unique: two enquiries
 * submitted in the same millisecond would otherwise have an arbitrary relative
 * order that could differ between the page that ends on one of them and the page
 * that starts after it, dropping or duplicating a row. UUID v7 is
 * time-ordered, so `id desc` agrees with `created_at desc` and the composite key
 * is total.
 */
export const CursorSchema = z.object({
  createdAt: UtcTimestampSchema,
  id: Uuidv7Schema,
});
export type Cursor = z.infer<typeof CursorSchema>;

/**
 * Encodes a cursor as an opaque base64url string.
 *
 * Opaque, not secret, and deliberately unsigned. A tampered cursor can only move
 * the starting point within a result set the caller is already authorised to
 * read, because scoping lives in the SQL `WHERE` clause - `/v1/me/*` filters by
 * the authenticated subject there, not here. Signing would add key rotation and
 * a new failure mode to buy nothing. Encoding is still worth doing: it stops
 * clients from constructing cursors by hand and depending on the sort key, which
 * would make the key impossible to change later.
 */
export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

/**
 * Decodes a cursor, throwing a `validation_failed` `ApiError` if it is unusable.
 *
 * A bad cursor is a bad query parameter, so it reuses `validation_failed` rather
 * than adding an error code - the enum is exhaustively mapped to statuses and
 * messages, and a code that only ever means "you edited the URL" earns none of
 * that.
 *
 * Every failure - malformed base64, invalid JSON, a wrong shape, a bad timestamp
 * - produces the same client-visible error, with the specific cause recorded in
 * `internalDetail` for the log. Distinguishing them to the caller would describe
 * how the cursor is built, and there is nothing a client could do differently.
 */
export function decodeCursor(encoded: string): Cursor {
  const reject = (internalDetail: string): never => {
    throw new ApiError('validation_failed', {
      fieldErrors: [
        {
          path: 'cursor',
          code: 'invalid_cursor',
          message: 'That page link is no longer valid. Please start from the first page.',
        },
      ],
      internalDetail,
    });
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return reject('cursor is not base64url-encoded JSON');
  }

  const result = CursorSchema.safeParse(parsed);
  if (!result.success) {
    return reject('cursor decoded but failed schema validation');
  }

  return result.data;
}

/**
 * Query parameters accepted by every list endpoint.
 *
 * `limit` is coerced because it arrives as a string, clamped by `max` rather than
 * transformed, so an over-large request is a visible 422 instead of a silent
 * truncation that hides a client bug.
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().min(1).max(512).optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * A page of results.
 *
 * `nextCursor` is null exactly when there is no further page. There is
 * deliberately no `total`: counting the staff queue on every request is an
 * unbounded scan, and the PRD's performance budget rules that out. The UI shows
 * "load more", not "page 7 of 92".
 */
export function PageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Turns an over-fetched row set into a page.
 *
 * Callers query `limit + 1` rows. The extra row is the only reliable way to know
 * whether a further page exists without a second count query; it is used as a
 * flag and then discarded, never returned.
 */
export function buildPage<T extends Cursor>(rows: readonly T[], limit: number): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : [...rows];
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}
