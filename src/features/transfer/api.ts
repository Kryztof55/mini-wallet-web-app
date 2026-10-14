import { z } from 'zod';
import { request, type HttpRequest } from '@/lib/http/client';

const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  maskedIdentifier: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const ContactsSchema = z.object({ items: z.array(ContactSchema) });
export const SavedContactSchema = z.object({ contact: ContactSchema, created: z.boolean() });

const TIMEOUT_MS = 10_000;

export function createContactsApi(send: HttpRequest = request) {
  return {
    list: () => send('GET', '/api/contacts', { schema: ContactsSchema, timeoutMs: TIMEOUT_MS }),
    save: (body: { readonly name: string; readonly identifier: string }) =>
      send('POST', '/api/contacts', { body, schema: SavedContactSchema, timeoutMs: TIMEOUT_MS }),
  };
}

export type ContactsApi = ReturnType<typeof createContactsApi>;
export const contactsApi = createContactsApi();
