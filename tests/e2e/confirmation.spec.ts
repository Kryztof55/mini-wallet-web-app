import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAs, main } from './session';

const TRANSFERS = '**/api/transfers';
const sendButton = (page: Page) => page.getByRole('button', { name: 'Enviar $250.00' });

/** Ana ($12,345.67) → Luis Pérez, $250.00, "Tacos" → summary. */
async function reachSummary(page: Page) {
  await loginAs(page, 'ana@demo.mx');
  await page.getByRole('link', { name: 'Enviar dinero' }).click();
  await page.getByRole('button', { name: /^Enviar a Luis Pérez/ }).click();
  await page.getByRole('textbox', { name: 'Monto' }).fill('250');
  await page.getByRole('textbox', { name: 'Concepto (opcional)' }).fill('Tacos');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL('/transfer/summary');
}

/** Home balance after the flow: proves how many times the money moved. */
async function expectHomeBalance(page: Page, text: string) {
  await page.goto('/');
  await expect(main(page).getByText(text, { exact: true })).toBeVisible();
}

test.describe('[FS-04] Confirmation outcomes', () => {
  test('[TC-E2E-15][AC-CONF-03][AC-CONF-04] network error → not sent → retry succeeds → debited once', async ({
    page,
    forceOutcome,
    expectNoA11yViolations,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'network_error');
    await sendButton(page).click();
    await expect(page.getByRole('heading', { name: 'No pudimos conectarnos' })).toBeFocused();
    await expect(page.getByText(/Tu dinero no se envió/)).toBeVisible();
    await expect(page.getByText(/Referencia:/)).toBeVisible();
    await expectNoA11yViolations();

    await page.unroute(TRANSFERS);
    await forceOutcome(TRANSFERS, 'success');
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click();
    await expect(page).toHaveURL(/\/receipts\/trf_/);
    await expectHomeBalance(page, '$12,095.67');
  });

  test('[TC-E2E-16][AC-CONF-05] insufficient funds at confirmation → updated balance → "Cambiar monto" keeps the amount with the error', async ({
    page,
    baseURL,
  }) => {
    await reachSummary(page);
    // Meanwhile another transfer leaves $145.67 (same session, as a second tab would).
    const drain = await page.request.post('/api/transfers', {
      headers: {
        origin: baseURL ?? '',
        'content-type': 'application/json',
        'x-request-id': crypto.randomUUID(),
        'idempotency-key': crypto.randomUUID(),
        'x-mock-outcome': 'success',
      },
      data: {
        recipient: { contactId: 'ctc_ana_maria' },
        amount: { amountMinor: 1220000, currency: 'MXN' },
      },
    });
    expect(drain.status()).toBe(201);

    await sendButton(page).click();
    await expect(page.getByRole('heading', { name: 'No tienes saldo suficiente' })).toBeFocused();
    await expect(page.getByText(/Saldo disponible: \$145\.67/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Cambiar monto' }).click();
    await expect(page).toHaveURL('/transfer/amount');
    await expect(page.getByRole('textbox', { name: 'Monto' })).toHaveValue('250.00');
    await expect(page.getByText('El monto supera tu saldo disponible ($145.67).')).toBeVisible();
  });

  test('[TC-E2E-17][AC-CONF-06] timeout, then completed → verifying → receipt, debited once', async ({
    page,
    forceOutcome,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'timeout-completed');
    // The verifying view lasts ~200 ms with E2E timings, shorter than Playwright's polling
    // interval at that point; the status checks are the reliable proof that it happened.
    const statusChecks: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/transfers/attempts/')) statusChecks.push(request.url());
    });
    await sendButton(page).click();
    await expect(page.getByRole('button', { name: 'Enviando…' })).toBeVisible();
    await expect(page).toHaveURL(/\/receipts\/trf_/);
    expect(statusChecks.length).toBeGreaterThanOrEqual(1);
    await expectHomeBalance(page, '$12,095.67');
  });

  test('[TC-E2E-17][AC-CONF-07] timeout, then not processed → "No se procesó tu envío"', async ({
    page,
    forceOutcome,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'timeout-not-processed');
    await sendButton(page).click();
    await expect(page.getByRole('heading', { name: 'No se procesó tu envío' })).toBeFocused();
    await expect(
      page.getByText('Tu dinero no se envió. Puedes intentarlo de nuevo.'),
    ).toBeVisible();
    await expectHomeBalance(page, '$12,345.67');
  });

  test('[TC-E2E-17][AC-CONF-08][AC-CONF-10] timeout, unresolved → never asserts the result, never stuck', async ({
    page,
    forceOutcome,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'timeout-unresolved');
    await sendButton(page).click();
    const heading = page.getByRole('heading', {
      name: 'No pudimos confirmar el estado de tu envío',
    });
    await expect(heading).toBeFocused({ timeout: 10_000 });
    await expect(page.getByText(/no se enviará dos veces/)).toBeVisible();
    await expect(main(page)).not.toContainText(/no se envió|Envío realizado/);
    await expect(page.getByRole('button', { name: 'Enviando…' })).toHaveCount(0);
  });

  test('[TC-E2E-18][AC-CONF-09] unknown error → fallback copy, reference, retry and Home', async ({
    page,
    forceOutcome,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'unknown_error');
    await sendButton(page).click();
    await expect(
      page.getByRole('heading', { name: 'No pudimos completar tu envío' }),
    ).toBeFocused();
    await expect(page.getByText('Si se realizó, lo verás en tus movimientos.')).toBeVisible();
    await expect(page.getByText(/Referencia:/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir al inicio' }).click();
    await expect(page).toHaveURL('/');
  });

  test('[TC-E2E-20][AC-CONF-02] double click on "Enviar" → exactly one request', async ({
    page,
    forceOutcome,
  }) => {
    await reachSummary(page);
    await forceOutcome(TRANSFERS, 'success');
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/transfers')) {
        posts.push(request.url());
      }
    });
    await sendButton(page).dblclick();
    await expect(page).toHaveURL(/\/receipts\/trf_/);
    expect(posts).toHaveLength(1);
    await expectHomeBalance(page, '$12,095.67');
  });
});
