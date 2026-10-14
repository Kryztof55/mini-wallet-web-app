# TASK-13 — Build the Home screen

| Field | Value |
|---|---|
| **ID** | TASK-13 |
| **Status** | Pending |
| **Milestone** | M2 — Home |
| **Covers** | FR-HOME-01…11 · FR-AUTH-10 · UIR-HOME-01…13 · AC-HOME-01…12 |
| **Specs** | FS-02, TS-02 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-12](./TASK-12-home-api.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m2-home` · commits `… [TASK-13]` |

---

## 1. Goal

Home with independently streamed sections, section-level retry, hide balance and header actions.

## 2. Scope

**In scope:** Page with `Suspense` per section; `BalanceCard`, `ActivityList`, `TransactionItem`, `MoneyText`, `SectionError` + `useSectionRetry`, skeletons, empty state, `HideBalanceToggle` (`hide_balance` cookie), `HomeHeader` (theme, logout), highlight support.
**Out of scope:** Transaction detail.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/page.tsx` | New |
| `src/features/home/*` | New |
| `src/components/domain/{BalanceCard,TransactionItem,MoneyText}.tsx` | New |

## 4. Acceptance criteria

- [ ] All FS-02 acceptance criteria pass.
- [ ] A failing section never blanks the page.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-03](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useSectionRetry | ⬜ |
| [TC-PL-04](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useHideBalance | ⬜ |
| [TC-COMP-06](../../05-testing/test-plan.md#6-test-cases) | Component | BalanceCard and HideBalanceToggle | ⬜ |
| [TC-COMP-07](../../05-testing/test-plan.md#6-test-cases) | Component | TransactionItem and ActivityList | ⬜ |
| [TC-COMP-08](../../05-testing/test-plan.md#6-test-cases) | Component | Home sections | ⬜ |

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
