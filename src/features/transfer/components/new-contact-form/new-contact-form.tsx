'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { TextField } from '@/shared/ui/text-field';
import { validateContactName } from '@/core/contact';
import { parseIdentifier, type Identifier } from '@/core/identifier';
import { validateRecipient } from '@/core/transfer-rules';
import { t } from '@/shared/lib/i18n/t';
import type { NewContactInput, SaveFieldError } from '@/features/transfer/hooks/use-save-contact';

type NameError = 'required' | 'length';
type IdentifierError = 'required' | 'format' | 'self';

function nameError(value: string): NameError | null {
  const result = validateContactName(value);
  if (result.ok) return null;
  return result.error.details?.reason === 'required' ? 'required' : 'length';
}

function identifierError(value: string, own: readonly Identifier[]): IdentifierError | null {
  if (value.trim() === '') return 'required';
  const parsed = parseIdentifier(value);
  if (!parsed.ok) return 'format';
  return validateRecipient(parsed.value, own).ok ? null : 'self';
}

/**
 * New contact (UIR-TX-05): name, phone or email (same behaviour as Login), "Guardar en
 * favoritos" checked by default. Errors on blur or submit; on submit focus goes to the first
 * invalid field (AC-TX-09). BR-09 is checked here for feedback and again by the server.
 */
export function NewContactForm({
  ownIdentifiers,
  saving,
  serverError,
  onSubmit,
  onDirtyChange,
}: {
  readonly ownIdentifiers: readonly Identifier[];
  readonly saving: boolean;
  readonly serverError: SaveFieldError | null;
  readonly onSubmit: (input: NewContactInput) => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<{
    name: NameError | null;
    identifier: IdentifierError | null;
  }>({
    name: null,
    identifier: null,
  });
  const nameRef = useRef<HTMLInputElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);

  const serverName = serverError?.field === 'name' ? 'length' : null;
  const serverIdentifier = serverError?.field === 'identifier' ? serverError.reason : null;
  const shownName = errors.name ?? serverName;
  const shownIdentifier = errors.identifier ?? serverIdentifier;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const next = { name: nameError(name), identifier: identifierError(identifier, ownIdentifiers) };
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.identifier) return identifierRef.current?.focus();
    const parsed = parseIdentifier(identifier);
    if (!parsed.ok) return;
    onSubmit({ name: name.trim(), identifier: parsed.value, saveToFavorites: save });
  };

  const dirtyAfter = (nextName: string, nextIdentifier: string) =>
    onDirtyChange?.(nextName.trim() !== '' || nextIdentifier.trim() !== '');

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        ref={nameRef}
        label={t('tx.contact.name.label')}
        name="contact-name"
        autoComplete="off"
        maxLength={50}
        readOnly={saving}
        value={name}
        error={shownName ? t(`tx.contact.name.error.${shownName}`) : null}
        onChange={(event) => {
          setName(event.target.value);
          dirtyAfter(event.target.value, identifier);
          if (errors.name)
            setErrors((e) => ({ ...e, name: nameError(event.target.value) && e.name }));
        }}
        onBlur={() => {
          if (name !== '') setErrors((e) => ({ ...e, name: nameError(name) }));
        }}
      />
      <TextField
        ref={identifierRef}
        label={t('tx.contact.identifier.label')}
        name="contact-identifier"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        readOnly={saving}
        value={identifier}
        error={shownIdentifier ? t(`tx.contact.identifier.error.${shownIdentifier}`) : null}
        onChange={(event) => {
          const value = event.target.value;
          setIdentifier(value);
          dirtyAfter(name, value);
          if (errors.identifier) {
            setErrors((e) => ({
              ...e,
              identifier: identifierError(value, ownIdentifiers) && e.identifier,
            }));
          }
        }}
        onBlur={() => {
          if (identifier.trim() !== '') {
            setErrors((e) => ({ ...e, identifier: identifierError(identifier, ownIdentifiers) }));
          }
        }}
      />
      <Checkbox
        label={t('tx.contact.save')}
        checked={save}
        disabled={saving}
        onChange={(event) => setSave(event.target.checked)}
      />
      <Button type="submit" fullWidth busy={saving} busyLabel={t('tx.contact.saving')}>
        {t('common.continue')}
      </Button>
    </form>
  );
}
