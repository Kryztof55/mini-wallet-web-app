# TASK-13 — Build the Home screen

| Field | Value |
|---|---|
| **ID** | TASK-13 |
| **Status** | Done |
| **Milestone** | M2 — Home |
| **Covers** | FR-HOME-01…11 · FR-AUTH-10 · UIR-HOME-01…13 · AC-HOME-01…12 |
| **Specs** | FS-02, TS-02 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-12](./TASK-12-home-api.md) |
| **Estimate** | 2 h |
| **Actual time** | ~2.25 h |
| **Branch / change request** | `feat/m2-home` · commits `… [TASK-13]` |

---

## 1. Goal

Home with independently streamed sections, section-level retry, hide balance and header actions.

## 2. Scope

**In scope:** Page with `Suspense` per section; `BalanceCard`, `ActivityList`, `TransactionItem`, `MoneyText`, `SectionError` + `useSectionRetry`, skeletons, empty state, `HideBalanceToggle` (`hide_balance` cookie), `HomeHeader` (theme, logout), highlight support.
**Out of scope:** Transaction detail.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(private)/page.tsx` | Home: shell + two Suspense sections, hide-balance provider, highlight |
| `src/features/home/{sections,data,api,activity-view,activity-list,activity-retry,balance-retry,use-section-retry,hide-balance,skeletons,home-header,send-money-action,constants}.ts(x)` | Sections, retries, view models, preference |
| `src/components/wallet/{balance-card,transaction-item,money-text,icons}.tsx` | Wallet components |
| `src/components/ui/button-classes.ts` | `buttonClasses` moved out of the client module |
| `src/server/session/session.ts` | `getSession` cached per request |
| `src/app/(private)/transfer/recipient/page.tsx` | Placeholder target for "Enviar dinero" (TASK-15) |
| `tests/e2e/home.spec.ts` | TC-E2E-08…10 + "Enviar dinero" (owned by TASK-20, written now) |

## 4. Acceptance criteria

- [x] All FS-02 acceptance criteria pass.
- [x] A failing section never blanks the page.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-03](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useSectionRetry | ✅ |
| [TC-PL-04](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useHideBalance | ✅ |
| [TC-COMP-06](../../05-testing/test-plan.md#6-test-cases) | Component | BalanceCard and HideBalanceToggle | ✅ |
| [TC-COMP-07](../../05-testing/test-plan.md#6-test-cases) | Component | TransactionItem and ActivityList | ✅ |
| [TC-COMP-08](../../05-testing/test-plan.md#6-test-cases) | Component | Home sections | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies.
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked.
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Server page with two Suspense sections; expected failures render a client `*Retry` component that retries only its endpoint (`useSectionRetry`). Greeting and balance share one summary request (`React.cache`); the greeting falls back to "Hola". |
| 2026-10-14 | Activity view models (labels, relative date, one accessible sentence per item) are built where the data is fetched, so SSR and hydration never diverge on `Intl` output. |
| 2026-10-14 | Static render review (light, dark, failing balance; 390 px and 1100 px) caught two server/client boundary bugs that no test or build step reported: `buttonClasses()` called from a Server Component while exported from a client module (the primary action failed to render), and `HIDE_BALANCE_COOKIE` / `HIGHLIGHT_PARAM` imported from client modules (client references, not strings: hidden balance and highlight were ignored). Moved to plain modules; recorded in CLAUDE.md pitfalls. Also kept the date visible when the concept truncates. |
| 2026-10-14 | Hide toggle keeps the name "Ocultar saldo" with `aria-pressed` (FS-02 1.3). Fixed bottom action on small screens + `scroll-padding-bottom` so focus is never hidden under it. |
| 2026-10-14 | 454 tests pass (55 files); lint, typecheck, format, build ✅. |
| 2026-10-14 | First owner E2E run: auth and smoke green; TC-E2E-08…10 failed on Playwright strict mode — two elements with the balance text. The trace's DOM snapshot shows the streamed segment left behind as `<div hidden id="S:1">` outside `<main>` while the visible section is rendered by React on the client: when streamed Suspense content arrives after hydration has started, React renders the boundary itself and the stream's copy is never moved. Not reproducible with a fully buffered page. Users don't see it (`hidden`, not in the accessibility tree). Tests now assert inside `<main>`; recorded as a known limitation in TS-02. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Home page, sections, wallet components, tests, E2E spec, static render review | Layout and copy | Found and fixed the client-module boundary bugs through a static render, not through tests |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- "Actualizando…" refresh state (UIR-HOME-10) not shown: Home is dynamic and refetched per visit, so the skeletons cover it.
- After a successful balance retry the greeting stays "Hola" until the next visit.
