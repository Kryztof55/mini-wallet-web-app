import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, ok } from '@/core/result';
import { getA11yViolations } from '@/test/axe';
import type { ContactsApi } from '@/shared/api/contacts';
import { RecipientStep } from './recipient-step';
import {
  draftProbe,
  FAVORITES,
  TransferProviders,
  transferData,
} from '@/features/transfer/test-utils';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const fakeApi = (overrides: Partial<Record<keyof ContactsApi, unknown>> = {}) =>
  ({ list: vi.fn(), save: vi.fn(), ...overrides }) as unknown as ContactsApi;

function setup(data = transferData(), api = fakeApi()) {
  const user = userEvent.setup();
  const utils = render(
    <TransferProviders data={data}>
      <RecipientStep api={api} />
    </TransferProviders>,
  );
  return { ...utils, user, api };
}

beforeEach(() => {
  router.push.mockClear();
  router.replace.mockClear();
});

describe('[TC-COMP-09] Recipient step', () => {
  it('[UIR-TX-01][UIR-TX-02] step indicator, heading focused on arrival', () => {
    setup();
    expect(screen.getByText('Paso 1 de 3 — Destinatario')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: '¿A quién le envías?' })).toHaveFocus();
  });

  it('[UIR-TX-03] favorites in server order, each with name and masked identifier', () => {
    setup();
    const list = screen.getByRole('region', { name: 'Favoritos' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Enviar a Luis Pérez, celular terminación 5432',
      'Enviar a María Torres, correo que empieza con m, en demo.mx',
      'Enviar a Sofía Díaz, celular terminación 4444',
    ]);
    expect(buttons[0]).toHaveTextContent('LPLuis Pérez•••• 5432');
    expect(within(list).getByRole('button', { name: /^Enviar a Luis Pérez/ })).toBeVisible();
  });

  it('[UIR-TX-04] activating a favorite selects it and opens the amount step', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /^Enviar a María Torres/ }));
    expect(draftProbe.current?.recipient).toEqual({
      kind: 'contact',
      contactId: 'ct_maria',
      name: 'María Torres',
      maskedIdentifier: 'm•••@demo.mx',
    });
    expect(router.push).toHaveBeenCalledWith('/transfer/amount');
  });

  it('[AC-TX-14] favorites error: reference and retry; "Nuevo contacto" still available', async () => {
    const api = fakeApi({
      list: vi
        .fn()
        .mockResolvedValue(ok({ data: { items: FAVORITES }, status: 200, requestId: 'r' })),
    });
    const { user } = setup(
      transferData({ favorites: { ok: false, requestId: '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b' } }),
      api,
    );
    expect(screen.getByRole('heading', { name: 'No pudimos cargar tus favoritos.' })).toBeVisible();
    expect(screen.getByText('3F9A-12C4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo contacto' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('button', { name: /^Enviar a Luis Pérez/ })).toBeVisible();
  });

  it('no favorites: empty message and the new-contact form open', () => {
    setup(transferData({ favorites: { ok: true, value: [] } }));
    expect(screen.getByText(/Aún no tienes favoritos/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nuevo contacto' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Nombre')).toBeVisible();
  });

  it('[UIR-TX-06][AC-TX-06] new contact saved → recipient + notice, amount step', async () => {
    const api = fakeApi({
      save: vi.fn().mockResolvedValue(
        ok({
          data: {
            contact: {
              id: 'ct_new',
              name: 'Pedro Gómez',
              maskedIdentifier: '•••• 3333',
              lastUsedAt: null,
            },
            created: true,
          },
          status: 201,
          requestId: 'r',
        }),
      ),
    });
    const { user } = setup(transferData(), api);
    await user.click(screen.getByRole('button', { name: 'Nuevo contacto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Pedro Gómez');
    await user.type(screen.getByLabelText('Celular o correo electrónico'), '55 4444 3333');
    expect(screen.getByRole('checkbox', { name: 'Guardar en favoritos' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/transfer/amount'));
    expect(draftProbe.current?.recipient).toMatchObject({ kind: 'contact', contactId: 'ct_new' });
    expect(draftProbe.current?.notice).toEqual({ kind: 'saved', name: 'Pedro Gómez' });
    // AC-TX-06: back on this step in the same flow, the new favorite is listed (never used → last).
    const names = within(screen.getByRole('region', { name: 'Favoritos' }))
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label')?.split(',')[0]);
    expect(names).toEqual([
      'Enviar a Luis Pérez',
      'Enviar a María Torres',
      'Enviar a Pedro Gómez',
      'Enviar a Sofía Díaz',
    ]);
  });

  it('[UIR-TX-08][AC-TX-16] save failure continues as a one-off', async () => {
    const api = fakeApi({
      save: vi
        .fn()
        .mockResolvedValue(err({ code: 'SERVICE_UNAVAILABLE', status: 503, requestId: 'r' })),
    });
    const { user } = setup(transferData(), api);
    await user.click(screen.getByRole('button', { name: 'Nuevo contacto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Pedro');
    await user.type(screen.getByLabelText('Celular o correo electrónico'), 'pedro@correo.com');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(draftProbe.current?.recipient).toMatchObject({
      kind: 'oneOff',
      maskedIdentifier: 'p•••@correo.com',
    });
    expect(draftProbe.current?.notice).toEqual({ kind: 'save_failed' });
  });

  it('server SELF_TRANSFER keeps the user on the form with the error', async () => {
    const api = fakeApi({
      save: vi.fn().mockResolvedValue(err({ code: 'SELF_TRANSFER', status: 422, requestId: 'r' })),
    });
    const { user } = setup(transferData({ ownIdentifiers: [] }), api);
    await user.click(screen.getByRole('button', { name: 'Nuevo contacto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Yo');
    await user.type(screen.getByLabelText('Celular o correo electrónico'), '5512345678');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('No puedes enviarte dinero a ti mismo.')).toBeVisible();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Nuevo contacto' }));
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
