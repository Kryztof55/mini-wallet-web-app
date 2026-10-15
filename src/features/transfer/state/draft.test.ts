import { describe, expect, it } from 'vitest';
import type { Identifier } from '@/core/identity';
import type { Money } from '@/core/money';
import {
  draftFingerprint,
  draftReducer,
  emptyDraft,
  hasDraftData,
  requiredStep,
  type Recipient,
  type TransferDraft,
} from './draft';

const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });
const ana: Recipient = {
  kind: 'contact',
  contactId: 'ct_1',
  name: 'Ana',
  maskedIdentifier: '•••• 5678',
};
const luis: Recipient = {
  kind: 'oneOff',
  name: 'Luis',
  identifier: { kind: 'phone', value: '5544443333' } as Identifier,
  maskedIdentifier: '•••• 3333',
};

const ready = (overrides: Partial<TransferDraft> = {}): TransferDraft => ({
  ...emptyDraft,
  recipient: ana,
  amount: mxn(25000),
  concept: 'Tacos',
  ...overrides,
});

describe('[TC-UNIT-13][BR-07][UIR-TX-19][UIR-TX-21] transfer draft reducer and fingerprint', () => {
  it('recipientSelected sets the recipient and an optional one-time notice', () => {
    const next = draftReducer(emptyDraft, {
      type: 'recipientSelected',
      recipient: ana,
      notice: { kind: 'saved', name: 'Ana' },
    });
    expect(next.recipient).toBe(ana);
    expect(next.notice).toEqual({ kind: 'saved', name: 'Ana' });
    expect(draftReducer(next, { type: 'noticeShown' }).notice).toBeNull();
  });

  it('amountConfirmed and conceptChanged keep the rest of the draft (UIR-TX-19)', () => {
    let draft = draftReducer(emptyDraft, { type: 'recipientSelected', recipient: ana });
    draft = draftReducer(draft, { type: 'amountConfirmed', amount: mxn(100), concept: 'Cena' });
    draft = draftReducer(draft, { type: 'conceptChanged', concept: 'Cena y tacos' });
    expect(draft).toMatchObject({ recipient: ana, amount: mxn(100), concept: 'Cena y tacos' });
  });

  it('summaryReached keeps the attempt key while nothing changed', () => {
    const first = draftReducer(ready(), { type: 'summaryReached', newKey: 'key-1' });
    expect(first.attempt?.key).toBe('key-1');
    const again = draftReducer(first, { type: 'summaryReached', newKey: 'key-2' });
    expect(again.attempt?.key).toBe('key-1');
  });

  it.each([
    ['recipient', { recipient: luis }],
    ['amount', { amount: mxn(30000) }],
    ['concept', { concept: 'Otra cosa' }],
  ] as const)('a changed %s gets a new attempt key', (_label, change) => {
    const first = draftReducer(ready(), { type: 'summaryReached', newKey: 'key-1' });
    const edited = { ...first, ...change };
    expect(draftReducer(edited, { type: 'summaryReached', newKey: 'key-2' }).attempt?.key).toBe(
      'key-2',
    );
  });

  it('the fingerprint ignores surrounding spaces in the concept and identifies one-off recipients by identifier', () => {
    expect(draftFingerprint(ready({ concept: ' Tacos ' }))).toBe(draftFingerprint(ready()));
    const other = { ...luis, name: 'Luis P.' };
    expect(draftFingerprint(ready({ recipient: other }))).toBe(
      draftFingerprint(ready({ recipient: luis })),
    );
  });

  it('reset clears everything; seedRecipient starts a new draft with that recipient (UIR-TX-21)', () => {
    const used = draftReducer(draftReducer(ready(), { type: 'summaryReached', newKey: 'k' }), {
      type: 'completed',
    });
    expect(draftReducer(used, { type: 'reset' })).toEqual(emptyDraft);
    expect(draftReducer(used, { type: 'seedRecipient', recipient: luis })).toEqual({
      ...emptyDraft,
      recipient: luis,
    });
  });

  it('cancelled discards the data and ends the flow (UIR-TX-20)', () => {
    const cancelled = draftReducer(ready(), { type: 'cancelled' });
    expect(cancelled).toEqual({ ...emptyDraft, completed: true });
    expect(hasDraftData(cancelled)).toBe(false);
  });

  it('completed marks the draft; choosing a recipient again clears the mark', () => {
    const done = draftReducer(ready(), { type: 'completed' });
    expect(done.completed).toBe(true);
    expect(draftReducer(done, { type: 'recipientSelected', recipient: luis }).completed).toBe(
      false,
    );
  });

  it('hasDraftData and requiredStep (UIR-TX-14, UIR-TX-20)', () => {
    expect(hasDraftData(emptyDraft)).toBe(false);
    expect(hasDraftData({ ...emptyDraft, concept: '   ' })).toBe(false);
    expect(hasDraftData({ ...emptyDraft, recipient: ana })).toBe(true);

    expect(requiredStep(emptyDraft, 'recipient')).toBeNull();
    expect(requiredStep(emptyDraft, 'amount')).toBe('recipient');
    expect(requiredStep(emptyDraft, 'summary')).toBe('recipient');
    expect(requiredStep({ ...emptyDraft, recipient: ana }, 'summary')).toBe('amount');
    expect(requiredStep(ready(), 'summary')).toBeNull();
  });
});
