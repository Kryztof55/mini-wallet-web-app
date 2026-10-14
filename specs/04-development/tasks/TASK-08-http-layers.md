# TASK-08 — Build the server HTTP helpers and the browser HTTP client

| Field | Value |
|---|---|
| **ID** | TASK-08 |
| **Status** | Pending |
| **Milestone** | M0 — Foundations |
| **Covers** | TS-00 §5–§6 · ADR-009 · NFR-06 |
| **Specs** | TS-00, ADR-009 |
| **Depends on** | [TASK-05](./TASK-05-domain-rules.md), [TASK-07](./TASK-07-observability.md) |
| **Estimate** | 1.25 h |
| **Actual time** | — |
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
| `src/server/http/*` | New |
| `src/lib/http/*` | New |

## 4. Acceptance criteria

- [ ] Every code in TS-00 §5.2 maps to its status.
- [ ] Client returns `TIMEOUT` exactly at the configured time and aborts the request.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-16](../../05-testing/test-plan.md#6-test-cases) | Unit | Error code → HTTP mapping | ⬜ |
| [TC-UNIT-23](../../05-testing/test-plan.md#6-test-cases) | Unit | Browser HTTP client | ⬜ |

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
