# Test plan — <Name>

| Field | Value |
|---|---|
| **Status** | Draft |
| **Version** | 0.1 |
| **Author** | <name> |
| **Last updated** | YYYY-MM-DD |
| **Covers** | FS-NN… · TS-NN… |
| **Tooling decision** | [ADR-NNN](../02-technical/adr/) |

<!-- Guidance: levels and cases are described by WHAT they verify. Concrete tools are chosen in the
     testing ADR and listed only in §2 "Tool" and §10. -->

---

## 1. Goal and scope

**Tested:** …
**Not tested (and why):** …

## 2. Strategy

<!-- Pyramid: many cheap unit tests on the domain, fewer component/integration tests,
     a few E2E tests over the critical flows. -->

| Level | Covers | Tool (per ADR) | Rationale | Expected volume |
|---|---|---|---|---|
| Unit | Business rules, validation, utilities, error mapping | … | … | High |
| Presentation logic | State transitions of view logic (state holders, view models, controllers…) | … | … | Medium |
| Component | Critical UI components and their states (loading/empty/error) | … | … | Medium |
| Integration | Server entry points with mocked persistence | … | … | Medium |
| E2E | Full user flows and every outcome scenario | … | … | Low |

## 3. Environments and test data

- **Mock data:** test users and fixtures (where they live, how they are reset).
- **Determinism:** how every non-deterministic outcome is forced in tests through a mechanism that is disabled in production. No test depends on randomness.
- **Time:** how timeouts and delays are controlled in tests (fake clock / configurable durations).
- **Isolation:** every test starts from a known state.

## 4. Coverage criteria

| Area | Target | Mandatory |
|---|---|---|
| Business and input validation rules (BR) | 100 % of branches, at domain **and** server level | Yes |
| UI rules (UIR) | Every UIR has at least one component or presentation-logic test | Yes |
| Error mapping | Every code | Yes |
| Critical components | Every state | Yes |
| Overall | ≥ N % lines | Indicative |

## 5. Traceability matrix

| Requirement / AC | Short description | TC | Level | Status |
|---|---|---|---|---|
| BR-NN | … | TC-UNIT-NN, TC-INT-NN | Unit, Int | ⬜ |
| UIR-<MOD>-NN | … | TC-COMP-NN | Component | ⬜ |
| AC-<MOD>-NN | … | TC-E2E-NN | E2E | ⬜ |

<!-- Rule: no BR, no UIR and no "Must" AC without at least one TC. -->

## 6. Test cases

### TC-<LEVEL>-NN — <Title>

| Field | Value |
|---|---|
| **Level** | Unit · Presentation logic · Component · Integration · E2E |
| **Covers** | BR-…, AC-… |
| **Priority** | High · Medium · Low |
| **Preconditions** | … |
| **Data** | … |

**Steps**
1. …

**Expected result**
- …

**Location:** `<path>` · **Status:** ⬜ Pending · ✅ Pass · ❌ Fail

<!-- For very similar cases, use a case table instead of one card per case: -->

| TC | Input | Expected result |
|---|---|---|
| TC-UNIT-NN-a | … | … |
| TC-UNIT-NN-b | … | … |

## 7. Negative scenarios and edge cases

| # | Scenario | TC |
|---|---|---|
| … | Duplicate submission / retry with the same idempotency key | … |
| … | Session expires mid-flow | … |

## 8. Non-functional tests

| Aspect | How it is verified | TC |
|---|---|---|
| Accessibility | Automated accessibility scan on key views + keyboard-only walkthrough | … |
| Observability | Correlation ID present on every response; no sensitive data in logs | … |
| Performance | … | … |

## 9. Entry and exit criteria

**Entry:** specs approved, environment running, test data loaded.
**Exit:** all High-priority tests pass; no gaps in the matrix for Must items.

## 10. Running the tests

| Suite | Command |
|---|---|
| Unit / presentation logic / component / integration | `<command>` |
| E2E | `<command>` |
| Coverage report | `<command>` |

## 11. Results

| Date | Suite | Total | ✅ | ❌ | Notes |
|---|---|---|---|---|---|
| … | … | … | … | … | … |

## 12. Test risks

| Risk | Mitigation |
|---|---|
| Flaky E2E due to randomness or timing | Forced outcomes and configurable durations |

## 13. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | YYYY-MM-DD | … | Created |
