import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAs, logout, main } from './session';

/**
 * TC-E2E-21: axe (WCAG 2.x A/AA) on every screen and outcome view. Each Playwright project
 * runs it in its color scheme, so light and dark are both covered on desktop and mobile.
 * Also checks the page title and that focus lands on the view's heading.
 */
async function expectView(
  page: Page,
  scan: () => Promise<void>,
  { title, heading }: { readonly title: string; readonly heading?: string },
) {
  await expect(page).toHaveTitle(title);
  if (heading) {
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
  }
  await scan();
}

const amount = (page: Page) => page.getByRole('textbox', { name: 'Monto' });

async function toSummary(page: Page) {
  await page.getByRole('link', { name: 'Enviar dinero' }).click();
  await page.getByRole('button', { name: /^Enviar a Luis Pérez/ }).click();
  await amount(page).fill('250');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL('/transfer/summary');
}

test.describe('[TC-E2E-21][NFR-14] Accessibility scan', () => {
  test('login, Home (normal and with section errors)', async ({ page, expectNoA11yViolations }) => {
    await page.goto('/login');
    await expectView(page, expectNoA11yViolations, { title: 'Inicia sesión · Mini Wallet' });

    // Code step, with an error showing (another account: Ana logs in next, and asking for her
    // code twice would hit the resend cooldown).
    await page.getByLabel('Celular o correo electrónico').fill('cero@demo.mx');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(main(page).getByText('Ingresa el código de 6 dígitos.')).toBeVisible();
    await expectNoA11yViolations();

    await loginAs(page, 'ana@demo.mx');
    await expectView(page, expectNoA11yViolations, { title: 'Inicio · Mini Wallet' });

    await logout(page);
    await expectNoA11yViolations(); // login with the "Cerraste sesión." notice
    await loginAs(page, 'falla.movs@demo.mx');
    await expect(
      main(page).getByRole('heading', { name: 'No pudimos cargar tus movimientos.' }),
    ).toBeVisible();
    await expectNoA11yViolations();
  });

  test('transfer steps, errors and the cancel dialog', async ({ page, expectNoA11yViolations }) => {
    await loginAs(page, 'ana@demo.mx');
    await page.getByRole('link', { name: 'Enviar dinero' }).click();
    await expectView(page, expectNoA11yViolations, {
      title: 'Destinatario · Enviar dinero · Mini Wallet',
      heading: '¿A quién le envías?',
    });

    // New-contact form with field errors.
    await page.getByRole('button', { name: 'Nuevo contacto' }).click();
    await page.getByRole('textbox', { name: 'Celular o correo electrónico' }).fill('55123');
    await main(page).getByRole('button', { name: 'Continuar' }).click();
    await expect(main(page).getByText('Ingresa el nombre del contacto.')).toBeVisible();
    await expectNoA11yViolations();

    await main(page)
      .getByRole('button', { name: /^Enviar a Luis Pérez/ })
      .click();
    await expectView(page, expectNoA11yViolations, {
      title: 'Monto · Enviar dinero · Mini Wallet',
      heading: '¿Cuánto le envías?',
    });
    await amount(page).fill('99999');
    await expect(main(page).getByText(/supera tu saldo/)).toBeVisible();
    await expectNoA11yViolations();

    await amount(page).fill('250');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expectView(page, expectNoA11yViolations, {
      title: 'Resumen · Enviar dinero · Mini Wallet',
      heading: 'Revisa tu envío',
    });

    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '¿Cancelar el envío?' })).toBeVisible();
    await expectNoA11yViolations();
  });

  for (const [outcome, heading] of [
    ['network_error', 'No pudimos conectarnos'],
    ['insufficient_funds', 'No tienes saldo suficiente'],
    ['unknown_error', 'No pudimos completar tu envío'],
    ['timeout-not-processed', 'No se procesó tu envío'],
    ['timeout-unresolved', 'No pudimos confirmar el estado de tu envío'],
  ] as const) {
    test(`outcome view: ${outcome}`, async ({ page, forceOutcome, expectNoA11yViolations }) => {
      await loginAs(page, 'ana@demo.mx');
      await toSummary(page);
      await forceOutcome('**/api/transfers', outcome);
      await page.getByRole('button', { name: 'Enviar $250.00' }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused({
        timeout: 10_000,
      });
      await expect(page).toHaveTitle(`${heading} · Mini Wallet`);
      await expectNoA11yViolations();
    });
  }

  test('receipt and receipt not found', async ({ page, forceOutcome, expectNoA11yViolations }) => {
    await loginAs(page, 'ana@demo.mx');
    await toSummary(page);
    await forceOutcome('**/api/transfers', 'success');
    await page.getByRole('button', { name: 'Enviar $250.00' }).click();
    await expect(page).toHaveURL(/\/receipts\/trf_/);
    await expectView(page, expectNoA11yViolations, {
      title: 'Envío realizado · Mini Wallet',
      heading: 'Envío realizado',
    });

    await page.goto('/receipts/trf_does-not-exist');
    await expectView(page, expectNoA11yViolations, {
      title: 'No encontramos este comprobante. · Mini Wallet',
      heading: 'No encontramos este comprobante.',
    });
  });
});
