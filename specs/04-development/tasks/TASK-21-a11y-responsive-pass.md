# TASK-21 — Run the accessibility and responsive pass

| Field | Value |
|---|---|
| **ID** | TASK-21 |
| **Status** | Pending |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | NFR-14 · A11Y-01…26 · UX-01 |
| **Specs** | Accessibility requirements §4 |
| **Depends on** | [TASK-20](./TASK-20-e2e-suite.md) |
| **Estimate** | 1.25 h |
| **Actual time** | — |
| **Branch / change request** | `chore/m5-quality-delivery` · commits `… [TASK-21]` |

---

## 1. Goal

Manual verification of what automation can't catch, with findings fixed.

## 2. Scope

**In scope:** Keyboard-only walkthrough; VoiceOver smoke test of the main flow and each outcome; 320 px and 200 % text; forced colors; reduced motion; fixes.
**Out of scope:** Formal audit.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `Various` | Fixes |

## 4. Acceptance criteria

- [ ] No blocking issue left in the walkthrough checklist.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-MAN-01](../../05-testing/test-plan.md#6-test-cases) | Manual | Keyboard-only walkthrough | ⬜ |
| [TC-MAN-02](../../05-testing/test-plan.md#6-test-cases) | Manual | Screen-reader smoke test | ⬜ |
| [TC-MAN-03](../../05-testing/test-plan.md#6-test-cases) | Manual | Resize and reflow | ⬜ |
| [TC-MAN-04](../../05-testing/test-plan.md#6-test-cases) | Manual | Forced colors, reduced motion, text spacing | ⬜ |

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
