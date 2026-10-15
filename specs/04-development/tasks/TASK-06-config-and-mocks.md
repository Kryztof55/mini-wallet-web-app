# TASK-06 — Implement configuration and the mock layer

| Field | Value |
|---|---|
| **ID** | TASK-06 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | NFR-10 · ASM-03, ASM-04, ASM-16, ASM-17 · FR-CONF-11 |
| **Specs** | TS-00 §8–§9 |
| **Depends on** | [TASK-05](./TASK-05-domain-rules.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~1 h |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-06]` |

---

## 1. Goal

Typed configuration and in-memory repositories with seeded users, simulated latency and the transfer outcome simulator, controllable only outside production.

## 2. Scope

**In scope:** Config schema and validation; repository ports and in-memory implementations (user, OTP, session, account, transaction, contact, attempt, transfer); seed data (TS-00 §9.1); outcome simulator (§9.2) with `x-mock-outcome`; latency; `POST /api/mock/reset`; mock controls forced off in production builds.
**Out of scope:** Real persistence.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/lib/config.ts` | New |
| `src/server/repositories/*` | New — ports + in-memory |
| `src/server/mock/*` | New — seed, simulator, latency |
| `src/app/api/mock/reset/route.ts` | New |

## 4. Acceptance criteria

- [x] Every seeded user produces the state it is meant to demonstrate.
- [x] Forcing header ignored (and logged) when mock controls are disabled.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-18](../../05-testing/test-plan.md#6-test-cases) | Unit | Outcome simulator | ✅ |
| [TC-UNIT-21](../../05-testing/test-plan.md#6-test-cases) | Unit | Configuration | ✅ |
| [TC-UNIT-22](../../05-testing/test-plan.md#6-test-cases) | Unit | Contact repository uniqueness | ✅ |
| [TC-INT-12](../../05-testing/test-plan.md#6-test-cases) | Integration | Mock controls disabled | ⬜ |

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
| 2026-10-14 | Typed config with Zod (`loadConfig`, fail-fast, `APP_ENV` gate for mock controls); public timings in `public-config.ts` (inlined NEXT_PUBLIC_*). |
| 2026-10-14 | Repository ports + in-memory implementations over one `MockDb` held in `globalThis` (shared by RSC and route handlers, survives dev reloads). Seed per TS-00 §9.1 with dates relative to reset time. Latency injectable; simulator + `readForcedOutcome`. |
| 2026-10-14 | Route renamed `/api/__mock/reset` → `/api/mock/reset`: App Router treats `_`-prefixed folders as private (no route). Specs, fixtures and test plan updated. |
| 2026-10-14 | Vitest aliases `server-only` to an empty module (the real package throws outside a React Server build). |
| 2026-10-14 | 167 tests pass (whole suite); lint, typecheck, build ✅. TC-INT-12 partially covered (reset route + header ignored); "ignored header is logged" and "demo hint off" are completed in TASK-07/TASK-10. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Config schema, repositories, seed data, simulator and tests | All | Found that `_`-prefixed route folders are private in App Router and renamed the route |

**Decisions made by me, not by the AI:** Random one-time code per challenge, shown only in the non-production demo hint (resolves ASM-15 vs AC-AUTH-10).

## 9. Technical debt / follow-ups

- —
