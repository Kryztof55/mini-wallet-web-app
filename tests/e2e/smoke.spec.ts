import { expect, test } from './fixtures';

test.describe('[SMOKE] E2E tooling', () => {
  test('serves the app and passes the accessibility scan', async ({
    page,
    expectNoA11yViolations,
  }) => {
    // Without a session, private Home redirects to login (TASK-09).
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Inicia sesión' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
    await expectNoA11yViolations();
  });

  test('health endpoint answers ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('[ADR-004] CSRF: a cross-site POST is rejected before anything else', async ({
    request,
  }) => {
    const response = await request.post('/api/transfers', {
      headers: {
        origin: 'https://evil.example',
        'content-type': 'application/json',
        'x-request-id': crypto.randomUUID(),
        'idempotency-key': crypto.randomUUID(),
      },
      data: {
        recipient: { contactId: 'ctc_ana_luis' },
        amount: { amountMinor: 1, currency: 'MXN' },
      },
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'CSRF_REJECTED' });
  });
});
