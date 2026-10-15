import { z } from 'zod';
import type { Result } from '@/core/common';
import {
  request,
  type ClientError,
  type ClientSuccess,
  type HttpRequest,
} from '@/shared/lib/http/client';

/** Response contracts of TS-01 §5, validated at the boundary (ADR-009). */
export const CodeIssuedSchema = z.object({
  destination: z.string(),
  expiresInSec: z.number(),
  resendAvailableInSec: z.number(),
  demoCode: z.string().optional(),
});
export type CodeIssued = z.infer<typeof CodeIssuedSchema>;

export const VerifiedSchema = z.object({ firstName: z.string(), redirectTo: z.string() });
export type Verified = z.infer<typeof VerifiedSchema>;

export type VerifyRequest = {
  readonly identifier: string;
  readonly code: string;
  readonly timeZone?: string;
  readonly returnTo?: string;
};

type Call<T> = Promise<Result<ClientSuccess<T>, ClientError>>;

export type AuthApi = {
  readonly requestCode: (identifier: string) => Call<CodeIssued>;
  readonly verify: (body: VerifyRequest) => Call<Verified>;
  readonly logout: () => Call<null>;
};

const LOGIN_TIMEOUT_MS = 10_000;

export function createAuthApi(send: HttpRequest = request): AuthApi {
  return {
    requestCode: (identifier) =>
      send('POST', '/api/auth/code', {
        body: { identifier },
        schema: CodeIssuedSchema,
        timeoutMs: LOGIN_TIMEOUT_MS,
      }),
    verify: (body) =>
      send('POST', '/api/auth/verify', {
        body,
        schema: VerifiedSchema,
        timeoutMs: LOGIN_TIMEOUT_MS,
      }),
    logout: () => send('POST', '/api/auth/logout', { body: {}, timeoutMs: LOGIN_TIMEOUT_MS }),
  };
}

export const authApi = createAuthApi();
