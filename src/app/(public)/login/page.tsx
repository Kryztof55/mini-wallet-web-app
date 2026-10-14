import type { Metadata } from 'next';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';
import { t } from '@/lib/i18n/t';

export const metadata: Metadata = { title: t('auth.title') };

// Placeholder so the session gate has somewhere to land; the login flow is built in TASK-11.
export default function LoginPage() {
  return (
    <>
      <header className="mx-auto flex max-w-flow flex-wrap items-center justify-end gap-3 px-4 py-3">
        <ThemeSwitcher />
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-flow px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('auth.title')}</h1>
      </main>
    </>
  );
}
