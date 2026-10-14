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
  `src/lib/i18n/messages.es-MX.ts`. Components never hard-code text: use `t('key', params)`.
  New keys go to the FS §12 table first.
- The project owner talks in Spanish.

## 4. Architecture rules (TS-00, ADR-001…009)

| Layer         | Path                                                                                                               | Rule                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core (domain) | `src/core`                                                                                                         | Pure TS rules and types (`Money`, `parseIdentifier`, `validateAmount`, OTP, attempt states). Imports nothing from the project, React, Next or I/O — ESLint enforces it.     |
| Server        | `src/server`                                                                                                       | `import 'server-only'`. Services return `Result`, never throw for expected failures. Repositories behind ports (`repositories/ports.ts`), in-memory mocks in `server/mock`. |
| Controllers   | `src/app/api/**/route.ts`                                                                                          | Wrap with `withApi(route, handler)`; parse with `parseJsonBody(request, zodSchema)`; map errors with `errorResponse(domainError(code), requestId)`.                         |
| Browser HTTP  | `src/lib/http/client.ts`                                                                                           | `request(method, path, { schema, body, timeoutMs, idempotencyKey })` → `Result`, never throws, always carries `requestId`.                                                  |
| Shared pure   | `src/lib`                                                                                                          | config, formatting, i18n, theme, observability helpers.                                                                                                                     |
| UI            | `src/components/ui` (base), `src/components/wallet` (wallet-specific), `src/features/*` (screens, hooks, reducers) | Presentation only. UI rules (`UIR-*`) live here; business rules (`BR-*`) are enforced on the server.                                                                        |

- Error codes: closed catalog in `src/core/errors.ts`, HTTP mapping in
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
```

Before reporting a task done: lint, typecheck, format check, `npm test` and `npm run build`
all green. E2E when the task touches flows (TASK-20 owns the suite).

## 6. UI and accessibility rules

- Colors only through semantic token utilities (`bg-surface`, `text-text-primary`,
  `text-status-error`, …). Tailwind's default palette is removed; raw colors fail
  `src/test/no-raw-colors.test.ts`. New tokens go in `src/app/globals.css` as
  `light-dark(light, dark)` and must pass `src/app/theme-tokens.test.ts` (contrast).
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

- Done: TASK-01, 03, 04, 05, 06, 07, 08, 09. TASK-02 is **In review** until
  `npm run test:e2e` passes on the owner's machine.
- **Next: TASK-10** (auth API: request code with random OTP + `demoCode`, verify →
  `createSession`, logout → `destroySession`). It also finishes TC-INT-12.
- Then: TASK-11 login screens → TASK-12/13 Home → TASK-14/15/16
  transfer → TASK-17/18/19 confirmation and receipt → TASK-20/21/22.

## 10. Known pitfalls

- Next.js 16.4: the `middleware` convention is deprecated → `src/proxy.ts`. Folders
  starting with `_` are private in the App Router (that is why the reset route is
  `/api/mock/reset`).
- Radix in jsdom: `Dialog` restores focus only to its own `Trigger` (pass `trigger`);
  `RadioGroup` selects on focus only while an arrow key is held (tests hold the key);
  toast announcements render on the next frame.
- Setting a cookie in a Server Action re-renders the current route on the server.
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
