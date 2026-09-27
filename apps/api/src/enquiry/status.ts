import { evaluateTransition, type InternalStatus } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

/**
 * ENQ-403: invalid transitions are rejected here, not in the UI.
 */
export function assertTransition(from: InternalStatus, to: InternalStatus) {
  const result = evaluateTransition(from, to);
  if (!result.ok) {
    throw new ApiError('invalid_transition', {
      fieldErrors: [
        {
          path: 'status',
          code: result.reason,
          message:
            result.allowed.length === 0
              ? 'That enquiry is already closed.'
              : `Permitted next statuses: ${result.allowed.join(', ')}.`,
        },
      ],
    });
  }
  return result;
}
