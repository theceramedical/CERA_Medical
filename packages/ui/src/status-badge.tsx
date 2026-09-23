import { customerStatusLabel } from '@cera/contracts/status';

import type { CustomerStatus } from '@cera/contracts/enums';

import { Badge, type BadgeProps } from './badge.tsx';

/**
 * An enquiry's status as a customer sees it.
 *
 * The label comes from `@cera/contracts`, not from a map in this file. That is a deliberate
 * dependency from the design system onto the domain, and the alternative is worse: a second copy of
 * the wording here means the badge can say "Under review" while the confirmation email says
 * "In review", and nothing would fail. `CUSTOMER_STATUS_LABELS` is already the single place that
 * decides what a customer is told, and it is `satisfies Record<CustomerStatus, string>`, so a new
 * status cannot be added without a label.
 *
 * The tone map *is* local, because tone is a design decision - which of five tints reads as
 * "waiting on us" versus "waiting on you" - and it has no meaning outside a rendered page.
 *
 * Only `CustomerStatus` is accepted. `InternalStatus` distinguishes `rejected_spam`,
 * `closed_withdrawn`, and `closed_no_response`, all of which collapse to `closed` for a customer,
 * and a component that could render either would be one `status` prop away from telling someone
 * their enquiry was marked as spam. The type makes that unrepresentable rather than merely
 * discouraged.
 */

/**
 * Status to tint.
 *
 * `satisfies Record<CustomerStatus, ...>` for the same reason as the labels: adding a status to the
 * enum without deciding its tone fails to compile, instead of rendering as the neutral default and
 * looking deliberate.
 */
const STATUS_TONE = {
  received: 'info',
  in_review: 'info',
  /** The only status that needs the customer to do something, so the only one that stands out. */
  action_needed: 'warning',
  in_progress: 'info',
  completed: 'success',
  /**
   * Neutral, not `danger`. A closed enquiry is an ordinary outcome, and red would read as an error
   * or a rejection - which for the withdrawn and no-response cases would be actively misleading.
   */
  closed: 'neutral',
} as const satisfies Record<CustomerStatus, NonNullable<BadgeProps['tone']>>;

export interface StatusBadgeProps {
  readonly status: CustomerStatus;
  readonly className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      tone={STATUS_TONE[status]}
      // Without the prefix the announcement is a bare "Under review", which in a table row or
      // beside a reference number says nothing about what is under review.
      srPrefix="Status"
      className={className}
    >
      {customerStatusLabel(status)}
    </Badge>
  );
}

export { STATUS_TONE };
