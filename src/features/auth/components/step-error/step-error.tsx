import { ErrorState } from '@/shared/ui/error-state';
import { t } from '@/shared/lib/i18n/t';
import type { StepError } from '@/features/auth/state/login-state';

const TITLES = {
  service: 'auth.error.service',
  network: 'auth.error.network',
  timeout: 'auth.error.timeout',
} as const;

/** Recoverable request error with retry and reference code (AC-AUTH-16, EC-12). */
export function StepErrorMessage({
  error,
  retrying,
  onRetry,
}: {
  readonly error: StepError;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}) {
  return (
    <ErrorState
      title={t(TITLES[error.kind])}
      onRetry={onRetry}
      retrying={retrying}
      requestId={error.requestId}
      headingLevel={2}
    />
  );
}
