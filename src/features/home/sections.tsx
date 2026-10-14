import { headers } from 'next/headers';
import { BalanceCard } from '@/components/wallet/balance-card';
import type { UserId } from '@/core/ids';
import { t } from '@/lib/i18n/t';
import { REQUEST_ID_HEADER } from '@/lib/observability/request-id';
import { ActivityList } from './activity-list';
import { ActivityRetry } from './activity-retry';
import { toActivityItemView } from './activity-view';
import { BalanceRetry } from './balance-retry';
import { loadActivity, loadSummary } from './data';

async function pageRequestId(): Promise<string | null> {
  return (await headers()).get(REQUEST_ID_HEADER);
}

/** "Hola, Ana"; falls back to "Hola" when the summary is unavailable (FS-02 EC-06). */
export async function Greeting({ userId }: { readonly userId: UserId }) {
  const summary = await loadSummary(userId);
  const firstName = summary.ok ? summary.value.firstName : null;
  return <>{firstName ? t('home.greeting', { firstName }) : t('home.greeting.anonymous')}</>;
}

/**
 * Server-rendered sections (TS-02 §7): expected failures are caught and rendered as a
 * section error with its own retry, so one failure never blanks the page (UIR-HOME-01).
 */
export async function BalanceSection({ userId }: { readonly userId: UserId }) {
  const summary = await loadSummary(userId);
  if (!summary.ok) return <BalanceRetry requestId={await pageRequestId()} />;
  return <BalanceCard balance={summary.value.balance} />;
}

export async function ActivitySection({
  userId,
  timeZone,
  highlightId,
}: {
  readonly userId: UserId;
  readonly timeZone: string;
  readonly highlightId: string | null;
}) {
  const activity = await loadActivity(userId);
  if (!activity.ok) {
    return <ActivityRetry requestId={await pageRequestId()} timeZone={timeZone} />;
  }
  const now = new Date();
  const items = activity.value.map((item) => toActivityItemView(item, now, timeZone));
  return <ActivityList items={items} highlightId={highlightId} />;
}
