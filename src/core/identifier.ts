import type { Brand } from './brand';
import { domainError, type DomainError } from './errors';
import { err, ok, type Result } from './result';

/** Ten-digit Mexican phone number, digits only (ASM-01). */
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
/** Trimmed, lowercased email address. */
export type EmailAddress = Brand<string, 'EmailAddress'>;
/** Identifier partially hidden for display (`•••• 5678`, `a•••@correo.com`). */
export type MaskedIdentifier = Brand<string, 'MaskedIdentifier'>;

export type Identifier =
  | { readonly kind: 'phone'; readonly value: PhoneNumber }
  | { readonly kind: 'email'; readonly value: EmailAddress };

export type IdentifierKind = Identifier['kind'];

export const EMAIL_MAX_LENGTH = 254;

const PHONE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;

type IdentifierError = DomainError<'INVALID_IDENTIFIER'>;

/** UIR-AUTH-01: anything containing `@` is treated as an email, everything else as a phone. */
export function inferIdentifierKind(raw: string): IdentifierKind {
  return raw.includes('@') ? 'email' : 'phone';
}

function parsePhone(raw: string): Result<Identifier, IdentifierError> {
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+52')) digits = digits.slice(3);
  else if (digits.startsWith('+')) {
    return err(domainError('INVALID_IDENTIFIER', { reason: 'unsupported_country_code' }));
  } else if (digits.length === 12 && digits.startsWith('52')) digits = digits.slice(2);

  if (!PHONE_PATTERN.test(digits)) {
    return err(domainError('INVALID_IDENTIFIER', { reason: 'phone_format' }));
  }
  return ok({ kind: 'phone', value: digits as PhoneNumber });
}

function parseEmail(raw: string): Result<Identifier, IdentifierError> {
  const email = raw.trim().toLowerCase();
  if (email.length > EMAIL_MAX_LENGTH) {
    return err(domainError('INVALID_IDENTIFIER', { reason: 'email_too_long' }));
  }
  if (!EMAIL_PATTERN.test(email)) {
    return err(domainError('INVALID_IDENTIFIER', { reason: 'email_format' }));
  }
  return ok({ kind: 'email', value: email as EmailAddress });
}

/** BR-10: a Mexican 10-digit phone (after normalization) or an email of at most 254 characters. */
export function parseIdentifier(raw: string): Result<Identifier, IdentifierError> {
  const trimmed = raw.trim();
  if (trimmed === '') return err(domainError('INVALID_IDENTIFIER', { reason: 'required' }));
  return inferIdentifierKind(trimmed) === 'email' ? parseEmail(trimmed) : parsePhone(trimmed);
}

/** Stable key for maps and stores: `phone:5512345678`, `email:ana@demo.mx`. */
export function identifierKey(identifier: Identifier): string {
  return `${identifier.kind}:${identifier.value}`;
}

export function sameIdentifier(a: Identifier, b: Identifier): boolean {
  return a.kind === b.kind && a.value === b.value;
}

/** UIR-AUTH-06: phone → last four digits; email → first character + domain. */
export function maskIdentifier(identifier: Identifier): MaskedIdentifier {
  if (identifier.kind === 'phone') {
    return `•••• ${identifier.value.slice(-4)}` as MaskedIdentifier;
  }
  const [local = '', domain = ''] = identifier.value.split('@');
  return `${local.slice(0, 1)}•••@${domain}` as MaskedIdentifier;
}

export type MaskedParts =
  | { readonly kind: 'phone'; readonly last4: string }
  | { readonly kind: 'email'; readonly first: string; readonly domain: string };

/**
 * Reads back a mask produced by `maskIdentifier` so the UI can give screen readers words
 * instead of bullets (FS-03 §13: "celular terminación 5678"). `null` for anything else.
 */
export function parseMaskedIdentifier(masked: string): MaskedParts | null {
  const phone = /^•••• (\d{4})$/u.exec(masked);
  if (phone?.[1]) return { kind: 'phone', last4: phone[1] };
  const email = /^(.)•••@(.+)$/u.exec(masked);
  if (email?.[1] && email[2]) return { kind: 'email', first: email[1], domain: email[2] };
  return null;
}
