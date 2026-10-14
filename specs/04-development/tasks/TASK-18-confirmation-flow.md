# TASK-18 — Build the confirmation flow

| Field | Value |
|---|---|
| **ID** | TASK-18 |
| **Status** | Pending |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-02…07 · UIR-CONF-01…11, 16 · AC-CONF-02…10 |
| **Specs** | FS-04, TS-04 §8 |
| **Depends on** | [TASK-16](./TASK-16-transfer-amount-summary.md), [TASK-17](./TASK-17-transfers-api.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m4-confirmation-receipt` · commits `… [TASK-18]` |

---

## 1. Goal

The client state machine and outcome views that turn every server or network result into an honest, recoverable screen.

## 2. Scope

**In scope:** `useConfirmTransfer` (timeline, abort, status checks, mapping table), `ConfirmButton`, `ProcessingNotice`, `VerifyingView`, `OutcomeView` variants, client events (`tx.confirm.timeout`, `tx.confirm.unresolved`).
**Out of scope:** Receipt page (TASK-19).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/features/confirmation/*` | New |
| `src/app/(private)/transfer/summary/page.tsx` | Modify |

## 4. Acceptance criteria

- [ ] Every row of the TS-04 response → state table covered.
- [ ] No timer or request survives unmount.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-08](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useConfirmTransfer | ⬜ |
| [TC-COMP-14](../../05-testing/test-plan.md#6-test-cases) | Component | Confirmation views | ⬜ |

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
