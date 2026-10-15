'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui/error-state';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { BalanceCard } from '@/features/home/components/balance-card';
import { t } from '@/shared/lib/i18n/t';
import { homeApi, type HomeApi } from '@/shared/api/account';
import { useSectionRetry } from '@/shared/hooks/use-section-retry';

/** Balance section after a server-side failure: error with reference and its own retry. */
export function BalanceRetry({
  requestId,
  api = homeApi,
}: {
  readonly requestId: string | null;
  readonly api?: HomeApi;
}) {
  const { state, retry } = useSectionRetry(api.getSummary, requestId);
  const announce = useAnnounce();

  useEffect(() => {
    if (state.status === 'error' && state.requestId !== requestId)
      announce(t('home.balance.error'));
  }, [state, requestId, announce]);

  if (state.status === 'ready') return <BalanceCard balance={state.data.balance} />;
  return (
    <ErrorState
      title={t('home.balance.error')}
      onRetry={() => void retry()}
      retrying={state.status === 'loading'}
      requestId={state.requestId}
      headingLevel={3}
    />
  );
}
