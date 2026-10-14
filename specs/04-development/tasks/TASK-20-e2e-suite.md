# TASK-20 — Write the E2E suite

| Field | Value |
|---|---|
| **ID** | TASK-20 |
| **Status** | Pending |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | NFR-09 · NFR-14 · AC-* (E2E level) |
| **Specs** | Test plan, ADR-005 |
| **Depends on** | [TASK-11](./TASK-11-login-screens.md), [TASK-13](./TASK-13-home-screen.md), [TASK-19](./TASK-19-receipt.md) |
| **Estimate** | 2 h |
| **Actual time** | — |
| **Branch / change request** | `chore/m5-quality-delivery` · commits `… [TASK-20]` |

---

## 1. Goal

End-to-end proof of every flow and every confirmation outcome, with accessibility scans in both themes.

## 2. Scope

**In scope:** Login, Home states, transfer flow, five outcomes + timeout sub-cases, Back/reload, deep link, CSRF smoke, axe on each screen (light and dark), mobile WebKit run.
**Out of scope:** Visual regression.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `tests/e2e/*` | New |

## 4. Acceptance criteria

- [ ] Suite green 10 consecutive runs (no flakiness).
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-E2E-01](../../05-testing/test-plan.md#6-test-cases) | E2E | Login with phone | ⬜ |
| [TC-E2E-02](../../05-testing/test-plan.md#6-test-cases) | E2E | Login with email | ⬜ |
| [TC-E2E-03](../../05-testing/test-plan.md#6-test-cases) | E2E | Wrong code, lock and new code | ⬜ |
| [TC-E2E-04](../../05-testing/test-plan.md#6-test-cases) | E2E | Expired code | ⬜ |
| [TC-E2E-05](../../05-testing/test-plan.md#6-test-cases) | E2E | Deep link and authenticated redirect | ⬜ |
| [TC-E2E-06](../../05-testing/test-plan.md#6-test-cases) | E2E | Session persistence and logout | ⬜ |
| [TC-E2E-07](../../05-testing/test-plan.md#6-test-cases) | E2E | Login service error | ⬜ |
| [TC-E2E-08](../../05-testing/test-plan.md#6-test-cases) | E2E | Home — normal user | ⬜ |
| [TC-E2E-09](../../05-testing/test-plan.md#6-test-cases) | E2E | Home — states and section retry | ⬜ |
| [TC-E2E-10](../../05-testing/test-plan.md#6-test-cases) | E2E | Hide balance | ⬜ |
| [TC-E2E-11](../../05-testing/test-plan.md#6-test-cases) | E2E | Transfer happy path | ⬜ |
| [TC-E2E-12](../../05-testing/test-plan.md#6-test-cases) | E2E | New contact variants | ⬜ |
| [TC-E2E-13](../../05-testing/test-plan.md#6-test-cases) | E2E | Amount rules, concept and edit | ⬜ |
| [TC-E2E-14](../../05-testing/test-plan.md#6-test-cases) | E2E | Cancel and step guard | ⬜ |
| [TC-E2E-15](../../05-testing/test-plan.md#6-test-cases) | E2E | Network error and safe retry | ⬜ |
| [TC-E2E-16](../../05-testing/test-plan.md#6-test-cases) | E2E | Insufficient funds | ⬜ |
| [TC-E2E-17](../../05-testing/test-plan.md#6-test-cases) | E2E | Timeout sub-cases | ⬜ |
| [TC-E2E-18](../../05-testing/test-plan.md#6-test-cases) | E2E | Unknown error | ⬜ |
| [TC-E2E-19](../../05-testing/test-plan.md#6-test-cases) | E2E | Receipt navigation | ⬜ |
| [TC-E2E-20](../../05-testing/test-plan.md#6-test-cases) | E2E | No double submission | ⬜ |
| [TC-E2E-21](../../05-testing/test-plan.md#6-test-cases) | E2E | Accessibility scan | ⬜ |
| [TC-E2E-22](../../05-testing/test-plan.md#6-test-cases) | E2E | Theme | ⬜ |
| [TC-E2E-23](../../05-testing/test-plan.md#6-test-cases) | E2E | Reference code correlation | ⬜ |

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
