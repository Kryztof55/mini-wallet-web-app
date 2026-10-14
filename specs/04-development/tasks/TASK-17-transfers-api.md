# TASK-17 — Implement the transfers API

| Field | Value |
|---|---|
| **ID** | TASK-17 |
| **Status** | Pending |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-01, 08, 11, 13 · BR-06, BR-07, BR-17 · UIR-CONF-17 · AC-TX-15, AC-CONF-04, 15, 16 |
| **Specs** | TS-04 §5, §6, §10 |
| **Depends on** | [TASK-06](./TASK-06-config-and-mocks.md), [TASK-14](./TASK-14-contacts-api.md) |
| **Estimate** | 1.5 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m4-confirmation-receipt` · commits `… [TASK-17]` |

---

## 1. Goal

Idempotent, rule-enforcing transfer submission with an attempt status endpoint and atomic debit.

## 2. Scope

**In scope:** `transfersService.confirm`, `getAttemptStatus`, `getReceipt`; `POST /api/transfers` (`201/202/409/422/503/500`); `GET /api/transfers/attempts/{key}`; per-key check-and-set; simulator integration.
**Out of scope:** Reversals.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/services/transfers.service.ts` | New |
| `src/app/api/transfers/route.ts, attempts/[key]/route.ts` | New |

## 4. Acceptance criteria

- [ ] Same key never debits twice, including concurrent requests.
- [ ] Every outcome of TS-00 §9.2 reachable by forcing.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-08](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/transfers — rules | ⬜ |
| [TC-INT-09](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/transfers — idempotency | ⬜ |
| [TC-INT-10](../../05-testing/test-plan.md#6-test-cases) | Integration | Forced outcomes and attempt status | ⬜ |
| [TC-INT-11](../../05-testing/test-plan.md#6-test-cases) | Integration | Receipt ownership | ⬜ |

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
