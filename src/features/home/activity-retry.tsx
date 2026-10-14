'use client';

import { useCallback, useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { useAnnounce } from '@/components/ui/live-announcer';
import { t } from '@/lib/i18n/t';
import { ActivityList } from './activity-list';
import { toActivityItemView } from './activity-view';
import { homeApi, type HomeApi } from './api';
import { useSectionRetry } from '@/lib/hooks/use-section-retry';

/** Activity section after a server-side failure: error with reference and its own retry. */
export function ActivityRetry({
  requestId,
  timeZone,
  api = homeApi,
}: {
  readonly requestId: string | null;
  readonly timeZone: string;
  readonly api?: HomeApi;
}) {
  const load = useCallback(() => api.getActivity(), [api]);
  const { state, retry } = useSectionRetry(load, requestId);
  const announce = useAnnounce();

  useEffect(() => {
    if (state.status === 'error' && state.requestId !== requestId) {
      announce(t('home.activity.error'));
    }
  }, [state, requestId, announce]);

  if (state.status === 'ready') {
    const now = new Date();
    return (
      <ActivityList
        items={state.data.items.map((item) => toActivityItemView(item, now, timeZone))}
      />
    );
  }
  return (
    <ErrorState
      title={t('home.activity.error')}
      onRetry={() => void retry()}
      retrying={state.status === 'loading'}
      requestId={state.requestId}
      headingLevel={3}
    />
  );
}
