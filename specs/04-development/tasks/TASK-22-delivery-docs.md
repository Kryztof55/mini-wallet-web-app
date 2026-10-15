# TASK-22 — Write the delivery documents

| Field | Value |
|---|---|
| **ID** | TASK-22 |
| **Status** | In review |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | DEL-01…05 |
| **Specs** | Specs README §7 |
| **Depends on** | [TASK-21](./TASK-21-a11y-responsive-pass.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~0.75 h |
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
| `.env.example` | Reset route path corrected (`/api/mock/reset`) |
| `specs/README.md`, `specs/03-plan/implementation-plan.md` | Final statuses, versions and actual time |

## 4. Acceptance criteria

- [x] Every item required by the challenge's deliverables section is present: README (run instructions, libraries, known limitations, time spent), DECISIONS.md (structure, UI vs business logic, edge cases, with more time; plus rendering, state and E2E tool justified), AI_USAGE.md (tools and where, accepted/corrected/rejected, own decisions).
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
| 2026-10-15 | Owner decision before writing the README: demo accounts are documented there, not on the login screen; outside production an unknown identifier gets no demo code (FS-01 1.5, TS-01 1.6). |
| 2026-10-15 | README, DECISIONS.md and AI_USAGE.md written from the challenge's deliverables list, the ADRs, the FS edge-case sections, the "with more time" sections and the task cards' AI-usage tables. Claims checked against the code (e.g. rate limiting exists only on the client-log endpoint, so DECISIONS says so; TypeScript flags as configured). |
| 2026-10-15 | Plan table and specs index updated with actual times, statuses and current versions. |
| 2026-10-15 | Time spent, at the owner's request, measured from the clock rather than the cards: specs Oct 13 17:54 → Oct 14 00:33 (~6.5 h; project creation, template timestamps, specs commit), implementation Oct 14 ~10:30 → Oct 15 ~00:45 (~14 h; first dependency install at 11:11 after ~1 h of scaffolding, last commit). The cards' values (~30.5 h) were effort estimates. The owner confirmed Claude was the only AI tool. |
| 2026-10-15 | Inactivity check: with gaps over 60 min treated as pauses, traces alone give ~13.4 h; the two large gaps (Oct 13 19:05–23:45, Oct 14 19:54–22:16) were reading and analysis per the owner, so the active total stays ~20.5 h. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Drafts of the three documents, status updates | Structure | First draft claimed rate limits on login and transfers and the `exactOptionalPropertyTypes` flag; both corrected against the code. |

**Decisions made by me, not by the AI:** Demo accounts in the README instead of the login screen; no demo code for unknown identifiers outside production; the time spent declared in the README (clock time, ~20.5 h); Claude as the only AI tool.

## 9. Technical debt / follow-ups

- —
