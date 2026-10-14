'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { useAnnounce } from '@/components/ui/live-announcer';
import { BalanceCard } from '@/components/wallet/balance-card';
import { t } from '@/lib/i18n/t';
import { homeApi, type HomeApi } from './api';
import { useSectionRetry } from '@/lib/hooks/use-section-retry';

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
