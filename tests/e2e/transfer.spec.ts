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
  test('[TC-E2E-11][AC-TX-01][AC-CONF-01][AC-HOME-09] happy path: favorite → amount → summary → receipt → Home updated', async ({
    page,
    forceOutcome,
    expectNoA11yViolations,
  }) => {
    await startTransferToLuis(page);
    await amountField(page).fill('250');
    await conceptField(page).fill('Tacos');
    await continueButton(page).click();
    await forceOutcome('**/api/transfers', 'success');
    await page.getByRole('button', { name: 'Enviar $250.00' }).click();

    await expect(page).toHaveURL(/\/receipts\/trf_/);
    await expect(page.getByRole('heading', { level: 1, name: 'Envío realizado' })).toBeFocused();
    await expect(main(page).getByText('$250.00')).toBeVisible();
    await expect(main(page).getByText(/a Luis Pérez/)).toBeVisible();
    await expect(main(page).getByText('Tacos')).toBeVisible();
    await expect(main(page).getByText('Completado')).toBeVisible();
    await expect(main(page).getByText(/^MW-[A-Z0-9]{6}$/)).toBeVisible();
    await expect(main(page).getByText('$12,095.67')).toBeVisible();
    await expectNoA11yViolations();
    await page.screenshot({ path: test.info().outputPath('receipt.png'), fullPage: true });

    await page.getByRole('link', { name: 'Ir al inicio' }).click();
    await expect(page).toHaveURL('/'); // the highlight parameter is dropped after it is shown
    await expect(main(page).getByText('$12,095.67')).toBeVisible();
    const first = main(page)
      .getByRole('region', { name: 'Movimientos recientes' })
      .getByRole('listitem')
      .first();
    await expect(first).toContainText('Luis Pérez');
    await expect(first).toContainText('−$250.00');
  });

  test('[TC-E2E-13] amount rules, concept limit and editing from the summary', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await startTransferToLuis(page);
    await expect(amountField(page)).toHaveAccessibleDescription('Saldo disponible: $12,345.67');

    // AC-TX-02: empty → BR-01 only on Continuar, focus on the amount.
    await continueButton(page).click();
    await expect(main(page).getByText('Ingresa un monto mayor a $0.00.')).toBeVisible();
    await expect(amountField(page)).toBeFocused();
    await expect(page).toHaveURL('/transfer/amount');

    // AC-TX-04: no letters, no third decimal, grouping while typing.
    await amountField(page).pressSequentially('1a2345.678');
    await expect(amountField(page)).toHaveValue('12,345.67');
    await expect(main(page).getByText('Ingresa un monto mayor a $0.00.')).toHaveCount(0);

    // AC-TX-03: BR-02 appears while typing and clears when valid.
    await amountField(page).press('End');
    await amountField(page).press('Backspace');
    await amountField(page).pressSequentially('8');
    await expect(
      main(page).getByText('El monto supera tu saldo disponible ($12,345.67).'),
    ).toBeVisible();
    await continueButton(page).click();
    await expect(page).toHaveURL('/transfer/amount');
    await amountField(page).fill('250');
    await expect(main(page).getByText(/supera tu saldo/)).toHaveCount(0);

    // AC-TX-11: the concept stops at 40 characters.
    await conceptField(page).pressSequentially('x'.repeat(45));
    await expect(conceptField(page)).toHaveValue('x'.repeat(40));
    await expect(main(page).getByText('40/40')).toBeVisible();
    await conceptField(page).fill('Tacos');
    await expectNoA11yViolations();
    await page.screenshot({ path: test.info().outputPath('amount.png'), fullPage: true });

    // AC-TX-01 (up to the summary): details, resulting balance, confirm label.
    await continueButton(page).click();
    await expect(page).toHaveURL('/transfer/summary');
    await expect(page.getByRole('heading', { level: 1, name: 'Revisa tu envío' })).toBeFocused();
    await expect(summaryValue(page, 'Para')).toContainText('Luis Pérez');
    // Amounts show "$250.00" and are read "250 pesos" (A11Y-17).
    await expect(summaryValue(page, 'Monto').getByText('$250.00', { exact: true })).toBeVisible();
    await expect(
      summaryValue(page, 'Monto').getByText('250 pesos', { exact: true }),
    ).toBeAttached();
    await expect(summaryValue(page, 'Concepto')).toHaveText('Tacos');
    await expect(summaryValue(page, 'Saldo después del envío')).toContainText('$12,095.67');
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
    await expect(summaryValue(page, 'Monto')).toContainText('$300.00');
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

  test.describe('[TC-E2E-12] new contact variants', () => {
    /** Ana → recipient step → "Nuevo contacto" open (she has favorites, so it starts closed). */
    async function openNewContact(page: Page) {
      await loginAs(page, 'ana@demo.mx');
      await page.getByRole('link', { name: 'Enviar dinero' }).click();
      await page.getByRole('button', { name: 'Nuevo contacto' }).click();
    }

    async function submitContact(page: Page, name: string, identifier: string, save = true) {
      await page.getByRole('textbox', { name: 'Nombre' }).fill(name);
      await page.getByRole('textbox', { name: 'Celular o correo electrónico' }).fill(identifier);
      if (!save) await page.getByRole('checkbox', { name: 'Guardar en favoritos' }).uncheck();
      await continueButton(page).click();
    }

    const favorite = (page: Page, name: string) =>
      main(page).getByRole('button', { name: new RegExp(`^Enviar a ${name}`) });

    test('[AC-TX-06] saved by default → notice → recipient → appears in favorites', async ({
      page,
    }) => {
      await openNewContact(page);
      await expect(page.getByRole('checkbox', { name: 'Guardar en favoritos' })).toBeChecked();
      await submitContact(page, 'Pedro Gómez', '55 8765 4321');
      await expect(page).toHaveURL('/transfer/amount');
      await expect(main(page).getByText('Guardamos a Pedro Gómez en tus favoritos.')).toBeVisible();
      await expect(main(page).getByText('Pedro Gómez', { exact: true })).toBeVisible();

      await page.getByRole('link', { name: 'Cambiar destinatario' }).click();
      await expect(favorite(page, 'Pedro Gómez')).toBeVisible();
    });

    test('[AC-TX-07] unchecked → one-off recipient, not added to favorites', async ({ page }) => {
      await openNewContact(page);
      await submitContact(page, 'Rosa Luna', 'rosa@correo.mx', false);
      await expect(page).toHaveURL('/transfer/amount');
      await expect(main(page).getByText('Rosa Luna', { exact: true })).toBeVisible();
      await expect(main(page).getByText(/en tus favoritos/)).toHaveCount(0);

      await page.getByRole('link', { name: 'Cambiar destinatario' }).click();
      await expect(favorite(page, 'Luis Pérez')).toBeVisible();
      await expect(favorite(page, 'Rosa Luna')).toHaveCount(0);
    });

    test('[AC-TX-08] duplicate identifier in another format → existing favorite, no duplicate', async ({
      page,
    }) => {
      await openNewContact(page);
      await submitContact(page, 'Luisito', '55 9876 5432');
      await expect(page).toHaveURL('/transfer/amount');
      await expect(main(page).getByText('Luis Pérez ya estaba en tus favoritos.')).toBeVisible();
      await expect(main(page).getByText('Luis Pérez', { exact: true })).toBeVisible();

      await page.getByRole('link', { name: 'Cambiar destinatario' }).click();
      await expect(favorite(page, 'Luis Pérez')).toHaveCount(1);
      await expect(favorite(page, 'Luisito')).toHaveCount(0);
    });

    test('[AC-TX-09] invalid fields → an error under each, focus on the first', async ({
      page,
    }) => {
      await openNewContact(page);
      await submitContact(page, '', '55123');
      await expect(main(page).getByText('Ingresa el nombre del contacto.')).toBeVisible();
      await expect(
        main(page).getByText(/Revisa el dato: usa un celular a 10 dígitos/),
      ).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Nombre' })).toBeFocused();
      await expect(page).toHaveURL('/transfer/recipient');
    });

    test('[AC-TX-10] my own number → "No puedes enviarte dinero a ti mismo."', async ({ page }) => {
      await openNewContact(page);
      await submitContact(page, 'Yo', '5512345678');
      await expect(main(page).getByText('No puedes enviarte dinero a ti mismo.')).toBeVisible();
      await expect(page).toHaveURL('/transfer/recipient');
    });

    test('[AC-TX-16] saving fails → notice, and the transfer continues with that contact', async ({
      page,
      forceOutcome,
    }) => {
      await openNewContact(page);
      await forceOutcome('**/api/contacts', 'service_unavailable');
      await submitContact(page, 'Pedro Gómez', '5587654321');
      await expect(page).toHaveURL('/transfer/amount');
      await expect(
        main(page).getByText('No pudimos guardar el contacto. Puedes continuar con el envío.'),
      ).toBeVisible();
      await expect(main(page).getByText('Pedro Gómez', { exact: true })).toBeVisible();
    });
  });
});
