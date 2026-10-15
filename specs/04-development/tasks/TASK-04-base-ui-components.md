# TASK-04 — Build the base UI components

| Field | Value |
|---|---|
| **ID** | TASK-04 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | NFR-11 · A11Y-03, 04, 05, 07, 08, 13, 18, 19, 24 · UIR-AUTH-03, UIR-TX-13 |
| **Specs** | ADR-008, accessibility requirements §3 |
| **Depends on** | [TASK-03](./TASK-03-themes-and-tokens.md) |
| **Estimate** | 1.5 h |
| **Actual time** | ~1.5 h |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-04]` |

---

## 1. Goal

Reusable, accessible base components that implement the shared patterns once.

## 2. Scope

**In scope:** `Button` (busy state, never disabled for invalid input), `TextField` (label, hint, error, invalid state), `Checkbox`, `Card`, `Skeleton`, `ErrorState` + `ReferenceCode`, `EmptyState`, `StepIndicator`, `Dialog` and `Toast` wrappers (Radix), page-level polite live region.
**Out of scope:** Domain components (built in their module tasks).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/components/ui/{button,text-field,checkbox,card,skeleton,reference-code,error-state,empty-state,step-indicator,dialog,toast,live-announcer,icons,index}.tsx` | New |
| `src/app/layout.tsx` | Mounts `LiveAnnouncerProvider` and `ToastProvider` once for every screen |
| `src/lib/cn.ts`, `src/lib/i18n/messages.es-MX.ts` | Class joiner; copy keys `common.reference/loading/close/step/notification(s)` |
| `src/test/setup.ts` | jsdom pointer-capture stubs needed by Radix |

## 4. Acceptance criteria

- [x] Each component meets its contract in accessibility requirements §3.
- [x] No axe violations in component tests.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-COMP-01](../../05-testing/test-plan.md#6-test-cases) | Component | Base components accessibility contracts | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies.
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data. (N/A: no logging in base UI; `ReferenceCode` shows the correlation ID.)
- [x] Keyboard and assistive-technology accessible; responsive behavior checked.
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | `Button` has no `disabled` prop at the type level, so UIR-AUTH-03 / UIR-TX-13 cannot be broken by accident; `busy` keeps focus, sets `aria-busy` + `aria-disabled`, swaps to the busy label and swallows clicks and form submits. Transparent border so buttons keep a shape in forced-colors mode. 44 px default height (A11Y-13). |
| 2026-10-14 | `TextField`: label/hint/error linked with `aria-describedby` (error read first), `aria-invalid`, extra `describedBy` for things like the available balance, decorative start adornment ("$"), focus ring on the box. `Checkbox` is native. |
| 2026-10-14 | `Dialog` (Radix): found that Radix only restores focus to its own `Trigger`, so the wrapper takes a `trigger` prop (A11Y-24). Suppresses the missing-description warning when there is none. |
| 2026-10-14 | `ToastProvider` + `useToast` (Radix): `background` type → polite announcement, 5 s, dismiss button "Cerrar", Spanish region and announcement labels (Radix defaults are English). `LiveAnnouncerProvider` + `useAnnounce`: two page-level regions present from the first render; clears then sets so repeated messages are announced again. |
| 2026-10-14 | Copy: `tx.step` generalized to `common.step` (FS-03 1.2); `common.loading` (FS-02 1.2); toast keys (FS-04 1.2). |
| 2026-10-14 | Visual check in Chromium (static render, light and dark, 390 px): fields, focus ring, error, checkbox, three button variants, busy button, skeletons, error state with reference, empty state. Preview page removed afterwards. |
| 2026-10-14 | 289 tests pass (34 files); lint, typecheck, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Components, tests, visual check | All | Caught the Radix focus-return gap (added `trigger`), English Radix toast labels, and jsdom pointer-capture gaps; fixed a test-plan matrix script that skipped `E2E` IDs |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- No visual regression tests; the E2E light/dark projects plus axe cover contrast on real pages (TASK-20/21).
- `ReferenceCode` is selectable text; a copy button can be added if the receipt flow needs it (`conf.receipt.copy` is for the folio).
