import 'server-only';
import type { z } from 'zod';
import { domainError, type DomainError } from '@/core/common';
import { err, ok, type Result } from '@/core/common';

/**
 * Shape validation at the boundary (ADR-009). A malformed body is a 400 VALIDATION_ERROR;
 * business rules are checked afterwards by the service and answer 422 with their own code.
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Result<z.infer<S>, DomainError<'VALIDATION_ERROR' | 'UNSUPPORTED_MEDIA_TYPE'>>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return err(domainError('UNSUPPORTED_MEDIA_TYPE'));
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return err(domainError('VALIDATION_ERROR', { reason: 'invalid_json' }));
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') || null;
    return err(domainError('VALIDATION_ERROR', { reason: 'schema', field }));
  }
  return ok(parsed.data);
}
