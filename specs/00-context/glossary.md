# Glossary — Mini Wallet Web App

| Field | Value |
|---|---|
| **Status** | Approved |
| **Version** | 1.0 |
| **Last updated** | 2026-10-13 |

> One term per concept, used identically in specs, code, tests and UI copy (UX-16).
> The "Source term" column maps the challenge's Spanish wording to the English term used in artifacts.

## 1. Domain terms

| Term | Source term | Definition | Notes |
|---|---|---|---|
| **User** | Usuario | Person who owns the wallet and is logged in. | Also "sender" in a transaction. |
| **Identifier** | Teléfono o email | Value used to identify a user or contact: a phone number or an email. | Type is inferred from the value. |
| **One-time code** | — | 6-digit code "sent" to the user's identifier and entered as the second login step. Mocked (ASM-15). | Also called OTP. |
| **Session** | Sesión | Proof that the user has logged in, kept between page loads until logout. | Mocked; see ASM-12. |
| **Balance** | Saldo disponible | Money the user can spend right now. | Always shown with currency. |
| **Money** | Monto, saldo | Amount + currency, stored as an integer number of **minor units** (cents). | Never floating point (BR-04). |
| **Amount** | Monto | Money the user wants to send in a transaction. | Must satisfy BR-01, BR-02, BR-04. |
| **Transaction** | Movimiento, transacción | A money movement on the user's account, incoming or outgoing. | Has direction, status, date, counterparty. |
| **Direction** | — | Whether a transaction is **incoming** (money received) or **outgoing** (money sent). | Never conveyed by color alone (A11Y-11). |
| **Transaction status** | — | `completed`, `pending` or `failed`. | |
| **Activity** | Movimientos recientes | The list of the most recent transactions on Home. | Bounded (ASM-10). |
| **Contact** | Contacto | A person the user can send money to: name + identifier. | |
| **Favorite** | Favorito | A contact saved in the user's list for quick selection. | No duplicates (BR-08). |
| **Recipient** | Destinatario | The contact selected to receive the money in the current transaction. | Required (BR-03). |
| **Transfer flow** | Nueva transacción | The steps from choosing a recipient to confirming. | |
| **Summary** | Resumen | Review step showing recipient, amount and resulting balance before confirming. | Satisfies A11Y-09. |
| **Confirmation** | Confirmación | The act of submitting the transaction for processing, and the screen that shows its outcome. | |
| **Outcome** | Escenario | Result of a confirmation: `success`, `network_error`, `insufficient_funds`, `timeout`, `unknown_error`. | See requirements §4.2. |
| **Ambiguous outcome** | — | An outcome where it is not known whether money moved (`timeout`, `unknown_error`). | Never presented as success or failure (UX-09). |
| **Receipt** | Comprobante | Proof of a successful transaction: reference number, date/time, recipient, amount, resulting balance. | |
| **Reference number** | Folio | Unique, human-readable identifier of a transaction shown on the receipt (e.g. `MW-7K3P9Q`). | Distinct from the correlation ID. |
| **Transfer attempt** | — | One submission of a specific summary (recipient + amount + concept). Retries and status checks refer to the same attempt; editing any detail creates a new one (BR-07). | Identified by the idempotency key. |
| **Verification** | — | Automatic status checks of a transfer attempt after a timeout, until a final state is known or the check limit is reached (FR-CONF-13). | |

## 2. Technical terms

| Term | Definition |
|---|---|
| **Business rule (BR)** | A rule about the domain that must hold regardless of the channel (e.g. the amount cannot exceed the balance). Implemented once in the domain; always enforced by the server. |
| **Input validation rule** | A rule about the **shape** of a single piece of data (e.g. phone has 10 digits, amount has at most 2 decimals). Implemented in domain value types; checked on the client for feedback and on the server for integrity. Tracked under the `BR` prefix (BR-04, BR-05). |
| **UI rule (UIR)** | A presentation or interaction behavior that exists only because there is a user interface (e.g. disable "Continue" while the amount is invalid, show an error when leaving a field, move focus to the first error, mask an identifier, redirect to Home if already logged in). Lives in the presentation layer; removing it degrades the experience but **never** breaks data integrity. Tracked as `UIR-<MOD>-NN` in each FS. |
| **Rule classification test** | *"If someone calls the server directly, bypassing the UI, must this still hold?"* **Yes** → business rule or input validation rule (server-enforced). **No** → UI rule (presentation only). |
| **Idempotency key** | Unique key generated per confirmation attempt and reused on retries, so the server processes it at most once (BR-07). |
| **Correlation ID** | Identifier attached to a request and propagated through all logs it produces; shown to the user as a **reference code** on errors (NFR-04). |
| **Mock** | Simulated implementation of a dependency (data store, payment processor) with controllable behavior. |
| **Forced outcome** | Mechanism, disabled in production, to choose a confirmation outcome deterministically for tests and demos (FR-CONF-11). |
| **Theme** | Visual mode of the app: `light`, `dark`, or `system` (follow the OS preference). |
| **Design token** | Named, semantic design value (e.g. `color.surface`, `color.status.error`) resolved per theme; components use tokens, never raw values (NFR-16). |
| **Masked identifier** | Identifier partially hidden for privacy, e.g. `•••• 4321` or `a•••@mail.com`. |
| **Minor units** | Smallest currency unit (cents). `$12.50` = `1250`. |
| **Server authority** | Principle that the server re-validates every rule; client validation exists only for user experience (BR-06). |

## 3. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-13 | Claude (AI-assisted) | Created |
| 1.0 | 2026-10-13 | Project owner | Approved |
