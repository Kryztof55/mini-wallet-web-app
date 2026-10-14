import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function loginAs(page: Page, identifier: string) {
  await page.goto('/login');
  await page.getByLabel('Celular o correo electrónico').fill(identifier);
  await page.getByRole('button', { name: 'Continuar' }).click();
  const hint = page.getByText(/Ambiente de prueba — código: \d{6}/);
  const code = ((await hint.textContent()) ?? '').replace(/\D/g, '');
  await page.getByLabel('Código de verificación').fill(code);
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page).toHaveURL('/');
}

/**
 * Assertions target the visible app inside <main>. When streamed Suspense content arrives
 * after hydration has started, React renders the section on the client and Next's streamed
 * copy can stay behind in a `<div hidden>` outside <main> (invisible, not in the a11y tree).
 */
const main = (page: Page) => page.locator('#main');

const activity = (page: Page) =>
  main(page).getByRole('region', { name: 'Movimientos recientes' }).getByRole('listitem');

test.describe('[FS-02] Home', () => {
  test('[TC-E2E-08] greeting, balance, 10 newest items with content and badges', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await loginAs(page, 'ana@demo.mx');
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeVisible();
    await expect(main(page).getByText('$12,345.67')).toBeVisible();
    await expect(activity(page)).toHaveCount(10);
    await expect(activity(page).first()).toContainText('Enviado');
    await expect(main(page).getByText('Pendiente').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enviar dinero' })).toBeVisible();
    await expectNoA11yViolations();
  });

  test('[TC-E2E-09] empty, zero balance, section errors and section retry', async ({ page }) => {
    await loginAs(page, 'nuevo@demo.mx');
    await expect(
      main(page).getByRole('heading', { name: 'Aún no tienes movimientos' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await loginAs(page, 'cero@demo.mx');
    await expect(main(page).getByText('No tienes saldo disponible')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enviar dinero' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await loginAs(page, 'falla.movs@demo.mx');
    await expect(
      main(page).getByRole('heading', { name: 'No pudimos cargar tus movimientos.' }),
    ).toBeVisible();
    await expect(main(page).getByText('$2,000.00')).toBeVisible();
    await expect(main(page).getByText(/Referencia: [0-9A-F]{4}-[0-9A-F]{4}/)).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    // Beto's balance always fails: the retry calls only the summary endpoint and stays in its section.
    await loginAs(page, 'falla.saldo@demo.mx');
    await expect(page.getByRole('heading', { level: 1, name: 'Hola' })).toBeVisible();
    await expect(
      main(page).getByRole('heading', { name: 'No pudimos cargar tu saldo.' }),
    ).toBeVisible();
    const summaryCalls: string[] = [];
    const activityCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/me/summary')) summaryCalls.push(request.url());
      if (request.url().includes('/api/me/transactions')) activityCalls.push(request.url());
    });
    await main(page).getByRole('button', { name: 'Intentar de nuevo' }).click();
    await expect(
      main(page).getByRole('heading', { name: 'No pudimos cargar tu saldo.' }),
    ).toBeVisible();
    await expect.poll(() => summaryCalls.length).toBe(1);
    expect(activityCalls).toHaveLength(0);
    await expect(activity(page).first()).toBeVisible();
  });

  test('[TC-E2E-10] hide balance persists across reloads', async ({ page }) => {
    await loginAs(page, 'ana@demo.mx');
    const toggle = main(page).getByRole('button', { name: 'Ocultar saldo' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(main(page).getByText('$ ••••••')).toBeVisible();
    await page.reload();
    await expect(main(page).getByText('$ ••••••')).toBeVisible();
    await expect(main(page).getByText('$12,345.67')).toHaveCount(0);
  });

  test('[AC-HOME-07] "Enviar dinero" opens the transfer flow', async ({ page }) => {
    await loginAs(page, 'ana@demo.mx');
    await page.getByRole('link', { name: 'Enviar dinero' }).click();
    await expect(page).toHaveURL('/transfer/recipient');
  });
});
