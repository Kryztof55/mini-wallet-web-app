import { expect, test } from './fixtures';

test.describe('[SMOKE] E2E tooling', () => {
  test('serves the app and passes the accessibility scan', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Mini Wallet' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
    await expectNoA11yViolations();
  });

  test('health endpoint answers ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
