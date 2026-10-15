import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { LiveAnnouncerProvider } from '@/shared/ui/live-announcer';
import { ToastProvider } from '@/shared/ui/toast';
import { ThemeProvider } from '@/shared/components/theme';
import { t } from '@/shared/lib/i18n/t';
import { resolveThemePreference, THEME_COOKIE } from '@/shared/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Mini Wallet', template: '%s · Mini Wallet' },
  description: 'Mini Wallet — envía dinero de forma simple y segura.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#13152b' },
  ],
};

/**
 * Reads the theme cookie on the server so `<html data-theme>` is right on first paint with
 * no blocking script (ADR-007). The skip link targets each view's `<main id="main">`.
 */
export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const theme = resolveThemePreference((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="es-MX" data-theme={theme}>
      <body>
        <a href="#main" className="skip-link">
          {t('common.skip_to_content')}
        </a>
        <ThemeProvider initialTheme={theme}>
          <LiveAnnouncerProvider>
            <ToastProvider>{children}</ToastProvider>
          </LiveAnnouncerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
