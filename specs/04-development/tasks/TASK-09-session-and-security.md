# TASK-09 — Implement session handling and request security

| Field | Value |
|---|---|
| **ID** | TASK-09 |
| **Status** | Done |
| **Milestone** | M1 — Security core + Login |
| **Covers** | BR-14 · NFR-05, NFR-17 · FR-AUTH-08, FR-AUTH-09 · UIR-AUTH-15 · AC-AUTH-13, 14, 19 |
| **Specs** | TS-01 §10, ADR-001, ADR-004 |
| **Depends on** | [TASK-06](./TASK-06-config-and-mocks.md), [TASK-07](./TASK-07-observability.md), [TASK-08](./TASK-08-http-layers.md) |
| **Estimate** | 1.5 h |
| **Actual time** | ~1.75 h |
| **Branch / change request** | `feat/m1-security-login` · commits `… [TASK-09]` |

---

## 1. Goal

Private views and APIs are unreachable without a valid session, and every state-changing request is CSRF-protected.

## 2. Scope

**In scope:** Cookie sign/verify (HMAC); `SessionRepository`; `getSession()`; middleware: requestId → CSRF layers → signature gate → redirects (`returnTo`, `reason`); `(private)/layout.tsx` authority check; `withSession` for controllers; security headers.
**Out of scope:** Signed CSRF token (ADR-004 §8).

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/proxy.ts` | New: request ID → CSRF → signature gate → login bounce → CSP nonce |
| `src/server/session/{cookie,session}.ts` | New: HMAC sign/verify (Web Crypto), cookie serialize/read; `getSession`, `getSessionFromRequest`, `createSession`, `destroySession` |
| `src/server/security/{csrf,routes,csp}.ts` | New |
| `src/server/http/with-session.ts`, `src/server/repositories/index.ts` | New: controller authority; `getRepositories()` |
| `src/app/(private)/layout.tsx`, `src/app/(private)/page.tsx` | New / moved: page authority; temporary Home moved into the private group |
| `src/app/(public)/login/page.tsx` | New: placeholder so the gate has somewhere to land (TASK-11 builds it) |
| `src/lib/routes.ts`, `src/lib/http/client.ts` | `loginUrl()`; the client's 401 redirect now sanitizes `returnTo` |
| `next.config.ts` | Static security headers |
| `tests/e2e/smoke.spec.ts` | `/` now redirects to `/login` |

## 4. Acceptance criteria

- [x] Pasted private URL in a fresh browser → Login, then back to that URL.
- [x] Private API without session → `401` even when middleware is skipped.
- [x] Foreign `Origin`, cross-site fetch metadata, non-JSON body or missing custom header → rejected.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-UNIT-15](../../05-testing/test-plan.md#6-test-cases) | Unit | Session cookie signing | ✅ |
| [TC-INT-01](../../05-testing/test-plan.md#6-test-cases) | Integration | CSRF protection matrix | ✅ |
| [TC-INT-02](../../05-testing/test-plan.md#6-test-cases) | Integration | Session gate and authority | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies. (N/A: no UI beyond the login placeholder.)
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked. (Login placeholder: h1, main, skip link, theme switcher.)
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Cookie `<id>.<hmac>` (base64url, 256-bit ID), verified with `crypto.subtle.verify` (constant time). `getSession()` = signature + store record; the proxy only checks the signature. |
| 2026-10-14 | Found a redirect loop in the design: valid signature but lost store record (server restart) → layout sends to `/login` → proxy bounces a valid cookie back to `/`. Fixed by not bouncing when `reason` is present (TS-01 1.2). Clearing the cookie from that GET was rejected: it would allow logout by link. |
| 2026-10-14 | Layouts don't receive the pathname, so the proxy forwards `x-return-to`; the value is sanitized anyway. |
| 2026-10-14 | CSP with a per-request nonce in the proxy (Next applies it to its scripts). Runtime check with `next start`: 12/12 scripts on `/login` carry the nonce; deep link → `307 /login?returnTo=%2Ftransfer%2Famount`; foreign Origin → `403 CSRF_REJECTED` (logged with reason); same-origin JSON → passes; private API → `401`; every response carries `x-request-id`. Hydration under the CSP is confirmed by the E2E smoke run on the owner's machine. |
| 2026-10-14 | Test pitfall: `beforeEach(() => mock.mockClear())` returns the mock, and Vitest runs a returned function as teardown. Use a block body. |
| 2026-10-14 | 333 tests pass (38 files); lint, typecheck, build ✅. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Proxy, session, CSRF, CSP, tests | All | Detected and fixed the login redirect loop; kept the stale cookie instead of clearing it on GET |

**Decisions made by me, not by the AI:** Proxy as first barrier + server authority (ADR-001), CSRF layers 1–5 (ADR-004).

## 9. Technical debt / follow-ups

- In-memory session store: single instance, sessions lost on restart (ASM-03).
- No idle/absolute session expiry yet; the store lifetime is the process.
- HSTS belongs to the hosting layer.
