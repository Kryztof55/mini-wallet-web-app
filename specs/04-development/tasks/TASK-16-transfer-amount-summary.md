# TASK-16 — Build the amount and summary steps

| Field | Value |
|---|---|
| **ID** | TASK-16 |
| **Status** | Done |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-01, 05, 06, 07, 11 · BR-01, 02, 04, 15 · UIR-TX-10…13, 15…18 · AC-TX-01…04, 11, 12 |
| **Specs** | FS-03, TS-03 |
| **Depends on** | [TASK-15](./TASK-15-transfer-recipient.md) |
| **Estimate** | 2 h |
| **Actual time** | ~2.25 h |
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
| `src/app/(private)/transfer/{amount,summary}/page.tsx` | New (amount replaces the TASK-15 placeholder) |
| `src/app/(private)/transfer/layout.tsx` | Hide-balance preference for the summary |
| `src/components/wallet/money-input.tsx`, `hide-balance-toggle.tsx` | New (toggle extracted from `BalanceCard`) |
| `src/core/money-input.ts`, `src/core/text.ts` | `editAmountText`; `truncateCharacters`, `stripControlCharacters` |
| `src/features/transfer/{use-amount-field,concept-field,amount-step,summary-step,transfer-data}.ts(x)` | New / modified |
| `tests/e2e/transfer.spec.ts`, `tests/e2e/session.ts` | TC-E2E-13, TC-E2E-14 written early (TASK-20 owns the file); shared login helpers |

## 4. Acceptance criteria

- [x] All FS-03 amount/summary criteria pass.
- [x] No floating-point arithmetic anywhere. (Minor units end to end; `formatMoney` divides only to display.)
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-06](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useAmountField | ✅ |
| [TC-COMP-11](../../05-testing/test-plan.md#6-test-cases) | Component | Amount step | ✅ |
| [TC-COMP-12](../../05-testing/test-plan.md#6-test-cases) | Component | Summary step | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (Balance error with retry in place of the balance; Continuar explains it is needed.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (No new events: client steps; the balance retry reuses `GET /api/me/summary`.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (axe in component tests and E2E; E2E runs desktop and iPhone in both themes.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Caret: `editAmountText(raw, caret)` cleans and groups, then puts the caret after the same number of kept characters (cleaning is left-to-right, so cleaning the text before the caret tells how many survive). `MoneyInput` writes value and caret in the change event, so React sees no difference and does not move it. Backspace right after a comma deletes the digit before it instead of "doing nothing". |
| 2026-10-14 | Feedback timing in `useAmountField`: the shown error is derived while rendering from the stored error, the parsed amount and the balance, so BR-02 also appears if the balance arrives later (retry). BR-01 is stored only by `check()` ("Continuar") and stays until the value is valid. |
| 2026-10-14 | Balance moved into `TransferDataProvider` state with a single-flight retry, so the summary uses the retried value. Summary reuses Home's hide-balance preference (cookie read by the layout) and toggle. The concept counter is announced only in the last 5 characters; input is cut by graphemes. |
| 2026-10-14 | The cloud workspace could not reach the npm registry, so instead of a static render check, TC-E2E-13 (amount rules, concept, edit) and TC-E2E-14 (guard, cancel) were written now and run on the owner's Mac; they save `amount.png` / `summary.png` for review. 556 unit/component tests pass; lint, typecheck, format, build ✅. |
| 2026-10-14 | TC-E2E-13 green in all 4 projects; screenshots reviewed (desktop dark, iPhone light). TC-E2E-14 found a real bug from TASK-15: "Cancelar envío" on steps 2–3 ended on step 1, because `reset` emptied the draft and the still-mounted step guard's `router.replace('/transfer/recipient')` won over `router.push('/')`. Fix: new `cancelled` action (empty draft + `completed`, so the guard also goes Home). Component regression test added; it fails with the old code. TC-E2E-14 green in all 4 projects after the fix. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Caret mapping, hook, steps, tests, early E2E | Most | The TASK-15 cancel used `reset`, which raced with the step guard (caught by the early E2E, not by the isolated dialog test). Two caret test expectations were wrong (written by hand) and were corrected against the rule, not the code. First summary draft put the hide-balance toggle inside the `<dl>` (invalid structure); moved out. |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- "Enviar $X" calls `onConfirm`, which TASK-18 wires to `useConfirmTransfer`; today it does nothing.
- An amount typed but not confirmed is lost when pressing "Atrás" (the concept is kept); FS-03 only requires preserving confirmed data.
