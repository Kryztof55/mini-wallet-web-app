# Assumptions & open questions — Mini Wallet Web App

| Field | Value |
|---|---|
| **Status** | Approved |
| **Version** | 1.0 |
| **Author** | Claude (AI-assisted draft) |
| **Reviewer** | Project owner |
| **Last updated** | 2026-10-13 |
| **Related** | [Requirements analysis](./requirements-analysis.md) · [User needs & UX](./user-needs-ux-analysis.md) · [Accessibility](./accessibility-requirements.md) |

> **Assumptions (ASM)** are what we will build on unless told otherwise.
> **Open questions (OQ)** need a decision from the project owner; each one has a recommendation so work is never blocked.
> When an OQ is resolved, its answer is recorded here and the affected assumption or requirement is updated.

---

## 1. Assumptions

| ID | Assumption | Basis | Impact if wrong | Affects |
|---|---|---|---|---|
| ASM-01 | Target market is **Mexico**: `es-MX` formatting; phone numbers have 10 digits (optional `+52` prefix accepted). | Company context | Validation and formatting rules change | FR-AUTH-02, BR-05, UX-07 |
| ASM-02 | **Single currency: MXN**, two decimal places. | Same | Money model needs a currency dimension | BR-04, money display |
| ASM-03 | Mock data lives **in server memory**; it resets on restart, and changes (balance, contacts, new transactions) persist while the server runs, isolated per user. | "datos mockeados" + API routes | Need a persistence adapter | TS-00, all TS |
| ASM-04 | **Seeded test users** cover every state: normal user, user with empty activity, user with low balance, user whose data load fails, identifier that fails login. | Need to demonstrate loading/empty/error states | States only visible by forcing errors | FR-AUTH-05, FR-HOME-04…06, tests |
| ASM-05 | **Simulated login errors are deterministic** (triggered by specific test identifiers or a wrong code), not random. | Testability (NFR-10) | E2E for login error becomes flaky | FR-AUTH-05, FR-AUTH-14 |
| ASM-06 | **Network error** means the request did not reach the server: nothing happened and retrying is safe. | Outcome semantics | Risk of double charge if the server did process it | FR-CONF-04, §4.2 |
| ASM-07 | **Timeout** and **unknown error** mean the outcome is unknown; the same idempotency key is reused for any retry or status check. | Financial integrity | Duplicate transactions | BR-07, UX-09 |
| ASM-08 | **Insufficient funds can still happen at confirmation** even after client checks (balance changed or simulated), because the server is the authority. | BR-06 | Scenario would be unreachable | FR-CONF-05 |
| ASM-09 | New contact data is **name + identifier (phone or email)**; no bank account numbers. | Source says "contacto"; same identifier types as login | New fields and validations | FR-TX-03, BR-05 |
| ASM-10 | The recent activity list shows the **last 10** transactions; no pagination or "see all". | Source says "recientes" | Pagination work | FR-HOME-03, FR-HOME-10 |
| ASM-11 | **No amount limit** besides the available balance. | Source rules only | New rule (BR) and UI | BR-01, BR-02 |
| ASM-12 | **Session lasts until logout**; no forced expiry in scope, but an invalid session is handled gracefully everywhere. | Source: "persistencia simple" | Expiry warning required (A11Y-16) | FR-AUTH-06, FR-AUTH-11 |
| ASM-13 | **Supported browsers**: latest two versions of evergreen browsers on desktop and mobile (Chrome, Safari, Firefox, Edge). | Industry default | Polyfills / testing matrix | TS-00, test plan |
| ASM-14 | **No existing brand or design system**: a neutral visual design built on our own **semantic design tokens**, with **light and dark themes** (dark mode is required — see decision log). | Not provided | Rework of visual layer | TS-00, UI primitives, UX-22, NFR-16 |
| ASM-15 | **Mock one-time code**: fixed demo code `123456` (documented in the README), 6 digits, valid for 5 minutes, max 3 attempts, resend cooldown 30 seconds. | OQ-02 decision; values chosen for demo and tests | Adjust values in config | FR-AUTH-12…16 |
| ASM-16 | **Outcome distribution** when not forced: success 60 %, network error 10 %, insufficient funds 10 %, timeout 10 %, unknown error 10 % (configurable); timeout sub-case by default: completed late. A forcing mechanism exists outside production for every outcome and timeout sub-case (completed, not processed, unresolved). | OQ-04 recommendation | Different demo/test behavior | FR-CONF-01, FR-CONF-11, FS-04 |
| ASM-17 | **Confirmation timing** (configurable): slow message after 3 s; client timeout 10 s; up to 3 status checks at 2 s, 4 s and 8 s. | Pragmatic defaults | Different waits | FR-CONF-06, FR-CONF-13, FS-04 |

## 2. Open questions

| ID | Question | Options | Recommendation | Blocking? | Status |
|---|---|---|---|---|---|
| OQ-01 | In which language is the **UI copy**? | a) Spanish (es-MX) · b) English · c) Both (i18n switch) | **a)** Spanish for the UI, English for code and docs; copy externalized so (c) is cheap later (NFR-13). | Yes — FS §12 | **Resolved** |
| OQ-02 | What does the **login form** ask for? Source only says "phone or email". | a) Identifier only · b) Identifier + password (mocked) · c) Identifier + one-time code step (mocked) | **b)** Realistic, still cheap; gives a meaningful "invalid credentials" error and exercises multi-field validation. Option (a) is the most literal reading and also valid. | Yes — FS-01 | **Resolved** |
| OQ-03 | How is the **simulated login error** triggered? | a) Random % · b) Specific test identifiers · c) Both | **b)** Deterministic and demo-friendly (ASM-05). | No | Open |
| OQ-04 | **Distribution** of random confirmation outcomes and how to **force** one. | Weights · forcing mechanism | Success ~60 %, each failure ~10 %, configurable; a forcing mechanism enabled only outside production (FR-CONF-11). | No | Open — recommendation applied |
| OQ-05 | What does the user see after a **timeout**? | a) Error + retry (same idempotency key) · b) "Verifying…" + automatic status check, then the real result; falls back to (a) if the check also fails | **b)** Most honest for the user (UX-09) and demonstrates resilient design; (a) is the minimum. | Yes — FS-04, API | **Resolved** |
| OQ-06 | Is **saving a new contact** mandatory or optional? | a) Always saved · b) Optional checkbox, on by default · c) Optional, off by default | **b)** Matches the source ("ingresar … y guardarlo") while allowing one-off transfers. | Yes — FS-03 | **Resolved** |
| OQ-07 | Does Home **reflect the new balance and transaction** after success? | Yes / No | **Yes** (FR-HOME-09); otherwise the mock feels broken. | No | Open |
| OQ-08 | **Order and shape** of the transfer flow. | a) Recipient → Amount → Summary (steps) · b) Amount → Recipient → Summary · c) Single form + Summary | **a)** See [UX §8](./user-needs-ux-analysis.md#8-recommended-flow-structure-to-confirm-in-fs-03). | Yes — FS-03 | **Resolved** |
| OQ-09 | Include the optional **concept/note** field (FR-TX-11)? | Yes / No | Only if time allows (Could). | No | **Resolved** |
| OQ-10 | Include **receipt share/download** (FR-CONF-12)? | Share · Download · Copy reference only | **Copy reference only**; share/download listed as "with more time". | No | Open — recommendation applied |
| OQ-11 | Include **hide balance** toggle (FR-HOME-11 / UX-17)? | Yes / No | Yes if time allows; cheap and visible UX value. | No | **Resolved** |
| OQ-12 | Include **self-transfer block** (BR-09)? | Yes / No | Yes; it is one domain rule plus a test. | No | **Resolved** |
| OQ-13 | Is there a **brand or visual reference** to follow? | Provided / Free | Free, neutral design (ASM-14). | No | Open |
| OQ-14 | Login with a well-formed identifier that has **no account**: reveal it, or continue to the code step and fail generically? | a) "No account found" · b) Continue and fail generically | **b)** Prevents account enumeration; the masked destination helps spot typos. | No | **Resolved** |

## 3. Decision log

| OQ | Date | Decision | Decided by | Updated items |
|---|---|---|---|---|
| OQ-01 | 2026-10-13 | **Spanish (es-MX)** for UI copy; code and docs in English; copy externalized | Project owner | NFR-13, A11Y-21, UX §7 |
| OQ-02 | 2026-10-13 | **Identifier + one-time code (mocked)**, two steps | Project owner (chose c over the recommended b) | FR-AUTH-12…16, UX-21, A11Y-14, A11Y-16, ASM-15 |
| OQ-05 | 2026-10-13 | **"Verifying" state + automatic status check**, falling back to safe retry | Project owner | FR-CONF-06, FR-CONF-13, §4.2 |
| OQ-08 | 2026-10-13 | **Recipient → Amount → Summary**, as steps | Project owner | UX §8, FS-03 |
| — | 2026-10-13 | **Dark mode is required** even without brand guidelines: light and dark themes, following the OS preference by default with a user override | Project owner | ASM-14, UX-22, NFR-16, A11Y-10, A11Y-26 |
| OQ-06 | 2026-10-13 | **Saving a new contact is optional, checked by default** | Project owner | FR-TX-04, FS-03 |
| OQ-09 | 2026-10-13 | **Concept/note field included** | Project owner | FR-TX-11 → Should, BR-15, FS-03 |
| OQ-11 | 2026-10-13 | **Hide/show balance included** | Project owner | FR-HOME-11 → Should, FS-02 |
| OQ-12 | 2026-10-13 | **Self-transfer blocked** | Project owner | BR-09 → Should, FS-03 |
| — | 2026-10-13 | **Search in favorites not included** ("with more time") | Project owner | FR-TX-10 → Won't |
| OQ-14 | 2026-10-13 | **Continue to the code step and fail generically** for unknown identifiers | Project owner | FS-01 E2 |

## 4. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-13 | Claude (AI-assisted) | Created |
| 0.2 | 2026-10-13 | Claude (AI-assisted) | Resolved OQ-01, OQ-02, OQ-05, OQ-08; added ASM-15 |
| 0.3 | 2026-10-13 | Claude (AI-assisted) | Dark mode required (ASM-14 updated) |
| 0.4 | 2026-10-13 | Claude (AI-assisted) | Resolved OQ-06, OQ-09, OQ-11, OQ-12, OQ-14; ASM-16, ASM-17 from FS-04 |
| 1.0 | 2026-10-13 | Project owner | Approved |
