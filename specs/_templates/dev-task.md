# TASK-NN — <Title in imperative mood>

| Field | Value |
|---|---|
| **ID** | TASK-NN |
| **Status** | Pending · In progress · In review · Done |
| **Milestone** | M-N |
| **Covers** | FR-…, BR-…, UIR-…, AC-… |
| **Specs** | [FS-NN](../../01-functional/) · [TS-NN](../../02-technical/) |
| **Depends on** | TASK-NN |
| **Estimate** | N h |
| **Actual time** | — |
| **Branch / change request** | `<branch>` · <link> |

---

## 1. Goal

<!-- One or two sentences: what works once this is done. -->

## 2. Scope

**In scope:** …
**Out of scope:** …

## 3. Solution design

<!-- Brief approach. If it contradicts or extends the TS, update the TS (or write an ADR) instead of only noting it here. -->

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `<path>` | New — … |

## 4. Acceptance criteria

- [ ] AC-…: …
- [ ] …

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| TC-UNIT-NN | Unit | … | ⬜ |
| TC-E2E-NN | E2E | … | ⬜ |

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
| … | Decision, problem found, change of direction… |

## 8. AI usage

<!-- Be specific: what the AI produced and how you exercised judgment over it. -->

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| … | … | … | … |

**Decisions made by me, not by the AI:** …

## 9. Technical debt / follow-ups

- …
