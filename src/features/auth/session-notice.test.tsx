import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANNOUNCE_DELAY_MS, LiveAnnouncerProvider } from '@/components/ui/live-announcer';
import { SessionNotice } from './session-notice';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function renderNotice(reason: 'logged_out' | 'session_ended' | null) {
  const utils = render(
    <LiveAnnouncerProvider>
      <SessionNotice reason={reason} />
    </LiveAnnouncerProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY_MS);
  });
  return utils;
}

describe('[TC-COMP-05][UIR-AUTH-17] SessionNotice', () => {
  it.each([
    ['logged_out', 'Cerraste sesión.'],
    ['session_ended', 'Tu sesión terminó. Inicia sesión de nuevo para continuar.'],
  ] as const)('reason=%s shows and announces "%s"', async (reason, text) => {
    await renderNotice(reason);
    expect(screen.getAllByText(text).length).toBe(2);
    expect(screen.getByTestId('live-polite')).toHaveTextContent(text);
  });

  it('renders nothing without a reason', async () => {
    const { container } = await renderNotice(null);
    expect(container).toHaveTextContent('');
    expect(screen.getByTestId('live-polite')).toBeEmptyDOMElement();
  });
});
