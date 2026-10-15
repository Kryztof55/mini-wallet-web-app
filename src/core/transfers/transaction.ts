import type { MaskedIdentifier } from '@/core/identity';
import type { TransactionId, UserId } from '@/core/common';
import type { Money } from '@/core/money';

export type TransactionDirection = 'in' | 'out';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

/** A money movement shown in the activity list (FS-02). */
export type Transaction = {
  readonly id: TransactionId;
  readonly userId: UserId;
  readonly direction: TransactionDirection;
  readonly counterparty: {
    readonly name: string | null;
    readonly maskedIdentifier: MaskedIdentifier;
  };
  readonly amount: Money;
  readonly concept: string | null;
  readonly status: TransactionStatus;
  /** ISO 8601, UTC. */
  readonly occurredAt: string;
};
