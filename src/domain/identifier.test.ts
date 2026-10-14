import { describe, expect, it } from 'vitest';
import {
  EMAIL_MAX_LENGTH,
  identifierKey,
  inferIdentifierKind,
  maskIdentifier,
  parseIdentifier,
  type Identifier,
} from './identifier';

describe('[TC-UNIT-05][BR-10][BR-05][UIR-AUTH-01] parseIdentifier', () => {
  it.each([
    '5512345678',
    '55 1234 5678',
    '55-1234-5678',
    '(55) 1234-5678',
    '+52 (55) 1234-5678',
    '+525512345678',
    '52 5512345678',
  ])('normalizes phone %j to 5512345678 (FS-01 EC-01)', (raw) => {
    expect(parseIdentifier(raw)).toEqual({
      ok: true,
      value: { kind: 'phone', value: '5512345678' },
    });
  });

  it.each([
    ['+1 415 555 0100', 'unsupported_country_code'], // FS-01 EC-02
    ['55123', 'phone_format'],
    ['551234567890', 'phone_format'],
    ['55abc45678', 'phone_format'],
  ])('rejects phone %j (%s)', (raw, reason) => {
    expect(parseIdentifier(raw)).toEqual({
      ok: false,
      error: { code: 'INVALID_IDENTIFIER', details: { reason } },
    });
  });

  it('trims and lowercases emails (FS-01 EC-03)', () => {
    expect(parseIdentifier('  Ana@Correo.COM ')).toEqual({
      ok: true,
      value: { kind: 'email', value: 'ana@correo.com' },
    });
  });

  it.each(['ana@', '@correo.com', 'ana@correo', 'ana correo@x.com', 'ana@@correo.com'])(
    'rejects malformed email %j',
    (raw) => {
      expect(parseIdentifier(raw).ok).toBe(false);
    },
  );

  it('rejects emails longer than 254 characters (FS-01 EC-04)', () => {
    const local = 'a'.repeat(EMAIL_MAX_LENGTH - '@correo.com'.length + 1);
    expect(parseIdentifier(`${local}@correo.com`)).toEqual({
      ok: false,
      error: { code: 'INVALID_IDENTIFIER', details: { reason: 'email_too_long' } },
    });
  });

  it('requires a value', () => {
    expect(parseIdentifier('   ')).toEqual({
      ok: false,
      error: { code: 'INVALID_IDENTIFIER', details: { reason: 'required' } },
    });
  });

  it('infers the type from the presence of @', () => {
    expect(inferIdentifierKind('ana@')).toBe('email');
    expect(inferIdentifierKind('55 12')).toBe('phone');
  });

  it('builds stable keys', () => {
    expect(identifierKey({ kind: 'phone', value: '5512345678' } as Identifier)).toBe(
      'phone:5512345678',
    );
  });
});

describe('[TC-UNIT-06][UIR-AUTH-06][UIR-TX-03] maskIdentifier', () => {
  it('shows the last four digits of a phone', () => {
    expect(maskIdentifier({ kind: 'phone', value: '5512345678' } as Identifier)).toBe('•••• 5678');
  });

  it('shows the first character and the domain of an email', () => {
    expect(maskIdentifier({ kind: 'email', value: 'ana@correo.com' } as Identifier)).toBe(
      'a•••@correo.com',
    );
  });
});
