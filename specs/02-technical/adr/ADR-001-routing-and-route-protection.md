# ADR-001 — Use the App Router with layered route protection

| Field | Value |
|---|---|
| **ID** | ADR-001 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, TS-01, TS-02, TS-03, TS-04 |
| **Driven by** | CON-03 (pages or app router) · FR-AUTH-08, FR-AUTH-09 · BR-14 · NFR-02 |

---

## 1. Context

The challenge lets us choose between the Pages Router and the App Router. The app has four areas (login, home, a 3-step transfer flow, receipt), a strict separation between public and private views, and a requirement that a private URL copied into another browser never shows private content (FR-AUTH-08). The routing choice also determines which rendering options (ADR-002) and layout-scoped state (ADR-003) are available.

## 2. Decision drivers

1. Private views must be protected **before** anything renders, and also when the URL is opened directly in another browser.
2. Server-side rendering of per-user data without shipping data-fetching code to the client (NFR-01, NFR-07).
3. Nested layouts so the transfer flow can own its state and guard (UIR-TX-14, UIR-TX-21).
4. Alignment with the framework's current direction (long-term maintainability).

## 3. Options considered

### Option A — Pages Router
- ✅ Mature, widely known; simple mental model.
- ❌ No nested layouts with their own state; no Server Components; protection relies on per-page `getServerSideProps` or client checks.
- ❌ Framework's legacy path.

### Option B — App Router, protection only in components (client or server layout)
- ✅ Nested layouts, Server Components.
- ❌ A layout check alone still lets route handlers and other entry points through; a client check flashes private UI.

### Option C — App Router + authorization middleware + server-side session check (defense in depth)
- ✅ Middleware rejects requests without a session before any rendering; works for pasted URLs, reloads and new browsers.
- ✅ Server layout and every controller/service re-check the session (BR-14), so a middleware bypass does not expose data.
- ❌ Two places that check the session (kept consistent through one shared `getSession` function).

| Driver | A | B | C |
|---|---|---|---|
| Protection before render, any browser | ●● | ●● | ●●● |
| Resilience if one layer fails | ● | ● | ●●● |
| Nested layouts / scoped state | ● | ●●● | ●●● |
| Framework direction | ● | ●●● | ●●● |

## 4. Decision

**We choose Option C: App Router with an authorization middleware as the first barrier and a server-side session check in the private layout and in every controller/service.**

## 5. Rationale

- The middleware runs on every request before rendering. A URL pasted into another browser arrives without the session cookie and is redirected to `/login?returnTo=<path>` before any private markup exists (FR-AUTH-08, UIR-AUTH-15).
- The middleware is **not** the only barrier. Middleware-only authorization has failed in practice: CVE-2025-29927 (March 2025) allowed bypassing Next.js middleware with a crafted header. The server layer therefore re-validates the session on every private read and write (BR-14).
- Route groups separate public and private areas without affecting URLs; the transfer flow gets its own layout for state (ADR-003) and step guard (UIR-TX-14).

### Route map

| Path | Group | Access | Notes |
|---|---|---|---|
| `/login` | `(public)` | Public; authenticated users redirected to `/` | FS-01 |
| `/` | `(private)` | Session required | Home, FS-02 |
| `/transfer/recipient` | `(private)/transfer` | Session required | FS-03 step 1 |
| `/transfer/amount` | `(private)/transfer` | Session + recipient in draft | FS-03 step 2 (guard) |
| `/transfer/summary` | `(private)/transfer` | Session + complete draft | FS-03 step 3 (guard) |
| `/receipts/[transferId]` | `(private)` | Session + ownership | FS-04 receipt, revisitable |
| `/api/auth/*` | API | Public (login), CSRF-protected | ADR-004 |
| `/api/*` (rest) | API | Session required, CSRF-protected | ADR-004 |

### Middleware responsibilities (first barrier)

1. Generate or forward the correlation ID (ADR-006).
2. CSRF checks for state-changing `/api/*` requests (ADR-004).
3. Verify that a session cookie exists **and its signature is valid** (cheap, no store lookup).
4. Private page without a valid cookie → redirect to `/login?returnTo=<path>`; private API → `401 UNAUTHENTICATED`.
5. `/login` with a valid cookie → redirect to `/`.

`returnTo` is accepted only as a same-origin relative path (starts with `/`, not `//`, no scheme) to prevent open redirects.

## 6. Consequences

**Positive**
- Private content is never rendered or returned without a session, even if one layer fails.
- Clear, testable responsibilities: middleware = cheap gate; server = authority.

**Negative / accepted costs**
- Session checks exist in two layers; mitigated by a single shared session module.
- Middleware runs on every matched request; kept cheap (signature check only, no I/O).

**Neutral / to watch**
- Framework naming: in recent Next.js versions the middleware file convention is renamed (`proxy`); the concept is unchanged. Confirm the convention at scaffolding time.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Routing | Next.js App Router with route groups `(public)` / `(private)` |
| First-barrier route protection | Next.js middleware (or `proxy` convention), matcher on private pages and `/api/*` |
| Authoritative session check | Shared `getSession()` used by the private layout, controllers and services |

## 8. In production or with more time

- Centralized authorization policies (roles/scopes) instead of a binary "has session".
- Edge-level protection (WAF, bot management) in front of the app.

## 9. How we validate the decision

- E2E: opening every private URL in a fresh browser context redirects to Login and, after login, lands on that URL (AC-AUTH-13).
- Integration: calling every private route handler without a session returns `401` even when the middleware is not executed (AC-AUTH-19).
- Unit: `returnTo` sanitization rejects absolute and protocol-relative URLs.

## 10. References

- FS-01 §5, §7 · BR-14
- CVE-2025-29927 — Next.js middleware authorization bypass (March 2025)
