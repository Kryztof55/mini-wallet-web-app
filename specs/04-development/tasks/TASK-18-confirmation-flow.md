# TASK-18 — Build the confirmation flow

| Field | Value |
|---|---|
| **ID** | TASK-18 |
| **Status** | Done |
| **Milestone** | M4 — Confirmation and receipt |
| **Covers** | FR-CONF-02…07 · UIR-CONF-01…11, 16 · AC-CONF-02…10 |
| **Specs** | FS-04, TS-04 §8 |
| **Depends on** | [TASK-16](./TASK-16-transfer-amount-summary.md), [TASK-17](./TASK-17-transfers-api.md) |
| **Estimate** | 2 h |
| **Actual time** | ~2.25 h |
| **Branch / change request** | `feat/m4-confirmation-receipt` · commits `… [TASK-18]` |

---

## 1. Goal

The client state machine and outcome views that turn every server or network result into an honest, recoverable screen.

## 2. Scope

**In scope:** `useConfirmTransfer` (timeline, abort, status checks, mapping table), `ConfirmButton`, `ProcessingNotice`, `VerifyingView`, `OutcomeView` variants, client events (`tx.confirm.timeout`, `tx.confirm.unresolved`).
**Out of scope:** Receipt page (TASK-19).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/features/confirmation/*` | New |
| `src/app/(private)/transfer/summary/page.tsx` | Modify (hosts `TransferConfirmation`) |
| `src/features/transfer/{summary-step,use-step-guard,transfer-data,completion-marker,start-transfer-link}.ts(x)`, `state/draft.ts` | Processing props, completion marker, balance update, `ConfirmableDraft` |
| `src/components/wallet/detail-row.tsx`, `src/features/home/send-money-action.tsx` | Shared label/value row; "Enviar dinero" clears the marker |
| `tests/e2e/confirmation.spec.ts` | TC-E2E-15…18, 20 written early (TASK-20 owns the file) |

## 4. Acceptance criteria

- [x] Every row of the TS-04 response → state table covered.
- [x] No timer or request survives unmount.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-08](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useConfirmTransfer | ✅ |
| [TC-COMP-14](../../05-testing/test-plan.md#6-test-cases) | Component | Confirmation views | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (Every FS-04 §8 state except the receipt, TASK-19.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (`tx.confirm.timeout` and `tx.confirm.unresolved` client events with request ID and attempt key only.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (Heading focus per view, polite announcements per phase, axe in component tests and E2E; actions stacked on small viewports.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Split in three: `confirm-state.ts` (pure reducer + the TS-04 §8 mapping, testable as tables), `use-confirm-transfer.ts` (timeline only) and the views. Every timer and request belongs to a "run" with its own `AbortController`; unmount aborts it and clears its timers, and waits resolve on abort so no promise hangs. Mutation check: removing the unmount cleanup makes both unmount tests fail. |
| 2026-10-14 | Success keeps the draft (deviation from TS-04 §6, documented there): resetting it would make the mounted step guard redirect to step 1 and race the navigation to the receipt, the same bug class TC-E2E-14 found for Cancel. The completion marker is read by the guard through `useSyncExternalStore` (no hydration mismatch, no flash) and cleared by "Enviar dinero". |
| 2026-10-14 | Insufficient funds: "Cambiar monto" stores the server's balance in the flow, so the amount step shows the BR-02 error against it. The E2E reproduces it for real (another transfer drains the balance while the summary is open), not by forcing the outcome. 630 tests; lint, typecheck, format, build ✅. |
| 2026-10-14 | E2E (owner's Mac, 4 projects): TC-E2E-17 "timeout, then completed" failed 2/4 because it asserted the ~200 ms verifying view; it now asserts the status-check requests and the receipt (the view itself is covered by TC-COMP-14). All confirmation E2E green afterwards. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | State machine, views, component and E2E tests | Most | Spotted that TS-04's "reset draft on success" would race the step guard and changed the design (documented deviation). Two test-setup mistakes fixed: a fake draft fingerprint made the summary mint a new key; a slow threshold shorter than the announcer delay hid "Enviando…". |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- Until TASK-19, success navigates to `/receipts/{id}`, which does not exist yet (404).
- `tx.confirm.timeout`/`unresolved` client events are fire-and-forget; lost if the network is down (by design, no retry storms).
