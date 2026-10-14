# Requirements analysis — Mini Wallet Web App

| Field | Value |
|---|---|
| **Status** | Approved |
| **Version** | 1.1 |
| **Author** | Claude (AI-assisted draft) |
| **Reviewer** | Project owner |
| **Last updated** | 2026-10-13 |
| **Source** | `Web Challenge.pdf` — "Web Challenge — Mini Wallet Web App" |
| **Related** | [User needs & UX](./user-needs-ux-analysis.md) · [Accessibility](./accessibility-requirements.md) · [Assumptions & questions](./assumptions-and-questions.md) · [Glossary](./glossary.md) |

> Source constraints are quoted as written, including technology names. Binding them to concrete
> decisions happens in ADRs; FS and TS stay technology-agnostic (see [specs README §2.2](../README.md#22-technology-agnostic-templates)).

---

## 1. Source summary

Build a web app that simulates the basic flow of a financial wallet:

```
Login → Home → New transaction → Confirmation / Receipt
```

- Data is mocked; no real services.
- The goal is to evaluate real development decisions: **typing, architecture, state, permissions, error handling, reusable components**.
- Operating context: **high-volume system with millions of active users**; design must consider **scalability and maintainability**.
- Deadline: **3 calendar days**. A later live session will question decisions and ask for **live modifications** to the code.

## 2. Stakeholders and what each needs

| Stakeholder | Need | Implication for the specs |
|---|---|---|
| End user (wallet customer) | Send money quickly and be certain of the outcome | Clear states, no ambiguous outcomes, receipt with reference — see [UX analysis](./user-needs-ux-analysis.md) |
| Evaluators (engineering team) | See intentional engineering judgment, not just a working happy path | Every requirement traceable; every technical choice justified in an ADR |
| Live-session interviewer | Ask about decisions and request live changes | Code that is easy to navigate and change; decisions written down |
| Future maintainers (implied by "millions of users") | Scale and evolve without rewrites | Layered architecture, explicit contracts, observability |

## 3. Functional requirements

Priority uses MoSCoW: **Must** = stated in the source · **Should** = implied by the source or expected in production · **Could** = extra value · **Won't** = explicitly out of scope.

### 3.1 AUTH — Login and session

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AUTH-01 | The login starts with a single identifier that can be a **phone number or an email**. | Must | §1 Formulario |
| FR-AUTH-02 | The identifier is **required** and its **format is validated** (email or phone). | Must | §1 Validaciones |
| FR-AUTH-03 | The identifier type is inferred from the input; the user does not pick it from a separate control. | Should | Derived (UX-03) |
| FR-AUTH-04 | A **loading state** is shown while authenticating, and the form cannot be submitted twice. | Must | §1 Estados |
| FR-AUTH-05 | A **simulated authentication error** is shown with a recoverable, descriptive message. | Must | §1 Estados |
| FR-AUTH-06 | A successful login creates a **mock session that persists** across page reloads. | Must | §1 Sesión |
| FR-AUTH-07 | After a successful login the user is taken to **Home**. | Must | §1 Navegación |
| FR-AUTH-08 | Private views are **inaccessible without a session**; the user is sent to Login and, after logging in, returned to the view originally requested. | Must | §Reto "permisos" |
| FR-AUTH-09 | An authenticated user who opens Login is sent to Home. | Should | Derived |
| FR-AUTH-10 | The user can **log out**, which ends the session and returns to Login. | Should | Derived (session lifecycle) |
| FR-AUTH-11 | An expired or invalid session during any flow is detected and handled without losing the user's place silently. | Could | Derived |
| FR-AUTH-12 | **Two-step login**: after a valid identifier, the user enters a **one-time code** (mocked) "sent" to that identifier, shown partially masked. | Must | OQ-02 decision |
| FR-AUTH-13 | The one-time code is **required** and must be **6 digits**. | Must | OQ-02 decision |
| FR-AUTH-14 | An **incorrect or expired code** shows a descriptive error; after **3 failed attempts** a new code must be requested. | Should | OQ-02 decision |
| FR-AUTH-15 | The user can **request a new code** after a visible cooldown, and can **go back to change the identifier** without retyping it. | Should | OQ-02 decision |
| FR-AUTH-16 | Code delivery is **mocked**: no real SMS or email; the demo code is documented and discoverable outside production. | Must | OQ-02 decision + CON-08 |

### 3.2 HOME — Balance and recent transactions

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-HOME-01 | Show the **user's name**. | Must | §2 Datos |
| FR-HOME-02 | Show the **available balance**. | Must | §2 Datos |
| FR-HOME-03 | Show a **list of recent transactions** (date, counterparty, amount, direction in/out, status). | Must | §2 Movimientos |
| FR-HOME-04 | Show a **loading state** while data is fetched. | Must | §2 Estados |
| FR-HOME-05 | Show an **empty state** when there are no transactions, with a suggested action. | Must | §2 Estados |
| FR-HOME-06 | Show an **error state** with retry when data cannot be loaded; balance and list fail independently where possible. | Must | §2 Estados |
| FR-HOME-07 | Provide a primary action to **start a new transaction**. | Must | §2 Acción |
| FR-HOME-08 | Layout is **responsive** (mobile first). | Must | §2 "diseño responsivo" |
| FR-HOME-09 | After a successful transaction, Home reflects the **updated balance** and the **new transaction**. | Should | Derived (consistency) |
| FR-HOME-10 | The list is bounded to the N most recent items (no unbounded rendering). | Should | NFR-01 |
| FR-HOME-11 | The user can hide/show the balance on screen. | Should | OQ-11 decision (privacy in public spaces) |

### 3.3 TX — New transaction

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-TX-01 | The user enters an **amount**. | Must | §3 |
| FR-TX-02 | The user selects a recipient from a **favorites list**. | Must | §3 |
| FR-TX-03 | The user can **manually enter a new contact**. | Must | §3 |
| FR-TX-04 | A new contact can be **saved** to favorites (mocked persistence). | Must | §3 |
| FR-TX-05 | A **summary** is shown before confirming (recipient, amount, resulting balance). | Must | §3 |
| FR-TX-06 | Business rules BR-01…BR-03 are validated **before confirming** and the user sees which rule failed. | Must | §Reglas de negocio |
| FR-TX-07 | From the summary the user can **go back and edit** without losing entered data. | Should | Derived (UX-06) |
| FR-TX-08 | The user can **cancel** the flow at any step and return to Home. | Should | Derived (user control) |
| FR-TX-09 | The favorites list has its own loading, empty and error states. | Should | Derived (async data) |
| FR-TX-10 | The user can search/filter favorites. | Won't | Not selected ("with more time") |
| FR-TX-11 | The user can add an optional concept/note. | Should | OQ-09 decision (common in MX transfers) |

### 3.4 CONF — Confirmation and receipt

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-CONF-01 | Confirming submits the transaction and receives a **mocked response whose outcome is random** among the five scenarios in §4.2. | Must | §4 |
| FR-CONF-02 | A **processing state** is shown while confirming, and confirmation cannot be triggered twice. | Must | §4 + EC (double submit) |
| FR-CONF-03 | **Success** → transaction confirmed and a **receipt** is shown. | Must | §4 Éxito |
| FR-CONF-04 | **Network error** → error state with a **retry** option. | Must | §4 Error de red |
| FR-CONF-05 | **Insufficient funds** → **descriptive** error. | Must | §4 Fondos insuficientes |
| FR-CONF-06 | **Timeout** → excessive waiting is **handled**: the wait is bounded, the user sees a "verifying" state, and the app automatically checks the transaction's real status before showing a final outcome. | Must | §4 Timeout + OQ-05 decision |
| FR-CONF-07 | **Unknown error** → **generic fallback**. | Must | §4 Error desconocido |
| FR-CONF-08 | Retrying never creates a **duplicate** transaction. | Should | Derived (financial integrity, BR-07) |
| FR-CONF-09 | The receipt shows reference number, date/time, recipient, amount, and resulting balance. | Should | Derived ("comprobante") |
| FR-CONF-10 | From the receipt the user can return to Home or start another transaction. | Should | Derived |
| FR-CONF-11 | Every outcome can be **forced deterministically** outside production (tests and demo). | Should | NFR-10 |
| FR-CONF-12 | The user can share or download the receipt. | Could | Derived |
| FR-CONF-13 | The app can **query the status of a confirmation** by its idempotency key; if the status check also fails, the user gets a safe retry (same key). | Must | OQ-05 decision |

## 4. Business rules

### 4.1 Rules

| ID | Rule | Priority | Source | Evaluated |
|---|---|---|---|---|
| BR-01 | **Minimum amount:** the amount must be greater than zero (no zero, no negative). | Must | §Reglas 1 | On input, on continue, on confirm |
| BR-02 | **Sufficient balance:** the amount cannot exceed the available balance. | Must | §Reglas 2 | On input, on continue, on confirm |
| BR-03 | **Recipient required:** a transaction cannot be confirmed without a recipient. | Must | §Reglas 3 | On continue, on confirm |
| BR-04 | **Amount format:** numeric, at most 2 decimal places, stored as an integer in minor units (cents). | Should | Derived (money correctness) | On input |
| BR-05 | **Recipient identifier format:** a manually entered recipient must be a valid phone number or email, as defined by BR-10. | Should | Derived (same identifier rules as FR-AUTH-02) | On input, on save |
| BR-06 | **Rules are authoritative on the server:** BR-01…BR-05, BR-09 and BR-15 are re-evaluated by the server at confirmation regardless of client checks. | Must | §"Validaciones en el lugar correcto, no solo en la UI" | On confirm |
| BR-07 | **Idempotent confirmation:** a confirmation retried with the same idempotency key returns the original outcome and never moves money twice. | Should | Derived (retry + timeout scenarios) | On confirm |
| BR-08 | **No duplicate favorites:** saving a contact whose identifier already exists does not create a second entry. | Should | Derived | On save |
| BR-09 | **No self-transfer:** the recipient cannot be the sender's own identifier. | Should | OQ-12 decision | On continue, on confirm |
| BR-10 | **Identifier format:** after normalization, a Mexican phone number of exactly 10 digits (spaces, dashes, parentheses and a leading `+52`/`52` removed) or an email of at most 254 characters `local@domain.tld` (trimmed, lowercased). | Must | FS-01 (login) · reused by BR-05 | On blur/continue (client), on request (server) |
| BR-11 | **One-time code format:** exactly 6 digits after removing spaces and dashes. | Must | FS-01 · OQ-02 | On verify |
| BR-12 | **Code validity:** valid for 5 minutes and at most 3 failed attempts; only the latest code for an identifier is valid. | Should | FS-01 · ASM-15 | On verify (server) |
| BR-13 | **Code throttling:** a new code cannot be issued sooner than 30 s after the previous one, unless the previous one is locked. | Should | FS-01 · ASM-15 | On resend (server) |
| BR-14 | **Session required:** every private view and operation requires a valid session; the server rejects requests without one. | Must | Challenge "permisos" · FS-01 | Every private request (server) |
| BR-15 | **Concept format:** optional; at most 40 characters after trimming; no line breaks or control characters. | Should | FS-03 · OQ-09 | On input (client), on confirm (server) |
| BR-16 | **Contact name:** required for a new contact; 1–50 characters after trimming. | Should | FS-03 | On continue (client), on save (server) |
| BR-17 | **Single final outcome:** a transfer attempt is *in progress*, *completed*, *failed* (with reason) or *not processed*; once final it never changes; status checks report it. | Must | FS-04 · OQ-05 | Status check (server) |

> **Rule types** (see [glossary](./glossary.md#2-technical-terms)): BR-04, BR-05, BR-10, BR-11, BR-15 and BR-16 are *input validation rules*; the rest are *business rules*. Both are server-enforced. Presentation-only behaviors are **UI rules** (`UIR-<MOD>-NN`) and are defined per screen in each FS §5.2, not here.
>
> The source states that **how and where** these rules are implemented is part of the evaluation.
> Analysis position: rules live once in the domain as pure functions; the client uses them for immediate feedback; the server enforces them as the authority (BR-06). Detailed in TS-03.

### 4.2 Confirmation outcome matrix

| Outcome | Money moved? | Retry safe? | User-facing behavior | Next actions |
|---|---|---|---|---|
| Success | Yes | — | Receipt with reference number | Home · New transaction |
| Network error | No (request did not reach the server) | Yes | "We couldn't reach the server, your money was not sent" | Retry · Back to summary |
| Insufficient funds | No | No (until the amount changes) | Descriptive message with current balance | Edit amount · Cancel |
| Timeout | **Unknown** → resolved by status check | Yes, with the same idempotency key | "This is taking longer than usual, we're checking" → then the real outcome (success receipt or failure); never states failure as fact | Automatic status check → final outcome; if the check fails: retry (same key) · Back to Home |
| Unknown error | Unknown | Yes, with the same idempotency key | Generic fallback with reference code | Retry · Back to Home |

**Key insight:** timeout and unknown error are **ambiguous outcomes**. In a financial product, telling the user "failed" when money actually moved (or vice versa) is the worst possible error. This drives BR-07 (idempotency), UX-09 (never assert an unknown outcome) and the reference code in NFR-04.

## 5. Non-functional requirements

| ID | Category | Requirement | Priority | Source |
|---|---|---|---|---|
| NFR-01 | Scalability | Server-side work is stateless per request; per-user data is never shared-cached; lists and payloads are bounded. | Must | §Contexto "millones de usuarios" |
| NFR-02 | Maintainability | Layered architecture with UI separated from business logic; dependencies point inward to the domain. | Must | §Contexto + "separación UI/lógica" |
| NFR-03 | Type safety | Explicit domain models and contracts; no untyped values; outcomes and states modeled as closed unions. | Must | §"TypeScript con intención" |
| NFR-04 | Observability | Structured logs with a correlation ID propagated across server rendering, server entry points and client errors; a user-visible reference code on errors and receipts. | Should | Project decision (traceability) |
| NFR-05 | Security & privacy | Session credential not readable by client scripts; no sensitive data in client storage or logs; inputs validated server-side. | Should | §Reto "permisos" + financial context |
| NFR-06 | Resilience | Bounded timeouts on every remote call; safe retries (idempotent, with backoff); graceful degradation per section. | Must | §4 Confirmación |
| NFR-07 | Performance | Fast first meaningful content on mid-range mobile devices and slow networks; minimal client code on first load. | Should | §Contexto (high volume) |
| NFR-08 | Testability | Unit tests for validations, presentation logic and critical components. | Should | §Testing (valued) |
| NFR-09 | E2E coverage | E2E tests for the main flow and every confirmation outcome. | Should | §E2E Testing (valued) |
| NFR-10 | Determinism | Random outcomes and delays are controllable in tests and demos; disabled in production. | Must | Needed by NFR-09 |
| NFR-11 | Reusability | Shared UI primitives (buttons, inputs, money display, state views) reused across screens. | Must | §Reto "componentes reutilizables" |
| NFR-12 | Pragmatism | Simple, extensible solutions; no abstraction without a current need. | Must | §"Pragmatismo" |
| NFR-13 | i18n readiness | User-facing copy externalized; dates, numbers and currency formatted by locale. | Should | Derived (scale, maintainability) |
| NFR-14 | Accessibility | Conformance with WCAG 2.2 level AA. | Must | Project decision — see [accessibility requirements](./accessibility-requirements.md) |
| NFR-15 | Usability | Meets the UX requirements in [user needs & UX analysis](./user-needs-ux-analysis.md). | Must | Project decision |
| NFR-16 | Theming | Colors, surfaces and states are expressed as **semantic design tokens** (e.g. `surface`, `text-primary`, `status-error`), never raw values in components, so light and dark themes (UX-22) swap without changing component code. | Must | Project decision (dark mode) |
| NFR-17 | Security | **CSRF protection** on every state-changing endpoint, including login: session cookie `SameSite=Lax`, origin / fetch-metadata verification, JSON content type plus a mandatory custom header, no CORS, and no state changes on safe methods. | Must | Project decision (owner, 2026-10-14) — see ADR-004 |

## 6. Technical constraints (from the source)

| ID | Constraint | Decision record |
|---|---|---|
| CON-01 | Framework: **Next.js + TypeScript**. | TS-00 bindings |
| CON-02 | Rendering: SSR, CSR or mixed per page — **must be justified**. | ADR-002 |
| CON-03 | Navigation structure: **pages or app router** — choice is free. | ADR-001 |
| CON-04 | State management: free choice (Context, Zustand, Redux…) — **must be justified**. | ADR-003 |
| CON-05 | Services: **API routes with mocked data**. | TS-00, TS-01…04 |
| CON-06 | Experience with **SSR, CSR and Server Actions** is valued. | ADR-002 |
| CON-07 | E2E testing with Playwright or another engine — **must be justified**. | ADR-005 |
| CON-08 | No connection to real services. | TS-00 |

## 7. Deliverables

| ID | Deliverable | Content required by the source | Built from |
|---|---|---|---|
| DEL-01 | Source code in a Git repository | — | All |
| DEL-02 | `README.md` | How to run, libraries used, known limitations, **actual time spent** | TS-00, plan time log, TS limitations |
| DEL-03 | `DECISIONS.md` | Project structure rationale, UI/business separation, edge cases considered, what would change with more time | ADRs, FS edge cases |
| DEL-04 | `AI_USAGE.md` | Tools and where they were used; what was accepted vs corrected/rejected; decisions made by the author, not the AI | AI usage sections of each TASK and spec phase |
| DEL-05 | Delivery within **3 calendar days** | — | Plan |

## 8. Evaluation criteria → how the specs respond

| What the source values | How we address it | Where |
|---|---|---|
| TypeScript with intent | Domain types, value objects (money), closed unions for outcomes/states, typed contracts | NFR-03 · TS-00 · TS-03 |
| React composition | Presentation vs presentation logic split; reusable primitives; conditional rendering by explicit state | NFR-02 · NFR-11 · TS per module |
| Rendering experience (SSR, CSR, Server Actions) | Per-view strategy chosen and justified | CON-02 · CON-06 · ADR-002 |
| Service implementation (API Routes) | Server entry points over in-memory mock repositories | CON-05 · TS-01…04 |
| Business rules in the right place | Domain functions shared by client and server; server authoritative | BR-06 · TS-03 |
| Pragmatism | Explicit "Won't" list; scope cuts decided upfront | NFR-12 · plan §7 |
| Error handling beyond the happy path | Five-outcome matrix; idempotent retries; per-section errors | §4.2 · TS-04 |
| Permissions | Protected views enforced before rendering | FR-AUTH-08 · TS-01 |
| Testing (unit + E2E) | Pyramid, deterministic outcomes, traceability matrix | NFR-08…10 · test plan |

## 9. Out of scope (Won't)

| Item | Reason |
|---|---|
| Real authentication: real one-time-code delivery (SMS/email), credential storage, fraud controls | Source: "No se busca seguridad ni autenticación real"; the OTP step is simulated (FR-AUTH-16) |
| Real payment rails (SPEI, cards), bank account numbers (CLABE) | Mocked by definition |
| Persistent database; data survives server restarts | Mocked data; in-memory is enough |
| Transaction history beyond the recent list (full history, filters, export) | Not required; FR-HOME-10 bounds the list |
| Multi-currency | Single currency assumed (ASM-02) |
| Native mobile app / offline mode | Web app only |

## 10. Coverage map

| Module | Requirements | Planned FS | Planned TS |
|---|---|---|---|
| AUTH | FR-AUTH-01…16, BR-10…14 | FS-01 Login | TS-01 Auth & session |
| HOME | FR-HOME-01…11 | FS-02 Home | TS-02 Home |
| TX | FR-TX-01…11, BR-01…05, BR-08…10, BR-15, BR-16 | FS-03 New transaction | TS-03 Transactions |
| CONF | FR-CONF-01…13, BR-06, BR-07, BR-17 | FS-04 Confirmation & receipt | TS-04 Confirmation |
| CORE | NFR-01…03, 05…07, 11…13, 17, CON-* | — | TS-00 Architecture, TS-01 (CSRF) |
| OBS | NFR-04 | — | TS-05 Observability |
| Cross-cutting UX / A11Y | NFR-14…16, UX-*, A11Y-* | All FS (§8, §12, §13) | TS-00 (design tokens, themes, primitives) |
| Testing | NFR-08…10 | — | Test plan, ADR-005 |

## 11. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-13 | Claude (AI-assisted) | Created from the challenge document |
| 0.2 | 2026-10-13 | Claude (AI-assisted) | Applied OQ-01, OQ-02 (OTP login: FR-AUTH-12…16), OQ-05 (status check: FR-CONF-06, FR-CONF-13), OQ-08 |
| 0.3 | 2026-10-13 | Claude (AI-assisted) | Dark mode: NFR-16 |
| 0.4 | 2026-10-13 | Claude (AI-assisted) | Rule taxonomy: business vs input validation vs UI rules |
| 0.5 | 2026-10-13 | Claude (AI-assisted) | Added BR-10…BR-17 from FS-01…04; priorities per OQ-06, OQ-09, OQ-11, OQ-12; FR-TX-10 → Won't |
| 1.0 | 2026-10-13 | Project owner | Approved |
| 1.1 | 2026-10-14 | Claude (AI-assisted) | Added NFR-17 (CSRF protection), decided by the owner during ADR review |
