# ADR-006 — Structured logging with an end-to-end correlation ID

| Field | Value |
|---|---|
| **ID** | ADR-006 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-05, all TS §11 |
| **Driven by** | NFR-04 (observability) · NFR-05 (no sensitive data) · UX-05 / UIR-CONF-11 (reference code) |

---

## 1. Context

With millions of users, a support request like "my transfer failed" must be traceable to the exact server-side events, across middleware, server rendering, Route Handlers, services and client-side errors. The same identifier is shown to the user as a reference code (FS-01…FS-04). Logs must never contain session IDs, one-time codes or full identifiers.

## 2. Decision drivers

1. One correlation ID per request, propagated through every server layer, including server rendering.
2. Machine-parseable logs with a fixed schema and event catalog.
3. Built-in redaction of sensitive fields.
4. Low overhead on the hot path.
5. Client-side errors correlated with server logs.

## 3. Options considered

- **A — `console.log` with ad-hoc strings:** ✅ zero setup. ❌ Unstructured, no levels, no redaction.
- **B — winston:** ✅ flexible transports. ❌ Heavier, slower; redaction is manual.
- **C — pino:** ✅ JSON by default, very low overhead, child loggers for bound context, path-based redaction.
- **D — Full OpenTelemetry (traces + logs):** ✅ industry standard for distributed tracing. ❌ Needs a collector/backend; disproportionate for a mocked single-service app.

## 4. Decision

**We choose pino for structured logs, with a correlation ID generated in the middleware and propagated through request headers and a per-request context; OpenTelemetry is the production path.**

## 5. Rationale

### Correlation ID flow

```
Browser ──(x-request-id? optional)──▶ Middleware: reuse valid ID or generate UUID
   │                                     ├─ forwards it as a request header
   │                                     └─ sets it on the response (x-request-id)
   │
   ├─ Server Component → reads header → logger child { requestId }
   ├─ Route Handler   → reads header → logger child { requestId } → service → repository
   └─ Client error    → POST /api/client-logs { requestId of the failed call, event, … }

Error responses: { code, message, requestId }  →  UI shows "Referencia: <short form>"
```

- In server code, a per-request context (Node `AsyncLocalStorage`) holds `{ requestId, userId? }` so services log without passing IDs through every function.
- The HTTP client sends its own `x-request-id` on each call, so client and server agree on the ID even when the response never arrives (timeout).

### Log schema (every line)

| Field | Example |
|---|---|
| `time`, `level` | ISO time, `info` |
| `event` | `tx.confirm.completed` (catalog in TS-05) |
| `requestId` | UUID |
| `userId` | internal ID (never identifier) |
| `route`, `method`, `status`, `durationMs` | `/api/transfers`, `POST`, `201`, `142` |
| `code` | domain error code when applicable |

### Redaction
Configured redaction paths for cookies, `authorization`, `identifier`, `code`, `destination`, `name`; identifiers that must appear are logged masked (`•••• 5678`).

## 6. Consequences

**Positive**
- Any reference code shown to a user maps to the full request trail.
- Uniform, queryable logs; sensitive fields removed by configuration, not by discipline.

**Negative / accepted costs**
- Middleware runtime may not support Node logging libraries; it only generates/propagates the ID and logs minimally.
- Client-log endpoint must be rate-limited and size-limited to avoid abuse.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Structured logger | pino (JSON) with redaction paths |
| Correlation ID | `x-request-id` header, generated in middleware, echoed in responses and error bodies |
| Per-request context | Node `AsyncLocalStorage` |
| Logger initialization | Next.js `instrumentation` hook |
| Client error reporting | `POST /api/client-logs` (rate-limited) |

## 8. In production or with more time

- OpenTelemetry traces with W3C `traceparent`; logs shipped to a central backend; dashboards and alerts per event (e.g. rate of `tx.confirm.unresolved`).
- Sampling of info-level logs at high volume.

## 9. How we validate the decision

- Integration: every API response carries `x-request-id`; error bodies include `requestId`.
- Unit: redaction removes all configured paths.
- E2E: the reference code shown on a forced error equals the response's `x-request-id` (short form).

## 10. References

- TS-05 (event catalog) · FS-01…FS-04 §12 (`common.reference`)
