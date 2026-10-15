import { domainError, type DomainError } from '@/core/common';
import { err, ok, type Result } from '@/core/common';

/** BR-17: state of a transfer attempt as reported by the server. */
export type TransferStatus = 'in_progress' | 'completed' | 'failed' | 'not_processed';

const ALLOWED: Readonly<Record<TransferStatus, readonly TransferStatus[]>> = {
  in_progress: ['completed', 'failed', 'not_processed'],
  // Never received or not processed: a retry with the same key may process it (BR-07).
  not_processed: ['in_progress'],
  completed: [],
  failed: [],
};

/** Final states never change; a retry returns them as they are. */
export function isFinalStatus(status: TransferStatus): boolean {
  return status === 'completed' || status === 'failed';
}

export function transitionAttempt(
  from: TransferStatus,
  to: TransferStatus,
): Result<TransferStatus, DomainError<'INTERNAL_ERROR'>> {
  if (!ALLOWED[from].includes(to)) {
    return err(domainError('INTERNAL_ERROR', { reason: 'invalid_transition', from, to }));
  }
  return ok(to);
}
