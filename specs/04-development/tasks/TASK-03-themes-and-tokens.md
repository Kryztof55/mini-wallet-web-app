# TASK-03 — Implement design tokens, themes and theme switching

| Field | Value |
|---|---|
| **ID** | TASK-03 |
| **Status** | Pending |
| **Milestone** | M0 — Foundations |
| **Covers** | UX-22 · NFR-16 · A11Y-10, A11Y-21, A11Y-26 · UIR-AUTH-18 |
| **Specs** | ADR-007, ADR-008, ADR-002, TS-00 §13 |
| **Depends on** | [TASK-01](./TASK-01-scaffold-project.md), [TASK-06](./TASK-06-config-and-mocks.md) |
| **Estimate** | 1.25 h |
| **Actual time** | — |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-03]` |

---

## 1. Goal

Light, dark and system themes from semantic tokens, correct on first paint, switchable from every screen and persisted through the theme Server Action.

## 2. Scope

**In scope:** Tokens in `globals.css` per `data-theme` (+ `prefers-color-scheme` for system, `color-scheme`, forced-colors); Tailwind mapping; root layout reads the `theme` cookie; `ThemeProvider`; `ThemeSwitcher` (Radix); `preferencesService` + Server Action; `<html lang="es-MX">`; skip link.
**Out of scope:** Brand design; high-contrast theme.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/globals.css, tailwind config` | New — tokens |
| `src/app/layout.tsx` | New — theme attribute, providers, skip link |
| `src/features/theme/*` | New — provider, switcher |
| `src/server/actions/set-theme.ts, src/server/services/preferences.service.ts` | New |

## 4. Acceptance criteria

- [ ] No flash of the wrong theme with any of the three settings (UX-22).
- [ ] Switcher keyboard-operable, exposes current value, keeps focus (A11Y-26).
- [ ] Token pairs meet contrast in both themes (A11Y-10).
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-09](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | Theme state | ⬜ |
| [TC-COMP-02](../../05-testing/test-plan.md#6-test-cases) | Component | ThemeSwitcher | ⬜ |
| [TC-INT-14](../../05-testing/test-plan.md#6-test-cases) | Integration | Theme Server Action | ⬜ |

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
