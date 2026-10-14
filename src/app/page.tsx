import { ThemeSwitcher } from '@/features/theme/theme-switcher';

// Temporary landing page until Home is built in TASK-13 under the (private) route group.
export default function Page() {
  return (
    <>
      <header className="mx-auto flex max-w-home flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="font-semibold">Mini Wallet</span>
        <ThemeSwitcher />
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-home px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Mini Wallet</h1>
      </main>
    </>
  );
}
