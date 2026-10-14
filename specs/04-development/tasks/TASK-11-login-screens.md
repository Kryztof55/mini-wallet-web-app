# TASK-11 — Build the login screens

| Field | Value |
|---|---|
| **ID** | TASK-11 |
| **Status** | Pending |
| **Milestone** | M1 — Security core + Login |
| **Covers** | FR-AUTH-01…05, 07, 11…16 · UIR-AUTH-01…17 · AC-AUTH-01…12, 15…18 |
| **Specs** | FS-01, TS-01 §6 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-10](./TASK-10-auth-api.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m1-security-login` · commits `… [TASK-11]` |

---

## 1. Goal

The two-step login of FS-01 with every UI rule, state and message.

## 2. Scope

**In scope:** `useLoginFlow` reducer, `useCountdown`, `IdentifierStep`, `CodeStep`, `OneTimeCodeField`, `ResendCountdown`, `SessionNotice`, demo hint, logout button component, copy keys.
**Out of scope:** —

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(public)/login/page.tsx` | New |
| `src/features/auth/*` | New |
| `src/lib/i18n/messages.es-MX.ts` | Modify — auth keys |

## 4. Acceptance criteria

- [ ] All FS-01 acceptance criteria pass.
- [ ] Every UIR-AUTH has a named test.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-01](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useLoginFlow | ⬜ |
| [TC-PL-02](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useCountdown | ⬜ |
| [TC-COMP-03](../../05-testing/test-plan.md#6-test-cases) | Component | IdentifierStep | ⬜ |
| [TC-COMP-04](../../05-testing/test-plan.md#6-test-cases) | Component | CodeStep and OneTimeCodeField | ⬜ |
| [TC-COMP-05](../../05-testing/test-plan.md#6-test-cases) | Component | SessionNotice | ⬜ |

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
