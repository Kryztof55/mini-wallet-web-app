import { describe, expect, it } from 'vitest';
import { parseIdentifier, type Identifier } from '@/core/identity';
import type { Money } from '@/core/money';
import {
  CONCEPT_MAX_LENGTH,
  validateAmount,
  validateConcept,
  validateRecipient,
} from './transfer-rules';

const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });
const id = (raw: string): Identifier => {
  const parsed = parseIdentifier(raw);
  if (!parsed.ok) throw new Error(`bad fixture ${raw}`);
  return parsed.value;
};

describe('[TC-UNIT-03][BR-01][BR-02] validateAmount', () => {
  const balance = mxn(100000);

  it.each([
    ['empty', null],
    ['zero', mxn(0)],
  ])('rejects %s amount with INVALID_AMOUNT', (_label, amount) => {
    expect(validateAmount(amount, balance)).toEqual({
      ok: false,
      error: { code: 'INVALID_AMOUNT', details: { reason: 'not_positive' } },
    });
  });

  it('accepts the smallest positive amount (FS-03 EC-02)', () => {
    expect(validateAmount(mxn(1), balance).ok).toBe(true);
  });

  it('accepts an amount equal to the balance (FS-03 EC-01)', () => {
    expect(validateAmount(mxn(100000), balance)).toEqual({ ok: true, value: mxn(100000) });
  });

  it('rejects an amount above the balance with the current balance', () => {
    expect(validateAmount(mxn(100001), balance)).toEqual({
      ok: false,
      error: { code: 'INSUFFICIENT_FUNDS', details: { balanceMinor: 100000 } },
    });
  });

  it('rejects any amount when the balance is zero (FS-03 EC-05)', () => {
    expect(validateAmount(mxn(1), mxn(0)).ok).toBe(false);
  });
});

describe('[TC-UNIT-04][BR-03][BR-09] validateRecipient', () => {
  const sender = [id('5512345678'), id('ana@demo.mx')];

  it('requires a recipient', () => {
    expect(validateRecipient(null, sender)).toEqual({
      ok: false,
      error: { code: 'RECIPIENT_REQUIRED' },
    });
  });

  it.each(['+52 55 1234 5678', '(55) 1234-5678', ' ANA@demo.mx '])(
    'rejects the sender own identifier in any format: %j (FS-03 EC-12)',
    (raw) => {
      expect(validateRecipient(id(raw), sender)).toEqual({
        ok: false,
        error: { code: 'SELF_TRANSFER' },
      });
    },
  );

  it('accepts someone else', () => {
    expect(validateRecipient(id('5598765432'), sender).ok).toBe(true);
  });
});

describe('[TC-UNIT-10][BR-15] validateConcept', () => {
  it('is optional: empty or spaces-only becomes null (FS-03 EC-11)', () => {
    expect(validateConcept('')).toEqual({ ok: true, value: null });
    expect(validateConcept('   ')).toEqual({ ok: true, value: null });
  });

  it('trims and accepts up to 40 characters, counting accents and emoji as one', () => {
    expect(validateConcept('  Tacos  ')).toEqual({ ok: true, value: 'Tacos' });
    const forty = 'ñ'.repeat(CONCEPT_MAX_LENGTH - 1) + '👍🏽';
    expect(validateConcept(forty)).toEqual({ ok: true, value: forty });
  });

  it('rejects 41 characters', () => {
    expect(validateConcept('a'.repeat(CONCEPT_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: { code: 'INVALID_CONCEPT', details: { reason: 'too_long' } },
    });
  });

  it.each(['Renta\noctubre', 'tab\there', 'bell\u0007'])(
    'rejects line breaks and control characters: %j',
    (raw) => {
      expect(validateConcept(raw)).toEqual({
        ok: false,
        error: { code: 'INVALID_CONCEPT', details: { reason: 'control_characters' } },
      });
    },
  );
});
