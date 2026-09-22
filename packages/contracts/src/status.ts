import {
  type CustomerStatus,
  CustomerStatusSchema,
  type InternalStatus,
  InternalStatusSchema,
} from './enums.ts';

/**
 * The enquiry status machine.
 *
 * Expressed as data rather than as a `switch` so the machine, its tests, and the
 * documentation cannot drift: the diagram in `.planning/data-contracts.md`
 * section 4.1 is a rendering of this table, and the tests assert properties of
 * the table itself rather than of a list of examples.
 *
 * `satisfies Record<InternalStatus, ...>` is what makes this exhaustive: adding
 * a status to the enum without adding it here fails to compile.
 */
export const INTERNAL_TRANSITIONS = {
  received: ['triaging', 'rejected_spam'],
  triaging: ['in_progress', 'awaiting_customer', 'referred', 'rejected_spam'],
  awaiting_customer: ['in_progress', 'closed_no_response', 'closed_withdrawn'],
  in_progress: ['awaiting_customer', 'referred', 'completed', 'closed_withdrawn'],
  referred: ['completed', 'closed_withdrawn'],

  // Terminal. An empty array, not an omitted key: omission would be
  // indistinguishable from an oversight, whereas this states the intent.
  completed: [],
  closed_no_response: [],
  closed_withdrawn: [],
  rejected_spam: [],
} as const satisfies Record<InternalStatus, readonly InternalStatus[]>;

/** The status every new enquiry starts in. */
export const INITIAL_INTERNAL_STATUS: InternalStatus = 'received';

/**
 * Internal to customer-facing status.
 *
 * `referred` collapses to `in_progress` and all three closure reasons collapse
 * to `closed`. That is the privacy boundary: a customer must not be able to tell
 * that their enquiry was marked spam, withdrawn, or closed for silence, because
 * each carries an internal judgement they are not party to.
 */
export const CUSTOMER_STATUS_MAP = {
  received: 'received',
  triaging: 'in_review',
  awaiting_customer: 'action_needed',
  in_progress: 'in_progress',
  referred: 'in_progress',
  completed: 'completed',
  closed_no_response: 'closed',
  closed_withdrawn: 'closed',
  rejected_spam: 'closed',
} as const satisfies Record<InternalStatus, CustomerStatus>;

/** Customer-facing labels. The only status wording a customer ever sees. */
export const CUSTOMER_STATUS_LABELS = {
  received: 'Enquiry received',
  in_review: 'Under review',
  action_needed: 'We need a reply from you',
  in_progress: 'In progress',
  completed: 'Completed',
  closed: 'Closed',
} as const satisfies Record<CustomerStatus, string>;

export function toCustomerStatus(internal: InternalStatus): CustomerStatus {
  return CUSTOMER_STATUS_MAP[internal];
}

export function customerStatusLabel(status: CustomerStatus): string {
  return CUSTOMER_STATUS_LABELS[status];
}

export function isTerminalStatus(status: InternalStatus): boolean {
  return INTERNAL_TRANSITIONS[status].length === 0;
}

export function allowedTransitionsFrom(status: InternalStatus): readonly InternalStatus[] {
  return INTERNAL_TRANSITIONS[status];
}

/**
 * Whether a transition is permitted.
 *
 * A same-status transition is rejected. It would otherwise append a status event
 * that says nothing changed, which makes the customer timeline noisy and the
 * audit trail misleading. Callers that want to record a note without a status
 * change should add an internal note instead.
 */
export function canTransition(from: InternalStatus, to: InternalStatus): boolean {
  // Via allowedTransitionsFrom rather than indexing directly: `as const` types a
  // terminal status as `readonly []`, so `.includes()` narrows its parameter to
  // `never` and rejects every argument.
  return allowedTransitionsFrom(from).includes(to);
}

export type TransitionResult =
  | { ok: true; from: InternalStatus; to: InternalStatus; customerStatus: CustomerStatus }
  | {
      ok: false;
      reason: 'terminal' | 'not_allowed' | 'same_status';
      allowed: readonly InternalStatus[];
    };

/**
 * Validates a transition and returns the derived customer status.
 *
 * Returns a result rather than throwing: an invalid transition is an expected
 * outcome of a staff action - two people working the same queue - not an
 * exceptional condition. The distinct `reason` values let the API explain what
 * happened instead of returning a bare 409.
 */
export function evaluateTransition(from: InternalStatus, to: InternalStatus): TransitionResult {
  const allowed = allowedTransitionsFrom(from);

  if (from === to) {
    return { ok: false, reason: 'same_status', allowed };
  }
  if (allowed.length === 0) {
    return { ok: false, reason: 'terminal', allowed };
  }
  if (!allowed.includes(to)) {
    return { ok: false, reason: 'not_allowed', allowed };
  }

  return { ok: true, from, to, customerStatus: CUSTOMER_STATUS_MAP[to] };
}

/**
 * Collapses a status history into the timeline a customer sees.
 *
 * De-duplicates consecutive entries that map to the same customer status. Moving
 * `in_progress -> referred` is two internal states but one customer state, and
 * showing "In progress" twice would imply something happened that the customer
 * cannot see - which is both confusing and a small information leak.
 *
 * Input is assumed chronological; the function does not reorder, because a
 * silent reorder would hide a caller passing events in the wrong order.
 */
export function buildCustomerTimeline(
  events: readonly { newStatus: InternalStatus; createdAt: string }[],
): { status: CustomerStatus; label: string; at: string }[] {
  const timeline: { status: CustomerStatus; label: string; at: string }[] = [];

  for (const event of events) {
    const status = CUSTOMER_STATUS_MAP[event.newStatus];
    if (timeline.at(-1)?.status === status) continue;

    timeline.push({ status, label: CUSTOMER_STATUS_LABELS[status], at: event.createdAt });
  }

  return timeline;
}

/** Every internal status, for tests and for building admin filter controls. */
export const ALL_INTERNAL_STATUSES: readonly InternalStatus[] = InternalStatusSchema.options;

/** Every customer status. */
export const ALL_CUSTOMER_STATUSES: readonly CustomerStatus[] = CustomerStatusSchema.options;
