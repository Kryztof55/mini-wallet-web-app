import 'server-only';
import { validateContactName, type Contact } from '@/core/contact';
import { domainError, type DomainError } from '@/core/errors';
import { maskIdentifier, parseIdentifier } from '@/core/identifier';
import type { UserId } from '@/core/ids';
import { err, ok, type Result } from '@/core/result';
import { validateRecipient } from '@/core/transfer-rules';
import { logEvent } from '@/server/logging/logger';
import { getRepositories } from '@/server/repositories';
import type { Repositories } from '@/server/repositories/ports';

export const CONTACTS_OUTCOMES = ['service_unavailable'] as const;
type ContactsOutcome = (typeof CONTACTS_OUTCOMES)[number];

/** What the client sees of a favorite (TS-03 §4): never the full identifier. */
export type ContactView = {
  readonly id: string;
  readonly name: string;
  readonly maskedIdentifier: string;
  readonly lastUsedAt: string | null;
};

export function toContactView(contact: Contact): ContactView {
  return {
    id: contact.id,
    name: contact.name,
    maskedIdentifier: maskIdentifier(contact.identifier),
    lastUsedAt: contact.lastUsedAt,
  };
}

type CreateError = DomainError<
  | 'INVALID_CONTACT_NAME'
  | 'INVALID_IDENTIFIER'
  | 'SELF_TRANSFER'
  | 'SERVICE_UNAVAILABLE'
  | 'NOT_FOUND'
>;

/** Favorites (FS-03 step 1, TS-03 §5): BR-08, BR-09, BR-10 and BR-16 enforced here. */
export function createContactsService(deps: { readonly repos: Repositories }) {
  const { repos } = deps;

  async function list(
    userId: UserId,
    forced: ContactsOutcome | null = null,
  ): Promise<Result<readonly ContactView[], DomainError<'SERVICE_UNAVAILABLE'>>> {
    if (forced === 'service_unavailable') {
      logEvent('error', 'tx.contacts.failed', { errorCode: 'SERVICE_UNAVAILABLE', forced: true });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }
    const contacts = await repos.contacts.list(userId);
    logEvent('debug', 'tx.contacts.loaded', { count: contacts.length });
    return ok(contacts.map(toContactView));
  }

  async function create(
    userId: UserId,
    input: { readonly name: string; readonly identifier: string },
    forced: ContactsOutcome | null = null,
  ): Promise<Result<{ readonly contact: ContactView; readonly created: boolean }, CreateError>> {
    const name = validateContactName(input.name);
    if (!name.ok) {
      logEvent('info', 'tx.contact.rejected', { errorCode: name.error.code });
      return err(name.error);
    }
    const identifier = parseIdentifier(input.identifier);
    if (!identifier.ok) {
      logEvent('info', 'tx.contact.rejected', { errorCode: 'INVALID_IDENTIFIER' });
      return err(domainError('INVALID_IDENTIFIER'));
    }
    if (forced === 'service_unavailable') {
      logEvent('error', 'tx.contact.save_failed', {
        errorCode: 'SERVICE_UNAVAILABLE',
        forced: true,
      });
      return err(domainError('SERVICE_UNAVAILABLE'));
    }

    const user = await repos.users.findById(userId);
    if (!user) return err(domainError('NOT_FOUND'));
    const notSelf = validateRecipient(identifier.value, user.identifiers);
    if (!notSelf.ok) {
      logEvent('info', 'tx.contact.rejected', { errorCode: 'SELF_TRANSFER' });
      return err(domainError('SELF_TRANSFER'));
    }

    const saved = await repos.contacts.save(userId, name.value, identifier.value);
    logEvent('info', saved.created ? 'tx.contact.created' : 'tx.contact.duplicate', {
      contactId: saved.contact.id,
    });
    return ok({ contact: toContactView(saved.contact), created: saved.created });
  }

  return { list, create };
}

export type ContactsService = ReturnType<typeof createContactsService>;

export function getContactsService(): ContactsService {
  return createContactsService({ repos: getRepositories() });
}
