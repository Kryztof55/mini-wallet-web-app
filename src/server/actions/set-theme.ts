'use server';

import 'server-only';
import { cookies, headers } from 'next/headers';
import type { ErrorCode } from '@/core/errors';
import { getConfig } from '@/shared/lib/config';
import { ensureRequestId, REQUEST_ID_HEADER } from '@/shared/lib/observability/request-id';
import type { ThemePreference } from '@/shared/lib/theme';
import { runWithRequestContext } from '@/server/logging/context';
import { logEvent } from '@/server/logging/logger';
import { setThemePreference } from '@/server/services/preferences.service';

export type SetThemeResult =
  | { readonly ok: true; readonly theme: ThemePreference }
  | { readonly ok: false; readonly code: ErrorCode };

/**
 * The only Server Action in the app (ADR-002 exception): low risk, no timeout or idempotency
 * needs. Next.js checks the Origin of Server Action requests; the value is still validated
 * because the action is a public POST endpoint.
 */
export async function setThemeAction(value: unknown): Promise<SetThemeResult> {
  const requestId = ensureRequestId((await headers()).get(REQUEST_ID_HEADER));
  const cookieStore = await cookies();
  return runWithRequestContext({ requestId }, () => {
    const secure = getConfig().appOrigin.startsWith('https://');
    const result = setThemePreference(cookieStore, value, { secure });
    if (!result.ok) {
      logEvent('warn', 'prefs.theme.rejected', { errorCode: result.error.code });
      return { ok: false, code: result.error.code };
    }
    logEvent('info', 'prefs.theme.changed', { theme: result.value });
    return { ok: true, theme: result.value };
  });
}
