# ADR — Architecture Decision Records

One file per decision: context → options → decision → consequences → bindings introduced.
ADRs are the only artifacts where concrete technologies are named and chosen; their bindings are copied into TS-00 §Technology bindings.
An accepted ADR is never edited; a new one supersedes it.

| ID | Decision | Status |
|---|---|---|
| [ADR-001](./ADR-001-routing-and-route-protection.md) | App Router with layered route protection (middleware + server check) | Accepted |
| [ADR-002](./ADR-002-rendering-and-server-entry-points.md) | Server-rendered reads; API → controller → service for client calls; one Server Action | Accepted |
| [ADR-003](./ADR-003-client-state-management.md) | React Context + useReducer, scoped providers | Accepted |
| [ADR-004](./ADR-004-session-and-request-security.md) | Signed opaque session cookie + CSRF layers 1–5 | Accepted |
| [ADR-005](./ADR-005-testing-tooling.md) | Vitest + Testing Library; Playwright + axe-core | Accepted |
| [ADR-006](./ADR-006-logging-and-traceability.md) | pino + end-to-end correlation ID | Accepted |
| [ADR-007](./ADR-007-theming.md) | Semantic CSS tokens + cookie-backed theme, CSS `prefers-color-scheme` for system | Accepted |
| [ADR-008](./ADR-008-ui-component-strategy.md) | Radix primitives + own domain components + Tailwind on tokens | Accepted |
| [ADR-009](./ADR-009-runtime-validation-at-boundaries.md) | Zod schemas for runtime validation at boundaries | Accepted |
