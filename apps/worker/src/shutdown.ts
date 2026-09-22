/**
 * Graceful shutdown orchestration.
 *
 * Extracted from `main.ts` because the ordering is the part that actually
 * matters and the part that is easy to break later. From Phase 10 the worker
 * claims outbox rows before processing them; if the connection pool closes
 * while a job is still running, that row stays claimed with no process behind
 * it and the enquiry stalls until the claim timeout expires.
 *
 * The required order:
 *   1. Stop accepting new work (HTTP server, then queue consumers).
 *   2. Wait for in-flight jobs to finish.
 *   3. Release shared resources (the database pool) last.
 *
 * Reversing 2 and 3 is the bug this module exists to prevent.
 */

export interface ShutdownStage {
  /** Used in logs and in test assertions about ordering. */
  name: string;
  close: () => Promise<void>;
}

export interface ShutdownOptions {
  /** Ordered, and the order is the contract: earliest stops accepting work first. */
  stages: ShutdownStage[];
  /**
   * Upper bound on the whole sequence. Past this the process gives up and exits
   * non-zero, because a shutdown that hangs forever gets SIGKILLed by the
   * orchestrator, which is strictly worse than exiting deliberately.
   */
  timeoutMs?: number;
  onEvent?: (event: ShutdownEvent) => void;
}

export type ShutdownEvent =
  | { type: 'started'; signal: string }
  | { type: 'stage_complete'; name: string; durationMs: number }
  | { type: 'stage_failed'; name: string; error: unknown }
  | { type: 'completed'; durationMs: number }
  | { type: 'timed_out'; timeoutMs: number }
  | { type: 'ignored_duplicate'; signal: string };

export interface ShutdownResult {
  ok: boolean;
  completed: string[];
  failed: string[];
  timedOut: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function createShutdownHandler(
  options: ShutdownOptions,
): (signal: string) => Promise<ShutdownResult> {
  const { stages, timeoutMs = DEFAULT_TIMEOUT_MS, onEvent } = options;

  let inFlight: Promise<ShutdownResult> | undefined;

  const runStages = async (signal: string): Promise<ShutdownResult> => {
    const startedAt = Date.now();
    onEvent?.({ type: 'started', signal });

    const completed: string[] = [];
    const failed: string[] = [];

    // Sequential by design. Closing stages concurrently would let the pool
    // close while a queue is still draining onto it, which is the exact failure
    // this ordering prevents.
    for (const stage of stages) {
      const stageStartedAt = Date.now();
      try {
        await stage.close();
        completed.push(stage.name);
        onEvent?.({
          type: 'stage_complete',
          name: stage.name,
          durationMs: Date.now() - stageStartedAt,
        });
      } catch (error) {
        // Continue rather than abort. A queue that fails to close cleanly must
        // not prevent the pool from being released, or the process leaks
        // connections on every restart.
        failed.push(stage.name);
        onEvent?.({ type: 'stage_failed', name: stage.name, error });
      }
    }

    const durationMs = Date.now() - startedAt;
    onEvent?.({ type: 'completed', durationMs });

    return { ok: failed.length === 0, completed, failed, timedOut: false };
  };

  return (signal: string): Promise<ShutdownResult> => {
    // A second SIGTERM must not start a parallel shutdown. Orchestrators often
    // send SIGTERM more than once, and two concurrent sequences would close the
    // pool twice and race the queue drain.
    if (inFlight !== undefined) {
      onEvent?.({ type: 'ignored_duplicate', signal });
      return inFlight;
    }

    let timer: NodeJS.Timeout | undefined;
    const withDeadline = Promise.race([
      runStages(signal),
      new Promise<ShutdownResult>((resolve) => {
        timer = setTimeout(() => {
          onEvent?.({ type: 'timed_out', timeoutMs });
          resolve({ ok: false, completed: [], failed: [], timedOut: true });
        }, timeoutMs);
      }),
    ]).finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    });

    inFlight = withDeadline;
    return withDeadline;
  };
}
