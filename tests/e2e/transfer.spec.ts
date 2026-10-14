import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAs, main } from './session';

const amountField = (page: Page) => page.getByRole('textbox', { name: 'Monto' });
const conceptField = (page: Page) => page.getByRole('textbox', { name: 'Concepto (opcional)' });
const continueButton = (page: Page) => page.getByRole('button', { name: 'Continuar' });
/** Summary value next to its label (`<dt>` → `<dd>`). */
const summaryValue = (page: Page, label: string) =>
  main(page)
    .locator('dt', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::dd[1]');

/** Ana ($12,345.67) → "Enviar dinero" → favorite Luis Pérez → amount step. */
async function startTransferToLuis(page: Page) {
  await loginAs(page, 'ana@demo.mx');
  await page.getByRole('link', { name: 'Enviar dinero' }).click();
  await expect(page).toHaveURL('/transfer/recipient');
  await page.getByRole('button', { name: /^Enviar a Luis Pérez/ }).click();
  await expect(page).toHaveURL('/transfer/amount');
  await expect(page.getByRole('heading', { level: 1, name: '¿Cuánto le envías?' })).toBeFocused();
}

test.describe('[FS-03] New transaction', () => {
  test('[TC-E2E-13] amount rules, concept limit and editing from the summary', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await startTransferToLuis(page);
    await expect(amountField(page)).toHaveAccessibleDescription('Saldo disponible: $12,345.67');

    // AC-TX-02: empty → BR-01 only on Continuar, focus on the amount.
    await continueButton(page).click();
    await expect(page.getByText('Ingresa un monto mayor a $0.00.')).toBeVisible();
    await expect(amountField(page)).toBeFocused();
    await expect(page).toHaveURL('/transfer/amount');

    // AC-TX-04: no letters, no third decimal, grouping while typing.
    await amountField(page).pressSequentially('1a2345.678');
    await expect(amountField(page)).toHaveValue('12,345.67');
    await expect(page.getByText('Ingresa un monto mayor a $0.00.')).toHaveCount(0);

    // AC-TX-03: BR-02 appears while typing and clears when valid.
    await amountField(page).press('End');
    await amountField(page).press('Backspace');
    await amountField(page).pressSequentially('8');
    await expect(page.getByText('El monto supera tu saldo disponible ($12,345.67).')).toBeVisible();
    await continueButton(page).click();
    await expect(page).toHaveURL('/transfer/amount');
    await amountField(page).fill('250');
    await expect(page.getByText(/supera tu saldo/)).toHaveCount(0);

    // AC-TX-11: the concept stops at 40 characters.
    await conceptField(page).pressSequentially('x'.repeat(45));
    await expect(conceptField(page)).toHaveValue('x'.repeat(40));
    await expect(page.getByText('40/40')).toBeVisible();
    await conceptField(page).fill('Tacos');
    await expectNoA11yViolations();
    await page.screenshot({ path: test.info().outputPath('amount.png'), fullPage: true });

    // AC-TX-01 (up to the summary): details, resulting balance, confirm label.
    await continueButton(page).click();
    await expect(page).toHaveURL('/transfer/summary');
    await expect(page.getByRole('heading', { level: 1, name: 'Revisa tu envío' })).toBeFocused();
    await expect(summaryValue(page, 'Para')).toContainText('Luis Pérez');
    await expect(summaryValue(page, 'Monto')).toHaveText('$250.00');
    await expect(summaryValue(page, 'Concepto')).toHaveText('Tacos');
    await expect(summaryValue(page, 'Saldo después del envío')).toHaveText('$12,095.67');
    await expect(page.getByRole('button', { name: 'Enviar $250.00' })).toBeVisible();
    await expectNoA11yViolations();
    await page.screenshot({ path: test.info().outputPath('summary.png'), fullPage: true });

    // AC-TX-12: edit the amount; recipient and concept are kept.
    await page.getByRole('link', { name: 'Cambiar monto' }).click();
    await expect(page).toHaveURL('/transfer/amount');
    await expect(amountField(page)).toHaveValue('250.00');
    await expect(conceptField(page)).toHaveValue('Tacos');
    await amountField(page).fill('300');
    await continueButton(page).click();
    await expect(page).toHaveURL('/transfer/summary');
    await expect(summaryValue(page, 'Para')).toContainText('Luis Pérez');
    await expect(summaryValue(page, 'Monto')).toHaveText('$300.00');
    await expect(summaryValue(page, 'Concepto')).toHaveText('Tacos');
  });

  test('[TC-E2E-14] step guard, cancel dialog keep/confirm, no transfer made', async ({ page }) => {
    await loginAs(page, 'ana@demo.mx');

    // AC-TX-05: later steps opened directly go to the first incomplete step.
    await page.goto('/transfer/summary');
    await expect(page).toHaveURL('/transfer/recipient');
    await page.goto('/transfer/amount');
    await expect(page).toHaveURL('/transfer/recipient');

    // Nothing entered yet: Cancelar goes Home without asking.
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL('/');

    // AC-TX-13: with data, Cancelar asks; Escape = "Seguir editando" and keeps the data.
    await page.getByRole('link', { name: 'Enviar dinero' }).click();
    await page.getByRole('button', { name: /^Enviar a Luis Pérez/ }).click();
    await amountField(page).fill('100');
    const cancel = page.getByRole('button', { name: 'Cancelar', exact: true });
    await cancel.click();
    const dialog = page.getByRole('dialog', { name: '¿Cancelar el envío?' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(cancel).toBeFocused();
    await expect(amountField(page)).toHaveValue('100');

    await cancel.click();
    await dialog.getByRole('button', { name: 'Cancelar envío' }).click();
    await expect(page).toHaveURL('/');
    await expect(main(page).getByText('$12,345.67')).toBeVisible();

    // The draft was discarded: the flow starts over.
    await page.goto('/transfer/amount');
    await expect(page).toHaveURL('/transfer/recipient');
  });
});
