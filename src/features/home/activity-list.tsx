'use client';

import { useEffect } from 'react';
import { buttonClasses } from '@/components/ui/button-classes';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionItem } from '@/components/wallet/transaction-item';
import { StartTransferLink } from '@/features/transfer/start-transfer-link';
import { t } from '@/lib/i18n/t';
import type { ActivityItemView } from './activity-view';
import { HIGHLIGHT_PARAM } from './constants';

/**
 * Recent activity (UIR-HOME-06…11). `highlightId` marks a just-completed transfer; the URL
 * parameter is dropped after the first render so a reload doesn't highlight it again.
 */
export function ActivityList({
  items,
  highlightId = null,
}: {
  readonly items: readonly ActivityItemView[];
  readonly highlightId?: string | null;
}) {
  useEffect(() => {
    if (!highlightId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(HIGHLIGHT_PARAM);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }, [highlightId]);

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('home.activity.empty.title')}
        description={t('home.activity.empty.body')}
        headingLevel={3}
        action={
          <StartTransferLink
            href="/transfer/recipient"
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            {t('home.send')}
          </StartTransferLink>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <TransactionItem key={item.id} item={item} highlighted={item.id === highlightId} />
      ))}
    </ul>
  );
}
