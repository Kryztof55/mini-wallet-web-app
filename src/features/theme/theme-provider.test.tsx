import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemePreference } from '@/lib/theme';
import { ThemeProvider, useTheme } from './theme-provider';

vi.mock('@/server/actions/set-theme', () => ({ setThemeAction: vi.fn() }));

function Probe({ next }: { readonly next: ThemePreference }) {
  const { theme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(next)}>
      current:{theme}
    </button>
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('[TC-PL-09][UX-22] theme state', () => {
  it('applies the selection to <html data-theme> immediately and persists it', async () => {
    const persist = vi.fn().mockResolvedValue({ ok: true, theme: 'dark' });
    render(
      <ThemeProvider initialTheme="system" persist={persist}>
        <Probe next="dark" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('current:system');

    await userEvent.click(screen.getByRole('button'));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button')).toHaveTextContent('current:dark');
    expect(persist).toHaveBeenCalledWith('dark');
  });

  it('keeps the applied theme when persisting fails', async () => {
    const persist = vi.fn().mockRejectedValue(new Error('offline'));
    render(
      <ThemeProvider initialTheme="dark" persist={persist}>
        <Probe next="light" />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button')).toHaveTextContent('current:light');
  });

  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe next="dark" />)).toThrow(/ThemeProvider/);
  });
});
