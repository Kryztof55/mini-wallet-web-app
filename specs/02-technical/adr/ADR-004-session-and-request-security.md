# ADR-004 — Signed opaque session cookie with layered CSRF protection

| Field | Value |
|---|---|
| **ID** | ADR-004 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, TS-01, all Route Handlers |
| **Driven by** | FR-AUTH-06, FR-AUTH-08, FR-AUTH-10 · BR-14 · NFR-05 · NFR-17 (CSRF) · ADR-001 |

---

## 1. Context

The session must persist across reloads (FR-AUTH-06), be checkable by the middleware before rendering (ADR-001) and be authoritative on the server (BR-14). Because the browser sends cookies automatically, every state-changing endpoint is exposed to Cross-Site Request Forgery. Next.js protects Server Actions against CSRF with an origin check, but **Route Handlers get no built-in CSRF protection**. Real authentication is out of scope, but session handling and request security are part of the evaluation ("permisos").

## 2. Decision drivers

1. Session credential never readable by JavaScript (NFR-05).
2. Middleware can validate cheaply without a data-store lookup.
3. Immediate revocation on logout.
4. Strong CSRF protection on every state-changing endpoint, including login.
5. Proportionate complexity (NFR-12).

## 3. Options considered

### Session storage
- **A — Token in `localStorage`, sent in a header:** ❌ readable by any script (XSS exfiltration); not available to Server Components or middleware.
- **B — Stateless signed token with claims (JWT-like) in a cookie:** ✅ no store needed. ❌ Revocation requires extra machinery; claims grow; easy to misuse.
- **C — Opaque random session ID, HMAC-signed, in an HttpOnly cookie; session data in a server-side store:** ✅ nothing sensitive in the cookie; middleware verifies the signature without I/O; logout deletes the server record. ❌ Needs a shared store at scale (in-memory here; Redis-like in production).

### CSRF protection
- **Cookie `SameSite` only:** ✅ blocks most cross-site POSTs. ❌ Browser-dependent; not sufficient alone.
- **Layers 1–5 (below):** ✅ OWASP-recommended defense in depth for JSON APIs; no extra client state.
- **Layers 1–5 + signed double-submit CSRF token:** ✅ strongest. ❌ Extra token lifecycle (including pre-login), redundant for JSON-only APIs with origin verification and custom headers.

## 4. Decision

**We choose a signed opaque session ID in a `HttpOnly; Secure; SameSite=Lax; Path=/` cookie, backed by a server-side session store, and CSRF protection layers 1–5. The signed CSRF token is documented as a "with more time" option.**

## 5. Rationale

### Session lifecycle

| Event | Behavior |
|---|---|
| Code verified (FS-01) | Service creates a session record `{ sessionId, userId, createdAt }`; controller sets the signed cookie |
| Any request | Middleware: cookie present + signature valid (first barrier). Server: `getSession()` loads the record (authority, BR-14) |
| Logout (`POST /api/auth/logout`) | Record deleted; cookie cleared; never via GET |
| Invalid / unknown session | Treated as no session: redirect (pages) or `401 UNAUTHENTICATED` (API) |
| Server restart | In-memory store is empty → users log in again (ASM-03, accepted) |

Signing uses HMAC-SHA-256 with a server secret from environment configuration, verifiable with Web Crypto in any runtime.

### CSRF protection layers

| # | Layer | Where | Effect |
|---|---|---|---|
| 1 | Session cookie `HttpOnly; Secure; SameSite=Lax` | Cookie attributes | Browser doesn't send the session on cross-site subresource POSTs |
| 2 | `Origin` must equal the app origin on `POST/PUT/PATCH/DELETE` to `/api/*`; fall back to `Sec-Fetch-Site: same-origin` when `Origin` is absent; otherwise `403 CSRF_REJECTED` | Middleware | Rejects requests from any other site, including login CSRF |
| 3 | State-changing requests require `Content-Type: application/json` and the custom header `x-request-id` (plus `idempotency-key` on confirm) | Middleware + controller | Cross-site HTML forms can't send JSON or custom headers; cross-origin scripts would need a CORS preflight we never grant |
| 4 | No CORS: `/api/*` never returns `Access-Control-Allow-Origin` | Configuration | Other origins can neither read nor write |
| 5 | Safe methods are safe: `GET` never changes state; logout and all mutations are `POST` | API design | No CSRF via links or images |

### Additional request-security rules
- `returnTo` accepts only same-origin relative paths (ADR-001).
- One-time code verification and code issuance are rate-limited per identifier by the service (BR-12, BR-13).
- Error responses never reveal whether an identifier has an account (OQ-14).
- No session ID, code or full identifier is ever logged (ADR-006).

## 6. Consequences

**Positive**
- Session credential unreachable from JavaScript; immediate logout.
- CSRF blocked at three independent levels (browser, origin, content/headers).

**Negative / accepted costs**
- In-memory session store: sessions lost on restart; single instance only.
- Requests from non-browser clients must send `Origin`/custom headers — acceptable, there are none.

**Neutral / to watch**
- `SameSite=Strict` would block the cookie when arriving from external links; `Lax` keeps deep links usable.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Session credential | Signed opaque ID in `HttpOnly; Secure; SameSite=Lax` cookie |
| Session store | In-memory repository behind a `SessionRepository` port |
| Signature | HMAC-SHA-256 via Web Crypto, secret from environment |
| CSRF protection | Middleware origin / fetch-metadata check + JSON + custom header requirement; no CORS |

## 8. In production or with more time

- **Signed double-submit CSRF token** (`x-csrf-token` bound to the session) as an extra layer.
- Shared session store (Redis-like) with TTL and sliding expiration; session expiry warning (A11Y-16).
- Device binding, anomaly detection, step-up authentication for transfers above a threshold.
- `__Host-` cookie prefix and HSTS preload.

## 9. How we validate the decision

- Integration tests: state-changing request with foreign `Origin` → `403`; without `Origin` but `Sec-Fetch-Site: cross-site` → `403`; form-encoded body → `415`/`403`; missing custom header → `403`; tampered cookie signature → `401`.
- E2E: session survives reload; logout invalidates the session server-side (old cookie replayed → `401`).
- Unit: cookie signing/verification; `returnTo` sanitization.

## 10. References

- OWASP Cross-Site Request Forgery Prevention Cheat Sheet (origin verification, fetch metadata, custom request headers, SameSite)
- FS-01 §5 · ADR-001 · ADR-006
