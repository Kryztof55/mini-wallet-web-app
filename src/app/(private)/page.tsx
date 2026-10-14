import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/features/home/home-header';
import { HIDE_BALANCE_COOKIE, HIGHLIGHT_PARAM } from '@/features/home/constants';
import { HideBalanceProvider } from '@/features/home/hide-balance';
import { ActivitySection, BalanceSection, Greeting } from '@/features/home/sections';
import { SendMoneyAction } from '@/features/home/send-money-action';
import { ActivitySkeleton, BalanceSkeleton } from '@/features/home/skeletons';
import { t } from '@/lib/i18n/t';
import { loginUrl } from '@/lib/routes';
import { getSession } from '@/server/session/session';

export const metadata: Metadata = { title: t('home.title') };

/**
 * Home (FS-02, TS-02 §7): the shell renders at once; balance and activity stream in their own
 * Suspense boundaries and fail independently. Dynamic and never cached (UIR-HOME-10).
 */
export default async function HomePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect(loginUrl({ reason: 'session_ended' }));
  const params = await searchParams;
  const highlight = typeof params[HIGHLIGHT_PARAM] === 'string' ? params[HIGHLIGHT_PARAM] : null;
  const hidden = (await cookies()).get(HIDE_BALANCE_COOKIE)?.value === '1';

  return (
    <HideBalanceProvider initialHidden={hidden}>
      <AppHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-home flex-col gap-6 px-4 pt-6 pb-28 outline-none md:pb-10"
      >
        <h1 className="text-2xl font-bold tracking-tight">
          <Suspense fallback={t('home.greeting.anonymous')}>
            <Greeting userId={session.userId} />
          </Suspense>
        </h1>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Card as="section" aria-labelledby="balance-title" className="flex flex-col gap-3">
            <h2 id="balance-title" className="text-sm font-medium text-text-secondary">
              {t('home.balance.label')}
            </h2>
            <Suspense fallback={<BalanceSkeleton />}>
              <BalanceSection userId={session.userId} />
            </Suspense>
          </Card>
          <SendMoneyAction />
        </div>

        <Card as="section" aria-labelledby="activity-title" className="flex flex-col gap-2">
          <h2 id="activity-title" className="text-lg font-semibold">
            {t('home.activity.title')}
          </h2>
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection
              userId={session.userId}
              timeZone={session.timeZone}
              highlightId={highlight}
            />
          </Suspense>
        </Card>
      </main>
    </HideBalanceProvider>
  );
}
