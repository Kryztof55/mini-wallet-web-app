import { z } from 'zod';
import { request, type HttpRequest } from '@/lib/http/client';

const MoneySchema = z.object({ amountMinor: z.number().int(), currency: z.literal('MXN') });

export const ReceiptSchema = z.object({
  transferId: z.string(),
  folio: z.string(),
  amount: MoneySchema,
  recipient: z.object({ name: z.string(), maskedIdentifier: z.string() }),
  concept: z.string().nullable(),
  completedAt: z.string(),
  balanceAfter: MoneySchema,
});
export type ReceiptView = z.infer<typeof ReceiptSchema>;

/** 201 → receipt; 202 → the same key is still being processed (TS-04 §5). */
const ConfirmResponseSchema = z.union([
  ReceiptSchema,
  z.object({ status: z.literal('in_progress') }),
]);

export const AttemptStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('in_progress') }),
  z.object({ status: z.literal('completed'), receipt: ReceiptSchema }),
  z.object({
    status: z.literal('failed'),
    code: z.string(),
    details: z.record(z.string(), z.unknown()).nullable(),
  }),
  z.object({ status: z.literal('not_processed') }),
]);
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;

export type TransferBody = {
  readonly recipient:
    { readonly contactId: string } | { readonly name: string; readonly identifier: string };
  readonly amount: { readonly amountMinor: number; readonly currency: 'MXN' };
  readonly concept: string | null;
};

/** Status checks have their own, shorter timeout (TS-04 §8). */
export const STATUS_CHECK_TIMEOUT_MS = 5000;

export function createTransfersApi(send: HttpRequest = request) {
  return {
    confirm: (
      body: TransferBody,
      attemptKey: string,
      options: { readonly timeoutMs: number; readonly signal: AbortSignal },
    ) =>
      send('POST', '/api/transfers', {
        body,
        idempotencyKey: attemptKey,
        schema: ConfirmResponseSchema,
        timeoutMs: options.timeoutMs,
        signal: options.signal,
      }),
    status: (
      attemptKey: string,
      options: { readonly requestId: string; readonly signal: AbortSignal },
    ) =>
      send('GET', `/api/transfers/attempts/${encodeURIComponent(attemptKey)}`, {
        schema: AttemptStatusSchema,
        timeoutMs: STATUS_CHECK_TIMEOUT_MS,
        // Same correlation ID as the attempt, so support sees one story (TS-05).
        requestId: options.requestId,
        signal: options.signal,
      }),
  };
}

export type TransfersApi = ReturnType<typeof createTransfersApi>;
export const transfersApi = createTransfersApi();
