import type { Page } from '@playwright/test';
import { expect } from './fixtures';

/** Logs in with the non-production demo hint (UIR-AUTH-16) and lands on Home. */
export async function loginAs(page: Page, identifier: string) {
  await page.goto('/login');
  await page.getByLabel('Celular o correo electrónico').fill(identifier);
  await page.getByRole('button', { name: 'Continuar' }).click();
  const hint = page.getByText(/Ambiente de prueba — código: \d{6}/);
  const code = ((await hint.textContent()) ?? '').replace(/\D/g, '');
  await page.getByLabel('Código de verificación').fill(code);
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page).toHaveURL('/');
}

/** Logout redirects with `location.replace`; wait for it so the next `goto` is not interrupted. */
export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/login?reason=logged_out');
}

/**
 * Assertions target the visible app inside <main>. Outside it there are copies of texts that
 * are not the UI: the screen-reader live region keeps the last announcement (e.g. a BR-02
 * error after it was fixed), and a streamed Suspense segment can stay behind in a hidden
 * `<div>` after hydration. Toasts are the exception: they render outside <main>.
 */
export const main = (page: Page) => page.locator('#main');
