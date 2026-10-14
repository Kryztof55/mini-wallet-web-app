import { z } from 'zod';
import { domainError } from '@/core/errors';
import { errorResponse, noContent, parseJsonBody, withApi } from '@/server/http';
import { createRateLimiter } from '@/server/http/rate-limit';
import { CLIENT_LOG_EVENTS } from '@/server/logging/events';
import { logEvent } from '@/server/logging/logger';

export const MAX_EVENTS_PER_REQUEST = 10;
export const MAX_EVENT_BYTES = 2048;

const detailValue = z.union([z.string().max(200), z.number(), z.boolean(), z.null()]);
const ClientEventSchema = z.strictObject({
  event: z.enum(CLIENT_LOG_EVENTS),
  level: z.enum(['warn', 'error']),
  requestId: z.uuid().optional(),
  route: z.string().max(200),
  attemptKey: z.string().max(100).optional(),
  details: z.record(z.string().max(50), detailValue).optional(),
  at: z.iso.datetime(),
});
/** Size is checked per raw event before the strict schema, so oversized input answers 413. */
const BodySchema = z.object({ events: z.array(z.unknown()).min(1).max(MAX_EVENTS_PER_REQUEST) });

const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}

/** Receives client-side failures so they can be correlated with server logs (TS-05 §5). */
export const POST = withApi('/api/client-logs', async (request, { requestId }) => {
  const decision = limiter.hit(clientKey(request));
  if (!decision.allowed) {
    return errorResponse(
      domainError('RATE_LIMITED', { retryAfterSec: decision.retryAfterSec }),
      requestId,
    );
  }

  const body = await parseJsonBody(request, BodySchema);
  if (!body.ok) return errorResponse(body.error, requestId);
  if (body.value.events.some((event) => JSON.stringify(event).length > MAX_EVENT_BYTES)) {
    return errorResponse(domainError('PAYLOAD_TOO_LARGE'), requestId);
  }
  const events = body.value.events.map((event) => ClientEventSchema.safeParse(event));
  if (events.some((event) => !event.success)) {
    return errorResponse(domainError('VALIDATION_ERROR', { reason: 'schema' }), requestId);
  }

  for (const parsed of events) {
    if (!parsed.success) continue;
    const { event, level, ...fields } = parsed.data;
    logEvent(level, event, { origin: 'client', failedRequestId: fields.requestId, ...fields });
  }
  return noContent(requestId);
});
