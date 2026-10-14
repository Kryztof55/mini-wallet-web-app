# TASK-05 — Implement the domain types and business rules

| Field | Value |
|---|---|
| **ID** | TASK-05 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | BR-01…BR-17 (domain side) · NFR-03 · UIR-AUTH-06, UIR-HOME-07, UIR-HOME-08 |
| **Specs** | TS-00 §4–§5, TS-01…TS-04 §6 |
| **Depends on** | [TASK-01](./TASK-01-scaffold-project.md) |
| **Estimate** | 1.5 h |
| **Actual time** | ~0.75 h |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-05]` |

---

## 1. Goal

Framework-free domain: types, value objects, the error catalog and every business/validation rule as a pure function returning `Result`.

## 2. Scope

**In scope:** `Money`, `Identifier` + `parseIdentifier` (BR-10), `maskIdentifier`, OTP rules (BR-11…BR-13), transfer rules (BR-01…BR-05, BR-09, BR-15, BR-16), attempt status transitions (BR-17), `draftFingerprint`, `sanitizeReturnTo`, `ErrorCode` catalog, `Result` helpers, formatters (money, signed amount, relative date).
**Out of scope:** Persistence and HTTP.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/core/*` (originally `src/domain`) | New |
| `src/lib/format/*` | New |

## 4. Acceptance criteria

- [x] 100 % branch coverage on rule functions.
- [x] No imports from React, Next or server modules in `src/core` (enforced by ESLint since the rename).
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-01](../../05-testing/test-plan.md#6-test-cases) | Unit | Money value object | ✅ |
| [TC-UNIT-02](../../05-testing/test-plan.md#6-test-cases) | Unit | Amount input parsing and formatting | ✅ |
| [TC-UNIT-03](../../05-testing/test-plan.md#6-test-cases) | Unit | validateAmount | ✅ |
| [TC-UNIT-04](../../05-testing/test-plan.md#6-test-cases) | Unit | validateRecipient | ✅ |
| [TC-UNIT-05](../../05-testing/test-plan.md#6-test-cases) | Unit | parseIdentifier | ✅ |
| [TC-UNIT-06](../../05-testing/test-plan.md#6-test-cases) | Unit | maskIdentifier | ✅ |
| [TC-UNIT-07](../../05-testing/test-plan.md#6-test-cases) | Unit | parseOtpCode | ✅ |
| [TC-UNIT-08](../../05-testing/test-plan.md#6-test-cases) | Unit | evaluateOtpAttempt | ✅ |
| [TC-UNIT-09](../../05-testing/test-plan.md#6-test-cases) | Unit | canIssueCode | ✅ |
| [TC-UNIT-10](../../05-testing/test-plan.md#6-test-cases) | Unit | validateConcept | ✅ |
| [TC-UNIT-11](../../05-testing/test-plan.md#6-test-cases) | Unit | validateContactName | ✅ |
| [TC-UNIT-12](../../05-testing/test-plan.md#6-test-cases) | Unit | Attempt status transitions | ✅ |
| [TC-UNIT-14](../../05-testing/test-plan.md#6-test-cases) | Unit | sanitizeReturnTo | ✅ |
| [TC-UNIT-17](../../05-testing/test-plan.md#6-test-cases) | Unit | Formatters | ✅ |

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
| 2026-10-14 | `src/domain` (now `src/core`): Result, Brand, error catalog, Money (integer minor units), amount input parsing/cleaning/formatting, Identifier (BR-10) + masking, OTP rules (BR-11…13), transfer rules (BR-01…03, 09, 15), contact name (BR-16), attempt transitions (BR-17), sanitizeReturnTo. `src/lib/format`: es-MX money, signed amounts, relative and full dates in the user time zone. |
| 2026-10-14 | 140 unit tests (14 TCs) pass; all rule files at 100 % branches. Uncovered: defensive origin check in `sanitizeReturnTo` (kept on purpose) and `Intl` fallbacks. Lint, typecheck, Prettier ✅. |
| 2026-10-14 | Characters counted as graphemes (`Intl.Segmenter`) so accents and emoji count as one (FS-03 EC-07). OTP challenge supports `code: null` decoys for unknown identifiers (OQ-14). |
| 2026-10-14 | Folder renamed `src/domain` → `src/core` (owner decision, TS-00 1.5) with `git mv`; `@/core/*` imports; ESLint `no-restricted-imports` blocks outer layers, React/Next and I/O inside `src/core`. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Domain code and table-driven tests from FS/TS rules | Implementation and test cases | Removed an unreachable `try/catch` and two unneeded lint suppressions found by coverage/lint |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- AC-AUTH-10 ("the previous code is no longer accepted") cannot hold with a single fixed demo code (ASM-15). Proposal for TASK-10: random code per challenge, shown in the non-production demo hint. Pending owner decision.
