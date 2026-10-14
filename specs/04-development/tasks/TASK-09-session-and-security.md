# TASK-09 — Implement session handling and request security

| Field | Value |
|---|---|
| **ID** | TASK-09 |
| **Status** | Pending |
| **Milestone** | M1 — Security core + Login |
| **Covers** | BR-14 · NFR-05, NFR-17 · FR-AUTH-08, FR-AUTH-09 · UIR-AUTH-15 · AC-AUTH-13, 14, 19 |
| **Specs** | TS-01 §10, ADR-001, ADR-004 |
| **Depends on** | [TASK-06](./TASK-06-config-and-mocks.md), [TASK-07](./TASK-07-observability.md), [TASK-08](./TASK-08-http-layers.md) |
| **Estimate** | 1.5 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m1-security-login` · commits `… [TASK-09]` |

---

## 1. Goal

Private views and APIs are unreachable without a valid session, and every state-changing request is CSRF-protected.

## 2. Scope

**In scope:** Cookie sign/verify (HMAC); `SessionRepository`; `getSession()`; middleware: requestId → CSRF layers → signature gate → redirects (`returnTo`, `reason`); `(private)/layout.tsx` authority check; `withSession` for controllers; security headers.
**Out of scope:** Signed CSRF token (ADR-004 §8).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/proxy.ts` | New |
| `src/server/session/*` | New |
| `src/app/(private)/layout.tsx` | New |
| `next config (headers)` | Modify |

## 4. Acceptance criteria

- [ ] Pasted private URL in a fresh browser → Login, then back to that URL.
- [ ] Private API without session → `401` even when middleware is skipped.
- [ ] Foreign `Origin`, cross-site fetch metadata, non-JSON body or missing custom header → rejected.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-15](../../05-testing/test-plan.md#6-test-cases) | Unit | Session cookie signing | ⬜ |
| [TC-INT-01](../../05-testing/test-plan.md#6-test-cases) | Integration | CSRF protection matrix | ⬜ |
| [TC-INT-02](../../05-testing/test-plan.md#6-test-cases) | Integration | Session gate and authority | ⬜ |

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
