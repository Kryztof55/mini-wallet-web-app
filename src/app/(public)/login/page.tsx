import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BfcacheGuard } from '@/components/bfcache-guard';
import { sanitizeReturnTo } from '@/core/return-to';
import { LoginView } from '@/features/auth/login-view';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';
import { t } from '@/lib/i18n/t';
import type { LoginReason } from '@/lib/routes';

export const metadata: Metadata = { title: t('auth.title') };

const REASONS: ReadonlySet<string> = new Set<LoginReason>(['session_ended', 'logged_out']);

/**
 * Server-rendered shell; the steps are client components (TS-01 §7). Users with a session
 * never get here: the proxy sends them on before anything renders (UIR-AUTH-15).
 */
export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reason =
    typeof params.reason === 'string' && REASONS.has(params.reason)
      ? (params.reason as LoginReason)
      : null;
  const returnTo =
    typeof params.returnTo === 'string' ? sanitizeReturnTo(params.returnTo) : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <BfcacheGuard />
      <header className="mx-auto flex w-full max-w-flow flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="font-semibold">Mini Wallet</span>
        <ThemeSwitcher />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-flow flex-1 px-4 py-8 outline-none"
      >
        <div className="rounded-lg border border-border bg-surface-raised p-6 sm:p-8">
          <Suspense>
            <LoginView reason={reason} returnTo={returnTo === '/' ? undefined : returnTo} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
