# TASK-12 — Implement the Home API and services

| Field | Value |
|---|---|
| **ID** | TASK-12 |
| **Status** | Done |
| **Milestone** | M2 — Home |
| **Covers** | FR-HOME-01…03, 10 · BR-14 |
| **Specs** | TS-02 §5 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 0.5 h |
| **Actual time** | ~0.75 h |
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
| `src/server/services/account.service.ts` | New: `getSummary`, `getRecentTransactions` (clamp 1…`ACTIVITY_LIMIT`), forced outages |
| `src/app/api/me/{summary,transactions}/route.ts` | New: `withApi` + `withSession` controllers |
| `src/server/repositories/{ports,in-memory}.ts` | `getBalance` / `listRecent` return `Result` with `SERVICE_UNAVAILABLE` for seeded failing users |
| `src/server/session/cookie.ts` | Canonical base64url signature required |
| `src/test/api.ts` | `sessionCookieFor`, `jsonGet` helpers |

## 4. Acceptance criteria

- [x] Contract of TS-02 §5; seeded failing users return `503`.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-06](../../05-testing/test-plan.md#6-test-cases) | Integration | Home endpoints | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (API: empty list and 503 per section.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (N/A: API only.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Account service shared by Server Components (TASK-13) and the GET endpoints used for section retries. Outages for Beto/Marta live in the repositories (`Result` with `SERVICE_UNAVAILABLE`), like the OTP delivery in TASK-10. |
| 2026-10-14 | A tamper test started failing intermittently: flipping the last base64url character can leave the decoded signature unchanged (two unused bits). Test now tampers a middle character, and verification accepts only the canonical spelling. |
| 2026-10-14 | Runtime check through the proxy: Ana summary and 2 transactions; Beto 503; no session 401. 425 tests pass (50 files); lint, typecheck, format, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Service, controllers, tests | All | Diagnosed the flaky tamper test and added canonical-encoding check |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- —
