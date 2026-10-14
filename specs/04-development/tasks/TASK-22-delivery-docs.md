# TASK-22 — Write the delivery documents

| Field | Value |
|---|---|
| **ID** | TASK-22 |
| **Status** | Pending |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | DEL-01…05 |
| **Specs** | Specs README §7 |
| **Depends on** | [TASK-21](./TASK-21-a11y-responsive-pass.md) |
| **Estimate** | 1.25 h |
| **Actual time** | — |
| **Branch / change request** | `chore/m5-quality-delivery` · commits `… [TASK-22]` |

---

## 1. Goal

README, DECISIONS.md and AI_USAGE.md ready for the evaluators, and specs marked Implemented.

## 2. Scope

**In scope:** README (how to run, demo users and code, scripts, libraries, known limitations, actual time spent); DECISIONS.md (from ADRs, edge cases, with more time); AI_USAGE.md (from task AI-usage sections and spec phases); final statuses in the specs index.
**Out of scope:** —

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `README.md, DECISIONS.md, AI_USAGE.md` | New |
| `specs/**` | Modify — statuses |

## 4. Acceptance criteria

- [ ] Every item required by the challenge's deliverables section is present.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| — | — | No dedicated TC; verified by the checks in §4 | — |

See the [test plan](../../05-testing/test-plan.md).

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
