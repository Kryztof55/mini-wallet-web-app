import { describe, expect, it } from 'vitest';
import { compareByRecentUse, CONTACT_NAME_MAX_LENGTH, validateContactName } from './contact';

describe('[TC-UNIT-11][BR-16] validateContactName', () => {
  it.each(['', '   '])('requires a name: %j', (raw) => {
    expect(validateContactName(raw)).toEqual({
      ok: false,
      error: { code: 'INVALID_CONTACT_NAME', details: { reason: 'required' } },
    });
  });

  it('trims and accepts accents, ñ and emoji as single characters (FS-03 EC-07)', () => {
    expect(validateContactName('  Begoña Ruíz 🌮 ')).toEqual({ ok: true, value: 'Begoña Ruíz 🌮' });
    const fifty = 'ñ'.repeat(CONTACT_NAME_MAX_LENGTH);
    expect(validateContactName(fifty)).toEqual({ ok: true, value: fifty });
  });

  it('rejects 51 characters', () => {
    expect(validateContactName('a'.repeat(CONTACT_NAME_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: { code: 'INVALID_CONTACT_NAME', details: { reason: 'too_long' } },
    });
  });

  it('rejects control characters', () => {
    expect(validateContactName('Ana\nLópez').ok).toBe(false);
  });
});

describe('[TC-UNIT-06][UIR-TX-03] compareByRecentUse', () => {
  it('most recent first, never used last, ties by name (es-MX)', () => {
    const list = [
      { name: 'Óscar', lastUsedAt: null },
      { name: 'Luis', lastUsedAt: '2026-10-14T10:00:00Z' },
      { name: 'Ana', lastUsedAt: null },
      { name: 'María', lastUsedAt: '2026-10-10T10:00:00Z' },
    ];
    expect([...list].sort(compareByRecentUse).map((c) => c.name)).toEqual([
      'Luis',
      'María',
      'Ana',
      'Óscar',
    ]);
  });
});
