export type OutboxStatus = 'pending' | 'in_flight' | 'done' | 'dead_letter';

export interface OutboxRow {
  readonly id: string;
  readonly eventType: string;
  attempts: number;
  status: OutboxStatus;
  lockedBy: string | null;
  lockedAt: string | null;
  availableAt: number;
}

export function claimBatch(
  rows: OutboxRow[],
  workerId: string,
  now: number,
  batchSize: number,
): OutboxRow[] {
  const claimed: OutboxRow[] = [];
  for (const row of rows) {
    if (claimed.length >= batchSize) break;
    if (row.status !== 'pending') continue;
    if (row.availableAt > now) continue;
    if (row.lockedBy !== null && row.lockedAt !== null) continue;
    row.status = 'in_flight';
    row.lockedBy = workerId;
    row.lockedAt = new Date(now).toISOString();
    claimed.push(row);
  }
  return claimed;
}

export function backoffMs(attempts: number): number {
  const cap = 60 * 60 * 1000;
  const base = Math.min(cap, 1_000 * 2 ** attempts);
  return Math.floor(Math.random() * base);
}

export function failOrDeadLetter(row: OutboxRow, maxAttempts: number, now: number): void {
  row.attempts += 1;
  row.lockedBy = null;
  row.lockedAt = null;
  if (row.attempts >= maxAttempts) {
    row.status = 'dead_letter';
    return;
  }
  row.status = 'pending';
  row.availableAt = now + backoffMs(row.attempts);
}
