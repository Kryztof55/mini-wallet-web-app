# TASK-17 — Implement the transfers API

| Field | Value |
|---|---|
| **ID** | TASK-17 |
| **Status** | Done |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-01, 08, 11, 13 · BR-06, BR-07, BR-17 · UIR-CONF-17 · AC-TX-15, AC-CONF-04, 15, 16 |
| **Specs** | TS-04 §5, §6, §10 |
| **Depends on** | [TASK-06](./TASK-06-config-and-mocks.md), [TASK-14](./TASK-14-contacts-api.md) |
| **Estimate** | 1.5 h |
| **Actual time** | ~1.75 h |
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
| `src/server/repositories/{ports,in-memory}.ts` | `attempts.claim`, `ledger.commitTransfer` (atomic); `receipts.save` removed (the commit stores it) |
| `src/test/transfers.ts` | Route helpers for the integration tests |

## 4. Acceptance criteria

- [x] Same key never debits twice, including concurrent requests.
- [x] Every outcome of TS-00 §9.2 reachable by forcing.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-08](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/transfers — rules | ✅ |
| [TC-INT-09](../../05-testing/test-plan.md#6-test-cases) | Integration | POST /api/transfers — idempotency | ✅ |
| [TC-INT-10](../../05-testing/test-plan.md#6-test-cases) | Integration | Forced outcomes and attempt status | ✅ |
| [TC-INT-11](../../05-testing/test-plan.md#6-test-cases) | Integration | Receipt ownership | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (API: every TS-04 §5 status.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (TS-04 §11 events; a test checks no names, identifiers or concepts in logs.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (N/A: API only.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Idempotency rests on `attempts.claim`, an atomic check-and-set: two concurrent requests with the same key never both process. Verified by mutation: adding an `await` between the check and the set makes the concurrency test fail with a double debit. Debit, movement and receipt are one `ledger.commitTransfer` step, so two different transfers racing for the same money cannot both pass BR-02 (test with Nico: 2 × $300 against $500 → one 201, one 422). |
| 2026-10-14 | Rules run before the simulated outcome (TS-00 §9.2): a genuinely insufficient balance is `INSUFFICIENT_FUNDS` even with `x-mock-outcome: network_error`. Rule failures are stored as `failed`, so the same key returns the same 422. Amount values are checked by the domain (`INVALID_AMOUNT` 422), not by the schema, so each rule has its specific code. |
| 2026-10-14 | Timeout sub-cases tested with fake timers. Two pitfalls: the request reaches its delay only after real async work (session HMAC), and `vi.waitFor` advances fake timers while polling; the test waits for the timer with `setImmediate` turns instead. Stable in 5 consecutive runs. Smoke test against `next start` through the proxy: 201, replay, status, debit once, 403 without Origin, 401 without session. 597 tests; lint, typecheck, format, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Ports, service, routes, integration tests | Most | First timeout tests hung (fake clock advanced before the request scheduled its delay), then passed for the wrong reason (`vi.waitFor` advanced the clock); fixed the wait. One test used Ana's contact for Carla (wrong owner → `RECIPIENT_REQUIRED`). |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- The recipient is never credited, even if the identifier is a seeded user (TS-04 §16).
- Simulated timeouts hold the HTTP connection (up to 29 s by default); E2E can shorten them with the `NEXT_PUBLIC_TRANSFER_*` timings.
