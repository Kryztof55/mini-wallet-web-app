# ADR-010 — Folder structure: features, shared and core, one folder per component

| Field | Value |
|---|---|
| **ID** | ADR-010 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (request), with Claude (AI-assisted) |
| **Affects** | TS-00 §3.1 and §3.3, TS-01…TS-05 §3.3, test plan file paths, ESLint configuration |
| **Driven by** | NFR-03 (maintainability) · owner review of the codebase after TASK-20 |

---

## 1. Context

After the user flow was complete, the owner reviewed the code and found the structure hard to read:

- `core`, `lib`, `components` and `features` did not say what goes where; `core` and `lib` sounded alike.
- The dependency direction was broken in practice: "shared" components imported a feature (`components/wallet/balance-card` → `features/home/hide-balance`), and features imported each other (`transfer` → `home` for the header, the hide-balance preference and the summary API; `home` → `transfer` for the "Enviar dinero" link). `home` had become shared without saying so.
- Feature folders were flat (30 files in `features/transfer`: steps, hooks, API, state and tests side by side).
- `components/ui/index.ts` was a central barrel nobody imported, and keeping one in sync is exactly the maintenance problem it should avoid.

## 2. Decision drivers

1. Anyone can tell from the path what a file is and who may use it.
2. The rules are enforced by a tool, not by memory.
3. A component, its test and its public surface stay together; no central file to keep in sync.
4. No behavior change: the move must be mechanical and the test suites must stay green.

## 3. Options considered

| Option | Pros | Cons |
|---|---|---|
| A. Keep the layers, only fix the cross-imports | Smallest diff | Names still unclear; flat folders remain |
| B. Group by technical type (`components/`, `hooks/`, `services/`) | Familiar | A feature is scattered across the tree; nothing stops cross-imports |
| **C. `features` + `shared` + `core`, one folder per component, ESLint boundaries** | Path says scope; colocation; rules enforced | One large mechanical move; docs and paths to update |

## 4. Decision

Option C.

```
app → features → shared → core          server → shared/lib, core
inside shared:  components → ui, hooks, api → lib → core
```

- `src/features/<area>` (`auth`, `home`, `transfer`, `receipt`): `components/<name>/`, `hooks/<name>/`, `state/`. A feature never imports another feature; the confirmation flow joins `transfer` because it lives on `/transfer/summary` and depends on the draft.
- `src/shared/ui` (primitives), `src/shared/components` (product pieces used by 2+ features), `src/shared/hooks`, `src/shared/api` (browser clients of our API, one per area, with their Zod contracts), `src/shared/lib` (infrastructure for client and server).
- `src/core` keeps its name and meaning (owner decision): pure domain, grouped by concept, each group with an `index.ts`: `common` (Result, errors, IDs, text), `money`, `identity` (identifier, user), `auth` (OTP, return-to), `contacts`, `transfers` (rules, attempt states, transactions). Direction: `transfers → contacts, identity, money → common`; `auth → identity → common`.
- One folder per component or hook: `<name>.tsx`, `<name>.test.tsx`, `index.ts` with **named** re-exports of that folder only. `export *` is not used: Next.js rejects it for client modules. Imports target the folder, never a file inside it, never a central barrel.
- A piece used by one feature lives in that feature; when a second feature needs it, it moves to `shared`.
- ESLint `no-restricted-imports` (regex patterns) enforces each arrow, the "no cross-feature imports" rule and the "import the folder" rule. Integration tests under `src/server` may import route handlers. Flat config keeps only the **last** matching `no-restricted-imports` per file, so each file belongs to exactly one group that lists all its patterns (the first version overlapped groups and silently dropped the core purity rule; caught while adding the core groups and verified with probe imports: 10 forbidden imports fail, 2 allowed ones pass).

## 5. Consequences

- Positive: scope is visible in every import (`@/features/transfer/…` vs `@/shared/…`); breaking a rule fails lint; adding a component means adding a folder, not editing a barrel.
- Negative: about 130 files moved and every import rewritten (done by script, resolving each import to its file; history kept with `git mv`). `index.ts` files must be updated when a folder gains an export.
- Task cards TASK-01…TASK-20 keep the paths of their time as a historical record; the table below maps them.

| Before | After |
|---|---|
| `src/components/ui/<name>.tsx` | `src/shared/ui/<name>/` |
| `src/components/wallet/{detail-row,masked-identifier,money-text,hide-balance-toggle}` | `src/shared/components/<name>/` (toggle in `hide-balance/`) |
| `src/components/wallet/{balance-card,transaction-item}` | `src/features/home/components/<name>/` |
| `src/components/wallet/{avatar,contact-item,money-input,recipient-context}` | `src/features/transfer/components/<name>/` |
| `src/components/bfcache-guard.tsx` | `src/shared/components/bfcache-guard/` |
| `src/lib/**` | `src/shared/lib/**` (`hooks/use-section-retry` → `src/shared/hooks/`) |
| `src/features/*/api.ts` | `src/shared/api/{auth,account,contacts,transfers}.ts` |
| `src/features/home/{home-header,hide-balance,constants}` | `src/shared/components/{app-header,hide-balance}/`; `HIGHLIGHT_PARAM` → `src/shared/lib/routes.ts` |
| `src/features/auth/logout-button.tsx` | `src/shared/components/app-header/` |
| `src/features/theme/*` | `src/shared/components/theme/` |
| `src/features/transfer/{completion-marker,start-transfer-link}` | `src/shared/lib/transfer-completion.ts`, `src/shared/components/start-transfer-link/` |
| `src/features/confirmation/*` | `src/features/transfer/{components,hooks,state}/`, receipt → `src/features/receipt/components/`, `view-heading` → `src/shared/ui/view-heading/` |
| `src/components/ui/index.ts` | removed |
| `src/core/<module>.ts` | `src/core/{common,money,identity,auth,contacts,transfers}/` (see §4) |

## 6. Bindings introduced

- `eslint.config.mjs`: `boundaries` (per-feature, `shared`, `shared/lib`, `shared/ui`, `server`, deep-import rule).
- `vitest.config.mts`: test globs for `src/shared/**`.
