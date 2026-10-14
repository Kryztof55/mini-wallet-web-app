# ADR-002 — Server-render private reads; route all client calls through API → controller → service

| Field | Value |
|---|---|
| **ID** | ADR-002 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, TS-01…TS-04 |
| **Driven by** | CON-02 (SSR/CSR justified per page) · CON-05 (API routes) · CON-06 (SSR, CSR, Server Actions valued) · NFR-01, NFR-02, NFR-06, NFR-07 |

---

## 1. Context

The challenge asks to justify SSR, CSR or mixed rendering per page, to implement services through API routes with mocked data, and values experience with Server Actions. Views differ: Home and the receipt are read-mostly per-user data; Login and the transfer flow are interactive forms; the confirmation needs strict control over timeouts, retries and idempotency (FS-04).

## 2. Decision drivers

1. Per-user financial data: fast first content, never shared-cached.
2. One place for business logic, reused by every entry point (NFR-02, BR-06).
3. Full control over the confirmation call: client timeout with real cancellation, idempotency and correlation headers, explicit status codes, parallel status checks (FS-04).
4. Browser only talks to our own server; service code never reaches the client bundle.
5. Demonstrate deliberate use of SSR, CSR and Server Actions.

## 3. Options considered

### Option A — Client-side rendering everywhere, client fetches API routes
- ✅ Simple, uniform.
- ❌ Blank/skeleton-first Home on every visit; more JavaScript; data fetching duplicated on the client.

### Option B — Server Components + Server Actions for all mutations
- ✅ Native, little boilerplate; progressive enhancement for forms.
- ❌ Server Actions cannot be aborted client-side, are dispatched one at a time per client, carry no custom headers, and surface errors as values instead of status codes — poor fit for the confirmation (driver 3).
- ❌ The challenge explicitly asks for API routes.

### Option C — Server Components for private reads + API → controller → service for client calls (+ one Server Action as a deliberate exception)
- ✅ Fast server-rendered reads; explicit HTTP contracts where control matters.
- ✅ One service layer shared by Server Components, Route Handlers and the Server Action.
- ❌ Two kinds of entry points to keep consistent (mitigated by the shared service and error model).

| Driver | A | B | C |
|---|---|---|---|
| Fast per-user first content | ● | ●●● | ●●● |
| Single business logic layer | ●● | ●●● | ●●● |
| Control over confirmation call | ●●● | ● | ●●● |
| Browser isolated from services | ●●● | ●●● | ●●● |
| Shows SSR + CSR + Server Actions with intent | ● | ●● | ●●● |

## 4. Decision

**We choose Option C.**

- **Reads for initial render** happen in **Server Components**, which call the **service directly** (no HTTP hop to our own API).
- **Every call triggered from the client** goes through **Route Handler (controller) → service → repository**.
- **One Server Action** — saving the theme preference (ADR-007) — calls the same service layer, as a documented, non-critical exception.

## 5. Rationale

### Layering

```
Server Component ─────────────────────────────┐
Client component → HTTP client → Route Handler (controller) → Service → Repository (in-memory mock)
Server Action (theme only) ───────────────────┘        ↑ server-only module
```

| Layer | Responsibility | Never does |
|---|---|---|
| HTTP client (browser) | Typed calls; timeout via cancellation; adds correlation and idempotency headers; maps responses to typed results | Business rules |
| Route Handler (controller) | Session check, CSRF (via middleware), input schema validation, call service, map domain errors to HTTP | Business rules, data access |
| Service (server-only) | Use cases; enforces BR-01…BR-17 using pure domain functions; idempotency | HTTP concerns |
| Repository | Data access (in-memory mock); simulated latency and outcomes | Business rules |
| Domain (shared) | Pure types and rules, used by client (feedback) and service (authority) | I/O, framework code |

Service and repository modules are marked server-only so importing them from client code fails the build.

### Rendering per view

| View | Strategy | Why | Cache |
|---|---|---|---|
| `/login` | Server-rendered shell + client form | Form interactivity; no per-user data | Static shell |
| `/` Home | Server Components, **streamed per section** (profile/balance and activity each in their own boundary) | Fast first content; independent loading/failure (UIR-HOME-01) | `no-store` (per-user) |
| Home section retry | Client fetch of that section's GET endpoint | Retry only the failed section (UIR-HOME-12, AC-HOME-06) | `no-store` |
| `/transfer/*` | Server-rendered layout + client step components | Multi-step interactive flow with client draft (ADR-003) | `no-store` |
| `/receipts/[id]` | Server Component | Revisitable, per-user, read-only (UIR-CONF-15) | `no-store` |

### Why not Server Actions for the critical paths
Server Actions are framework-native RPC: Next generates the POST endpoint and the client calls a function. They replace the API + controller layer, not the service. For the confirmation we need what they don't provide well: abortable requests for the 10 s timeout, idempotency and correlation headers, parallel status checks, and status codes that distinguish the five outcomes. Server Actions are also public POST endpoints — they need the same session and input validation.

### The Server Action exception
Theme preference is low-risk, has no timeout or idempotency needs, and benefits from progressive enhancement. Using a Server Action there — calling the same service layer — shows the trade-off was chosen, not ignored.

## 6. Consequences

**Positive**
- Business rules live once; every entry point enforces them (BR-06).
- Explicit, testable HTTP contracts for everything the client triggers.
- Home renders useful content on first paint; sections degrade independently.

**Negative / accepted costs**
- Some read endpoints exist in two forms (Server Component path and GET Route Handler for retry); both call the same service.

**Neutral / to watch**
- Any new client-triggered operation defaults to a Route Handler; a Server Action needs a written reason.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Server-rendered reads | React Server Components (Next.js App Router), dynamic rendering, `no-store` |
| Server entry points for client calls | Next.js Route Handlers under `/api` (controllers) |
| Server-only boundary | `server-only` package on service and repository modules |
| Server-side mutation (exception) | One Next.js Server Action (theme preference) |
| Client HTTP | Native `fetch` + `AbortController` wrapped in a typed client |

## 8. In production or with more time

- Services would call real backends; the BFF keeps credentials and internal URLs off the browser.
- Response schemas shared and generated (e.g. OpenAPI) between controller and client.

## 9. How we validate the decision

- No service or repository module appears in the client bundle (build fails otherwise).
- Integration tests call each Route Handler with real `Request` objects.
- E2E: Home shows content without a client-side loading phase on first paint; a forced activity failure leaves the balance visible and retry reloads only the list.

## 10. References

- FS-02 §5.2, FS-04 §5.2 · ADR-004 (CSRF on Route Handlers) · ADR-007 (theme Server Action)
