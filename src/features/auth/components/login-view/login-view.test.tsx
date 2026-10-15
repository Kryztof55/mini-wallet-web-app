import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveAnnouncerProvider } from '@/shared/ui/live-announcer';
import { LoginView } from './login-view';
import { failure, fakeAuthApi, verified } from '@/features/auth/test-utils';

const navigate = vi.hoisted(() => vi.fn());

// Like Next's router: pushState/replaceState and popstate update useSearchParams.
vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    const read = () => new URLSearchParams(window.location.search);
    const [params, setParams] = useState(read);
    useEffect(() => {
      const sync = () => setParams(read());
      window.addEventListener('popstate', sync);
      window.addEventListener('test:navigate', sync);
      return () => {
        window.removeEventListener('popstate', sync);
        window.removeEventListener('test:navigate', sync);
      };
    }, []);
    return params;
  },
}));

const originalPush = window.history.pushState.bind(window.history);
const originalReplace = window.history.replaceState.bind(window.history);

beforeEach(() => {
  navigate.mockClear();
  originalReplace(null, '', '/login');
  window.history.pushState = (...args: Parameters<History['pushState']>) => {
    originalPush(...args);
    setTimeout(() => window.dispatchEvent(new Event('test:navigate')), 0);
  };
});

afterEach(() => {
  window.history.pushState = originalPush;
});

function setup(api = fakeAuthApi(), reason: 'logged_out' | 'session_ended' | null = null) {
  const user = userEvent.setup();
  render(
    <LiveAnnouncerProvider>
      <LoginView reason={reason} returnTo="/transfer/amount" api={api} navigate={navigate} />
    </LiveAnnouncerProvider>,
  );
  return { user, api };
}

async function continueWith(user: ReturnType<typeof userEvent.setup>, identifier: string) {
  await user.type(screen.getByLabelText('Celular o correo electrónico'), identifier);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('[FS-01] LoginView', () => {
  it('[AC-AUTH-01][AC-AUTH-06][UIR-AUTH-14] full login: code step, verify, replace navigation to returnTo', async () => {
    const api = fakeAuthApi({ verify: vi.fn().mockResolvedValue(verified('/transfer/amount')) });
    const { user } = setup(api);
    await continueWith(user, '55 1234 5678');

    expect(await screen.findByRole('heading', { name: 'Ingresa tu código' })).toBeVisible();
    expect(screen.getByLabelText('Código de verificación')).toHaveFocus();
    await waitFor(() => expect(window.location.search).toBe('?step=code'));

    await user.type(screen.getByLabelText('Código de verificación'), '482915');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(api.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: '55 1234 5678',
        code: '482915',
        returnTo: '/transfer/amount',
      }),
    );
    expect(navigate).toHaveBeenCalledWith('/transfer/amount');
  });

  it('[UIR-AUTH-13][EC-07] browser Back from the code step returns to step 1 with the identifier focused', async () => {
    const { user } = setup();
    await continueWith(user, '5512345678');
    await screen.findByRole('heading', { name: 'Ingresa tu código' });
    await waitFor(() => expect(window.location.search).toBe('?step=code'));

    await act(async () => {
      originalReplace(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    const input = await screen.findByLabelText('Celular o correo electrónico');
    expect(input).toHaveValue('5512345678');
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('[AC-AUTH-16] service error: message, reference code, retry; identifier kept', async () => {
    const api = fakeAuthApi({
      requestCode: vi.fn().mockResolvedValue(failure('SERVICE_UNAVAILABLE', undefined, 503)),
    });
    const { user } = setup(api);
    await continueWith(user, '5512345678');

    expect(await screen.findByRole('heading', { name: /No pudimos continuar/ })).toBeVisible();
    expect(screen.getByText('3F9A-12C4')).toBeInTheDocument();
    expect(screen.getByLabelText('Celular o correo electrónico')).toHaveValue('5512345678');
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(api.requestCode).toHaveBeenCalledTimes(2);
  });

  it('[UIR-AUTH-17] shows the session notice', () => {
    setup(fakeAuthApi(), 'logged_out');
    expect(screen.getAllByText('Cerraste sesión.').length).toBeGreaterThan(0);
  });

  it('[EC-08] a reload on ?step=code starts at step 1 and drops the param', () => {
    originalReplace(null, '', '/login?step=code&returnTo=%2Fx');
    setup();
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
    expect(window.location.search).toBe('?returnTo=%2Fx');
  });
});
