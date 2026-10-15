# TASK-02 — Set up the test tooling

| Field | Value |
|---|---|
| **ID** | TASK-02 |
| **Status** | Done |
| **Milestone** | M0 — Foundations |
| **Covers** | ADR-005 · NFR-08, NFR-09 |
| **Specs** | ADR-005, TS-00 |
| **Depends on** | [TASK-01](./TASK-01-scaffold-project.md) |
| **Estimate** | 0.5 h |
| **Actual time** | ~0.5 h |
| **Branch / change request** | `feat/m0-foundations` · commits `… [TASK-02]` |

---

## 1. Goal

Vitest (unit, presentation logic, component, integration) and Playwright (E2E with axe-core) configured, each with one passing example.

## 2. Scope

**In scope:** Vitest + jsdom + Testing Library + user-event; Playwright projects: desktop Chromium and mobile WebKit, light and dark color schemes; axe helper; `test`, `test:e2e`, `test:coverage` scripts.
**Out of scope:** Real test cases (they come with each task).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `vitest.config.ts, src/test/setup.ts` | New |
| `playwright.config.ts, tests/e2e/fixtures.ts` | New — projects, axe helper, mock-outcome header helper |

## 4. Acceptance criteria

- [x] `npm test` and `npm run test:e2e` pass with the example tests.
- [x] E2E fixture can set `x-mock-outcome` and reset mock data.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

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
| 2026-10-14 | Vitest 5 with two projects: `node` (domain, lib, server, route handlers) and `dom` (jsdom: components, hooks). jest-dom matchers + RTL cleanup in setup; axe helper with contrast disabled in jsdom (checked in E2E). |
| 2026-10-14 | Playwright 1.64: four projects (Chromium desktop and WebKit iPhone 13, light and dark), production build as web server with shortened timings and `APP_ENV=test`, one worker because mock state is shared and reset per test. |
| 2026-10-14 | Fixtures: auto `resetMocks`, `forceOutcome(urlGlob, outcome)` via route-level header injection, `expectNoA11yViolations` (WCAG 2.x A/AA tags). |
| 2026-10-14 | Added `GET /api/health` used by Playwright readiness and as integration smoke test. |
| 2026-10-14 | Checks: `vitest run` ✅ 3/3 (node + dom). E2E smoke pending owner run (`npm run test:e2e`) — browsers live on the owner machine. |
| 2026-10-14 | Owner run on macOS after `npx playwright install webkit` (WebKit was missing): `npm run test:e2e` passed in all 4 projects (Chromium/WebKit × light/dark), on the TASK-09 build — which also confirms the app hydrates under the nonce CSP and `/` redirects to `/login`. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Vitest/Playwright configs, fixtures, smoke tests | Project split, fixtures | — |

**Decisions made by me, not by the AI:** Run E2E on my machine.

## 9. Technical debt / follow-ups

- E2E smoke to be confirmed by the owner before marking Done.
