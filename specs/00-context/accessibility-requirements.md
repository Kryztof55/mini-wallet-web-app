# Accessibility requirements — Mini Wallet Web App

| Field | Value |
|---|---|
| **Status** | Approved |
| **Version** | 1.0 |
| **Author** | Claude (AI-assisted draft) |
| **Reviewer** | Project owner |
| **Last updated** | 2026-10-13 |
| **Target** | **WCAG 2.2, level AA** (NFR-14) |
| **Related** | [Requirements analysis](./requirements-analysis.md) · [User needs & UX](./user-needs-ux-analysis.md) |

> Why AA on a coding challenge: with millions of users, a meaningful share has visual, motor, auditory or
> cognitive impairments, and many more are temporarily or situationally limited (bright sunlight, one hand, noise).
> Financial services are also a common target of accessibility regulation. AA is the usual industry baseline.
> Accessibility is designed in from the FS, not audited at the end.

---

## 1. Accessibility requirements

| ID | Requirement | WCAG 2.2 SC | Level | Priority |
|---|---|---|---|---|
| A11Y-01 | **Semantic structure**: each view has one main heading, a logical heading hierarchy, landmarks (header, main, navigation), and lists marked up as lists. | 1.3.1, 2.4.6 | A / AA | Must |
| A11Y-02 | **Page title and navigation announcements**: each view has a unique, descriptive title; after navigation, focus moves to the main heading (or the view is otherwise announced). | 2.4.2, 2.4.3 | A | Must |
| A11Y-03 | **Keyboard operable**: every action works with keyboard only, with no traps and a logical focus order; a "skip to content" link is provided. | 2.1.1, 2.1.2, 2.4.1, 2.4.3 | A | Must |
| A11Y-04 | **Visible focus, never hidden**: focus indicator with ≥ 3:1 contrast, never covered by sticky headers, footers or banners. | 2.4.7, 2.4.11, 1.4.11 | AA | Must |
| A11Y-05 | **Labels and instructions**: every input has a visible, persistent label (placeholders are not labels); format hints are programmatically associated with the field; the accessible name contains the visible label. | 3.3.2, 2.5.3, 1.3.1 | A | Must |
| A11Y-06 | **Input purpose**: fields declare their purpose (email, phone, name) so browsers and assistive tech can autofill and adapt. | 1.3.5 | AA | Must |
| A11Y-07 | **Error identification and suggestion**: errors are described in text, linked to their field and exposed as invalid; the message suggests a fix; on a failed submit, focus moves to the first error (or an error summary). | 3.3.1, 3.3.3, 4.1.2 | A / AA | Must |
| A11Y-08 | **Status messages announced**: loading finished, contact saved, processing, and each confirmation outcome are announced without moving focus (polite for info, assertive only for blocking errors). | 4.1.3 | AA | Must |
| A11Y-09 | **Error prevention for financial actions**: before money moves the user can review, correct and explicitly confirm. | 3.3.4 | AA | Must |
| A11Y-10 | **Contrast in both themes**: text ≥ 4.5:1 (large text ≥ 3:1); UI components, states, focus indicators and meaningful graphics ≥ 3:1 — verified in **light and dark** themes, including status colors (success, error, warning) and incoming/outgoing amounts. | 1.4.3, 1.4.11 | AA | Must |
| A11Y-11 | **Not color alone**: incoming vs outgoing amounts use sign and text/icon in addition to color; errors use icon + text, not only red; success/failure screens differ in heading and icon, not just color. | 1.4.1 | A | Must |
| A11Y-12 | **Resize and reflow**: usable at 200 % text size and at 320 CSS px width without horizontal scrolling or loss of content; tolerates user text-spacing overrides. | 1.4.4, 1.4.10, 1.4.12 | AA | Must |
| A11Y-13 | **Target size**: interactive targets ≥ 24 × 24 CSS px (WCAG minimum); project target ≥ 44 × 44 for primary and frequent actions. | 2.5.8 | AA | Must (24) / Should (44) |
| A11Y-14 | **Accessible authentication**: login requires no cognitive test; the one-time code can be **pasted or autofilled** by the OS (never forces manual transcription); paste and autofill allowed in every field. | 3.3.8 | AA | Must |
| A11Y-15 | **Redundant entry**: information already given in the flow (recipient, amount) is shown or pre-filled, never requested again. | 3.3.7 | A | Must |
| A11Y-16 | **No time pressure**: the transfer flow has no user time limit; if the session can expire, the user is warned and can extend it. The one-time code's **expiry** is a security time limit: it is stated up front, a new code can always be requested, and no countdown is announced every second. | 2.2.1 | A | Must |
| A11Y-17 | **Money and data read naturally**: amounts are announced with currency and direction ("sent 250 pesos" / "received"); masked identifiers are announced intelligibly; dates have an unambiguous accessible form. | 1.3.1 | A | Should |
| A11Y-18 | **Icons and images**: decorative icons are hidden from assistive tech; icon-only buttons have accessible names; avatars with initials don't produce noise. | 1.1.1, 4.1.2 | A | Must |
| A11Y-19 | **Loading placeholders**: skeletons are hidden from assistive tech; the loading region is marked as busy and announced once. | 4.1.3 | AA | Should |
| A11Y-20 | **Motion**: no flashing content; non-essential animation is disabled when the user prefers reduced motion. | 2.3.1 (+ 2.3.3 AAA, adopted as good practice) | A | Should |
| A11Y-21 | **Language**: the page language is declared as `es-MX` (OQ-01) and changes of language in parts are marked. | 3.1.1, 3.1.2 | A / AA | Must |
| A11Y-22 | **Consistency**: navigation, component naming and any help mechanism appear in the same place and form across views. | 3.2.3, 3.2.4, 3.2.6 | A / AA | Should |
| A11Y-23 | **Predictable behavior**: focusing or changing a field never triggers navigation or submission by itself. | 3.2.1, 3.2.2 | A | Must |
| A11Y-24 | **Dialogs** (e.g. cancel confirmation): focus moves into the dialog, stays there while open, returns to the trigger on close, and Escape closes it. | 2.1.2, 2.4.3 | A | Must (if dialogs are used) |
| A11Y-25 | **Orientation**: works in portrait and landscape. | 1.3.4 | AA | Must |
| A11Y-26 | **Theme control**: the theme switcher is keyboard operable, has an accessible name, exposes the current selection, and changing it does not move focus or reload the view; the OS high-contrast / forced-colors mode keeps all controls and focus visible. | 4.1.2, 3.2.2, 1.4.11 | A / AA | Must |

## 2. Requirements per screen

| Screen | Key requirements | Specific concerns |
|---|---|---|
| Login | A11Y-05, 06, 07, 08, 14, 16 | Identifier field label says both options ("Phone or email"). Code step: focus moves to the code field with its instructions (where it was sent, length); single field declared as one-time code; wrong-code and attempts-left announced; resend cooldown exposed as text, not only a visual timer. |
| Home | A11Y-01, 08, 11, 17, 19 | Balance announced with currency; list items read as one coherent sentence (who, amount, direction, date, status); independent section errors announced; hidden-balance toggle has state (pressed/not pressed). |
| Recipient | A11Y-01, 05, 07, 15, 18 | Favorites are a list of selectable options with clear selected state; "add new contact" form errors per field; "saved" feedback announced. |
| Amount | A11Y-05, 07, 08, 17 | Available balance associated as a description of the field; rule violations (BR-01/02) announced when they appear; live formatting must not confuse screen readers (no re-announcing on every keystroke). |
| Summary | A11Y-09, 15, 17 | All details readable in order; edit actions have specific names ("Edit amount", not "Edit"); primary action name includes the amount. |
| Processing | A11Y-08, 16, 20 | Processing announced once; spinner not the only indicator; no time limit imposed on the user. |
| Outcome / Receipt | A11Y-01, 02, 08, 11 | Focus moves to the outcome heading; success vs error distinguishable without color; reference number copyable and readable character by character. |

## 3. Reusable patterns (to be implemented once as shared components)

| Pattern | Accessibility contract |
|---|---|
| Text field | Visible label, hint and error linked to the input; invalid state exposed; purpose declared; paste allowed. |
| Money display | Visual format `$1,234.50`; accessible text with currency and, when relevant, direction. |
| Money input | Numeric keyboard on touch devices; formatted value does not move the caret unexpectedly; announced value matches the visual value. |
| Async section | Busy state during load; single announcement on completion; error with retry button reachable by keyboard. |
| Status / toast | Announced politely; does not steal focus; stays long enough to be read or can be dismissed; never the only place an error is shown. |
| Outcome view | Heading receives focus on arrival; icon + text; actions in a predictable order. |
| Dialog | Focus management, Escape to close, labelled by its title. |
| Theme switcher | Accessible name and current value exposed; no focus loss on change; respects OS preference until the user overrides it. |
| Button | Accessible name equals or starts with the visible label; loading state announced and exposed as busy/disabled. |

## 4. Verification approach

| Method | What it catches | When |
|---|---|---|
| Automated scan in component and E2E tests | Missing names, contrast issues, invalid roles — only a portion of real issues | Every run |
| Keyboard-only walkthrough of the full flow | Traps, order, missing focus, hidden focus | Every screen, before marking a TASK done |
| Screen reader smoke test (VoiceOver on iOS/macOS; NVDA on Windows or TalkBack on Android if available) | Announcements, names, reading order | Main flow + each confirmation outcome |
| Zoom 200 % and 320 px viewport | Reflow, truncation, overlapping | Every screen |
| Reduced-motion and high text-spacing settings | Motion and spacing robustness | Once per screen |
| Contrast check in light **and** dark themes (plus OS forced-colors mode) | Theme-specific contrast and visibility regressions | Every screen; automated scan runs in both themes |

Each FS §13 lists the A11Y IDs it must meet; the test plan maps them to TCs.

## 5. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-13 | Claude (AI-assisted) | Created |
| 0.2 | 2026-10-13 | Claude (AI-assisted) | OTP login (A11Y-14, A11Y-16); page language es-MX (OQ-01) |
| 0.3 | 2026-10-13 | Claude (AI-assisted) | Dark mode: A11Y-10 both themes, A11Y-26 theme control |
| 1.0 | 2026-10-13 | Project owner | Approved |
