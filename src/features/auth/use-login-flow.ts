'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import { maskIdentifier, parseIdentifier } from '@/core/identifier';
import type { ClientError } from '@/lib/http/client';
import { authApi as defaultApi, type AuthApi } from './api';
import { initialLoginState, loginReducer, type LoginState, type StepError } from './login-state';

export type LoginFlowOptions = {
  readonly api?: AuthApi;
  readonly now?: () => number;
  /** Sanitized again by the server; forwarded so the user lands where they were going. */
  readonly returnTo?: string | undefined;
  /** Defaults to the browser's IANA time zone (stored in the session for date display). */
  readonly timeZone?: string | undefined;
  readonly onSuccess: (redirectTo: string) => void;
};

export type LoginFlow = {
  readonly state: LoginState;
  readonly requestCode: (identifier: string) => Promise<void>;
  readonly verify: (code: string) => Promise<void>;
  readonly resend: () => Promise<void>;
  readonly changeIdentifier: () => void;
  readonly retry: () => Promise<void>;
};

function stepError(error: ClientError): StepError {
  const kind =
    error.code === 'NETWORK_ERROR' ? 'network' : error.code === 'TIMEOUT' ? 'timeout' : 'service';
  return { kind, requestId: error.requestId };
}

/**
 * Drives the login (FS-01): performs the requests, maps every server outcome to a state
 * transition and blocks double submissions with a ref, so two quick presses send one request
 * even before React re-renders (UIR-AUTH-04, AC-AUTH-05).
 */
export function useLoginFlow({
  api = defaultApi,
  now = Date.now,
  returnTo,
  timeZone,
  onSuccess,
}: LoginFlowOptions): LoginFlow {
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);
  // The identifier the current code was requested for; read by verify and resend.
  const identifierRef = useRef('');
  const busy = useRef(false);
  const done = useRef(false);
  const lastAttempt = useRef<(() => Promise<void>) | null>(null);

  const exclusive = useCallback(async (task: () => Promise<void>) => {
    if (busy.current || done.current) return;
    busy.current = true;
    lastAttempt.current = task;
    try {
      await task();
    } finally {
      busy.current = false;
    }
  }, []);

  const issue = useCallback(
    (identifier: string, resend: boolean) =>
      exclusive(async () => {
        if (!resend) identifierRef.current = identifier;
        dispatch(resend ? { type: 'RESEND_REQUESTED' } : { type: 'CODE_REQUESTED', identifier });
        const result = await api.requestCode(identifier);
        if (result.ok) {
          const { destination, demoCode, resendAvailableInSec } = result.value.data;
          dispatch({
            type: 'CODE_ISSUED',
            destination,
            demoCode: demoCode ?? null,
            resendAt: now() + resendAvailableInSec * 1000,
          });
          return;
        }
        const error = result.error;
        if (error.code === 'INVALID_IDENTIFIER') {
          dispatch({ type: 'IDENTIFIER_REJECTED' });
        } else if (error.code === 'CODE_THROTTLED') {
          const retryAfterSec = Number(error.details?.retryAfterSec ?? 0);
          const resendAt = now() + retryAfterSec * 1000;
          const parsed = parseIdentifier(identifier);
          if (!resend && parsed.ok) {
            dispatch({
              type: 'CODE_ALREADY_SENT',
              destination: maskIdentifier(parsed.value),
              resendAt,
            });
          } else {
            dispatch({ type: 'RESEND_THROTTLED', resendAt });
          }
        } else {
          dispatch({ type: 'REQUEST_FAILED', error: stepError(error) });
        }
      }),
    [api, exclusive, now],
  );

  const requestCode = useCallback((identifier: string) => issue(identifier, false), [issue]);
  const resend = useCallback(() => issue(identifierRef.current, true), [issue]);

  const verify = useCallback(
    (code: string) =>
      exclusive(async () => {
        dispatch({ type: 'VERIFY_REQUESTED' });
        const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const result = await api.verify({
          identifier: identifierRef.current,
          code,
          ...(zone ? { timeZone: zone } : {}),
          ...(returnTo ? { returnTo } : {}),
        });
        if (result.ok) {
          done.current = true;
          dispatch({ type: 'VERIFIED', redirectTo: result.value.data.redirectTo });
          onSuccess(result.value.data.redirectTo);
          return;
        }
        const error = result.error;
        switch (error.code) {
          case 'INVALID_CODE_FORMAT':
            dispatch({ type: 'CODE_REJECTED', error: 'format' });
            break;
          case 'CODE_INCORRECT':
            dispatch({
              type: 'CODE_INCORRECT',
              attemptsLeft: Number(error.details?.attemptsLeft ?? 0),
            });
            break;
          case 'CODE_LOCKED':
            dispatch({ type: 'CODE_BLOCKED', reason: 'locked', now: now() });
            break;
          case 'CODE_EXPIRED':
            dispatch({ type: 'CODE_BLOCKED', reason: 'expired', now: now() });
            break;
          case 'INVALID_IDENTIFIER':
            dispatch({ type: 'IDENTIFIER_REJECTED' });
            break;
          default:
            dispatch({ type: 'REQUEST_FAILED', error: stepError(error) });
        }
      }),
    [api, exclusive, now, onSuccess, returnTo, timeZone],
  );

  const changeIdentifier = useCallback(() => {
    if (!busy.current) dispatch({ type: 'CHANGE_IDENTIFIER' });
  }, []);

  const retry = useCallback(async () => {
    const task = lastAttempt.current;
    if (task) await exclusive(task);
  }, [exclusive]);

  return useMemo(
    () => ({ state, requestCode, verify, resend, changeIdentifier, retry }),
    [state, requestCode, verify, resend, changeIdentifier, retry],
  );
}
