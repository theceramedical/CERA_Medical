import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { ApiError } from './errors.ts';
import {
  buildPage,
  type Cursor,
  decodeCursor,
  DEFAULT_PAGE_SIZE,
  encodeCursor,
  MAX_PAGE_SIZE,
  PaginationQuerySchema,
} from './pagination.ts';

const cursor: Cursor = {
  createdAt: '2026-09-01T10:15:00.000Z',
  id: '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f',
};

describe('cursor codec', () => {
  it('round-trips', () => {
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('produces a URL-safe string', () => {
    // A cursor travels in a query string. Standard base64 would need escaping,
    // and a half-escaped cursor is a bug that only shows up on some pages.
    const encoded = encodeCursor(cursor);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(encoded)).toBe(encoded);
  });

  it('does not look like the sort key it encodes', () => {
    // Opacity is the point: a client that can read the cursor will start
    // depending on the sort key, which then cannot be changed.
    expect(encodeCursor(cursor)).not.toContain('2026-09-01');
  });

  it.each([
    ['not base64 at all', '!!!not-base64!!!'],
    ['base64 of non-JSON', Buffer.from('plain text', 'utf8').toString('base64url')],
    [
      'base64 of the wrong shape',
      Buffer.from(JSON.stringify({ page: 3 }), 'utf8').toString('base64url'),
    ],
    [
      'a non-UUID id',
      Buffer.from(JSON.stringify({ createdAt: cursor.createdAt, id: 'abc' }), 'utf8').toString(
        'base64url',
      ),
    ],
    [
      'a non-timestamp createdAt',
      Buffer.from(JSON.stringify({ createdAt: 'yesterday', id: cursor.id }), 'utf8').toString(
        'base64url',
      ),
    ],
  ])('rejects %s', (_label, encoded) => {
    expect(() => decodeCursor(encoded)).toThrow(ApiError);
  });

  it('gives every malformed cursor the same client-visible error', () => {
    // Differences here would describe how the cursor is built, and no client can
    // act on the distinction anyway.
    const bodies = ['!!!', Buffer.from('{}', 'utf8').toString('base64url')].map((bad) => {
      try {
        decodeCursor(bad);
        throw new Error('expected decodeCursor to throw');
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        return JSON.stringify(error.toEnvelope('req-1'));
      }
    });

    expect(bodies[0]).toBe(bodies[1]);
  });

  it('records the specific cause internally, for the log', () => {
    try {
      decodeCursor('!!!');
      throw new Error('expected decodeCursor to throw');
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      expect(error.internalDetail).toContain('base64url');
      expect(JSON.stringify(error.toEnvelope('req-1'))).not.toContain('base64url');
    }
  });
});

describe('PaginationQuerySchema', () => {
  it('defaults the limit rather than returning everything', () => {
    expect(PaginationQuerySchema.parse({})).toEqual({ limit: DEFAULT_PAGE_SIZE });
  });

  it('coerces the limit from a query string', () => {
    expect(PaginationQuerySchema.parse({ limit: '50' }).limit).toBe(50);
  });

  it('rejects a limit above the maximum instead of silently clamping it', () => {
    // A silent clamp hides a client bug: the caller believes it asked for 5000
    // and got everything, and nothing ever says otherwise.
    const result = PaginationQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE + 1) });

    expect(result.success).toBe(false);
  });

  it.each([['0'], ['-1'], ['1.5'], ['abc'], ['']])('rejects limit %s', (limit) => {
    expect(PaginationQuerySchema.safeParse({ limit }).success).toBe(false);
  });
});

describe('buildPage', () => {
  const rows = (count: number): Cursor[] =>
    Array.from({ length: count }, (_unused, index) => ({
      createdAt: `2026-09-01T10:00:0${String(index)}.000Z`,
      id: uuidv7(),
    }));

  it('returns a null cursor when the result set is exhausted', () => {
    const page = buildPage(rows(3), 5);

    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it('returns a null cursor when the last page is exactly full', () => {
    // The caller over-fetches by one, so exactly `limit` rows means there is no
    // further page. Getting this wrong yields an extra empty page every time.
    const page = buildPage(rows(5), 5);

    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  it('discards the over-fetched row rather than returning it', () => {
    const source = rows(6);
    const page = buildPage(source, 5);

    expect(page.items).toHaveLength(5);
    expect(page.items.map((row) => row.id)).not.toContain(source[5]?.id);
  });

  it('points the next cursor at the last returned row, not the over-fetched one', () => {
    // Off by one here skips a row permanently, which in a work queue means an
    // enquiry nobody ever sees.
    const source = rows(6);
    const page = buildPage(source, 5);

    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor ?? '')).toEqual({
      createdAt: source[4]?.createdAt,
      id: source[4]?.id,
    });
  });

  it('pages through a full set exactly once per row', () => {
    const source = rows(11);
    const seen: string[] = [];

    for (let offset = 0; offset < source.length; offset += 4) {
      const page = buildPage(source.slice(offset, offset + 5), 4);
      seen.push(...page.items.map((row) => row.id));
    }

    expect(seen).toEqual(source.map((row) => row.id));
    expect(new Set(seen).size).toBe(source.length);
  });

  it('handles an empty result set', () => {
    expect(buildPage([], 25)).toEqual({ items: [], nextCursor: null });
  });

  it('does not alias the caller rows array', () => {
    const source = rows(2);
    const page = buildPage(source, 5);

    page.items.pop();

    expect(source).toHaveLength(2);
  });
});
