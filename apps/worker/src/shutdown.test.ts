import { describe, expect, it, vi } from 'vitest';

import { createShutdownHandler, type ShutdownEvent, type ShutdownStage } from './shutdown.ts';

/**
 * These tests assert the ordering guarantees rather than the logging. Ordering
 * is what protects claimed outbox rows, and it is the property a future
 * refactor is most likely to break - for example by switching the loop to
 * Promise.all to "speed up shutdown".
 */

const stage = (name: string, order: string[], behaviour?: () => Promise<void>): ShutdownStage => ({
  name,
  close: async () => {
    order.push(`${name}:start`);
    if (behaviour) await behaviour();
    order.push(`${name}:end`);
  },
});

describe('createShutdownHandler', () => {
  it('closes stages strictly in order, never overlapping', async () => {
    const order: string[] = [];
    const shutdown = createShutdownHandler({
      stages: [
        stage('http', order, () => new Promise((resolve) => setTimeout(resolve, 20))),
        stage('queue', order, () => new Promise((resolve) => setTimeout(resolve, 10))),
        stage('pool', order),
      ],
    });

    const result = await shutdown('SIGTERM');

    // Each stage fully completes before the next begins. Interleaved start/end
    // markers would mean the stages ran concurrently.
    expect(order).toEqual([
      'http:start',
      'http:end',
      'queue:start',
      'queue:end',
      'pool:start',
      'pool:end',
    ]);
    expect(result.ok).toBe(true);
    expect(result.completed).toEqual(['http', 'queue', 'pool']);
  });

  it('still releases the pool when the queue fails to close', async () => {
    const order: string[] = [];
    const shutdown = createShutdownHandler({
      stages: [
        stage('http', order),
        { name: 'queue', close: () => Promise.reject(new Error('valkey unreachable')) },
        stage('pool', order),
      ],
    });

    const result = await shutdown('SIGTERM');

    // The important assertion: a failing queue must not leak pool connections
    // on every restart.
    expect(order).toContain('pool:end');
    expect(result.failed).toEqual(['queue']);
    expect(result.completed).toEqual(['http', 'pool']);
    expect(result.ok).toBe(false);
  });

  it('ignores a duplicate signal instead of shutting down twice', async () => {
    const order: string[] = [];
    const events: ShutdownEvent[] = [];
    const shutdown = createShutdownHandler({
      stages: [stage('pool', order, () => new Promise((resolve) => setTimeout(resolve, 30)))],
      onEvent: (event) => events.push(event),
    });

    // Orchestrators frequently send SIGTERM more than once. Two concurrent
    // sequences would close the pool twice and race the queue drain.
    const [first, second] = await Promise.all([shutdown('SIGTERM'), shutdown('SIGTERM')]);

    expect(order).toEqual(['pool:start', 'pool:end']);
    expect(first).toBe(second);
    expect(events.filter((event) => event.type === 'started')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'ignored_duplicate')).toHaveLength(1);
  });

  it('gives up deliberately rather than hanging forever', async () => {
    vi.useFakeTimers();
    try {
      const shutdown = createShutdownHandler({
        // Never resolves. Without the deadline the process would wait for
        // SIGKILL, losing the chance to exit with a meaningful code.
        stages: [{ name: 'stuck', close: () => new Promise<void>(() => undefined) }],
        timeoutMs: 5_000,
      });

      const pending = shutdown('SIGTERM');
      await vi.advanceTimersByTimeAsync(5_000);
      const result = await pending;

      expect(result.timedOut).toBe(true);
      expect(result.ok).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports each stage duration for diagnosing slow drains', async () => {
    const order: string[] = [];
    const events: ShutdownEvent[] = [];
    const shutdown = createShutdownHandler({
      stages: [stage('http', order), stage('pool', order)],
      onEvent: (event) => events.push(event),
    });

    await shutdown('SIGINT');

    const stageEvents = events.filter((event) => event.type === 'stage_complete');
    expect(stageEvents.map((event) => (event.type === 'stage_complete' ? event.name : ''))).toEqual(
      ['http', 'pool'],
    );
    expect(events.at(-1)?.type).toBe('completed');
  });
});
