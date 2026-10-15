'use client';

import { useCallback, useRef, useState } from 'react';
import type { Result } from '@/core/result';
import type { ClientError, ClientSuccess } from '@/shared/lib/http/client';

export type SectionState<T> =
  | { readonly status: 'error'; readonly requestId: string | null }
  | { readonly status: 'loading'; readonly requestId: string | null }
  | { readonly status: 'ready'; readonly data: T };

/**
 * A section that failed on the server can be retried on its own (UIR-HOME-12): only its
 * endpoint is called, and the rest of the page is untouched (AC-HOME-06).
 */
export function useSectionRetry<T>(
  load: () => Promise<Result<ClientSuccess<T>, ClientError>>,
  initialRequestId: string | null,
): { readonly state: SectionState<T>; readonly retry: () => Promise<void> } {
  const [state, setState] = useState<SectionState<T>>({
    status: 'error',
    requestId: initialRequestId,
  });
  const inFlight = useRef(false);

  const retry = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((current) => ({
      status: 'loading',
      requestId: current.status === 'ready' ? null : current.requestId,
    }));
    const result = await load();
    inFlight.current = false;
    setState(
      result.ok
        ? { status: 'ready', data: result.value.data }
        : { status: 'error', requestId: result.error.requestId },
    );
  }, [load]);

  return { state, retry };
}
