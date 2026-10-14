# TASK-07 — Implement the observability foundation

| Field | Value |
|---|---|
| **ID** | TASK-07 |
| **Status** | Pending |
| **Milestone** | M0 — Foundations |
| **Covers** | NFR-04 · NFR-05 (logs) · UIR-CONF-11 |
| **Specs** | TS-05, ADR-006 |
| **Depends on** | [TASK-01](./TASK-01-scaffold-project.md) |
| **Estimate** | 0.75 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-07]` |

---

## 1. Goal

Every server log line is structured JSON with a correlation ID and no sensitive data; client failures can be reported and correlated.

## 2. Scope

**In scope:** pino logger with redaction; `AsyncLocalStorage` request context; typed event catalog; `instrumentation.ts`; `ensureRequestId` (used by middleware in TASK-09); `POST /api/client-logs` with limits; `reportClientEvent`; reference-code formatter.
**Out of scope:** Metrics, tracing backends.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/logging/*` | New |
| `src/instrumentation.ts` | New |
| `src/app/api/client-logs/route.ts` | New |
| `src/lib/observability/report-client-event.ts` | New |

## 4. Acceptance criteria

- [ ] Redaction removes every configured path.
- [ ] Only catalog event names compile.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-19](../../05-testing/test-plan.md#6-test-cases) | Unit | Request ID and reference code | ⬜ |
| [TC-UNIT-20](../../05-testing/test-plan.md#6-test-cases) | Unit | Log redaction | ⬜ |
| [TC-INT-13](../../05-testing/test-plan.md#6-test-cases) | Integration | Correlation and client logs | ⬜ |

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
