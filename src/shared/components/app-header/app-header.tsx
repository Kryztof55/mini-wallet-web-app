import { LogoutButton } from './logout-button';
import { ThemeSwitcher } from '@/shared/components/theme';

/** Header actions on every private screen (UIR-HOME-13): theme and immediate logout. */
export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-home flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="font-semibold">Mini Wallet</span>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
