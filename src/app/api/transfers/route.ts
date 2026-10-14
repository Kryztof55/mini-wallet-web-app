import { z } from 'zod';
import { domainError } from '@/core/errors';
import type { AttemptKey } from '@/core/ids';
import { getConfig } from '@/lib/config';
import { IDEMPOTENCY_KEY_HEADER } from '@/lib/http/client';
import { errorResponse, jsonOk, parseJsonBody, withApi } from '@/server/http';
import { withSession } from '@/server/http/with-session';
import { logForcedOutcome, readForcedOutcome } from '@/server/mock/controls';
import { TRANSFER_OUTCOMES } from '@/server/mock/outcome-simulator';
import { getTransfersService } from '@/server/services/transfers.service';

const ROUTE = '/api/transfers';

/**
 * Shape only: amount, recipient and concept rules are the domain's (BR-06), so an invalid value
 * gets its specific 422 code, not a generic 400.
 */
const Body = z.strictObject({
  recipient: z.union([
    z.strictObject({ contactId: z.string().max(100) }),
    z.strictObject({ name: z.string().max(200), identifier: z.string().max(254) }),
  ]),
  amount: z.strictObject({ amountMinor: z.number(), currency: z.string().max(3) }),
  concept: z.string().max(400).nullable().optional(),
});

const KeySchema = z.uuid();

/** Submits a transfer attempt (TS-04 §5): 201 receipt, 202 in progress, 409/422/503/500. */
export const POST = withApi(
  ROUTE,
  withSession(async (request, { requestId, session }) => {
    const forced = readForcedOutcome(
      request.headers,
      TRANSFER_OUTCOMES,
      getConfig().mockControlsEnabled,
    );
    logForcedOutcome(forced, ROUTE);

    const key = KeySchema.safeParse(request.headers.get(IDEMPOTENCY_KEY_HEADER));
    if (!key.success) {
      return errorResponse(
        domainError('VALIDATION_ERROR', { reason: 'header', field: IDEMPOTENCY_KEY_HEADER }),
        requestId,
      );
    }
    const body = await parseJsonBody(request, Body);
    if (!body.ok) return errorResponse(body.error, requestId);

    const result = await getTransfersService().confirm(
      session.userId,
      key.data as AttemptKey,
      body.value,
      forced.value,
    );
    switch (result.kind) {
      case 'completed':
        return jsonOk(result.receipt, requestId, 201);
      case 'in_progress':
        return jsonOk({ status: 'in_progress' }, requestId, 202);
      case 'error':
        return errorResponse(result.error, requestId);
      default: {
        const exhaustive: never = result;
        return exhaustive;
      }
    }
  }),
);
