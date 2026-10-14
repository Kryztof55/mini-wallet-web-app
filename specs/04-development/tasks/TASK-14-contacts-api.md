# TASK-14 — Implement the contacts API

| Field | Value |
|---|---|
| **ID** | TASK-14 |
| **Status** | Pending |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-02, 04 · BR-08, BR-09, BR-10, BR-16 |
| **Specs** | TS-03 §5 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 0.5 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m3-transfer-flow` · commits `… [TASK-14]` |

---

## 1. Goal

List and save favorites with duplicate and self-transfer protection.

## 2. Scope

**In scope:** `contactsService.list`, `create`; `GET/POST /api/contacts`.
**Out of scope:** Edit/delete favorites.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/server/services/contacts.service.ts` | New |
| `src/app/api/contacts/route.ts` | New |

## 4. Acceptance criteria

- [ ] Contract of TS-03 §5: `201` new, `200` duplicate, `422` codes.
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-07](../../05-testing/test-plan.md#6-test-cases) | Integration | Contacts endpoints | ⬜ |

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
