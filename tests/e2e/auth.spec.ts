import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const identifierField = (page: Page) => page.getByLabel('Celular o correo electrónico');
const codeField = (page: Page) => page.getByLabel('Código de verificación');

async function requestCode(page: Page, identifier: string) {
  await identifierField(page).fill(identifier);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ingresa tu código' })).toBeVisible();
}

/** Reads the current code from the non-production demo hint (UIR-AUTH-16). */
async function demoCode(page: Page): Promise<string> {
  const hint = page.getByText(/Ambiente de prueba — código: \d{6}/);
  const text = (await hint.textContent()) ?? '';
  return text.replace(/\D/g, '');
}

async function verify(page: Page, code: string) {
  await codeField(page).fill(code);
  await page.getByRole('button', { name: 'Verificar' }).click();
}

async function login(page: Page, identifier = '5512345678') {
  await page.goto('/login');
  await requestCode(page, identifier);
  await verify(page, await demoCode(page));
  await expect(page).toHaveURL('/');
}

const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

test.describe('[FS-01] Login', () => {
  test('[TC-E2E-01] phone → masked destination → demo code → Home; Back does not show Login', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/login');
    await expectNoA11yViolations();
    await requestCode(page, '55 1234 5678');

    await expect(page.getByText('Enviamos un código de 6 dígitos a •••• 5678.')).toBeVisible();
    await expect(codeField(page)).toBeFocused();
    await expectNoA11yViolations();

    await verify(page, await demoCode(page));
    await expect(page).toHaveURL('/');
    await page.goBack();
    await expect(identifierField(page)).toHaveCount(0);
  });

  test('[TC-E2E-02] email with spaces and uppercase → masked email → Home', async ({ page }) => {
    await page.goto('/login');
    await requestCode(page, '  Ana@Demo.MX ');
    await expect(page.getByText('a•••@demo.mx', { exact: false })).toBeVisible();
    await verify(page, await demoCode(page));
    await expect(page).toHaveURL('/');
  });

  test('[TC-E2E-03] wrong code twice, lock on the third, new code after cooldown, old code rejected', async ({
    page,
  }) => {
    await page.goto('/login');
    await requestCode(page, '5512345678');
    const first = await demoCode(page);

    await verify(page, wrong(first));
    await expect(page.getByText('El código no es correcto. Te quedan 2 intentos.')).toBeVisible();
    await verify(page, wrong(first));
    await expect(page.getByText('El código no es correcto. Te queda 1 intento.')).toBeVisible();
    await verify(page, wrong(first));
    await expect(
      page.getByText('Superaste los intentos permitidos. Solicita un código nuevo.'),
    ).toBeVisible();
    await expect(codeField(page)).toHaveAttribute('readonly', '');

    const resend = page.getByRole('button', { name: 'Solicitar código nuevo' });
    await expect(resend).toBeFocused();
    await resend.click();
    await expect(page.getByText('Te enviamos un código nuevo.')).toBeVisible();
    const second = await demoCode(page);
    expect(second).not.toBe(first);

    // Cooldown (2 s in E2E) before another code; the old code no longer works.
    await expect(page.getByText(/Podrás solicitar un código nuevo en/)).toBeVisible();
    await verify(page, first);
    await expect(page.getByText(/El código no es correcto/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Solicitar código nuevo' })).toBeVisible({
      timeout: 5000,
    });
    await verify(page, second);
    await expect(page).toHaveURL('/');
  });

  test('[TC-E2E-04] expired code → message → request a new one', async ({ page, forceOutcome }) => {
    await page.goto('/login');
    await requestCode(page, '5512345678');
    await forceOutcome('**/api/auth/verify', 'otp_expired');
    await verify(page, await demoCode(page));
    await expect(page.getByText('Este código expiró. Solicita uno nuevo.')).toBeVisible();
    await page.getByRole('button', { name: 'Solicitar código nuevo' }).click();
    await expect(page.getByText('Te enviamos un código nuevo.')).toBeVisible();
  });

  test('[TC-E2E-05] deep link → Login → back to it; logged-in user opening /login → Home', async ({
    page,
  }) => {
    await page.goto('/transfer/recipient');
    await expect(page).toHaveURL('/login?returnTo=%2Ftransfer%2Frecipient');
    await requestCode(page, '5512345678');
    await verify(page, await demoCode(page));
    await expect(page).toHaveURL('/transfer/recipient');

    await page.goto('/login');
    await expect(page).toHaveURL('/');
  });

  test('[TC-E2E-06] reload keeps the session; logout → notice; Home and Back go to Login', async ({
    page,
  }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveURL('/');

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL('/login?reason=logged_out');
    await expect(page.getByText('Cerraste sesión.')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
    // The cookie was cleared, so this is a visitor without a session (no "session ended").
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('[AC-AUTH-11][EC-07] Change identifier and browser Back return to step 1 with the value', async ({
    page,
  }) => {
    await page.goto('/login');
    await requestCode(page, '5512345678');
    await page.getByRole('button', { name: 'Cambiar celular o correo' }).click();
    await expect(identifierField(page)).toHaveValue('5512345678');
    await expect(identifierField(page)).toBeFocused();

    // Within the cooldown this reuses the code already sent; after it, a new one is issued.
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ingresa tu código' })).toBeVisible();
    await page.goBack();
    await expect(identifierField(page)).toHaveValue('5512345678');
  });

  test('[TC-E2E-07][AC-AUTH-16] simulated service error is recoverable with a reference code', async ({
    page,
  }) => {
    await page.goto('/login');
    await identifierField(page).fill('falla.login@demo.mx');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: /No pudimos continuar/ })).toBeVisible();
    await expect(page.getByText(/Referencia: [0-9A-F]{4}-[0-9A-F]{4}/)).toBeVisible();
    await expect(identifierField(page)).toHaveValue('falla.login@demo.mx');
  });
});
