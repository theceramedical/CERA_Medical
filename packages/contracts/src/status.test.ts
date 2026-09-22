import { describe, expect, it } from 'vitest';

import { type InternalStatus } from './enums.ts';
import {
  ALL_INTERNAL_STATUSES,
  buildCustomerTimeline,
  canTransition,
  CUSTOMER_STATUS_MAP,
  evaluateTransition,
  INITIAL_INTERNAL_STATUS,
  INTERNAL_TRANSITIONS,
  isTerminalStatus,
  toCustomerStatus,
} from './status.ts';

/**
 * These assert properties of the machine rather than a list of examples.
 *
 * A test per edge would pass while missing the case that actually matters - a
 * newly added status that nobody wired up. Properties like "every status is
 * reachable" and "no terminal state has an outgoing edge" keep holding as the
 * machine grows.
 */

describe('transition table integrity', () => {
  it('covers every internal status', () => {
    expect(Object.keys(INTERNAL_TRANSITIONS).sort()).toEqual([...ALL_INTERNAL_STATUSES].sort());
  });

  it('only ever targets a status that exists', () => {
    const known = new Set<string>(ALL_INTERNAL_STATUSES);
    const unknown: string[] = [];

    for (const [from, targets] of Object.entries(INTERNAL_TRANSITIONS)) {
      for (const target of targets) {
        if (!known.has(target)) unknown.push(`${from} -> ${target}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it('has no self-transition', () => {
    const selfEdges = Object.entries(INTERNAL_TRANSITIONS)
      .filter(([from, targets]) => (targets as readonly string[]).includes(from))
      .map(([from]) => from);

    expect(selfEdges).toEqual([]);
  });

  it('makes every status reachable from the initial status', () => {
    // An unreachable status is dead code that still appears in filter dropdowns
    // and status reports. This is the check that catches a forgotten edge.
    const seen = new Set<InternalStatus>([INITIAL_INTERNAL_STATUS]);
    const queue: InternalStatus[] = [INITIAL_INTERNAL_STATUS];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) break;
      for (const next of INTERNAL_TRANSITIONS[current]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    const unreachable = ALL_INTERNAL_STATUSES.filter((status) => !seen.has(status));
    expect(unreachable).toEqual([]);
  });

  it('treats exactly the five closure statuses as terminal', () => {
    const terminal = ALL_INTERNAL_STATUSES.filter(isTerminalStatus).sort();

    expect(terminal).toEqual([
      'closed_no_response',
      'closed_withdrawn',
      'completed',
      'rejected_spam',
    ]);
  });

  it('guarantees every non-terminal status can still reach a terminal one', () => {
    // Without this, an enquiry could become permanently stuck in an open state
    // with no valid way to close it - invisible until a real enquiry hits it.
    const stuck: InternalStatus[] = [];

    for (const start of ALL_INTERNAL_STATUSES) {
      const seen = new Set<InternalStatus>([start]);
      const queue: InternalStatus[] = [start];
      let reachesTerminal = false;

      while (queue.length > 0 && !reachesTerminal) {
        const current = queue.shift();
        if (current === undefined) break;
        if (isTerminalStatus(current)) {
          reachesTerminal = true;
          break;
        }
        for (const next of INTERNAL_TRANSITIONS[current]) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }

      if (!reachesTerminal) stuck.push(start);
    }

    expect(stuck).toEqual([]);
  });
});

describe('evaluateTransition', () => {
  it('permits a valid transition and derives the customer status', () => {
    const result = evaluateTransition('received', 'triaging');

    expect(result).toEqual({
      ok: true,
      from: 'received',
      to: 'triaging',
      customerStatus: 'in_review',
    });
  });

  it('rejects an edge that does not exist', () => {
    // Skipping triage would mean an enquiry was never reviewed.
    const result = evaluateTransition('received', 'completed');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('not_allowed');
      expect(result.allowed).toEqual(['triaging', 'rejected_spam']);
    }
  });

  it('rejects any move out of a terminal status', () => {
    for (const terminal of ALL_INTERNAL_STATUSES.filter(isTerminalStatus)) {
      const result = evaluateTransition(terminal, 'in_progress');

      expect(result.ok, `${terminal} should be terminal`).toBe(false);
      if (!result.ok) expect(result.reason).toBe('terminal');
    }
  });

  it('rejects a no-op transition', () => {
    // A same-status move would append an event saying nothing changed, which
    // makes the customer timeline noisy and the audit trail misleading.
    const result = evaluateTransition('in_progress', 'in_progress');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('same_status');
  });

  it('agrees with canTransition on every pair', () => {
    // Two callers use two entry points. If they ever disagree, a transition the
    // UI offers would be refused by the API.
    for (const from of ALL_INTERNAL_STATUSES) {
      for (const to of ALL_INTERNAL_STATUSES) {
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(
          from !== to && evaluateTransition(from, to).ok,
        );
      }
    }
  });
});

describe('customer status mapping', () => {
  it('maps every internal status', () => {
    expect(Object.keys(CUSTOMER_STATUS_MAP).sort()).toEqual([...ALL_INTERNAL_STATUSES].sort());
  });

  it('never reveals that an enquiry was rejected as spam', () => {
    // The single most important mapping in the file. Telling someone their
    // enquiry was classed as spam is both a poor experience and a disclosure of
    // an internal judgement.
    expect(toCustomerStatus('rejected_spam')).toBe('closed');
  });

  it('collapses all three closure reasons to one customer status', () => {
    expect(toCustomerStatus('closed_no_response')).toBe('closed');
    expect(toCustomerStatus('closed_withdrawn')).toBe('closed');
    expect(toCustomerStatus('rejected_spam')).toBe('closed');
  });

  it('hides referral behind in_progress', () => {
    expect(toCustomerStatus('referred')).toBe('in_progress');
    expect(toCustomerStatus('in_progress')).toBe('in_progress');
  });

  it('never exposes an internal status name as a customer status', () => {
    const internalOnly = [
      'triaging',
      'referred',
      'closed_no_response',
      'closed_withdrawn',
      'rejected_spam',
    ];
    const exposed = Object.values(CUSTOMER_STATUS_MAP).filter((value) =>
      internalOnly.includes(value),
    );

    expect(exposed).toEqual([]);
  });
});

describe('buildCustomerTimeline', () => {
  it('collapses consecutive events that map to the same customer status', () => {
    // in_progress -> referred is two internal states but one customer state.
    // Showing "In progress" twice implies something the customer cannot see.
    const timeline = buildCustomerTimeline([
      { newStatus: 'received', createdAt: '2026-09-01T10:00:00.000Z' },
      { newStatus: 'triaging', createdAt: '2026-09-01T11:00:00.000Z' },
      { newStatus: 'in_progress', createdAt: '2026-09-02T09:00:00.000Z' },
      { newStatus: 'referred', createdAt: '2026-09-03T09:00:00.000Z' },
      { newStatus: 'completed', createdAt: '2026-09-05T15:00:00.000Z' },
    ]);

    expect(timeline).toEqual([
      { status: 'received', label: 'Enquiry received', at: '2026-09-01T10:00:00.000Z' },
      { status: 'in_review', label: 'Under review', at: '2026-09-01T11:00:00.000Z' },
      { status: 'in_progress', label: 'In progress', at: '2026-09-02T09:00:00.000Z' },
      { status: 'completed', label: 'Completed', at: '2026-09-05T15:00:00.000Z' },
    ]);
  });

  it('keeps the earliest timestamp when collapsing', () => {
    // The customer saw the status change at the first moment, not the last.
    const timeline = buildCustomerTimeline([
      { newStatus: 'in_progress', createdAt: '2026-09-02T09:00:00.000Z' },
      { newStatus: 'referred', createdAt: '2026-09-03T09:00:00.000Z' },
    ]);

    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.at).toBe('2026-09-02T09:00:00.000Z');
  });

  it('shows a re-entered status as a separate entry', () => {
    // in_progress -> awaiting_customer -> in_progress is a genuine round trip
    // and the customer needs to see both moves.
    const timeline = buildCustomerTimeline([
      { newStatus: 'in_progress', createdAt: '2026-09-02T09:00:00.000Z' },
      { newStatus: 'awaiting_customer', createdAt: '2026-09-03T09:00:00.000Z' },
      { newStatus: 'in_progress', createdAt: '2026-09-04T09:00:00.000Z' },
    ]);

    expect(timeline.map((entry) => entry.status)).toEqual([
      'in_progress',
      'action_needed',
      'in_progress',
    ]);
  });

  it('returns an empty timeline for no events', () => {
    expect(buildCustomerTimeline([])).toEqual([]);
  });

  it('never leaks a transition reason', () => {
    const timeline = buildCustomerTimeline([
      { newStatus: 'rejected_spam', createdAt: '2026-09-01T10:00:00.000Z' },
    ]);

    expect(JSON.stringify(timeline)).not.toContain('spam');
    expect(timeline[0]?.label).toBe('Closed');
  });
});
