import { domainError, type DomainError } from './errors';
import { err, ok, type Result } from './result';
import { countCharacters, hasControlCharacters } from './text';

export const CONTACT_NAME_MAX_LENGTH = 50;

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
