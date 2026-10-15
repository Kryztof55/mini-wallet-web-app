# ADR-009 — Validate untrusted data at the boundaries with Zod schemas

| Field | Value |
|---|---|
| **ID** | ADR-009 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, TS-01…TS-04 (controllers, HTTP client) |
| **Driven by** | BR-06 (server authority) · NFR-03 (type safety) · NFR-05 (input validation) |

---

## 1. Context

TypeScript types disappear at runtime. Every request body reaching a controller and every response reaching the HTTP client is untrusted until checked. Domain validators (BR-*) check business meaning, but first the **shape** must be verified (types, required fields, no extra fields), and the resulting value must have a precise static type.

## 2. Decision drivers

1. One definition yields both runtime validation and the static type (no drift).
2. Clear separation: schema = shape; domain function = business rule.
3. Small, well-known, framework-independent.

## 3. Options considered

- **A — Hand-written type guards:** ✅ no dependency. ❌ Verbose, error-prone, types and checks drift apart.
- **B — Zod:** ✅ schema → inferred type; composable; detailed issues for `VALIDATION_ERROR.details`. ❌ One dependency (~small).
- **C — Valibot / other schema libraries:** ✅ smaller bundles. ❌ Less familiar to most reviewers; similar value here.

## 4. Decision

**We choose Zod for request/response shape validation in controllers and the HTTP client. Business rules stay in pure domain functions.**

## 5. Rationale

- Controller: `parse body with schema → VALIDATION_ERROR (400) if shape fails → domain rules in the service → 422 with a specific code`.
- HTTP client: responses parsed with the endpoint schema; a mismatch becomes `INTERNAL_ERROR` and is logged (TS-00 §6.1).
- Schemas live next to each endpoint contract and are shared between controller and client; domain value objects (`Money`, `Identifier`) are built from parsed data through domain constructors.

## 6. Consequences

**Positive:** types and runtime checks cannot drift; clear 400 vs 422 distinction.
**Negative:** one dependency in client and server bundles (kept to schemas actually used by the client).

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Runtime shape validation | Zod schemas shared by controllers and the HTTP client |

## 8. In production or with more time

- Generate schemas and an OpenAPI document from a single contract source.

## 9. How we validate the decision

- Integration: malformed bodies → `400 VALIDATION_ERROR`; well-formed but rule-violating → `422` with the specific code.

## 10. References

- TS-00 §5, §6 · BR-06
