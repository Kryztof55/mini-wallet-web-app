# ADR-007 — Semantic CSS tokens with a cookie-backed theme preference

| Field | Value |
|---|---|
| **ID** | ADR-007 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, all UI |
| **Driven by** | UX-22 (light/dark, system default, no flash) · NFR-16 (semantic tokens) · A11Y-10, A11Y-26 |

---

## 1. Context

Dark mode is required (decision log, 2026-10-13). The app follows the OS preference by default, lets the user override it (light / dark / system), persists the choice, and must render the right theme on the first paint. Pages are server-rendered (ADR-002), so the server must know the preference before sending HTML.

## 2. Decision drivers

1. No flash of the wrong theme, including on the first server render.
2. Components never reference raw colors (NFR-16).
3. Contrast verifiable per theme (A11Y-10); respects OS forced-colors mode.
4. Minimal client JavaScript and no hydration mismatches.

## 3. Options considered

- **A — Preference in `localStorage` + inline blocking script before paint (common library approach):** ✅ works without server knowledge. ❌ Server HTML doesn't know the theme → requires a blocking script and suppressing hydration warnings.
- **B — Preference in a cookie read by the server; "system" resolved by CSS media query:** ✅ server renders the correct attribute; "system" needs no JS at all; no hydration mismatch. ❌ Cookie sent on every request (a few bytes).
- **C — OS preference only, no override:** ✅ trivial. ❌ Fails UX-22 (user override).

## 4. Decision

**We choose Option B: semantic design tokens as CSS custom properties, a `theme` cookie (`light` | `dark` | `system`) read by the root layout, and CSS `prefers-color-scheme` for `system`.**

## 5. Rationale

- Root layout reads the cookie and renders `<html data-theme="light|dark|system">`.
- CSS defines tokens for `[data-theme="light"]`, `[data-theme="dark"]`, and for `[data-theme="system"]` inside `@media (prefers-color-scheme: dark)` → correct on first paint with zero JavaScript.
- `color-scheme` is set per theme so native controls and scrollbars match.
- Changing the theme updates the attribute immediately on the client and persists via the **theme Server Action** (ADR-002's documented exception), which sets the cookie. Focus stays on the control (A11Y-26).
- Tokens are semantic (`--color-surface`, `--color-text-primary`, `--color-status-error`, `--color-amount-in`, `--color-focus-ring`…); each pair is contrast-checked in both themes.
- Forced-colors mode: focus rings and borders use system colors when `forced-colors: active`.

## 6. Consequences

**Positive**
- Correct theme on first paint for all three settings; no blocking script.
- Adding or adjusting a theme touches only token definitions.

**Negative / accepted costs**
- The cookie is not `HttpOnly` (the client may read it to sync the control); it contains no sensitive data.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Design tokens | CSS custom properties, semantic names, defined per `data-theme` |
| Theme preference persistence | `theme` cookie (`SameSite=Lax`, 1 year) |
| System theme | CSS `prefers-color-scheme` media query |
| Theme update | Theme Server Action + immediate client attribute update |

## 8. In production or with more time

- Tokens generated from a design-token source file (e.g. W3C design tokens format) shared with design tools.
- High-contrast theme variant.

## 9. How we validate the decision

- E2E with `colorScheme: 'dark'` and no cookie renders dark on first paint (screenshot before hydration).
- axe-core contrast checks pass in light and dark projects.

## 10. References

- UX-22 · NFR-16 · A11Y-10, A11Y-26 · ADR-002 · ADR-008
