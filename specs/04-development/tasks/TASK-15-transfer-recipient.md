# TASK-15 — Build the transfer layout, draft state and recipient step

| Field | Value |
|---|---|
| **ID** | TASK-15 |
| **Status** | Done |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-02…04, 08, 09 · UIR-TX-01…09, 14, 19, 20 · AC-TX-05…10, 13, 14, 16 |
| **Specs** | FS-03, TS-03, ADR-003 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-14](./TASK-14-contacts-api.md) |
| **Estimate** | 2 h |
| **Actual time** | ~2.5 h |
| **Branch / change request** | `feat/m3-transfer-flow` · commits `… [TASK-15]` |

---

## 1. Goal

A guarded three-step flow with a scoped draft, and a recipient step that supports favorites and new contacts.

## 2. Scope

**In scope:** Server `transfer/layout.tsx` (balance, own identifier, favorites); `TransferDraftProvider` reducer (incl. attempt key rule); `useStepGuard`; `RecipientStep`, `FavoritesList`, `ContactItem`, `NewContactForm`, `useSaveContact`; `CancelTransferDialog`.
**Out of scope:** Amount and summary (TASK-16).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/transfer/layout.tsx, recipient/page.tsx` | New |
| `src/app/(private)/transfer/amount/page.tsx` | New (placeholder step; form in TASK-16) |
| `src/features/transfer/*` | New |
| `src/components/wallet/{avatar,contact-item,recipient-context,masked-identifier}.tsx` | New |
| `src/core/identifier.ts` | `parseMaskedIdentifier` (spoken form of a mask) |
| `src/lib/hooks/use-section-retry.ts`, `src/lib/format/initials.ts` | Moved from `features/home` (now shared by Home and transfer) |

## 4. Acceptance criteria

- [x] Draft survives step navigation and resets on cancel.
- [x] Every UIR in scope has a named test.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-13](../../05-testing/test-plan.md#6-test-cases) | Unit | Transfer draft reducer and fingerprint | ✅ |
| [TC-PL-05](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useStepGuard | ✅ |
| [TC-PL-07](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useSaveContact | ✅ |
| [TC-COMP-09](../../05-testing/test-plan.md#6-test-cases) | Component | Recipient step | ✅ |
| [TC-COMP-10](../../05-testing/test-plan.md#6-test-cases) | Component | NewContactForm | ✅ |
| [TC-COMP-13](../../05-testing/test-plan.md#6-test-cases) | Component | CancelTransferDialog | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (Favorites: list, empty, error + retry; save failure continues as one-off.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (Server side from TASK-14; the client logs nothing.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (Rendered at 390 px light and 1024 px dark.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Draft lives in `TransferDraftProvider` (`useReducer`) with split state/dispatch contexts, so components that only dispatch do not re-render on every keystroke. The attempt key rule (BR-07) is in the reducer: `summaryReached` keeps the key while the fingerprint is unchanged. `completed` marks a finished transfer so the guard sends Back to Home (UIR-TX-21). |
| 2026-10-14 | Server data (balance, favorites, own identifiers for BR-09) is read once by the server layout and handed down through `TransferDataProvider` as `Loaded<T>`, so a failed read becomes a retry state instead of a crashed page. The client checks BR-09 before calling the API; the server checks it again. |
| 2026-10-14 | `useSaveContact`: unchecked "Guardar en favoritos" → one-off recipient, no request; 201/200 → saved/duplicate notice; 422 → field errors; anything else → continue as one-off with the "No pudimos guardar" notice (UIR-TX-08). Single-flight so a double tap sends one request. |
| 2026-10-14 | FS-03 §13 asks for "celular terminación 5678" as the spoken name; the first version read the bullets. Added `parseMaskedIdentifier` (core) and `MaskedIdentifierText` (shows the mask, reads words). |
| 2026-10-14 | React Compiler lint flagged the test probe writing to a module object during render; moved to an effect. 517 tests pass; lint, typecheck, format, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Reducer, contexts, guard, steps, form, tests | Most | Favorite accessible name first read "•••• 5432" (bullets) instead of the FS-03 wording; corrected. Test probe mutated a module object during render (lint error); moved to an effect. |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- E2E for the recipient flows (TC-E2E-12, TC-E2E-14) is owned by TASK-20.
- Home activity uses the masked identifier as the visible name when a counterparty has no name; give it the spoken form in TASK-21 (a11y pass).
- The amount step is a placeholder (guard, heading, notice, recipient context, cancel); TASK-16 adds the form.
