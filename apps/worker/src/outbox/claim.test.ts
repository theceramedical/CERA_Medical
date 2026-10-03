import { describe, expect, it } from 'vitest';

import { claimBatch, failOrDeadLetter, type OutboxRow } from './claim.ts';

function row(id: string, overrides: Partial<OutboxRow> = {}): OutboxRow {
  return {
    id,
    eventType: 'erpnext.lead.upsert',
    attempts: 0,
    status: 'pending',
    lockedBy: null,
    lockedAt: null,
    availableAt: 0,
    ...overrides,
  };
}

describe('claimBatch', () => {
  it('never double-claims a row', () => {
    const rows = [row('a'), row('b')];
    const first = claimBatch(rows, 'w1', 1_000, 10);
    const second = claimBatch(rows, 'w2', 1_000, 10);
    expect(first.map((item) => item.id)).toEqual(['a', 'b']);
    expect(second).toEqual([]);
  });
});

describe('failOrDeadLetter', () => {
  it('moves to dead_letter after the attempt ceiling', () => {
    const item = row('a', { attempts: 7 });
    failOrDeadLetter(item, 8, 1_000);
    expect(item.status).toBe('dead_letter');
  });
});
