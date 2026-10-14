# TASK-16 — Build the amount and summary steps

| Field | Value |
|---|---|
| **ID** | TASK-16 |
| **Status** | Pending |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-01, 05, 06, 07, 11 · BR-01, 02, 04, 15 · UIR-TX-10…13, 15…18 · AC-TX-01…04, 11, 12 |
| **Specs** | FS-03, TS-03 |
| **Depends on** | [TASK-15](./TASK-15-transfer-recipient.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m3-transfer-flow` · commits `… [TASK-16]` |

---

## 1. Goal

Amount entry with live rule feedback and a complete, editable summary.

## 2. Scope

**In scope:** `MoneyInput` (caret-safe formatting), `useAmountField`, `ConceptField`, `AmountStep`, `SummaryStep` (hide-balance masking), edit actions, confirm button hand-off to TASK-18.
**Out of scope:** Submitting the transfer.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/transfer/{amount,summary}/page.tsx` | New |
| `src/components/wallet/MoneyInput.tsx` | New |
| `src/features/transfer/*` | Modify |

## 4. Acceptance criteria

- [ ] All FS-03 amount/summary criteria pass.
- [ ] No floating-point arithmetic anywhere.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-06](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useAmountField | ⬜ |
| [TC-COMP-11](../../05-testing/test-plan.md#6-test-cases) | Component | Amount step | ⬜ |
| [TC-COMP-12](../../05-testing/test-plan.md#6-test-cases) | Component | Summary step | ⬜ |

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
