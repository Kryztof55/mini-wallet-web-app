import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Identifier } from '@/core/identifier';
import { err, ok } from '@/core/result';
import type { ContactsApi } from './api';
import { useSaveContact } from './use-save-contact';

const identifier = { kind: 'phone', value: '5544443333' } as Identifier;
const contact = {
  id: 'ct_new',
  name: 'Pedro Gómez',
  maskedIdentifier: '•••• 3333',
  lastUsedAt: null,
};
const saved = (created: boolean, name = 'Pedro Gómez') =>
  ok({
    data: { contact: { ...contact, name }, created },
    status: created ? 201 : 200,
    requestId: 'r',
  });
const failure = (code: string) =>
  err({ code, status: code === 'NETWORK_ERROR' ? null : 503, requestId: 'r' });

function setup(response: unknown) {
  const api = {
    list: vi.fn(),
    save: vi.fn().mockResolvedValue(response),
  } as unknown as ContactsApi & {
    save: ReturnType<typeof vi.fn>;
  };
  return { api, hook: renderHook(() => useSaveContact(api)) };
}

const input = { name: 'Pedro Gómez', identifier, saveToFavorites: true };

describe('[TC-PL-07][UIR-TX-06][UIR-TX-07][UIR-TX-08] useSaveContact', () => {
  it('201 → saved contact becomes the recipient with the "saved" notice', async () => {
    const { api, hook } = setup(saved(true));
    let outcome;
    await act(async () => {
      outcome = await hook.result.current.submit(input);
    });
    expect(api.save).toHaveBeenCalledWith({ name: 'Pedro Gómez', identifier: '5544443333' });
    expect(outcome).toEqual({
      ok: true,
      recipient: {
        kind: 'contact',
        contactId: 'ct_new',
        name: 'Pedro Gómez',
        maskedIdentifier: '•••• 3333',
      },
      notice: { kind: 'saved', name: 'Pedro Gómez' },
    });
  });

  it('200 → the existing favorite (with its saved name) becomes the recipient, "duplicate" notice', async () => {
    const { hook } = setup(saved(false, 'Ana López'));
    const outcome = await act(() => hook.result.current.submit(input));
    expect(outcome).toMatchObject({
      recipient: { kind: 'contact', name: 'Ana López' },
      notice: { kind: 'duplicate', name: 'Ana López' },
    });
  });

  it.each(['SERVICE_UNAVAILABLE', 'NETWORK_ERROR', 'TIMEOUT'])(
    '%s → continue with a one-off recipient and the "save failed" notice',
    async (code) => {
      const { hook } = setup(failure(code));
      const outcome = await act(() => hook.result.current.submit(input));
      expect(outcome).toEqual({
        ok: true,
        recipient: {
          kind: 'oneOff',
          name: 'Pedro Gómez',
          identifier,
          maskedIdentifier: '•••• 3333',
        },
        notice: { kind: 'save_failed' },
      });
    },
  );

  it.each([
    ['SELF_TRANSFER', { field: 'identifier', reason: 'self' }],
    ['INVALID_IDENTIFIER', { field: 'identifier', reason: 'format' }],
    ['INVALID_CONTACT_NAME', { field: 'name', reason: 'invalid' }],
  ])('%s from the server → back to the form with a field error', async (code, error) => {
    const { hook } = setup(failure(code));
    expect(await act(() => hook.result.current.submit(input))).toEqual({ ok: false, error });
  });

  it('unchecked "Guardar en favoritos" → one-off without calling the server (AC-TX-07)', async () => {
    const { api, hook } = setup(saved(true));
    const outcome = await act(() =>
      hook.result.current.submit({ ...input, saveToFavorites: false }),
    );
    expect(api.save).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ ok: true, recipient: { kind: 'oneOff' }, notice: undefined });
  });

  it('saves once on a double submit (EC-08) and exposes the saving state', async () => {
    let resolve!: (value: unknown) => void;
    const api = {
      list: vi.fn(),
      save: vi.fn(() => new Promise((r) => (resolve = r))),
    } as unknown as ContactsApi & { save: ReturnType<typeof vi.fn> };
    const { result } = renderHook(() => useSaveContact(api));
    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.submit(input);
      second = result.current.submit(input);
    });
    expect(result.current.saving).toBe(true);
    await act(async () => {
      resolve(saved(true));
      await first;
    });
    expect(await second).toBeNull();
    expect(api.save).toHaveBeenCalledOnce();
    expect(result.current.saving).toBe(false);
  });
});
