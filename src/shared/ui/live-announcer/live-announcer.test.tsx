import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/shared/ui/button';
import { ANNOUNCE_DELAY_MS, LiveAnnouncerProvider, useAnnounce } from './live-announcer';

function Announcer() {
  const announce = useAnnounce();
  return (
    <>
      <Button onClick={() => announce('Contacto guardado')}>Guardar</Button>
      <Button onClick={() => announce('No hay conexión', 'assertive')}>Fallar</Button>
    </>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY_MS);
  });
}

describe('[TC-COMP-01][A11Y-08] page live regions', () => {
  it('announces politely without moving focus, and repeats a message when asked again', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <LiveAnnouncerProvider>
        <Announcer />
      </LiveAnnouncerProvider>,
    );
    const polite = screen.getByTestId('live-polite');
    expect(polite).toHaveAttribute('aria-live', 'polite');
    expect(polite).toBeEmptyDOMElement();

    const save = screen.getByRole('button', { name: 'Guardar' });
    await user.click(save);
    expect(polite).toBeEmptyDOMElement();
    await flush();
    expect(polite).toHaveTextContent('Contacto guardado');
    expect(save).toHaveFocus();

    await user.click(save);
    expect(polite).toBeEmptyDOMElement();
    await flush();
    expect(polite).toHaveTextContent('Contacto guardado');
  });

  it('uses the assertive region only when asked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <LiveAnnouncerProvider>
        <Announcer />
      </LiveAnnouncerProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Fallar' }));
    await flush();
    expect(screen.getByTestId('live-assertive')).toHaveTextContent('No hay conexión');
    expect(screen.getByTestId('live-polite')).toBeEmptyDOMElement();
  });

  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Announcer />)).toThrow(/LiveAnnouncerProvider/);
  });
});
