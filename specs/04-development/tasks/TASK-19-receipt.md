# TASK-19 — Build the receipt and post-transfer navigation

| Field | Value |
|---|---|
| **ID** | TASK-19 |
| **Status** | Done |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-03, 09, 10 · UIR-CONF-07, 12…15 · UIR-TX-21 · UIR-HOME-11 · AC-CONF-01, 11…14, 17 · AC-HOME-09 |
| **Specs** | FS-04, TS-04 |
| **Depends on** | [TASK-18](./TASK-18-confirmation-flow.md) |
| **Estimate** | 1 h |
| **Actual time** | ~1.25 h |
| **Branch / change request** | `feat/m4-confirmation-receipt` · commits `… [TASK-19]` |

---

## 1. Goal

A revisitable receipt with copy and send-again actions, and navigation that never leads back into a finished flow.

## 2. Scope

**In scope:** Receipt page (server), `ReceiptDetails`, `CopyFolioButton`, not-found view, completion marker → Home on Back, `seedRecipient` for send again, Home highlight.
**Out of scope:** Share/download (FR-CONF-12).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/receipts/[transferId]/page.tsx` | New |
| `src/features/confirmation/receipt/*`, `view-heading.tsx` | New (heading shared with the outcome views) |
| `src/app/(private)/transfer/again/[transferId]/page.tsx`, `src/features/transfer/send-again.tsx` | New: "Enviar otra vez" |
| `src/server/{repositories,mock,services}` | Internal recipient reference per receipt; `getSendAgainRecipient`; movement ID = transfer ID |
| `src/features/home/activity-list.tsx` | Empty-state "Enviar dinero" clears the completion marker |
| `tests/e2e/{transfer,confirmation}.spec.ts` | TC-E2E-11, TC-E2E-19 written early (TASK-20 owns the files) |

## 4. Acceptance criteria

- [x] Back from receipt lands on Home; reload shows the same receipt; other users' receipts not found.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-COMP-15](../../05-testing/test-plan.md#6-test-cases) | Component | Receipt | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (Receipt and not-found; copy failure.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (`receipt.viewed` / `receipt.not_found` with the transfer ID only.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (Heading focus, folio spelled out, axe; rendered at 390 px light and 1024 px dark.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | "Enviar otra vez" needs the recipient, but the client only ever saw the masked identifier, and a one-off recipient has no contact ID. The stored receipt keeps an internal recipient reference and a server route `/transfer/again/[id]` resolves it inside the transfer layout, seeds the draft and replaces to the amount step. Seeding there (no step guard mounted) avoids the guard race seen in TASK-16/18. |
| 2026-10-14 | The movement created by a transfer now shares the transfer's ID, so the receipt's "Ir al inicio" can highlight it on Home with the existing `?highlight=` support. Smoke test against `next start`: owner sees the receipt with folio; another user sees "No encontramos este comprobante." with no data; send-again route 200. Screenshots reviewed (390 px light, 1024 px dark, not-found). 645 tests; lint, typecheck, format, build ✅. |
| 2026-10-14 | E2E on the owner's Mac: TC-E2E-11 and TC-E2E-19 green in 4 projects. A TC-E2E-13 run failed once on WebKit because a page-wide `getByText` matched the live region's last announcement (the BR-02 error, already fixed on screen); text assertions in the transfer and confirmation specs are now scoped to `<main>`. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Receipt page and views, send-again route, tests | All | — |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- The not-found receipt answers HTTP 200 with the not-found view (the page is private and dynamic; a 404 status would not change what the user sees).
- WebKit cannot be granted clipboard permissions in Playwright; TC-E2E-19 accepts either toast there.
