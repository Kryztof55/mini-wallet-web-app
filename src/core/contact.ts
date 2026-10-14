import { domainError, type DomainError } from './errors';
import type { Identifier } from './identifier';
import type { ContactId, UserId } from './ids';
import { err, ok, type Result } from './result';
import { countCharacters, hasControlCharacters } from './text';

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
