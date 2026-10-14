import { domainError } from '@/core/errors';
import { getConfig } from '@/lib/config';
import { errorResponse, noContent, withApi } from '@/server/http';
import { logEvent } from '@/server/logging/logger';
import { resetMockDb } from '@/server/mock/db';

/**
 * Restores seed data before each E2E test (test plan §3). Exists only when mock controls are
 * enabled; otherwise it answers 404 as if the route did not exist (TC-INT-12).
 */
export const POST = withApi('/api/mock/reset', async (_request, { requestId }) => {
  if (!getConfig().mockControlsEnabled) return errorResponse(domainError('NOT_FOUND'), requestId);
  resetMockDb();
  logEvent('info', 'mock.reset');
  return noContent(requestId);
});
