import { vi } from 'vitest';
import type { ErrorDetails } from '@/core/errors';
import { err, ok } from '@/core/result';
import type { ClientErrorCode } from '@/shared/lib/http/client';
import type { AuthApi, CodeIssued } from '@/shared/api/auth';

export const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

export const issued = (overrides: Partial<CodeIssued> = {}) =>
  ok({
    data: {
      destination: '•••• 5678',
      expiresInSec: 300,
      resendAvailableInSec: 30,
      demoCode: '482915',
      ...overrides,
    },
    status: 202,
    requestId: REQUEST_ID,
  });

export const failure = (
  code: ClientErrorCode,
  details?: ErrorDetails,
  status: number | null = 422,
) => err({ code, status, requestId: REQUEST_ID, ...(details ? { details } : {}) });

export const verified = (redirectTo = '/') =>
  ok({ data: { firstName: 'Ana', redirectTo }, status: 200, requestId: REQUEST_ID });

export function fakeAuthApi(overrides: Partial<Record<keyof AuthApi, unknown>> = {}) {
  return {
    requestCode: vi.fn().mockResolvedValue(issued()),
    verify: vi.fn().mockResolvedValue(verified()),
    logout: vi.fn().mockResolvedValue(ok({ data: null, status: 204, requestId: REQUEST_ID })),
    ...overrides,
  } as unknown as AuthApi & {
    requestCode: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
}
