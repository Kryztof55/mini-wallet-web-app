# TASK-04 — Build the base UI components

| Field | Value |
|---|---|
| **ID** | TASK-04 |
| **Status** | Pending |
| **Milestone** | M0 — Foundations |
| **Covers** | NFR-11 · A11Y-03, 04, 05, 07, 08, 13, 18, 19, 24 · UIR-AUTH-03, UIR-TX-13 |
| **Specs** | ADR-008, accessibility requirements §3 |
| **Depends on** | [TASK-03](./TASK-03-themes-and-tokens.md) |
| **Estimate** | 1.5 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-04]` |

---

## 1. Goal

Reusable, accessible base components that implement the shared patterns once.

## 2. Scope

**In scope:** `Button` (busy state, never disabled for invalid input), `TextField` (label, hint, error, invalid state), `Checkbox`, `Card`, `Skeleton`, `ErrorState` + `ReferenceCode`, `EmptyState`, `StepIndicator`, `Dialog` and `Toast` wrappers (Radix), page-level polite live region.
**Out of scope:** Domain components (built in their module tasks).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/components/ui/*` | New |

## 4. Acceptance criteria

- [ ] Each component meets its contract in accessibility requirements §3.
- [ ] No axe violations in component tests.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-COMP-01](../../05-testing/test-plan.md#6-test-cases) | Component | Base components accessibility contracts | ⬜ |

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
