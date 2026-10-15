# Mini Wallet Web App

A Next.js + TypeScript simulation of a basic wallet flow for the Spin web challenge:
**Login → Home → New transfer → Confirmation / Receipt**. All data is mocked behind the
app's own API routes, but the app is built the way a production app would be:
typed domain model, business rules enforced on the server, idempotent confirmation,
session and CSRF protection, structured logs with correlation IDs, accessibility in
light and dark themes, and unit, integration and E2E tests.

| Document                       | What it covers                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [DECISIONS.md](./DECISIONS.md) | Why the project is structured this way, UI vs business logic, rendering and state choices, edge cases, what I would do with more time |
| [AI_USAGE.md](./AI_USAGE.md)   | Which AI tools were used and where, what was accepted, corrected or rejected, and which decisions were mine                           |
| [specs/](./specs/README.md)    | The spec-driven workflow behind the code: requirements, functional and technical specs, ADRs, plan, task cards, test plan             |

## Time spent

**About 20.5 hours of active work**, in two blocks (Mexico City time). The night between
them is the only pause; time spent reading and analyzing, with no file or commit to show
for it, is included.

| Phase                                                                                                  | When                           | Time        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------ | ----------- |
| Reading the challenge, requirements analysis, functional and technical specs, ADRs, plan and test plan | Oct 13, 17:54 → Oct 14, 00:37  | ~6.5 h      |
| Implementation, tests, folder-structure refactor, accessibility pass and these documents               | Oct 14, 10:35 → Oct 15, ~00:45 | ~14 h       |
| **Total**                                                                                              |                                | **~20.5 h** |

Measured from the project creation time, file and git timestamps, and the commit history.
The per-task times in the task cards are rough effort estimates, not clock time.

## Quick start

Requirements: **Node.js ≥ 20.9** and npm.

```bash
npm install
cp .env.example .env.local
# In .env.local set SESSION_SECRET to a random string of 32+ characters, e.g.:
#   openssl rand -base64 48
npm run dev            # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

Every setting, its default and its meaning is listed in [`.env.example`](./.env.example)
(details in TS-00 §8). Configuration is validated at startup: a missing or invalid value
stops the server with a clear message.

## Demo accounts

Log in with any of these (phone **or** email). Outside production, the code step shows the
one-time code under the field (“Ambiente de prueba — código: …”): copy or paste it and
press “Verificar”. Any other phone or email is not a demo account: no code is shown for it.

| Use it to see                                                  | Phone        | Email                 |
| -------------------------------------------------------------- | ------------ | --------------------- |
| **Main flow** — balance $12,345.67, recent activity, favorites | `5512345678` | `ana@demo.mx`         |
| New user — $500.00, no activity, no favorites                  | `5500000001` | `nuevo@demo.mx`       |
| Zero balance — sending is blocked by the balance rule          | `5500000002` | `cero@demo.mx`        |
| Balance section fails to load (retry)                          | `5500000003` | `falla.saldo@demo.mx` |
| Activity section fails to load (retry)                         | `5500000004` | `falla.movs@demo.mx`  |
| Login service error                                            | `5500000005` | `falla.login@demo.mx` |

**Recommended for reviewers: `ana@demo.mx`.** Phones are also accepted as
`+52 55 1234 5678` or `(55) 1234-5678`.

> **Transfer confirmations answer randomly** (success, network error, insufficient funds,
> timeout, unknown error). Send several transfers to see every case — see
> [Trying each confirmation outcome](#trying-each-confirmation-outcome).

The one-time code is random per request, valid 5 minutes, 3 attempts; a new code can be
requested after 30 s. Mock data lives in server memory: transfers and new contacts persist
while the server runs and reset on restart.

### Trying each confirmation outcome

**The transfer confirmation answers randomly on purpose**, as the challenge asks: every
time you press **“Enviar $…”** on the summary, the mock server picks one outcome. **To see
the different cases, send several transfers** (e.g. with `ana@demo.mx`, $10 to Luis Pérez)
and you will get a different screen from time to time:

| Outcome            | Chance | What you see                                                                                                                                                          |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Success            | 60 %   | Receipt: “Envío realizado”, with folio, date and the new balance                                                                                                      |
| Network error      | 10 %   | “No pudimos conectarnos”: the money was not sent; “Intentar de nuevo” retries safely                                                                                  |
| Insufficient funds | 10 %   | “No tienes saldo suficiente”, with the current balance and “Cambiar monto”                                                                                            |
| Timeout            | 10 %   | “Esto está tardando un poco más de lo normal…”, then “Estamos verificando tu envío…”; the app checks the status and ends on the receipt (the transfer completed late) |
| Unknown error      | 10 %   | “No pudimos completar tu envío”: generic fallback that does not claim whether the money moved, with a reference code, a safe retry and “Ir al inicio”                 |

Things to know while trying them:

- **Retries are safe:** “Intentar de nuevo” reuses the same attempt, so a transfer is never
  charged twice, and the retry gets a new random answer.
- **Data persists while the server runs:** each success lowers the balance and appears in
  Home's activity. Restart the server to start again from the seed data.
- **Business rules are not random:** an amount of zero, above your balance, or with no
  recipient is always rejected before or at confirmation.

**To see one outcome every time** instead of waiting for it, set its weight in `.env.local`
and restart the server:

```bash
OUTCOME_WEIGHTS=network_error:100      # or insufficient_funds / timeout / unknown_error
OUTCOME_WEIGHTS=success:50,timeout:50  # or any mix; the default is 60/10/10/10/10
```

The E2E tests force each outcome per request with the `x-mock-outcome` header, including
the three timeout sub-cases: completed late, not processed, and unresolved (“No pudimos
confirmar el estado de tu envío”). Demo aids — the code hint, `x-mock-outcome`,
`POST /api/mock/reset` — exist only when `MOCK_CONTROLS_ENABLED=true` and are always off
with `APP_ENV=production`.

## Scripts

| Command                                                 | What it does                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                           | Development server                                                                                                |
| `npm run build` / `npm start`                           | Production build and server                                                                                       |
| `npm run check`                                         | Lint + type-check + unit/integration tests                                                                        |
| `npm test`                                              | Unit, component and integration tests (Vitest)                                                                    |
| `npm run test:coverage`                                 | Same, with a coverage report                                                                                      |
| `npm run test:e2e`                                      | Playwright E2E: Chromium desktop and WebKit iPhone, light and dark (4 projects); builds and starts the app itself |
| `npm run lint` / `npm run typecheck` / `npm run format` | Individually                                                                                                      |

First E2E run: `npx playwright install chromium webkit`.

## Tech stack

| Library                                                 | Why                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16** (App Router) + **React 19**              | Server Components for first render, Route Handlers as the API, one Server Action; `proxy.ts` as the first auth barrier (ADR-001, ADR-002) |
| **TypeScript 6** (`strict`, `noUncheckedIndexedAccess`) | Branded IDs, `Money` in minor units, `Result` types for expected errors; no `any`                                                         |
| **Zod**                                                 | Request/response shapes validated at every boundary; types derived from the schema (ADR-009)                                              |
| **Tailwind CSS 4**                                      | Utility styling mapped to our semantic CSS-variable tokens; light/dark/system themes without a flash (ADR-007)                            |
| **Radix UI** (Dialog, Toast, Radio Group)               | Only where accessible behavior is hard to get right; every other component is ours (ADR-008)                                              |
| **pino**                                                | Structured JSON logs with request IDs and redaction (ADR-006)                                                                             |
| **Vitest** + **Testing Library** + **axe-core**         | Unit, presentation-logic, component (with accessibility scan) and Route Handler integration tests (ADR-005)                               |
| **Playwright** + **@axe-core/playwright**               | E2E across engines and mobile viewports, with forced outcomes and accessibility scans (ADR-005)                                           |
| **ESLint** + **Prettier**                               | Static analysis, including the import rules that enforce the folder architecture (ADR-010)                                                |

State management uses React Context + `useReducer` scoped to the transfer flow; no state
library (ADR-003, justified in DECISIONS.md).

## Project structure

```
src/
  app/          Routes only: pages, layouts, API route handlers (thin)
  features/     auth · home · transfer · receipt — screens, hooks and state per area
  shared/       ui (primitives) · components (shared product pieces) · hooks
                api (typed browser clients of our API) · lib (http, i18n, format, config…)
  core/         Pure domain: money, identity, auth, contacts, transfers — no React, no I/O
  server/       services (business logic) · repositories (ports + in-memory) · session ·
                security · http helpers · logging · mock (seed, outcome simulator)
  styles/       Design tokens, Tailwind theme, base styles
  proxy.ts      Request ID, CSP, CSRF origin check, route protection
tests/e2e/      Playwright specs
specs/          Requirements → specs → ADRs → plan → task cards → test plan
```

Imports only go `app → features → shared → core` (and `server → shared/lib, core`); ESLint
enforces it. Each component or hook has its own folder with its test and an `index.ts`.

## Testing

- **652 unit, component and integration tests** in 83 files: domain rules, reducers and
  hooks, components (with axe), every Route Handler against the in-memory backend,
  idempotency and concurrency of the confirmation.
- **E2E** (`tests/e2e/`): every flow and every confirmation outcome, session and CSRF
  checks, theme, correlation IDs, axe on every screen in light and dark, and reflow at
  320 px — on 4 projects (Chromium desktop and WebKit mobile, light and dark).
- **Manual accessibility pass** (TASK-21): keyboard, 320 px / 200 % zoom / text spacing,
  forced colors, reduced motion. The traceability matrix from every requirement to its
  tests is in [`specs/05-testing/test-plan.md`](./specs/05-testing/test-plan.md).

## Known limitations

- **Mocked backend:** data lives in the memory of one server process — it resets on
  restart and is not shared between instances. Sessions, one-time codes, idempotency
  records and rate limits are in memory too. The repositories are interfaces (ports), so a
  real database or a Redis-like store replaces them without touching services or UI.
- **No real authentication:** the one-time code is never sent; outside production it is
  shown on screen. No session expiry (the session lasts until logout).
- **Single currency (MXN) and Mexican phone numbers** (10 digits, optional `+52`).
- **Activity shows the last 10 movements**, with no pagination or detail view.
- **Not included:** search in favorites, receipt share/download (copying the folio is
  supported), biometrics, push notifications.
- **The transfer draft does not survive a page reload**: the step guard sends the user
  back to the first incomplete step.
- **Accessibility:** automated and scripted checks pass; the VoiceOver smoke test
  (TC-MAN-02) is pending. Lighthouse performance budgets were not measured.
- **Observability:** logs go to stdout as JSON; no tracing backend or dashboards.
