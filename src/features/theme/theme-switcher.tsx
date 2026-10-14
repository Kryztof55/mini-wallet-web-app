'use client';

import * as RadioGroup from '@radix-ui/react-radio-group';
import { t } from '@/lib/i18n/t';
import { isThemePreference, THEME_PREFERENCES } from '@/lib/theme';
import { THEME_ICONS } from './theme-icons';
import { useTheme } from './theme-provider';

/**
 * Light / dark / system control, available on every screen (UX-22, UIR-AUTH-18).
 * A radio group: one tab stop, arrows move and select, the current value is exposed as
 * `aria-checked`, and changing it never moves focus or reloads the view (A11Y-26).
 */
export function ThemeSwitcher({ className = '' }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroup.Root
      aria-label={t('theme.label')}
      value={theme}
      onValueChange={(value) => {
        if (isThemePreference(value)) setTheme(value);
      }}
      orientation="horizontal"
      loop
      className={`inline-flex gap-0.5 rounded-full border border-border bg-surface-sunken p-0.5 ${className}`}
    >
      {THEME_PREFERENCES.map((preference) => {
        const Icon = THEME_ICONS[preference];
        return (
          <RadioGroup.Item
            key={preference}
            value={preference}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-text-secondary transition-colors hover:text-text-primary data-[state=checked]:bg-surface-raised data-[state=checked]:font-semibold data-[state=checked]:text-text-primary data-[state=checked]:shadow-sm data-[state=checked]:ring-1 data-[state=checked]:ring-border-strong forced-colors:data-[state=checked]:outline forced-colors:data-[state=checked]:outline-1"
          >
            <Icon />
            <span>{t(`theme.${preference}`)}</span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
