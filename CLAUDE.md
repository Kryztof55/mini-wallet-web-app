# CLAUDE.md — Mini Wallet Web App

Instructions for AI coding sessions (Claude Code or any agent) working in this repo.
Read this file fully before touching code. The specs are the source of truth; this file is
the map to them.

## 1. What this is

Spin "Web Challenge": a mini wallet in Next.js + TypeScript with mocked data.
Flow: Login (identifier + one-time code) → Home → New transfer (recipient → amount → summary)
→ Confirmation (5 outcomes: success, network error with retry, insufficient funds, timeout,
unknown error) → Receipt. Deliverables also include `README.md`, `DECISIONS.md` and
`AI_USAGE.md` (TASK-22).

## 2. How work is done here (spec-driven, one task at a time)

1. Pick the next task from `specs/04-development/tasks/README.md` (critical path in
   `specs/03-plan/implementation-plan.md`).
2. Read the task card, then every spec it references (FS, TS, ADR, accessibility
   requirements). If the code must deviate from a spec, update the spec first (bump its
   version and add a change-history row). Accepted ADRs are never edited; a new ADR
   supersedes them.
3. Implement. Name tests after their test case and rule IDs, e.g.
   `describe('[TC-UNIT-03][BR-01][BR-02] validateAmount', …)`.
4. Run the quality gates (§5). All must pass.
5. Close the task:
   - task card: status `Done`, actual time, file table, acceptance criteria and checklist
     ticked, TC statuses, **Dev log** (what and why), **AI usage** (tool, what it did, what
     was corrected), tech debt;
   - `specs/04-development/tasks/README.md` status;
   - `specs/05-testing/test-plan.md`: set the TC rows to ✅, then run
     `python3 scripts/update-test-matrix.py` (never edit the matrix by hand);
   - any spec you changed: version bump + change-history row.
6. Report back briefly. Do not commit unless the owner asks (see §8).

## 3. Language

- Every artifact is in **English**: code, comments, specs, commit messages, docs.
- User-facing copy is **Spanish (es-MX)**, defined in each FS §12 and implemented in
  `src/shared/lib/i18n/messages.es-MX.ts`. Components never hard-code text: use `t('key', params)`.
  New keys go to the FS §12 table first.
- The project owner talks in Spanish.

## 4. Architecture rules (TS-00, ADR-001…010)

**Folders (ADR-010).** `app → features → shared → core`; `server → shared/lib, core`; inside
core `transfers → contacts, identity, money → common`, `auth → identity → common`. ESLint
(`no-restricted-imports` in `eslint.config.mjs`) enforces every arrow. Flat config keeps only
the last matching `no-restricted-imports` per file: add patterns to the file's one group.

| Folder                         | What goes there                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`                      | Routes only: pages, layouts, `api/**/route.ts` controllers.                                                                               |
| `src/features/<area>`          | One product area (`auth`, `home`, `transfer`, `receipt`): `components/<name>/`, `hooks/<name>/`, `state/`. Never imports another feature. |
| `src/shared/ui/<name>`         | Design-system primitives (Radix + tokens). Know nothing about the product.                                                                |
| `src/shared/components/<name>` | Product pieces used by 2+ features: `app-header`, `hide-balance`, `money-text`, `theme`, `start-transfer-link`…                           |
| `src/shared/hooks/<name>`      | Hooks used by 2+ features.                                                                                                                |
| `src/shared/api`               | Browser clients of our API, one module per area with its Zod contract (`auth`, `account`, `contacts`, `transfers`).                       |
| `src/shared/lib`               | Infrastructure for client and server: `http/client.ts`, `i18n`, `format`, `config`, `routes`, `observability`.                            |
| `src/core`                     | Pure TS domain rules and types. Imports nothing from the project, React, Next or I/O.                                                     |
| `src/server`                   | `import 'server-only'`. Services return `Result`; repositories behind ports; mocks in `server/mock`.                                      |

- **One folder per component or hook**: `<name>.tsx`, `<name>.test.tsx`, `index.ts` with named
  re-exports of that folder only (no `export *`: Next rejects it for client modules). Import the
  folder (`@/shared/ui/button`), never a file inside it (ESLint), never a central barrel.
- Used by one feature → it lives in that feature. Needed by a second feature → move it to
  `shared` (don't import across features).
- Controllers: `withApi(route, handler)`; parse with `parseJsonBody(request, zodSchema)`; map
  errors with `errorResponse(domainError(code), requestId)`.
- Browser HTTP: `request(method, path, { schema, body, timeoutMs, idempotencyKey })` →
  `Result`, never throws, always carries `requestId`.
- UI rules (`UIR-*`) live in the UI; business rules (`BR-*`) are enforced on the server.

- Error codes: closed catalog in `src/core/common/errors.ts`, HTTP mapping in
  `src/server/http/status.ts` (TS-00 §5.2). The UI picks copy by `code`, never from the
  server `message`.
- Money is integer minor units (`amountMinor`), MXN.
- Validation: Zod for shapes at boundaries (400 `VALIDATION_ERROR`); business rules in
  services (422 with a specific code) — ADR-009.
- Rendering: Server Components read through services; client calls go through Route
  Handlers; the **only** Server Action is the theme preference (ADR-002).
- Route protection: `src/proxy.ts` (Next 16 name for middleware) is the first barrier;
  `getSession()` in private layouts/controllers is the authority (ADR-001, ADR-004).
- Logging: `logEvent(level, event, fields)` with catalog events from
  `src/server/logging/events.ts`; never log codes, cookies, full identifiers or names
  (redaction in `redaction.ts`). Error field is `errorCode`, not `code`.

## 5. Commands and quality gates

```bash
npm run dev            # http://localhost:3000 (needs .env.local, see .env.example)
npm run lint           # ESLint, 0 errors and 0 warnings
npm run typecheck      # tsc --noEmit
npm run format:check   # Prettier (npm run format to fix)
npm test               # Vitest: projects "node" (unit/integration) and "dom" (jsdom components)
npm run build          # must compile with no warnings
npm run test:e2e       # Playwright: builds and serves on :3100, 4 projects (light/dark × desktop/mobile)
                       # first time on a machine: npx playwright install chromium webkit
```

Before reporting a task done: lint, typecheck, format check, `npm test` and `npm run build`
all green. E2E when the task touches flows (TASK-20 owns the suite).

## 6. UI and accessibility rules

- Colors only through semantic token utilities (`bg-surface`, `text-text-primary`,
  `text-status-error`, …). Tailwind's default palette is removed; raw colors fail
  `src/styles/no-raw-colors.test.ts`. Styles live in `src/styles/`: `globals.css` (entry, imports
  only), `tokens.css` (semantic tokens as `light-dark(light, dark)`), `tailwind-theme.css`
  (token → utility mapping), `base.css`, `utilities.css`. New tokens go in `tokens.css` and its
  `@theme` mapping, and must pass `src/styles/tokens.test.ts` (contrast).
- `Button` has no `disabled` prop on purpose: primary actions stay enabled with invalid
  input and show errors on press (UIR-AUTH-03, UIR-TX-13). Use `busy` during requests.
- Use the base components (`TextField`, `ErrorState` + `ReferenceCode`, `SkeletonGroup`,
  `Dialog` with `trigger`, `useToast`, `useAnnounce`) instead of re-implementing patterns.
- Every view: one `h1`, `<main id="main">` (skip link target), focus to the heading on
  step/view change, WCAG 2.2 AA in light and dark. Component tests run axe
  (`src/test/axe.ts`).

## 7. Testing conventions

- Unit/integration (`*.test.ts`, `*.int.test.ts`) run in node; components
  (`*.test.tsx`) in jsdom with Testing Library + user-event.
- `server-only` is aliased to an empty module in Vitest.
- Mock data and forced outcomes: seed users in `src/server/mock/seed.ts`;
  `x-mock-outcome` header and `POST /api/mock/reset` work only when mock controls are on
  (`APP_ENV` ≠ production and `MOCK_CONTROLS_ENABLED=true`).
- The one-time code is random per challenge; outside production the API returns
  `demoCode` so the login screen can show it.

## 8. Git

- One branch per milestone, as named in each task card (`feat/m0-foundations`,
  `feat/m1-security-login`, …). Conventional Commits with the task ID:
  `feat(scope): summary [TASK-NN]`.
- Commit only when the owner asks. Author: `Christopher <c.farango.dg@gmail.com>`.
- Never overwrite `package.json` / `package-lock.json` wholesale; ask before adding a
  dependency.

## 9. Current state

- Done: TASK-01 to TASK-19 (the whole user flow). TASK-20: all 23 E2E green on 4 projects;
  pending the 10× stability run (`npx playwright test --repeat-each=10`).
- Folder-structure refactor done (ADR-010) on `refactor/folder-structure`.
- TASK-21 in review: scripted a11y/responsive pass done and its 8 findings fixed (reflow at
  320 px, spoken masks and amounts); TC-MAN-02 waits for the owner's VoiceOver run (guide in
  the card, §10). **Next: TASK-22** delivery docs, on `chore/m5-quality-delivery`.
- Pending owner decision: demo-accounts hint on login step 1 and no demo code for
  unknown identifiers (non-production only).
- TASK-22: README with demo accounts, DECISIONS.md, AI_USAGE.md.

## 10. Known pitfalls

- `MoneyText` and masked identifiers render a visual span (`aria-hidden`) plus an `sr-only`
  spoken one ("250 pesos", "celular terminación 5678"). `toHaveText` / `textContent` on a
  container sees both; assert the visual text with `getByText(…, { exact: true })`.
- Next.js 16.4: the `middleware` convention is deprecated → `src/proxy.ts`. Folders
  starting with `_` are private in the App Router (that is why the reset route is
  `/api/mock/reset`).
- Radix in jsdom: `Dialog` restores focus only to its own `Trigger` (pass `trigger`);
  `RadioGroup` selects on focus only while an arrow key is held (tests hold the key);
  toast announcements render on the next frame.
- Setting a cookie in a Server Action re-renders the current route on the server.
- Anything exported from a `'use client'` module is a client reference on the server: a
  function can't be called and a constant is not its value (e.g. `buttonClasses` lives in
  `shared/ui/button/button-classes.ts`, the cookie name in
  `shared/components/hide-balance/constants.ts`). Unit tests and the
  build don't catch it: check the server log, a static render or E2E.
- `/login?reason=…` is never bounced by the proxy even with a valid cookie (avoids a loop
  when the session store lost the record). Private controllers:
  `withApi(route, withSession(handler))`.
- Vitest: `beforeEach(() => mock.mockClear())` returns the mock and Vitest calls it as a
  teardown — use a block body.
- Tailwind v4 / Lightning CSS polyfills `light-dark()` in the build; check the built CSS
  if theming looks wrong.
- When running inside a Linux VM against this macOS checkout, native binaries
  (`@next/swc-linux-*`, `lightningcss-linux-*`, `@tailwindcss/oxide-linux-*`,
  `@rolldown/binding-linux-*`, `@unrs/resolver-binding-linux-*`) must be installed with
  `--no-save` after every `npm install`. Not needed on the Mac itself.
- Never reset the transfer draft while a step is mounted and you are navigating away: the
  step guard sees the empty draft and its `router.replace` races yours. Use `cancelled`
  (guard goes Home) or just leave the layout (TASK-16 Cancel, TASK-18 success).
- Fake timers + route handlers: the request reaches its `setTimeout` only after real async
  work (session HMAC), and `vi.waitFor` advances fake timers while polling. Wait with
  `setImmediate` turns until `vi.getTimerCount() > 0` (see `outcomes.int.test.ts`).
- Blur validation + a submit button below the field: mouse down blurs, the error renders, the
  layout shifts and the click misses. `Button type="submit"` prevents default on mouse down;
  keep it that way (jsdom has no layout, so only E2E catches this).
- E2E: scope text assertions to `main(page)` (`tests/e2e/session.ts`). Outside `<main>` the
  live region keeps the last announcement (a fixed error can still "exist"), and streamed
  Suspense segments can leave hidden copies. Only toasts are asserted at page level.
- E2E: don't assert a transient view (e.g. "verificando…", ~200 ms with E2E timings); Playwright
  polls at ~500 ms by then and misses it intermittently. Assert durable evidence instead
  (the network requests it makes, the final screen) and cover the view in component tests.
- E2E: logout redirects with `location.replace`; wait for `/login?reason=logged_out`
  before the next `page.goto`, or WebKit reports the goto as interrupted (`logout` in `tests/e2e/session.ts`).
