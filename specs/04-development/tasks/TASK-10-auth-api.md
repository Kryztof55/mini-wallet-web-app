# TASK-10 — Implement the auth API

| Field | Value |
|---|---|
| **ID** | TASK-10 |
| **Status** | Pending |
| **Milestone** | M1 — Security core + Login |
| **Covers** | FR-AUTH-01, 02, 05, 06, 10, 12…16 · BR-10…BR-13 · OQ-14 |
| **Specs** | TS-01 §5, §9 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 1.25 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m1-security-login` · commits `… [TASK-10]` |

---

## 1. Goal

Request code, verify code and logout endpoints with the OTP rules enforced on the server.

## 2. Scope

**In scope:** `authService` (requestCode, verifyCode, logout) and controllers; throttling and attempt limits; identical responses for unknown identifiers; time zone stored in session; demo code from config.
**Out of scope:** Real OTP delivery.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/services/auth.service.ts` | New |
| `src/app/api/auth/{code,verify,logout}/route.ts` | New |

## 4. Acceptance criteria

- [ ] Contract and error table of TS-01 §5/§9 satisfied.
- [ ] No code, session ID or full identifier in logs.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-03](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/code | ⬜ |
| [TC-INT-04](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/verify | ⬜ |
| [TC-INT-05](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/logout | ⬜ |

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
