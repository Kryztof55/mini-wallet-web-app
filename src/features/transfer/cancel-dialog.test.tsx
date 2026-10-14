import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelTransfer } from './cancel-transfer';
import { emptyDraft } from './state/draft';
import { draftProbe, TransferProviders } from './test-utils';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const withRecipient = {
  ...emptyDraft,
  recipient: { kind: 'contact' as const, contactId: 'c', name: 'Ana', maskedIdentifier: '•' },
};

beforeEach(() => router.push.mockClear());

describe('[TC-COMP-13][UIR-TX-20][A11Y-24] CancelTransferDialog', () => {
  it('without data: goes Home directly, no dialog', async () => {
    render(
      <TransferProviders>
        <CancelTransfer />
      </TransferProviders>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('with data: asks; Escape keeps editing and returns focus to "Cancelar"', async () => {
    const user = userEvent.setup();
    render(
      <TransferProviders draft={withRecipient}>
        <CancelTransfer />
      </TransferProviders>,
    );
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancel);
    const dialog = screen.getByRole('dialog', { name: '¿Cancelar el envío?' });
    expect(dialog).toHaveAccessibleDescription('Se perderán los datos que ingresaste.');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cancel).toHaveFocus();
    expect(draftProbe.current?.recipient).not.toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('"Seguir editando" keeps the data; "Cancelar envío" discards it and goes Home', async () => {
    const user = userEvent.setup();
    render(
      <TransferProviders draft={withRecipient}>
        <CancelTransfer />
      </TransferProviders>,
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(draftProbe.current?.recipient).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar envío' }));
    expect(draftProbe.current).toEqual({ ...emptyDraft, completed: true });
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('unsaved typing in a form also counts as data', async () => {
    render(
      <TransferProviders>
        <CancelTransfer dirty />
      </TransferProviders>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
