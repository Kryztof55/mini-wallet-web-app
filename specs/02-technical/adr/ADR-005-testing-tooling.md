# ADR-005 — Vitest + Testing Library for unit/component/integration, Playwright for E2E

| Field | Value |
|---|---|
| **ID** | ADR-005 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | Test plan, all TS §14 |
| **Driven by** | CON-07 (E2E engine justified) · NFR-08, NFR-09, NFR-10 · A11Y verification · UX-22 (both themes) |

---

## 1. Context

The challenge values unit tests of validations, hooks and critical components, and E2E tests with a justified engine. Our specs add requirements that shape tooling: every confirmation outcome must be forced deterministically (NFR-10), timeouts must be controllable, accessibility must be scanned automatically in both themes, and the app is mobile-first.

## 2. Decision drivers

1. Fast feedback for many small domain and reducer tests.
2. Component tests that exercise behavior the way users do (roles, labels), which also checks accessibility contracts.
3. Integration tests of Route Handlers without starting a server.
4. E2E across engines and mobile viewports, with clock control, forced outcomes and accessibility scanning.
5. Low configuration cost for a TypeScript/ESM project.

## 3. Options considered

### Unit / component
- **Jest + Testing Library:** ✅ ubiquitous. ❌ More configuration for ESM/TypeScript; slower.
- **Vitest + Testing Library:** ✅ native ESM/TS, fast watch mode, Jest-compatible API. ❌ Slightly younger ecosystem.

### E2E
- **Cypress:** ✅ great DX. ❌ Limited WebKit support; one tab per test; parallelism tied to paid service.
- **Playwright:** ✅ Chromium, WebKit and Firefox; mobile emulation; `colorScheme` per context (light/dark); clock control; network interception; free parallelism; accessibility scanning integration.

## 4. Decision

**We choose Vitest + React Testing Library (+ user-event) for unit, presentation-logic, component and integration tests, and Playwright (+ axe-core) for E2E.**

## 5. Rationale

| Level | Tool | How |
|---|---|---|
| Unit (domain rules BR-*, money, reducers, error mapping) | Vitest | Pure functions, table-driven cases |
| Presentation logic (hooks, view state) | Vitest + Testing Library `renderHook` | Fake timers for cooldowns and slow thresholds |
| Component (UIR-*, states) | Vitest + Testing Library + user-event (jsdom) | Queries by role/label; network mocked at the HTTP client boundary |
| Integration (Route Handlers + services + in-memory repo) | Vitest | Call handlers with real `Request` objects; assert status, body, headers (CSRF, session, idempotency) |
| E2E (flows, five outcomes, a11y, themes) | Playwright + axe-core | Projects: desktop Chromium, mobile WebKit; light and dark color schemes; forced outcomes; clock control |

### Determinism (NFR-10)
- Outcomes forced per request with a test-only header (e.g. `x-mock-outcome: timeout-completed`), honored **only** when the mock-control flag is enabled and never in production builds (FR-CONF-11, UIR-CONF-17).
- Timings (slow threshold, client timeout, status-check intervals; ASM-17) come from configuration, shortened in E2E.
- Seeded users for every state (ASM-04); repository reset endpoint/fixture available only with the mock-control flag.

## 6. Consequences

**Positive**
- One runner for three levels; fast; ESM/TS-native.
- E2E covers WebKit/mobile and both themes, matching real usage (UX-01, UX-22).

**Negative / accepted costs**
- jsdom is not a real browser: layout and focus-visible checks rely on E2E.

**Neutral / to watch**
- Keep E2E count low (critical flows + one test per outcome) to protect run time.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Unit / presentation logic / component / integration runner | Vitest |
| Component testing | React Testing Library + user-event (jsdom) |
| E2E | Playwright (Chromium desktop, WebKit mobile; light/dark) |
| Automated accessibility scan | axe-core via Playwright |
| Forced outcomes | Test-only request header behind a non-production flag |

## 8. In production or with more time

- Visual regression snapshots per theme.
- Contract tests between client HTTP module and controllers.
- Mutation testing on domain rules.

## 9. How we validate the decision

- Full unit + component + integration suite runs in seconds locally; E2E suite in minutes.
- Zero flaky E2E across 10 consecutive runs.

## 10. References

- Test plan (Phase 5) · FS-04 §5.2 · ASM-16, ASM-17
