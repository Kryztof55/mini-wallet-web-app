'use client';

import { useCallback, useEffect } from 'react';
import { ErrorState } from '@/shared/ui/error-state';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { t } from '@/shared/lib/i18n/t';
import { ActivityList } from '@/features/home/components/activity-list';
import { toActivityItemView } from '@/features/home/activity-view';
import { homeApi, type HomeApi } from '@/shared/api/account';
import { useSectionRetry } from '@/shared/hooks/use-section-retry';

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
