import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemePreference } from '@/shared/lib/theme';
import { getA11yViolations } from '@/test/axe';
import { ThemeProvider } from './theme-provider';
import { ThemeSwitcher } from './theme-switcher';

vi.mock('@/server/actions/set-theme', () => ({ setThemeAction: vi.fn() }));

function setup(initialTheme: ThemePreference = 'system') {
  const persist = vi.fn().mockResolvedValue({ ok: true, theme: initialTheme });
  const utils = render(
    <ThemeProvider initialTheme={initialTheme} persist={persist}>
      <button type="button">antes</button>
      <ThemeSwitcher />
    </ThemeProvider>,
  );
  return { ...utils, persist };
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('[TC-COMP-02][A11Y-26][UIR-AUTH-18] ThemeSwitcher', () => {
  it('has an accessible name and exposes the current value', () => {
    setup('dark');
    const group = screen.getByRole('radiogroup', { name: 'Tema' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Claro' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sistema' })).not.toBeChecked();
  });

  it('changes the theme on click and keeps focus on the control', async () => {
    const { persist } = setup('system');
    const dark = screen.getByRole('radio', { name: 'Oscuro' });

    await userEvent.click(dark);

    expect(dark).toBeChecked();
    expect(dark).toHaveFocus();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(persist).toHaveBeenCalledWith('dark');
  });

  it('is keyboard operable: one tab stop on the current value, arrows move and select', async () => {
    const user = userEvent.setup();
    setup('light');
    screen.getByRole('button', { name: 'antes' }).focus();

    await user.tab();
    const light = screen.getByRole('radio', { name: 'Claro' });
    expect(light).toHaveFocus();

    // Radix selects on focus while an arrow key is held; roving focus moves on the next
    // tick, so the key is held until focus lands (as in a real browser).
    const pressArrow = async (key: 'ArrowRight' | 'ArrowLeft', target: HTMLElement) => {
      await user.keyboard(`{${key}>}`);
      await waitFor(() => expect(target).toHaveFocus());
      await user.keyboard(`{/${key}}`);
    };

    const dark = screen.getByRole('radio', { name: 'Oscuro' });
    await pressArrow('ArrowRight', dark);
    expect(dark).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('dark');

    const system = screen.getByRole('radio', { name: 'Sistema' });
    await pressArrow('ArrowRight', system);
    expect(system).toBeChecked();

    await pressArrow('ArrowLeft', dark);
    expect(dark).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
