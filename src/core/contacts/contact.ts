import { domainError, type DomainError } from '@/core/common';
import type { Identifier } from '@/core/identity';
import type { ContactId, UserId } from '@/core/common';
import { err, ok, type Result } from '@/core/common';
import { countCharacters, hasControlCharacters } from '@/core/common';

export const CONTACT_NAME_MAX_LENGTH = 50;

/** A saved favorite (FS-03). Unique per user by normalized identifier (BR-08). */
export type Contact = {
  readonly id: ContactId;
  readonly userId: UserId;
  readonly name: string;
  readonly identifier: Identifier;
  /** ISO 8601; favorites are ordered by most recent use (UIR-TX-03). */
  readonly lastUsedAt: string | null;
};

/** BR-16: required for a new contact; 1–50 characters after trimming. */
export function validateContactName(
  raw: string,
): Result<string, DomainError<'INVALID_CONTACT_NAME'>> {
  const name = raw.trim();
  if (name === '') return err(domainError('INVALID_CONTACT_NAME', { reason: 'required' }));
  if (hasControlCharacters(name)) {
    return err(domainError('INVALID_CONTACT_NAME', { reason: 'control_characters' }));
  }
  if (countCharacters(name) > CONTACT_NAME_MAX_LENGTH) {
    return err(domainError('INVALID_CONTACT_NAME', { reason: 'too_long' }));
  }
  return ok(name);
}

const byName = new Intl.Collator('es-MX');

/** UIR-TX-03: most recently used first; never-used ones last, by name. Server and client agree. */
export function compareByRecentUse(
  a: { readonly name: string; readonly lastUsedAt: string | null },
  b: { readonly name: string; readonly lastUsedAt: string | null },
): number {
  if (a.lastUsedAt !== b.lastUsedAt) {
    if (a.lastUsedAt === null) return 1;
    if (b.lastUsedAt === null) return -1;
    return b.lastUsedAt.localeCompare(a.lastUsedAt);
  }
  return byName.compare(a.name, b.name);
}
