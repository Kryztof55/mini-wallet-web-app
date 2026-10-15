import type { ErrorCode, ErrorDetails } from '@/core/errors';
import type { Money } from '@/core/money';
import type { ClientError } from '@/shared/lib/http/client';
import type { AttemptStatus, ReceiptView } from '@/shared/api/transfers';

/** TS-04 §4: exactly one state drives the confirmation UI (UIR-CONF-*). `ref` = request ID. */
export type ConfirmState =
  | { readonly status: 'idle' }
  | { readonly status: 'processing'; readonly slow: boolean }
  | { readonly status: 'verifying'; readonly checksDone: number }
  | { readonly status: 'completed'; readonly receipt: ReceiptView }
  | { readonly status: 'networkError'; readonly ref: string }
  | { readonly status: 'notProcessed'; readonly ref: string }
  | { readonly status: 'insufficientFunds'; readonly balance: Money | null; readonly ref: string }
  | { readonly status: 'unknownError'; readonly ref: string }
  | { readonly status: 'unresolved'; readonly ref: string }
  | { readonly status: 'ruleViolation'; readonly code: ErrorCode | string; readonly ref: string };

export type FinalState = Exclude<ConfirmState, { status: 'idle' | 'processing' | 'verifying' }>;

export type ConfirmEvent =
  | { readonly type: 'started' }
  | { readonly type: 'slow' }
  | { readonly type: 'verifying'; readonly checksDone: number }
  | { readonly type: 'settled'; readonly state: FinalState }
  | { readonly type: 'reset' };

export const initialConfirmState: ConfirmState = { status: 'idle' };

export function confirmReducer(state: ConfirmState, event: ConfirmEvent): ConfirmState {
  switch (event.type) {
    case 'started':
      return { status: 'processing', slow: false };
    case 'slow':
      // Only meaningful while the request is still pending (UIR-CONF-02).
      return state.status === 'processing' ? { ...state, slow: true } : state;
    case 'verifying':
      return { status: 'verifying', checksDone: event.checksDone };
    case 'settled':
      return event.state;
    case 'reset':
      return initialConfirmState;
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

function balanceFrom(details: ErrorDetails | Readonly<Record<string, unknown>> | null | undefined) {
  const minor = details?.balanceMinor;
  return typeof minor === 'number' && Number.isSafeInteger(minor) && minor >= 0
    ? ({ amountMinor: minor, currency: 'MXN' } as const)
    : null;
}

/** What to do with the POST response (TS-04 §8 "Response → state"). `verify` = start checks. */
export type ConfirmNext =
  | { readonly kind: 'settled'; readonly state: FinalState }
  | { readonly kind: 'verify'; readonly immediately: boolean }
  | { readonly kind: 'ignore' };

export function nextFromConfirm(
  result:
    | {
        readonly ok: true;
        readonly status: number;
        readonly data: ReceiptView | { status: 'in_progress' };
      }
    | { readonly ok: false; readonly error: ClientError },
): ConfirmNext {
  if (result.ok) {
    if ('transferId' in result.data) {
      return { kind: 'settled', state: { status: 'completed', receipt: result.data } };
    }
    // 202: another request with this key is running; ask for its result right away.
    return { kind: 'verify', immediately: true };
  }
  const { code, requestId: ref, details } = result.error;
  switch (code) {
    case 'TIMEOUT':
      return { kind: 'verify', immediately: false };
    case 'ABORTED':
      return { kind: 'ignore' };
    case 'NETWORK_ERROR':
    case 'NETWORK_UNAVAILABLE':
    case 'SERVICE_UNAVAILABLE':
      return { kind: 'settled', state: { status: 'networkError', ref } };
    case 'INSUFFICIENT_FUNDS':
      return {
        kind: 'settled',
        state: { status: 'insufficientFunds', balance: balanceFrom(details), ref },
      };
    case 'INVALID_AMOUNT':
    case 'RECIPIENT_REQUIRED':
    case 'SELF_TRANSFER':
    case 'INVALID_IDENTIFIER':
    case 'INVALID_CONCEPT':
    case 'INVALID_CONTACT_NAME':
      return { kind: 'settled', state: { status: 'ruleViolation', code, ref } };
    default:
      // INTERNAL_ERROR, IDEMPOTENCY_KEY_REUSED (a client bug), anything unexpected.
      return { kind: 'settled', state: { status: 'unknownError', ref } };
  }
}

/** What a status check tells (TS-04 §8); `null` = keep checking (in progress or check failed). */
export function stateFromStatus(status: AttemptStatus, ref: string): FinalState | null {
  switch (status.status) {
    case 'completed':
      return { status: 'completed', receipt: status.receipt };
    case 'not_processed':
      return { status: 'notProcessed', ref };
    case 'failed':
      return status.code === 'INSUFFICIENT_FUNDS'
        ? { status: 'insufficientFunds', balance: balanceFrom(status.details), ref }
        : { status: 'ruleViolation', code: status.code, ref };
    case 'in_progress':
      return null;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
