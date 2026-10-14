# TASK-19 — Build the receipt and post-transfer navigation

| Field | Value |
|---|---|
| **ID** | TASK-19 |
| **Status** | Pending |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-03, 09, 10 · UIR-CONF-07, 12…15 · UIR-TX-21 · UIR-HOME-11 · AC-CONF-01, 11…14, 17 · AC-HOME-09 |
| **Specs** | FS-04, TS-04 |
| **Depends on** | [TASK-18](./TASK-18-confirmation-flow.md) |
| **Estimate** | 1 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m4-confirmation-receipt` · commits `… [TASK-19]` |

---

## 1. Goal

A revisitable receipt with copy and send-again actions, and navigation that never leads back into a finished flow.

## 2. Scope

**In scope:** Receipt page (server), `ReceiptDetails`, `CopyFolioButton`, not-found view, completion marker → Home on Back, `seedRecipient` for send again, Home highlight.
**Out of scope:** Share/download (FR-CONF-12).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/receipts/[transferId]/page.tsx` | New |
| `src/features/confirmation/receipt/*` | New |

## 4. Acceptance criteria

- [ ] Back from receipt lands on Home; reload shows the same receipt; other users' receipts not found.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-COMP-15](../../05-testing/test-plan.md#6-test-cases) | Component | Receipt | ⬜ |

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
