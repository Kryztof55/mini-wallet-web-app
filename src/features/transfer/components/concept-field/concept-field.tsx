'use client';

import { useId } from 'react';
import { TextField } from '@/shared/ui/text-field';
import { useAnnounce } from '@/shared/ui/live-announcer';
import { countCharacters, stripControlCharacters, truncateCharacters } from '@/core/common';
import { CONCEPT_MAX_LENGTH } from '@/core/transfers';
import { t } from '@/shared/lib/i18n/t';

/** Remaining characters at which the counter starts being announced (UIR-TX-15). */
const ANNOUNCE_FROM_REMAINING = 5;

/**
 * Optional concept (FR-TX-11, BR-15): input stops at 40 characters (graphemes, so an emoji is
 * never cut), line breaks and control characters are dropped, and a visible "{n}/40" counter
 * is announced only near the limit.
 */
export function ConceptField({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const announce = useAnnounce();
  const counterId = useId();
  const count = countCharacters(value);

  return (
    <div className="flex flex-col gap-1">
      <TextField
        label={t('tx.concept.label')}
        name="concept"
        autoComplete="off"
        enterKeyHint="done"
        value={value}
        describedBy={counterId}
        onChange={(event) => {
          const next = truncateCharacters(
            stripControlCharacters(event.target.value),
            CONCEPT_MAX_LENGTH,
          );
          const remaining = CONCEPT_MAX_LENGTH - countCharacters(next);
          if (next !== value && remaining <= ANNOUNCE_FROM_REMAINING) {
            announce(t('tx.concept.remaining', { n: remaining }));
          }
          onChange(next);
        }}
      />
      <p id={counterId} className="self-end text-sm text-text-secondary tabular-nums">
        {t('tx.concept.counter', { n: count })}
      </p>
    </div>
  );
}
