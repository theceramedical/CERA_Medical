import { internalStatusLabel } from '@cera/contracts/status';

import type { InternalStatus } from '@cera/contracts/enums';

import { Badge, type BadgeProps } from './badge.tsx';

const INTERNAL_STATUS_TONE = {
  received: 'info',
  triaging: 'info',
  awaiting_customer: 'warning',
  in_progress: 'info',
  referred: 'info',
  completed: 'success',
  closed_no_response: 'neutral',
  closed_withdrawn: 'neutral',
  rejected_spam: 'danger',
} as const satisfies Record<InternalStatus, NonNullable<BadgeProps['tone']>>;

export interface InternalStatusBadgeProps {
  readonly status: InternalStatus;
  readonly className?: string;
}

export function InternalStatusBadge({ status, className }: InternalStatusBadgeProps) {
  return (
    <Badge tone={INTERNAL_STATUS_TONE[status]} srPrefix="Status" className={className}>
      {internalStatusLabel(status)}
    </Badge>
  );
}
