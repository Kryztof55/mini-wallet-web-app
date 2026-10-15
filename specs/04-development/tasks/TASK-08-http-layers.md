# TASK-08 — Build the server HTTP helpers and the browser HTTP client

| Field | Value |
|---|---|
| **ID** | TASK-08 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | TS-00 §5–§6 · ADR-009 · NFR-06 |
| **Specs** | TS-00, ADR-009 |
| **Depends on** | [TASK-05](./TASK-05-domain-rules.md), [TASK-07](./TASK-07-observability.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~1 h |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-08]` |

---

## 1. Goal

One way to write controllers (parse → service → map errors) and one typed browser client with timeout, correlation and idempotency headers.

## 2. Scope

**In scope:** `toResponse` (error code → HTTP), `parseBody` with Zod, `withRequestContext`, `no-store` headers; browser `request<T>()` with `AbortController` timeout, `x-request-id`, optional `idempotency-key`, response schema parsing, `NETWORK_ERROR`/`TIMEOUT` mapping, global `401` → login redirect.
**Out of scope:** Endpoint-specific schemas (in module tasks).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/http/{status,respond,parse-body,handler,index}.ts` | New: code → status table, response builders, Zod body parsing, `withApi` controller wrapper |
| `src/lib/http/client.ts` | New: `createHttpClient` / `request` |
| `src/app/api/{client-logs,mock/reset}/route.ts` | Refactored onto `withApi` + `errorResponse` |
| `src/core/errors.ts` | `PAYLOAD_TOO_LARGE`, client-only `ABORTED` |
| `src/instrumentation.ts`, `src/server/logging/startup.ts` | Startup log moved to a Node-only module (removes the Edge build warning) |

## 4. Acceptance criteria

- [x] Every code in TS-00 §5.2 maps to its status.
- [x] Client returns `TIMEOUT` exactly at the configured time and aborts the request.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-16](../../05-testing/test-plan.md#6-test-cases) | Unit | Error code → HTTP mapping | ✅ |
| [TC-UNIT-23](../../05-testing/test-plan.md#6-test-cases) | Unit | Browser HTTP client | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (N/A: no UI)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (N/A: no UI)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Server: exhaustive `Record<ErrorCode, number>` (a new code without a status fails to compile), common error body with generic messages, `Retry-After` from `details.retryAfterSec`, `parseJsonBody` (415 / 400 `invalid_json` / 400 `schema` + first field), `withApi(route, handler)` = request ID + ALS context + one `http.request.completed` line (`errorCode` on failures) + generic 500 for exceptions, logged with `err`. |
| 2026-10-14 | Client: `createHttpClient({ fetch, onUnauthenticated })` returns `Result<{data,status,requestId}, ClientError>`, never throws. Timeout vs caller abort are distinguished (`TIMEOUT` vs `ABORTED`); non-catalog error bodies fall back by status; 2xx breaking the schema → `INTERNAL_ERROR`; 401 → one full navigation to `/login?reason=session_ended&returnTo=…` (clears in-memory state on purpose). |
| 2026-10-14 | Spec gaps found: client-logs returned 413 with no catalog code → `PAYLOAD_TOO_LARGE` (TS-00 1.4, TS-05 1.2). Fixed the pre-existing Edge build warning from `instrumentation.ts`. |
| 2026-10-14 | 229 tests pass (23 files); lint, typecheck, build ✅ with no warnings. Runtime check with `next start`: reset → 204 with the incoming `x-request-id`; client-logs text/plain → 415 with catalog body; both write one summary log line. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Server helpers, HTTP client, tests, route refactor | All | Added `ABORTED` so an unmount is not reported as a timeout; added `PAYLOAD_TOO_LARGE` instead of overloading `VALIDATION_ERROR` with a 413 |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- `GET /api/health` is not wrapped in `withApi` on purpose (readiness polling would flood the logs); it still gets `x-request-id` from the proxy in TASK-09.
- The client-logs rate limiter is in-memory per instance; production would use a shared store (ADR-006 §8).
