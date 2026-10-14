import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from './button';
import { TOAST_DURATION_MS, ToastProvider, useToast } from './toast';

function CopyReceipt() {
  const toast = useToast();
  return <Button onClick={() => toast({ title: 'Folio copiado' })}>Copiar folio</Button>;
}

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <ToastProvider>
      <CopyReceipt />
    </ToastProvider>,
  );
  return user;
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('[TC-COMP-01][A11Y-08] Toast', () => {
  it('shows the message without stealing focus and announces it politely', async () => {
    const user = setup();
    const trigger = screen.getByRole('button', { name: 'Copiar folio' });
    await user.click(trigger);

    expect(screen.getByRole('region', { name: /Notificaciones/ })).toBeInTheDocument();
    expect(screen.getAllByText('Folio copiado').length).toBeGreaterThan(0);
    expect(trigger).toHaveFocus();
    // Radix renders the announcement text on the next frame, prefixed by the provider label.
    await waitFor(() =>
      expect(
        screen.getAllByRole('status').find((el) => el.textContent?.includes('Folio copiado')),
      ).toHaveAttribute('aria-live', 'polite'),
    );
    const announcement = screen
      .getAllByRole('status')
      .find((el) => el.textContent?.includes('Folio copiado'));
    expect(announcement).toHaveTextContent('Notificación Folio copiado');
  });

  it('can be dismissed with its labelled close button', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Copiar folio' }));
    const region = screen.getByRole('region', { name: /Notificaciones/ });
    await user.click(within(region).getByRole('button', { name: 'Cerrar' }));
    expect(within(region).queryByText('Folio copiado')).not.toBeInTheDocument();
  });

  it('closes by itself after the configured duration', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Copiar folio' }));
    const region = screen.getByRole('region', { name: /Notificaciones/ });
    expect(within(region).getByText('Folio copiado')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TOAST_DURATION_MS + 500);
    });
    expect(within(region).queryByText('Folio copiado')).not.toBeInTheDocument();
  });

  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<CopyReceipt />)).toThrow(/ToastProvider/);
  });
});
