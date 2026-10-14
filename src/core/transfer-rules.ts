import { domainError, type DomainError } from './errors';
import { sameIdentifier, type Identifier } from './identifier';
import { Money } from './money';
import { err, ok, type Result } from './result';
import { countCharacters, hasControlCharacters } from './text';

export const CONCEPT_MAX_LENGTH = 40;

/** BR-01 (amount > 0) and BR-02 (amount ≤ available balance). */
export function validateAmount(
  amount: Money | null,
  balance: Money,
): Result<Money, DomainError<'INVALID_AMOUNT' | 'INSUFFICIENT_FUNDS'>> {
  if (amount === null || Money.isZero(amount)) {
    return err(domainError('INVALID_AMOUNT', { reason: 'not_positive' }));
  }
  if (Money.compare(amount, balance) > 0) {
    return err(domainError('INSUFFICIENT_FUNDS', { balanceMinor: balance.amountMinor }));
  }
  return ok(amount);
}

/** BR-03 (recipient required) and BR-09 (no self-transfer against any of the sender's identifiers). */
export function validateRecipient(
  recipient: Identifier | null,
  senderIdentifiers: readonly Identifier[],
): Result<Identifier, DomainError<'RECIPIENT_REQUIRED' | 'SELF_TRANSFER'>> {
  if (recipient === null) return err(domainError('RECIPIENT_REQUIRED'));
  if (senderIdentifiers.some((own) => sameIdentifier(own, recipient))) {
    return err(domainError('SELF_TRANSFER'));
  }
  return ok(recipient);
}

/**
 * BR-15: optional concept; trimmed; at most 40 characters; no line breaks or control characters.
 * Returns `null` when empty (FS-03 EC-11).
 */
export function validateConcept(
  raw: string,
): Result<string | null, DomainError<'INVALID_CONCEPT'>> {
  if (hasControlCharacters(raw)) {
    return err(domainError('INVALID_CONCEPT', { reason: 'control_characters' }));
  }
  const concept = raw.trim();
  if (concept === '') return ok(null);
  if (countCharacters(concept) > CONCEPT_MAX_LENGTH) {
    return err(domainError('INVALID_CONCEPT', { reason: 'too_long' }));
  }
  return ok(concept);
}
