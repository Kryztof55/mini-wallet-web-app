'use client';

import { useCallback, useRef, useState } from 'react';
import type { Identifier } from '@/core/identity';
import { maskIdentifier } from '@/core/identity';
import { contactsApi as defaultApi, type ContactsApi } from '@/shared/api/contacts';
import type { ContactNotice, Recipient } from '@/features/transfer/state/draft';

export type NewContactInput = {
  readonly name: string;
  /** Already parsed and normalized on the client (BR-10); the server parses it again. */
  readonly identifier: Identifier;
  readonly saveToFavorites: boolean;
};

/** Field errors the server can still report (it is the authority). */
export type SaveFieldError =
  | { readonly field: 'name'; readonly reason: 'invalid' }
  | { readonly field: 'identifier'; readonly reason: 'format' | 'self' };

export type SaveOutcome =
  | { readonly ok: true; readonly recipient: Recipient; readonly notice: ContactNotice | undefined }
  | { readonly ok: false; readonly error: SaveFieldError };

/**
 * New contact → recipient (UIR-TX-06…08). Saving happens on "Continuar" and never blocks the
 * transfer: a failed save continues with a one-off recipient. One request at a time (EC-08).
 */
export function useSaveContact(api: ContactsApi = defaultApi) {
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const submit = useCallback(
    async (input: NewContactInput): Promise<SaveOutcome | null> => {
      const oneOff: Recipient = {
        kind: 'oneOff',
        name: input.name,
        identifier: input.identifier,
        maskedIdentifier: maskIdentifier(input.identifier),
      };
      if (!input.saveToFavorites) return { ok: true, recipient: oneOff, notice: undefined };
      if (inFlight.current) return null;

      inFlight.current = true;
      setSaving(true);
      const result = await api.save({ name: input.name, identifier: input.identifier.value });
      inFlight.current = false;
      setSaving(false);

      if (result.ok) {
        const { contact, created } = result.value.data;
        return {
          ok: true,
          recipient: {
            kind: 'contact',
            contactId: contact.id,
            name: contact.name,
            maskedIdentifier: contact.maskedIdentifier,
          },
          notice: { kind: created ? 'saved' : 'duplicate', name: contact.name },
        };
      }
      switch (result.error.code) {
        case 'INVALID_CONTACT_NAME':
          return { ok: false, error: { field: 'name', reason: 'invalid' } };
        case 'INVALID_IDENTIFIER':
          return { ok: false, error: { field: 'identifier', reason: 'format' } };
        case 'SELF_TRANSFER':
          return { ok: false, error: { field: 'identifier', reason: 'self' } };
        default:
          // Outage, network or timeout: continue as a one-off (UIR-TX-08).
          return { ok: true, recipient: oneOff, notice: { kind: 'save_failed' } };
      }
    },
    [api],
  );

  return { submit, saving };
}
