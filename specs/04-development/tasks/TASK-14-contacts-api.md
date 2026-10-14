# TASK-14 — Implement the contacts API

| Field | Value |
|---|---|
| **ID** | TASK-14 |
| **Status** | Done |
| **Milestone** | M3 — Transfer flow |
| **Covers** | FR-TX-02, 04 · BR-08, BR-09, BR-10, BR-16 |
| **Specs** | TS-03 §5 |
| **Depends on** | [TASK-09](./TASK-09-session-and-security.md) |
| **Estimate** | 0.5 h |
| **Actual time** | ~0.5 h |
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
| `src/server/services/contacts.service.ts` | New: `list`, `create` (BR-16 → BR-10 → BR-09 → BR-08 via repository), `toContactView` |
| `src/app/api/contacts/route.ts` | New: `GET`/`POST` with `withApi` + `withSession`, forced `service_unavailable` |

## 4. Acceptance criteria

- [x] Contract of TS-03 §5: `201` new, `200` duplicate, `422` codes.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-INT-07](../../05-testing/test-plan.md#6-test-cases) | Integration | Contacts endpoints | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (API: empty list, 503.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (N/A: API only.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Responses carry only the masked identifier (TS-03 §4); the full one never leaves the server. Duplicate detection uses the normalized identifier, so `55 9876 5432` matches a saved `5598765432` (200, nothing created). Self-transfer checked against every identifier of the user (phone and email, any format). |
| 2026-10-14 | 13 integration tests (TC-INT-07), including "no names or identifiers in logs". 467 tests pass; lint, typecheck, format, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Service, controller, tests | All | — |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- —
