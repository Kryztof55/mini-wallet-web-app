# TASK-15 — Build the transfer layout, draft state and recipient step

| Field | Value |
|---|---|
| **ID** | TASK-15 |
| **Status** | Pending |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-02…04, 08, 09 · UIR-TX-01…09, 14, 19, 20 · AC-TX-05…10, 13, 14, 16 |
| **Specs** | FS-03, TS-03, ADR-003 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-14](./TASK-14-contacts-api.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
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
| `src/features/transfer/*` | New |

## 4. Acceptance criteria

- [ ] Draft survives step navigation and resets on cancel.
- [ ] Every UIR in scope has a named test.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-13](../../05-testing/test-plan.md#6-test-cases) | Unit | Transfer draft reducer and fingerprint | ⬜ |
| [TC-PL-05](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useStepGuard | ⬜ |
| [TC-PL-07](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useSaveContact | ⬜ |
| [TC-COMP-09](../../05-testing/test-plan.md#6-test-cases) | Component | Recipient step | ⬜ |
| [TC-COMP-10](../../05-testing/test-plan.md#6-test-cases) | Component | NewContactForm | ⬜ |
| [TC-COMP-13](../../05-testing/test-plan.md#6-test-cases) | Component | CancelTransferDialog | ⬜ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [ ] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [ ] Business logic lives in the domain/application layers, not in the UI.
- [ ] Loading / empty / error states implemented as the FS specifies.
- [ ] Errors mapped to domain codes; nothing swallowed silently.
- [ ] Log events per TS-05, with correlation ID and no sensitive data.
- [ ] Keyboard and assistive-technology accessible; responsive behavior checked.
- [ ] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| — | — |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| — | — | — | — |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- —
