import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Money } from '@/core/money';
import { ActivityList } from '@/features/home/activity-list';
import { toActivityItemView, type ActivityItemData } from '@/features/home/activity-view';
import { initialsOf } from '@/lib/format/initials';
import { getA11yViolations } from '@/test/axe';

const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });

const NOW = new Date('2026-10-14T20:40:00Z'); // 14:40 in Mexico City
const TZ = 'America/Mexico_City';

const item = (overrides: Partial<ActivityItemData> = {}): ActivityItemData => ({
  id: 'txn_1',
  direction: 'out',
  counterparty: { name: 'Luis Pérez', maskedIdentifier: '•••• 5432' },
  amount: mxn(25000),
  concept: 'Tacos',
  status: 'completed',
  occurredAt: '2026-10-14T20:32:00Z', // 14:32 local
  ...overrides,
});

const renderList = (items: ActivityItemData[], highlightId: string | null = null) =>
  render(
    <ActivityList
      items={items.map((i) => toActivityItemView(i, NOW, TZ))}
      highlightId={highlightId}
    />,
  );

describe('[TC-COMP-07][UIR-HOME-06][UIR-HOME-07][UIR-HOME-08][UIR-HOME-09] TransactionItem and ActivityList', () => {
  it('AC-HOME-03: shows name, concept, relative date, signed amount and direction; no badge when completed', () => {
    renderList([item()]);
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Luis Pérez');
    expect(row).toHaveTextContent('Tacos·Hoy, 14:32');
    expect(row).toHaveTextContent('−$250.00');
    expect(row).toHaveTextContent('Enviado');
    expect(row).not.toHaveTextContent('Pendiente');
  });

  it('is read as one sentence; the visual parts are hidden from assistive technology', () => {
    renderList([item()]);
    const row = screen.getByRole('listitem');
    expect(within(row).getByText(/^Enviado a Luis Pérez/)).toHaveTextContent(
      'Enviado a Luis Pérez, −$250.00, 14 de octubre de 2026, 14:32, concepto Tacos',
    );
    expect(row.querySelector('[aria-hidden="true"]')).toHaveTextContent('Luis Pérez');
  });

  it('incoming items use + and "Recibido"; direction is never colour alone', () => {
    renderList([item({ direction: 'in', amount: mxn(100000), concept: null })]);
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('+$1,000.00');
    expect(row).toHaveTextContent('Recibido');
    expect(row).toHaveTextContent('Recibido de Luis Pérez');
  });

  it('AC-HOME-11: badges only for pending and failed', () => {
    renderList([item({ id: 'a', status: 'pending' }), item({ id: 'b', status: 'failed' })]);
    const [pending, failed] = screen.getAllByRole('listitem');
    expect(pending).toHaveTextContent('Pendiente');
    expect(pending).toHaveTextContent('estado Pendiente');
    expect(failed).toHaveTextContent('Fallido');
  });

  it('UIR-HOME-09 / EC-03: long names truncate visually with the full name kept; no name → masked identifier', () => {
    const long = 'María Fernanda de los Ángeles Rodríguez Villaseñor 🌮';
    renderList([
      item({ id: 'a', counterparty: { name: long, maskedIdentifier: '•••• 1' } }),
      item({ id: 'b', counterparty: { name: null, maskedIdentifier: '•••• 5678' } }),
    ]);
    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first as HTMLElement).getByTitle(long)).toHaveClass('truncate');
    expect(first).toHaveTextContent(`Enviado a ${long}`);
    expect(second).toHaveTextContent('Enviado a •••• 5678');
  });

  it('dates: yesterday and older', () => {
    const views = [
      toActivityItemView(item({ occurredAt: '2026-10-13T15:10:00Z' }), NOW, TZ),
      toActivityItemView(item({ occurredAt: '2026-10-11T23:05:00Z' }), NOW, TZ),
      toActivityItemView(item({ occurredAt: '2025-10-12T23:05:00Z' }), NOW, TZ),
    ];
    expect(views.map((v) => v.dateLabel)).toEqual([
      'Ayer, 09:10',
      '11 oct, 17:05',
      '12 oct 2025, 17:05',
    ]);
  });

  it('AC-HOME-05: empty state with a suggestion to send money', () => {
    renderList([]);
    expect(screen.getByRole('heading', { name: 'Aún no tienes movimientos' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Enviar dinero' })).toHaveAttribute(
      'href',
      '/transfer/recipient',
    );
  });

  it('initials', () => {
    expect(initialsOf('Ana López')).toBe('AL');
    expect(initialsOf('maría')).toBe('M');
    expect(initialsOf('Ángel de la Torre')).toBe('ÁT');
  });

  it('has no axe violations', async () => {
    const { container } = renderList([
      item(),
      item({ id: 'x', status: 'pending', direction: 'in' }),
    ]);
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
