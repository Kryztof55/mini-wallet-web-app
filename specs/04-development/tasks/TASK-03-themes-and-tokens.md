# TASK-03 — Implement design tokens, themes and theme switching

| Field | Value |
|---|---|
| **ID** | TASK-03 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | UX-22 · NFR-16 · A11Y-10, A11Y-21, A11Y-26 · UIR-AUTH-18 |
| **Specs** | ADR-007, ADR-008, ADR-002, TS-00 §13 |
| **Depends on** | [TASK-01](./TASK-01-scaffold-project.md), [TASK-06](./TASK-06-config-and-mocks.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~1.25 h |
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
| `src/app/globals.css` | Tokens (`light-dark()`), Tailwind v4 `@theme` mapping (default palette removed), base styles, focus ring, skip link, forced-colors, reduced motion |
| `src/app/layout.tsx` | Reads the `theme` cookie → `<html data-theme>`, `ThemeProvider`, skip link, `theme-color` |
| `src/features/theme/{theme-provider,theme-switcher,theme-icons}.tsx` | Context + `useTheme`, Radix radio group switcher |
| `src/lib/theme.ts`, `src/lib/i18n/{messages.es-MX,t}.ts` | Shared theme preference type; first copy keys and `t()` |
| `src/server/actions/set-theme.ts`, `src/server/services/preferences.service.ts` | Server Action → service (cookie writer interface) |

## 4. Acceptance criteria

- [x] No flash of the wrong theme with any of the three settings (UX-22).
- [x] Switcher keyboard-operable, exposes current value, keeps focus (A11Y-26).
- [x] Token pairs meet contrast in both themes (A11Y-10).
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-09](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | Theme state | ✅ |
| [TC-COMP-02](../../05-testing/test-plan.md#6-test-cases) | Component | ThemeSwitcher | ✅ |
| [TC-INT-14](../../05-testing/test-plan.md#6-test-cases) | Integration | Theme Server Action | ✅ |
| [TC-UNIT-24](../../05-testing/test-plan.md#6-test-cases) | Unit | Theme token contrast (added in this task) | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (Persist failure keeps the applied theme for the visit.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked.
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Tokens defined once with `light-dark(light, dark)`; `data-theme` only sets `color-scheme` (`system` → `light dark`). Tailwind/Lightning CSS polyfills `light-dark()` with `--lightningcss-light/dark` switches, verified in the built CSS. Same behavior as ADR-007 (cookie + CSS for system), half the CSS and no duplicated dark block. |
| 2026-10-14 | Verified in Chromium with JavaScript removed from the server HTML: cookie `light` + OS dark → light; `dark` + OS light → dark; `system` follows the OS both ways; Tab shows "Saltar al contenido" first. |
| 2026-10-14 | Palette: slate neutrals, añil actions, jade for money in/success, grana for errors, maize for warnings. All pairs pass in both themes (lowest: `border-strong` 3.9:1 light; success on its surface 4.9:1 light). Checked option also gets a `border-strong` ring so the state does not depend on a low-contrast fill (WCAG 1.4.11). |
| 2026-10-14 | jsdom: Radix selects on focus only while an arrow key is held and roving focus moves on the next tick, so the test holds the key until focus lands. |
| 2026-10-14 | 258 tests pass (28 files); lint, typecheck, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Palette, tokens, provider, switcher, Server Action, tests, contrast test | Palette and structure | Switched from duplicated dark blocks to `light-dark()`; added `action-secondary-hover/text` tokens and TC-UNIT-24 after finding the plan had no automated contrast check below E2E |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- Setting a cookie in a Server Action makes Next re-render the current route on the server; acceptable for a rare action, but a client-only cookie write would avoid the extra render.
- `theme-color` meta follows the OS, not the user's override.
- `light-dark()` needs Chrome 123 / Safari 17.5 / Firefox 120; the Lightning CSS polyfill covers older engines through the `--lightningcss-*` variables.
