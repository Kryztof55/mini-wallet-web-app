'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { t } from '@/shared/lib/i18n/t';
import type { LoginReason } from '@/shared/lib/routes';
import type { AuthApi } from '@/shared/api/auth';
import { CodeStep } from '@/features/auth/components/code-step';
import { IdentifierStep } from '@/features/auth/components/identifier-step';
import { SessionNotice } from '@/features/auth/components/session-notice';
import { StepErrorMessage } from '@/features/auth/components/step-error';
import { useLoginFlow } from '@/features/auth/hooks/use-login-flow';

const STEP_PARAM = 'step';

function urlWithStep(step: 'code' | null): string {
  const url = new URL(window.location.href);
  if (step) url.searchParams.set(STEP_PARAM, step);
  else url.searchParams.delete(STEP_PARAM);
  return `${url.pathname}${url.search}`;
}

/**
 * Login screen (FS-01). The code step is mirrored in the URL (`?step=code`) so the browser's
 * Back button returns to step 1 with the identifier kept (UIR-AUTH-13, EC-07); a reload on
 * step 2 starts again at step 1 (EC-08).
 */
/**
 * After login: a full navigation that replaces the current entry. The private page then
 * starts from a fresh document with the new cookie, and going Back reaches the Login entry
 * as a new request, which the proxy redirects away (UIR-AUTH-14, AC-AUTH-06). A client-side
 * `router.replace` left the Login entry in the router cache, so Back showed the form again.
 */
function navigateAway(url: string): void {
  window.location.replace(url);
}

export function LoginView({
  reason,
  returnTo,
  api,
  navigate = navigateAway,
}: {
  readonly reason: LoginReason | null;
  readonly returnTo: string | undefined;
  readonly api?: AuthApi;
  readonly navigate?: (url: string) => void;
}) {
  const searchParams = useSearchParams();
  const announce = useAnnounce();
  const identifierRef = useRef<HTMLInputElement>(null);
  const returningToStep1 = useRef(false);

  const onSuccess = useCallback((redirectTo: string) => navigate(redirectTo), [navigate]);
  const flow = useLoginFlow({
    ...(api ? { api } : {}),
    returnTo,
    onSuccess,
  });
  const { state } = flow;
  const urlStep = searchParams.get(STEP_PARAM);

  // Reload on ?step=code: there is no challenge in memory, so drop the param (EC-08).
  useEffect(() => {
    if (urlStep === 'code' && state.step === 'identifier') {
      window.history.replaceState(null, '', urlWithStep(null));
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entering the code step adds a history entry; leaving it through Back returns to step 1.
  const { step, changeIdentifier } = { step: state.step, changeIdentifier: flow.changeIdentifier };
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === 'identifier' && step === 'code') {
      window.history.pushState(null, '', urlWithStep('code'));
    }
    previousStep.current = step;
  }, [step]);

  // The URL catches up with pushState on a later render, so Back is only recognised after the
  // code step has been seen in the URL.
  const sawCodeInUrl = useRef(false);
  useEffect(() => {
    if (step !== 'code') {
      sawCodeInUrl.current = false;
    } else if (urlStep === 'code') {
      sawCodeInUrl.current = true;
    } else if (sawCodeInUrl.current) {
      sawCodeInUrl.current = false;
      returningToStep1.current = true;
      changeIdentifier();
    }
  }, [urlStep, step, changeIdentifier]);

  // Back on step 1: focus the pre-filled identifier (UIR-AUTH-13).
  useEffect(() => {
    if (step === 'identifier' && returningToStep1.current) {
      returningToStep1.current = false;
      identifierRef.current?.focus();
    }
  }, [step]);

  // Status messages without moving focus (A11Y-08).
  useEffect(() => {
    if (state.notice === 'code_resent') announce(t('auth.resend.sent'));
    if (state.notice === 'already_sent') announce(t('auth.code.already_sent'));
  }, [state.notice, state.codeVersion, announce]);

  useEffect(() => {
    if (state.stepError) announce(t(`auth.error.${state.stepError.kind}`), 'assertive');
  }, [state.stepError, announce]);

  const stepError = state.stepError ? (
    <StepErrorMessage
      error={state.stepError}
      retrying={state.pending !== null}
      onRetry={() => void flow.retry()}
    />
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      <SessionNotice reason={reason} />
      {state.step === 'identifier' ? (
        <IdentifierStep
          defaultValue={state.identifier}
          busy={state.pending === 'code'}
          serverError={state.identifierError}
          onSubmit={(identifier) => void flow.requestCode(identifier)}
          inputRef={identifierRef}
        >
          {stepError}
        </IdentifierStep>
      ) : (
        <CodeStep
          key={state.codeVersion}
          destination={state.destination}
          demo={state.demo}
          codeStatus={state.codeStatus}
          codeError={state.codeError}
          attemptsLeft={state.attemptsLeft}
          resendAt={state.resendAt}
          notice={state.notice}
          verifying={state.pending === 'verify'}
          resending={state.pending === 'resend'}
          onVerify={(code) => void flow.verify(code)}
          onResend={() => void flow.resend()}
          onChangeIdentifier={() => window.history.back()}
        >
          {stepError}
        </CodeStep>
      )}
    </div>
  );
}
