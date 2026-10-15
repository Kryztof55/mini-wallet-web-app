'use client';

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { draftReducer, emptyDraft, type DraftAction, type TransferDraft } from './draft';

const DraftStateContext = createContext<TransferDraft | null>(null);
const DraftDispatchContext = createContext<Dispatch<DraftAction> | null>(null);

/**
 * Draft scoped to the `/transfer` layout (ADR-003, TS-03 §8): it survives moving between
 * steps and disappears when the user leaves the flow. State and dispatch are separate
 * contexts so components that only dispatch don't re-render on every change.
 */
export function TransferDraftProvider({
  initialDraft = emptyDraft,
  children,
}: {
  readonly initialDraft?: TransferDraft;
  readonly children: ReactNode;
}) {
  const [draft, dispatch] = useReducer(draftReducer, initialDraft);
  return (
    <DraftDispatchContext.Provider value={dispatch}>
      <DraftStateContext.Provider value={draft}>{children}</DraftStateContext.Provider>
    </DraftDispatchContext.Provider>
  );
}

export function useDraft(): TransferDraft {
  const draft = useContext(DraftStateContext);
  if (!draft) throw new Error('useDraft must be used inside <TransferDraftProvider>');
  return draft;
}

export function useDraftDispatch(): Dispatch<DraftAction> {
  const dispatch = useContext(DraftDispatchContext);
  if (!dispatch) throw new Error('useDraftDispatch must be used inside <TransferDraftProvider>');
  return dispatch;
}
