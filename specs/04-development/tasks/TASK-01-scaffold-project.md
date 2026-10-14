# TASK-01 — Scaffold the project and tooling

| Field | Value |
|---|---|
| **ID** | TASK-01 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | TS-00 §3.3, §14 · CON-01 |
| **Specs** | TS-00 |
| **Depends on** | — |
| **Estimate** | 0.5 h |
| **Actual time** | ~1 h (incl. dependency install issues) |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-01]` |

---

## 1. Goal

A Next.js + TypeScript project with the TS-00 folder structure where `dev`, `build`, `lint`, `typecheck` and `test` all run.

## 2. Scope

**In scope:** Project creation; strict `tsconfig`; ESLint rules from TS-00 §14 (no `any`, no non-null assertions); Prettier; npm scripts; `.env.example`; empty folder structure.
**Out of scope:** Any feature code.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `package.json, tsconfig.json, eslint config, .prettierrc` | New |
| `.env.example` | New — keys from TS-00 §8 |
| `src/** (folders)` | New — structure from TS-00 §3.3 |

## 4. Acceptance criteria

- [x] All scripts run without errors on a clean clone.
- [x] ESLint fails on `any` and on non-null assertions.
- [x] Framework middleware file convention (`middleware` vs `proxy`) verified and noted in TS-00 if different (ADR-001 §6).
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| — | — | No dedicated TC; verified by the checks in §4 | — |

See the [test plan](../../05-testing/test-plan.md).

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
| 2026-10-14 | npm registry blocked in the AI workspaces (403 by policy) → owner installed dependencies from his terminal; versions resolved by npm: Next 16.4.0, React 19.3.1, TypeScript 6.0.3, Zod 4.6.7, Tailwind 4.3.3, ESLint 9.39.5. |
| 2026-10-14 | `eslint-config-next` resolved to 14.2.35 (incompatible with ESLint 9, pulled a vulnerable `glob`); pinned to 16.4.0 to match Next instead of `npm audit fix --force`. `@types/node` aligned with the local Node major. |
| 2026-10-14 | Verified in Next 16.4 source: `middleware` file convention is deprecated → `src/proxy.ts`. TS-00/TS-01/TS-05, TASK-09 and test plan updated (TS-00 v1.2). |
| 2026-10-14 | Added `APP_ENV` so mock controls depend on it, not on `NODE_ENV`; E2E can run a production build with `APP_ENV=test`. |
| 2026-10-14 | Linux arm64 native binaries installed with `--no-save` so the AI can run lint/tests/build from the linked shell. |
| 2026-10-14 | Checks: `eslint .` ✅ · `tsc --noEmit` ✅ · `prettier --check` ✅ · `next build` ✅ · ESLint rejects `any` and `!` ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Config files (tsconfig, ESLint, Prettier, Next, PostCSS, .env.example), install commands, diagnosis of the audit warning | tsconfig/ESLint/Prettier settings | `npm audit fix --force` suggestion from npm rejected in favor of pinning the matching version; ESLint override added after a false positive on Playwright `use` |

**Decisions made by me, not by the AI:** Install dependencies manually from my terminal; use `@latest` instead of pinned versions; keep TypeScript 6.

## 9. Technical debt / follow-ups

- Empty folders of TS-00 §3.3 are created by each task as code lands (git does not track empty folders).
- Temporary `src/app/page.tsx` replaced by Home in TASK-13.
- Re-run the `--no-save` Linux binaries install after any plain `npm install`.
