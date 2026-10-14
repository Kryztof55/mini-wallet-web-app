# TASK-10 — Implement the auth API

| Field | Value |
|---|---|
| **ID** | TASK-10 |
| **Status** | Done |
| **Milestone** | M1 — Security core + Login |
| **Covers** | FR-AUTH-01, 02, 05, 06, 10, 12…16 · BR-10…BR-13 · OQ-14 |
| **Specs** | TS-01 §5, §9 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~1.25 h |
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
| `src/server/services/auth.service.ts` | New: `createAuthService(deps)` (requestCode, verifyCode, logout) + `getAuthService()` |
| `src/app/api/auth/{code,verify,logout}/route.ts` | New controllers (`withApi` + Zod + `errorResponse`) |
| `src/server/repositories/{ports,in-memory}.ts` | `OtpDelivery` port and mock |
| `src/server/mock/controls.ts` | `logForcedOutcome` (`mock.outcome.forced` / `ignored`) |
| `src/server/logging/page-context.ts`, `src/app/(private)/layout.tsx` | Page logs carry the proxy's request ID |
| `src/test/{api,capture-logs}.ts` | Shared helpers for route tests |

## 4. Acceptance criteria

- [x] Contract and error table of TS-01 §5/§9 satisfied.
- [x] No code, session ID or full identifier in logs.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-03](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/code | ✅ |
| [TC-INT-04](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/verify | ✅ |
| [TC-INT-05](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/auth/logout | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (N/A: API only.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (N/A: API only.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Service built with injected deps (`now`, `generateCode`, repos, policy) so rules are testable; controllers stay thin. Codes from `crypto.randomInt` (uniform 6 digits). |
| 2026-10-14 | Seeded `falla.login` modelled as a failing **delivery** (new `OtpDelivery` port), not as a special case in the service. |
| 2026-10-14 | Order in verify: identifier → code format (no attempt consumed) → forced outage (no attempt consumed) → challenge evaluation → single-use delete → session. |
| 2026-10-14 | Runtime check through the proxy (`next start`): code 202 with `•••• 5678` and demo code → verify 200 `{ firstName: 'Ana', redirectTo: '/transfer/amount' }` + `HttpOnly; SameSite=Lax` cookie → `/` 200 → `/login` 307 to `/` → logout 204 clears cookie → old cookie on `/` → `/login?reason=session_ended` (no loop). The demo code appears 0 times in the server log. |
| 2026-10-14 | Found that page-level logs had no `requestId`: added `runInPageContext` (reuses the proxy's ID) to the private layout. |
| 2026-10-14 | TC-INT-12 completed (mock controls off: header ignored and logged, no `demoCode`, reset 404). 361 tests pass (42 files); lint, typecheck, format, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Auth service, controllers, tests, runtime check | All | Modelled the failing seed user as a delivery failure; added page log context after spotting logs without `requestId` |

**Decisions made by me, not by the AI:** Random code per challenge with `demoCode` outside production (decision log, TS-01 1.1).

## 9. Technical debt / follow-ups

- No per-IP rate limit on `/api/auth/*` beyond BR-12/BR-13 per identifier; production would add one at the edge.
- `OtpDelivery` mock never sends; a real SMS/email provider is out of scope.
