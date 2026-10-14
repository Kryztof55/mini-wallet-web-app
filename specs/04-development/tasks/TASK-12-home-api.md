# TASK-12 — Implement the Home API and services

| Field | Value |
|---|---|
| **ID** | TASK-12 |
| **Status** | Pending |
| **Milestone** | M2 — Home |
| **Covers** | FR-HOME-01…03, 10 · BR-14 |
| **Specs** | TS-02 §5 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 0.5 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m2-home` · commits `… [TASK-12]` |

---

## 1. Goal

Account summary and recent activity available to Server Components and as GET endpoints for retries.

## 2. Scope

**In scope:** `accountService.getSummary`, `getRecentTransactions` (limit clamp); `GET /api/me/summary`; `GET /api/me/transactions`.
**Out of scope:** —

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/services/account.service.ts` | New |
| `src/app/api/me/{summary,transactions}/route.ts` | New |

## 4. Acceptance criteria

- [ ] Contract of TS-02 §5; seeded failing users return `503`.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-06](../../05-testing/test-plan.md#6-test-cases) | Integration | Home endpoints | ⬜ |

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
