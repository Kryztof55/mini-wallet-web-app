import { describe, expect, it } from 'vitest';
import { ensureRequestId, isValidRequestId, toReferenceCode } from './request-id';

describe('[TC-UNIT-19][NFR-04][UIR-CONF-11] request ID and reference code', () => {
  it('reuses a well-formed incoming ID so client and server agree', () => {
    const id = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';
    expect(ensureRequestId(id)).toBe(id);
    expect(ensureRequestId(id.toUpperCase())).toBe(id);
  });

  it.each([null, undefined, '', 'not-a-uuid', '3f9a12c4-5b6d-4e7f-8a9b', "x'; DROP TABLE"])(
    'replaces an invalid incoming value %j with a new UUID',
    (incoming) => {
      const id = ensureRequestId(incoming);
      expect(isValidRequestId(id)).toBe(true);
      expect(id).not.toBe(incoming);
    },
  );

  it('derives a short reference from the first 8 hex characters', () => {
    expect(toReferenceCode('3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b')).toBe('3F9A-12C4');
  });
});
