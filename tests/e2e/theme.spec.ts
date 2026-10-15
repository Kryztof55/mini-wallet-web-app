import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAs } from './session';

const DARK_SURFACE = 'rgb(19, 21, 43)'; // --surface dark (#13152b)
const LIGHT_SURFACE = 'rgb(246, 247, 251)'; // --surface light (#f6f7fb)

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('[TC-E2E-22][UX-22][A11Y-26] Theme', () => {
  test('no cookie: follows the system scheme on first paint, with JavaScript off', async ({
    browser,
  }) => {
    // Without JavaScript the page is exactly what the server sent: no flash to fix later.
    for (const [scheme, expected] of [
      ['dark', DARK_SURFACE],
      ['light', LIGHT_SURFACE],
    ] as const) {
      const context = await browser.newContext({ colorScheme: scheme, javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
      expect(await bodyBackground(page)).toBe(expected);
      await context.close();
    }
  });

  test('choosing a theme overrides the system and persists across reloads and pages', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loginAs(page, 'ana@demo.mx');
    await page.getByRole('radio', { name: 'Oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => bodyBackground(page)).toBe(DARK_SURFACE);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeChecked();
    expect(await bodyBackground(page)).toBe(DARK_SURFACE);

    await page.getByRole('link', { name: 'Enviar dinero' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('radio', { name: 'Sistema' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect.poll(() => bodyBackground(page)).toBe(LIGHT_SURFACE);
  });
});
