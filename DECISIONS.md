# Design decisions

How and why the Mini Wallet is built the way it is. Each section summarizes a decision; the
full reasoning, the options that were rejected and their trade-offs are in the
[ADRs](./specs/02-technical/adr/) and the [technical specs](./specs/02-technical/).

The challenge says the system runs at high volume with millions of active users. That
context drove three priorities: **money must never move twice or move wrongly**, **the
server is the only authority**, and **every piece can be scaled or replaced on its own**.

## 1. How I worked: specs first

Before writing code I wrote the requirements analysis, four functional specs (one per
screen), six technical specs, ten ADRs, an ordered plan of 22 tasks and a test plan with a
traceability matrix (every business rule, UI rule and acceptance criterion → its tests).
Every task card records what was built, deviations from the spec and AI usage. It costs
time up front, but it made the ambiguous parts of the challenge explicit early (what does
"timeout" mean for the money? can a retry charge twice? what happens with an unknown
phone?) and gave each one a written answer that the code and the tests follow.

## 2. Project structure

```
app → features → shared → core          server → shared/lib, core
```

| Folder         | Holds                                                                                                                                            | May import                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `src/core`     | Pure domain: `Money` (integer cents), identifiers, OTP rules, contacts, transfer rules and attempt states. No React, no I/O                      | Only `core`                             |
| `src/server`   | Services (business logic), repository ports and their in-memory implementations, session, security, HTTP helpers, logging, mocks                 | `core`, `shared/lib`                    |
| `src/shared`   | `ui` (primitives), `components` (product pieces used by 2+ features), `hooks`, `api` (typed browser clients), `lib` (http, i18n, format, config) | `core`, inward                          |
| `src/features` | One folder per area (`auth`, `home`, `transfer`, `receipt`): its components, hooks and state                                                     | `shared`, `core`; never another feature |
| `src/app`      | Routes only: pages, layouts and thin API route handlers                                                                                          | Everything                              |

- **The direction is enforced by ESLint**, not by convention: an import that breaks it fails
  `npm run lint`.
- **One folder per component or hook**, with its test and an `index.ts`. There is no central
  barrel file to keep in sync, and imports target the folder, never a file inside it.
- **A piece used by one feature lives in that feature;** it moves to `shared` when a second
  feature needs it.

Why: anyone can tell from a path what a file is and who may use it, features can be
developed or removed independently, and the domain can be tested in isolation. This
structure came from a mid-project refactor I asked for: the first layout mixed `components`,
`lib` and `domain` in a way that was hard to read (ADR-010).

## 3. Separating UI from business logic

Business rules live in **pure functions in `core`**, used in two places:

1. **In the UI, for immediate feedback:** the amount field validates BR-01 (more than zero)
   and BR-02 (not above the balance) as the user types; the recipient step checks BR-03 and
   BR-09 (no self-transfer).
2. **On the server, as the authority:** the transfer service re-validates every rule at
   confirmation (BR-06), whatever the client sent. BR-02 is checked against the balance _at
   that moment_, and the ledger re-checks it atomically while debiting. A user can pass the
   client checks and still get "insufficient funds" if the balance changed in between; the
   UI handles that outcome.

The layers in between:

- **Route Handlers are thin controllers:** parse and validate the shape with Zod, call a
  service, map the result to HTTP. Shape (Zod) and business rule (`core`) are kept apart on
  purpose (ADR-009).
- **Services own the use cases** and depend on repository _ports_, not implementations, so
  a real database replaces the in-memory one without touching services or UI.
- **Expected failures are values, not exceptions:** `Result<T, DomainError>` with a closed
  catalog of error codes. Each code maps to one HTTP status on the server and to one
  Spanish message in the UI; server messages are never shown to users.
- **React components only render state.** Flows live in reducers (pure, unit-tested state
  machines) and hooks (side effects), for example the login state machine, the transfer
  draft and the confirmation state machine.

## 4. Rendering: SSR, CSR and one Server Action (ADR-002)

| Where                               | How                                              | Why                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, transfer layout, receipt      | **Server Components** call services directly     | Per-user financial data in the first paint, no loading spinner on arrival, no data-fetching code in the bundle. Home's balance and activity stream in separate Suspense boundaries, so one can fail (with retry) while the other shows |
| Login, transfer steps, confirmation | **Client Components** calling our Route Handlers | Interactive flows: validation as you type, step state, a confirmation with client timeout, cancellation and status checks                                                                                                              |
| Theme preference                    | **One Server Action**                            | Non-critical, progressive enhancement; documented as the only exception                                                                                                                                                                |

The browser only talks to our own server (a BFF): services and repositories are
`server-only` and never reach the client. Per-user responses are `Cache-Control: no-store`
and pages are dynamic, so nothing personal is cached by a CDN or shared between users.

## 5. State: Context + `useReducer`, no state library (ADR-003)

Client state is small: the login steps, the transfer draft (recipient, amount, concept),
the confirmation status, the theme and the hide-balance preference. Server data arrives
already rendered by Server Components.

- **The transfer draft** is a reducer in a provider mounted by the `/transfer` layout: it
  survives moving between steps and disappears when the user leaves the flow, with no
  manual cleanup.
- **A step guard** sends a user who lands on a later step (deep link, reload) to the first
  incomplete one.
- **Why not Redux or Zustand:** they would add a dependency and global scope for state that
  is local to one flow. A typed reducer gives the same testability. If client-side server
  state grew, I would add a query cache (e.g. TanStack Query) before a global store.

## 6. Confirmation: the part where money moves

The challenge asks for random outcomes: success, network error, insufficient funds,
timeout and unknown error. The hard part is not showing five screens; it is not charging
twice when the outcome is unknown.

- **Idempotency (BR-07).** The summary creates an idempotency key per draft. Every retry
  and status check reuses it. The server atomically _claims_ the key, and a replay returns
  the original outcome. A key reused with a different payload (compared by SHA-256 hash)
  is rejected with `409`. Debit, transaction record, receipt and favorite update are
  committed together.
- **Semantics of each failure.** _Network error_ means the request never reached the
  server: nothing happened, retrying is safe. _Timeout_ and _unknown error_ mean "we don't
  know": the UI never assumes failure.
- **Timeout handling.** After 3 s the UI says it is taking longer than usual. At 10 s it
  stops waiting and verifies the attempt status (at +2 s, +4 s and +8 s), then shows
  _completed_ (receipt), _not processed_ (safe retry with the same key) or _unresolved_
  (do not retry blindly; check the activity). Timings are configurable and shortened in E2E.
- **Lifecycle.** A run-scoped `AbortController` and timers are cleared on unmount; double
  submission is impossible (one attempt in flight; the button is busy).
- **Determinism for tests.** In non-production environments a request header
  (`x-mock-outcome`) forces any outcome, including the three timeout sub-cases. It is
  ignored (and logged) in production.

## 7. Session and security (ADR-001, ADR-004)

The challenge does not ask for real security, but at this scale the shape matters.

- **Session.** A login creates a server-side session; the browser holds only a random,
  HMAC-signed ID in an `HttpOnly; Secure; SameSite=Lax` cookie. Logout deletes the server
  record, so it takes effect at once.
- **Route protection in two layers.** `proxy.ts` (formerly middleware) rejects private
  routes without a valid session before anything renders. Every private layout and
  controller checks the session again, because the proxy is not the authority.
- **CSRF.** `SameSite`, an origin check on every state-changing request, JSON-only bodies,
  no CORS, and a custom header from our client.
- **Abuse limits.** One-time codes have a resend cooldown per identifier and 3 attempts
  each; the client-log endpoint is rate limited. Per-user limits on transfers would need
  the shared store described in §12.
- **Account enumeration.** In production, the API answers the same for a phone that has an
  account and one that does not, so the login does not reveal who is a customer.

## 8. Errors, logs and traceability (ADR-006)

- **Correlation ID.** Every request gets an `x-request-id` in the proxy. It is propagated
  through services and server rendering, written in every log line, and returned to the
  client.
- **Visible reference.** Error screens show a short reference code derived from that ID,
  so a support agent can find the exact logs.
- **Logs.** Structured JSON (pino), from a fixed event catalog, with redaction: no
  identifiers, codes, names or cookies in logs.
- **Client errors.** Errors in the browser are reported to the server with the same ID.

## 9. Components and design (ADR-007, ADR-008)

- **Our own components, Radix where needed.** Domain components are ours (`MoneyText`,
  `TransactionItem`, `ContactItem`, `OutcomeView`, `OneTimeCodeField`…). Radix primitives
  are used only where accessible behavior is complex: dialog, toast and radio group.
- **Semantic design tokens.** Colors are CSS variables, mapped into Tailwind. Light, dark
  and system themes come from a cookie read on the server, so there is no flash of the
  wrong theme. A test fails if a component uses a raw color, and another test checks the
  contrast of every token pair in both themes.
- **Accessibility as a requirement, not a pass at the end.**
  - **Structure and focus:** landmarks and focus on the heading after each navigation.
  - **Announcements:** a live region announces each status once.
  - **Amounts:** read as "250 pesos", not "$250".
  - **Masked numbers:** read as "celular terminación 5678".
  - **Checks:** axe runs in component tests and on every E2E screen in both themes, and
    the layout reflows at 320 px.

## 10. Testing strategy (ADR-005)

| Level              | Tool                     | What                                                                                                                       |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Unit               | Vitest                   | Domain rules (table-driven), formatters, reducers                                                                          |
| Presentation logic | Vitest + Testing Library | Hooks: login flow, amount field, confirmation state machine (fake timers)                                                  |
| Component          | Testing Library + axe    | Behavior through roles and labels, as a user would; accessibility contracts                                                |
| Integration        | Vitest                   | Every Route Handler against the in-memory backend: status codes, CSRF, session, idempotency and concurrency, log redaction |
| E2E                | Playwright + axe         | Every flow and outcome on Chromium desktop and WebKit mobile, light and dark                                               |

**Why Playwright for E2E:**

- **Engines:** it drives Chromium and WebKit from one API, with mobile viewports. WebKit
  matters because every browser on iPhone uses it.
- **Controlled requests:** request interception lets a test force a confirmation outcome
  on one attempt only.
- **Timing:** auto-waiting avoids sleeps, and the app's timings are configurable, so
  timeout cases run fast.
- **Tooling:** first-class TypeScript and an axe integration.

Cypress has no WebKit support of the same quality.

**What the tests caught that a manual check would not have:**

- **Step guard race:** the cancel action raced with the step guard.
- **Hidden layout shift:** a blur error shifted the layout and swallowed the click on
  "Continuar".
- **Stale favorites:** the favorites order was stale after a transfer.
- **Screen-reader text:** the masked number of a favorite was read as bullets.

The task cards log each one.

## 11. Edge cases considered

**Login**

- **Phone formats:** typed with `+52`, spaces, dashes or parentheses, normalized to 10 digits.
- **Email:** uppercase or surrounding spaces are normalized.
- **Code:** pasted with spaces or dashes; letters are rejected.
- **Double submit:** a double click on "Continuar" or "Verificar" sends one request.
- **Reload on the code step:** a reload within the cooldown reuses the code already sent.
- **Expired code:** checked by the server, never by a client timer.
- **Lockout:** 3 wrong codes lock the code; a new one can be requested.
- **Several tabs:** logging in or out in one tab is reflected in the others on their next
  request.
- **Tampered session:** a modified cookie counts as no session.
- **Deep links:** a private URL redirects to Login and comes back after login (only to
  safe internal paths).

**Home**

- **Partial failure:** balance and activity load and fail independently, each with retry.
- **Empty state:** no activity shows a prompt to send money.
- **Unnamed counterparty:** shown as a masked identifier.
- **Long text:** very long names and concepts are truncated with the full text available.
- **Hidden balance:** the preference applies from the first paint, without a flash.
- **Dates:** "Hoy" and "Ayer" are computed in the user's time zone, not the server's.

**New transfer**

- **Amount format:** cents are stored as integers (no floating point); input like `007`,
  `25.` or a pasted `$1,250.50` is normalized.
- **Amount limits:** an amount equal to the balance is allowed; zero balance blocks any
  amount.
- **Self-transfer:** sending to your own phone or email is blocked.
- **Duplicate contacts:** no duplicate favorites, even on a double click.
- **Text input:** names with accents, ñ or emoji are counted by characters, not bytes; a
  concept with only spaces counts as empty.
- **Reload or Back:** a reload on a later step goes to the first incomplete one; Back keeps
  the data.

**Confirmation**

- **Late completion:** the server completes right after the client times out (the receipt
  is shown).
- **Retry after "unresolved":** if the original attempt completed, there is no second
  debit.
- **Concurrent confirmation:** two tabs confirming the same summary create one transaction.
- **Balance changed:** after the summary, the server decides.
- **Edit after a failure:** editing the amount after insufficient funds starts a new
  attempt.
- **Session ends mid-flow:** if the session ends during verification, the outcome is kept.
- **Back after leaving:** the back button after a completed transfer does not reopen it.
- **Wrong receipt:** another user's receipt answers "not found", not "forbidden", so it
  does not reveal that it exists.

## 12. What I would do differently with more time

**At production scale**

- **Persistence:** a real database with transactions for the ledger, and a shared store
  (Redis-like) for sessions, one-time codes, idempotency keys and rate limits. The ports
  are already in place; today one process holds everything in memory.
- **Observability:** OpenTelemetry traces (W3C `traceparent`), logs shipped to a central
  backend, and alerts on signals like the rate of _unresolved_ confirmations.
- **Contracts:** an OpenAPI document generated from one source, shared by the controllers
  and the client, with contract tests between them.
- **Security:**
  - **CSRF:** a signed double-submit CSRF token as an extra layer.
  - **Session:** expiry with a warning.
  - **Transfers:** step-up authentication above an amount.
  - **Edge:** WAF and bot protection in front of the app.

**Product and UX**

- **Draft:** keep the transfer draft in session storage so it survives a reload.
- **Favorites:** search.
- **Activity:** pagination and a detail view.
- **Receipt:** share or download.
- **Language:** more locales; the copy is already externalized.

**Quality and process**

- **Visual tests:** Storybook with visual regression per state and theme.
- **Mutation testing:** on the domain rules.
- **Earlier checks:** a VoiceOver/TalkBack pass and Lighthouse budgets in CI, not only once
  at the end.
- **Structure first:** set the folder structure and its lint rules on day one. I refactored
  it midway; tests kept it safe, but it cost time.
- **E2E earlier:** write the E2E for each flow as soon as the flow existed. The races it
  found were cheaper to fix when the code was fresh.
