# TASK-21 — Run the accessibility and responsive pass

| Field | Value |
|---|---|
| **ID** | TASK-21 |
| **Status** | In review (VoiceOver run pending) |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | NFR-14 · A11Y-01…26 · UX-01 |
| **Specs** | Accessibility requirements §4 |
| **Depends on** | [TASK-20](./TASK-20-e2e-suite.md) |
| **Estimate** | 1.25 h |
| **Actual time** | ~1.5 h |
| **Branch / change request** | `chore/m5-quality-delivery` · commits `… [TASK-21]` |

---

## 1. Goal

Manual verification of what automation can't catch, with findings fixed.

## 2. Scope

**In scope:** Keyboard-only walkthrough; VoiceOver smoke test of the main flow and each outcome; 320 px and 200 % text; forced colors; reduced motion; fixes.
**Out of scope:** Formal audit.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/features/home/activity-view.ts` | Spoken counterparty (masked identifier as words) and spoken amount in the item sentence |
| `src/features/home/components/transaction-item/` | Row reflows at narrow widths: amount drops to its own line, secondary line wraps, status badge moved next to the date |
| `src/features/auth/components/code-step/` | Code instructions read the destination as words |
| `src/shared/lib/format/money.ts`, `src/shared/components/money-text/` | `spokenMoney` ("250 pesos", "12345 pesos con 67 centavos"); `MoneyText` shows the symbol and reads the words |
| `src/shared/components/theme/theme-switcher.tsx` | Wraps instead of overflowing |
| `src/features/transfer/components/{contact-item,recipient-context}/` | Names wrap instead of truncating; "Cambiar" is a 44 px target and drops to its own line when space runs out |
| `src/shared/ui/checkbox/` | 24 × 24 px |
| `src/styles/base.css` | Headings: `overflow-wrap: anywhere` |
| `tests/e2e/a11y.spec.ts` | TC-E2E-21: reflow at 320 px with a text-spacing override on every main view |

## 4. Acceptance criteria

- [x] No blocking issue left in the walkthrough checklist (scripted part; VoiceOver run pending).
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-MAN-01](../../05-testing/test-plan.md#6-test-cases) | Manual | Keyboard-only walkthrough | ✅ |
| [TC-MAN-02](../../05-testing/test-plan.md#6-test-cases) | Manual | Screen-reader smoke test | ⏳ owner's VoiceOver run (§10) |
| [TC-MAN-03](../../05-testing/test-plan.md#6-test-cases) | Manual | Resize and reflow | ✅ |
| [TC-MAN-04](../../05-testing/test-plan.md#6-test-cases) | Manual | Forced colors, reduced motion, text spacing | ✅ |

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
| 2026-10-14 | **How the pass was run.** Production build in Chromium, driven by a throwaway script, on 10 views: login (both steps), Home, recipient, new-contact form, amount with error, summary, network-error outcome, receipt, cancel dialog. Modes: 320 × 640, 360 × 780, landscape 640 × 320, browser zoom 200 % (640 px at DPR 2), text-only 200 % at 375 px, WCAG 1.4.12 text spacing at 320 px, forced colors, reduced motion, desktop dark. Checks: horizontal scroll and content outside the viewport, clipped text, a Tab walk of each view (focus indicator present, not covered, target size), boundaries and selected states in forced colors, running animations and transitions with reduced motion, dialog focus trap and Escape. Plus a screenshot review of each view and an accessibility-tree read of code step, Home, summary and receipt. |
| 2026-10-14 | **Findings and fixes.** See the table below. After the fixes the script reports nothing except the truncated activity names and concepts at 200 % text, which UIR-HOME-09 and FS-02 §9 specify (full text in `title` and in the item's sentence). |
| 2026-10-14 | False alarms ruled out: fields draw their focus ring on the wrapper (`focus-within`), not the `<input>`; the theme switcher marks the checked option with an outline in forced colors; dialog focus does return to "Cancelar" (Radix restores it in a `setTimeout`, so a check made in the same tick sees `<body>`). |

| # | Finding | Where | Requirement | Fix |
|---|---|---|---|---|
| 1 | The theme switcher overflows 320 px with text spacing (11 px of horizontal scroll on every view) and at 200 % text | Header | A11Y-12 (1.4.10, 1.4.12) | Segmented control wraps (`flex-wrap`, `max-w-full`) |
| 2 | Activity row: at 320 px the status badge overlaps the date, names are cut to "Empre…", concepts to "T.." | Home | A11Y-12, UIR-HOME-06 | Right column holds only amount and direction; when the name column would get narrower than 7rem the amount drops to its own line; the secondary line wraps (concept → date → status) |
| 3 | Favorite names and the recipient on the amount step vanish behind an ellipsis at large text; "Cambiar" covers the masked number | Recipient, amount | A11Y-12 | Names wrap; "Cambiar" is 44 px high and drops to its own line when space runs out |
| 4 | A long heading word ("conectarnos") overflows at 200 % text | Outcome views | A11Y-12 | Headings use `overflow-wrap: anywhere` |
| 5 | "Guardar en favoritos" checkbox is 20 × 20 px | New contact | A11Y-13 (2.5.8) | 24 × 24 px |
| 6 | Home activity, unnamed counterparty: read as "Enviado a bullet bullet bullet bullet 5678" | Home | A11Y-17 | Spoken as "celular terminación 5678" / "correo que empieza con l, en demo.mx" |
| 7 | Code step instructions read the destination as bullets | Login | A11Y-17 | Same spoken form via `spokenMaskedIdentifier` |
| 8 | Amounts read as "$250.00": a non-Mexican voice may say "dólares", and a Spain voice reads "12,345" as a decimal. FS-02 §13 asks for "250 pesos" | Home, summary, receipt, activity | A11Y-17 | `spokenMoney`: "250 pesos", "12345 pesos con 67 centavos"; `MoneyText` shows the symbol, reads the words. The "Enviar $250.00" button keeps its visible label as its name (2.5.3) |

Kept by design: secondary actions (theme options, "Cerrar sesión", "Ocultar saldo", "Copiar folio") are 36 px high and the summary's edit links 28 px. They meet the 24 px minimum (A11Y-13 Must); 44 px is the Should target for primary and frequent actions, which all are (44–60 px).

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| — | — | — | — |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- The pass covered Chromium only (forced colors and reduced motion are emulated). WebKit is covered by the E2E projects and by the VoiceOver run.

## 10. VoiceOver run (TC-MAN-02) — for the owner

macOS: `Cmd + F5` toggles VoiceOver; `Ctrl + Option + →` reads the next item; `Ctrl + Option + U` opens the rotor (headings, landmarks). iPhone: Settings → Accessibility → VoiceOver; swipe right for the next item. Use Safari, with the system voice set to Spanish (Mexico) if possible. About 10 minutes.

| # | Do | Expect to hear |
|---|---|---|
| 1 | Login: type `5512345678`, Continuar | Focus on the code field: "Código de verificación … Enviamos un código de 6 dígitos a celular terminación 5678" |
| 2 | Copy the demo code and paste it into the field (no typing) | Paste works; after "Verificar" you land on Home |
| 3 | While the resend countdown runs, stay on the page for 10 s | The countdown is not announced every second |
| 4 | Home: read the balance, then the first movements | "Saldo disponible … 12345 pesos con 67 centavos"; each movement as one sentence, e.g. "Enviado a Luis Pérez, 250 pesos, 14 de octubre de 2026, …, concepto Tacos" |
| 5 | Enviar dinero → a favorite → type `99999` as the amount | The error is announced once when it appears, not on every keystroke |
| 6 | Amount `250` → Continuar → Enviar | "Enviando…" announced once; the result heading is read on arrival |
| 7 | Receipt: move to the folio | Read character by character ("M W guion …") |
| 8 | Optional: an outcome with error (the E2E uses `x-mock-outcome`; manually, retry until a random error appears) | The heading ("No pudimos …") is read on arrival; the reference code is read |

Report anything that sounds wrong (with the step number); otherwise TC-MAN-02 is ✅ and A11Y-08/14/16/17 close.
