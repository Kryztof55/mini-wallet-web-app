import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveAnnouncerProvider } from '@/shared/ui/live-announcer';
import { getA11yViolations } from '@/test/axe';
import { CodeStep, type CodeStepProps } from './code-step';

const NOW = new Date('2026-10-14T18:00:00Z').getTime();

const base: CodeStepProps = {
  destination: '•••• 5678',
  demoCode: null,
  codeStatus: 'active',
  codeError: null,
  attemptsLeft: null,
  resendAt: NOW + 30_000,
  notice: null,
  verifying: false,
  resending: false,
  onVerify: () => undefined,
  onResend: () => undefined,
  onChangeIdentifier: () => undefined,
};

function setup(props: Partial<CodeStepProps> = {}) {
  const handlers = { onVerify: vi.fn(), onResend: vi.fn(), onChangeIdentifier: vi.fn() };
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = (extra: Partial<CodeStepProps>) => (
    <LiveAnnouncerProvider>
      <CodeStep {...base} {...handlers} {...props} {...extra} />
    </LiveAnnouncerProvider>
  );
  const utils = render(view({}));
  const input = screen.getByLabelText<HTMLInputElement>('Código de verificación');
  return {
    ...utils,
    ...handlers,
    user,
    input,
    rerenderWith: (extra: Partial<CodeStepProps>) => utils.rerender(view(extra)),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('[TC-COMP-04] CodeStep and OneTimeCodeField', () => {
  it('[UIR-AUTH-05][UIR-AUTH-06][AC-AUTH-01] focuses the field, which announces the masked destination and length', () => {
    const { input } = setup();
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription(
      'Enviamos un código de 6 dígitos a celular terminación 5678.',
    );
    expect(screen.getByText('Enviamos un código de 6 dígitos a •••• 5678.')).toBeVisible();
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).not.toHaveAttribute('maxlength');
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresa tu código' })).toBeVisible();
  });

  it('[UIR-AUTH-07][UIR-AUTH-08][AC-AUTH-17] normalizes pasted codes and never submits by itself', async () => {
    const { user, input, onVerify } = setup();
    await user.paste('123 456');
    expect(input).toHaveValue('123456');
    await user.clear(input);
    await user.paste('12-34-56-78');
    expect(input).toHaveValue('123456');
    await user.type(input, 'ab');
    expect(input).toHaveValue('123456');
    expect(onVerify).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(onVerify).toHaveBeenCalledWith('123456');
  });

  it('[UIR-AUTH-02][UIR-AUTH-03] Verify stays enabled; empty or short code shows the error and focuses', async () => {
    const { user, input, onVerify } = setup();
    await user.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(input).toHaveAccessibleDescription(/Ingresa el código de 6 dígitos\./);
    await user.type(input, '123');
    await user.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(input).toHaveAccessibleDescription(/El código debe tener 6 dígitos\./);
    expect(input).toHaveFocus();
    expect(onVerify).not.toHaveBeenCalled();
  });

  it('[UIR-AUTH-09][AC-AUTH-07] incorrect code: attempts left, focus kept, content selected', async () => {
    const { user, input, rerenderWith } = setup();
    await user.type(input, '111111');
    rerenderWith({ codeError: 'incorrect', attemptsLeft: 2 });
    expect(input).toHaveAccessibleDescription(/El código no es correcto\. Te quedan 2 intentos\./);
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);

    rerenderWith({ codeError: 'incorrect', attemptsLeft: 1 });
    expect(input).toHaveAccessibleDescription(/Te queda 1 intento\./);
  });

  it('[UIR-AUTH-10][AC-AUTH-08] locked: read-only field, message, new-code action available and focused', () => {
    const { input, rerenderWith } = setup();
    rerenderWith({ codeStatus: 'locked', codeError: 'locked', resendAt: NOW });
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAccessibleDescription(/Solicita un código nuevo\./);
    expect(screen.getByRole('button', { name: 'Solicitar código nuevo' })).toHaveFocus();
  });

  it('[AC-AUTH-09] expired shows its message', () => {
    setup({ codeStatus: 'expired', codeError: 'expired', resendAt: NOW });
    expect(screen.getByText('Este código expiró. Solicita uno nuevo.')).toBeVisible();
  });

  it('[UIR-AUTH-11][AC-AUTH-10] cooldown text replaces the action and the end is announced once', async () => {
    const { onResend, user } = setup({ resendAt: NOW + 2000 });
    expect(screen.getByText('Podrás solicitar un código nuevo en 0:02.')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Solicitar código nuevo' }),
    ).not.toBeInTheDocument();
    // The countdown text is not a live region (not announced every second).
    expect(screen.getByText(/Podrás solicitar/).closest('[aria-live]')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    const button = screen.getByRole('button', { name: 'Solicitar código nuevo' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'Ya puedes solicitar un código nuevo.',
    );
    await user.click(button);
    expect(onResend).toHaveBeenCalledOnce();
  });

  it('[UIR-AUTH-12] shows the "new code sent" notice', () => {
    setup({ notice: 'code_resent' });
    expect(screen.getByText('Te enviamos un código nuevo.')).toBeVisible();
  });

  it('[UIR-AUTH-13] offers to change the identifier', async () => {
    const { user, onChangeIdentifier } = setup();
    await user.click(screen.getByRole('button', { name: 'Cambiar celular o correo' }));
    expect(onChangeIdentifier).toHaveBeenCalledOnce();
  });

  it('[UIR-AUTH-16][AC-AUTH-18] demo hint only when the server sent a demo code', () => {
    const { rerenderWith } = setup();
    expect(screen.queryByText(/Ambiente de prueba/)).not.toBeInTheDocument();
    rerenderWith({ demoCode: '482915' });
    expect(screen.getByText('Ambiente de prueba — código: 482915')).toBeVisible();
  });

  it('[UIR-AUTH-04] verifying: busy label, read-only field, presses ignored', async () => {
    const { user, input, onVerify } = setup({ verifying: true });
    const button = screen.getByRole('button', { name: 'Verificando…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(input).toHaveAttribute('readonly');
    await user.click(button);
    expect(onVerify).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = setup({ demoCode: '482915', codeError: 'incorrect', attemptsLeft: 2 });
    vi.useRealTimers();
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
