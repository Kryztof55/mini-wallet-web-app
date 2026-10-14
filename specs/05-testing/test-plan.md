# Test plan — Mini Wallet Web App

| Field | Value |
|---|---|
| **Status** | Draft |
| **Version** | 0.2 |
| **Author** | Claude (AI-assisted draft) |
| **Reviewer** | Project owner |
| **Last updated** | 2026-10-14 |
| **Covers** | FS-01…FS-04 · TS-00…TS-05 · NFR-04, 06, 08…10, 14, 17 |
| **Tooling decision** | [ADR-005](../02-technical/adr/ADR-005-testing-tooling.md) |

---

## 1. Goal and scope

**Tested:** every business and input-validation rule (domain and server), every UI rule, every acceptance criterion of FS-01…FS-04, the five confirmation outcomes and timeout sub-cases, session and CSRF protection, correlation IDs, accessibility (automated + manual) in both themes.
**Not tested (and why):** real OTP delivery, payment networks and persistence (mocked by design); performance budgets beyond a manual Lighthouse check (no load-testing environment); visual regression (listed as "with more time" in ADR-005).

## 2. Strategy

| Level | Covers | Tool (per ADR-005) | Rationale | Cases |
|---|---|---|---|---|
| Unit | Domain rules, value objects, formatters, mapping, simulator, signing, redaction | Vitest | Fast, exhaustive, table-driven | 24 |
| Presentation logic | Hooks and reducers that drive UI rules and timelines | Vitest + Testing Library `renderHook`, fake timers | Deterministic timing without a browser | 9 |
| Component | UI rules (UIR-*) and accessibility contracts of components | Vitest + Testing Library + user-event + axe (jsdom) | Behavior as users see it, by role and label | 15 |
| Integration | Route Handlers + services + in-memory repositories; middleware | Vitest with real `Request` objects | Server authority, contracts, security | 14 |
| E2E | Full journeys, all outcomes, a11y scans, themes | Playwright + axe-core (Chromium desktop, WebKit mobile; light and dark) | Real browser, real navigation | 23 |
| Manual | What automation can't judge | Keyboard, VoiceOver, browser zoom, OS settings | Accessibility requirements §4 | 4 |

## 3. Environments and test data

- **Mock data:** seeded users from TS-00 §9.1; every test starts with `POST /api/mock/reset` (E2E fixture) or a fresh in-memory repository (integration).
- **Determinism:** outcomes forced with `x-mock-outcome` (TS-00 §9.2–9.3), only when mock controls are enabled. In E2E, the header is injected per request with route interception so it affects only the intended call. No test depends on randomness; TC-UNIT-18 checks the distribution separately.
- **Time:** unit and presentation-logic tests use fake timers. E2E runs with shortened configuration: `TRANSFER_SLOW_MS=300`, `TRANSFER_TIMEOUT_MS=1000`, `TRANSFER_STATUS_CHECK_DELAYS_MS=200,400,800`, `OTP_RESEND_COOLDOWN_SEC=2`; code expiry forced with `otp_expired`.
- **Isolation:** one browser context per E2E test; integration tests build their own repositories; no shared mutable state between tests.

## 4. Coverage criteria

| Area | Target | Mandatory |
|---|---|---|
| Business and input validation rules (BR) | 100 % of branches at domain level **and** at least one server-level test each | Yes |
| UI rules (UIR) | Every UIR has at least one component or presentation-logic test (or E2E where it is navigation) | Yes |
| Acceptance criteria (AC) | Every AC has at least one test | Yes |
| Error mapping | Every error code | Yes |
| Critical components | Every state | Yes |
| Overall | ≥ 80 % lines | Indicative |

## 5. Traceability matrix

Generated from the test cases in §6; every BR, UIR and AC is covered.

| Requirement / rule / AC | Short description | TC | Levels | Status |
|---|---|---|---|---|
| BR-01 | Minimum amount | TC-UNIT-03, TC-INT-08 | INT, UNIT | ⬜ |
| BR-02 | Sufficient balance | TC-UNIT-03, TC-INT-08 | INT, UNIT | ⬜ |
| BR-03 | Recipient required | TC-UNIT-04, TC-PL-05, TC-INT-08 | INT, PL, UNIT | ⬜ |
| BR-04 | Amount format | TC-UNIT-01, TC-UNIT-02, TC-INT-08 | INT, UNIT | ⬜ |
| BR-05 | Recipient identifier format | TC-UNIT-05, TC-INT-08 | INT, UNIT | ⬜ |
| BR-06 | Rules are authoritative on the server | TC-INT-08 | INT | ⬜ |
| BR-07 | Idempotent confirmation | TC-UNIT-13, TC-INT-09 | INT, UNIT | ⬜ |
| BR-08 | No duplicate favorites | TC-UNIT-22, TC-INT-07 | INT, UNIT | ⬜ |
| BR-09 | No self-transfer | TC-UNIT-04, TC-INT-07, TC-INT-08 | INT, UNIT | ⬜ |
| BR-10 | Identifier format | TC-UNIT-05, TC-INT-03, TC-INT-07 | INT, UNIT | ⬜ |
| BR-11 | One-time code format | TC-UNIT-07, TC-INT-04 | INT, UNIT | ✅ |
| BR-12 | Code validity | TC-UNIT-08, TC-INT-04 | INT, UNIT | ✅ |
| BR-13 | Code throttling | TC-UNIT-09, TC-INT-03 | INT, UNIT | ✅ |
| BR-14 | Session required | TC-UNIT-15, TC-INT-02 | INT, UNIT | ✅ |
| BR-15 | Concept format | TC-UNIT-10, TC-INT-08 | INT, UNIT | ⬜ |
| BR-16 | Contact name | TC-UNIT-11, TC-INT-07 | INT, UNIT | ⬜ |
| BR-17 | Single final outcome | TC-UNIT-12, TC-INT-10 | INT, UNIT | ⬜ |
| UIR-AUTH-01 | Identifier type inference | TC-UNIT-05, TC-COMP-03 | COMP, UNIT | ✅ |
| UIR-AUTH-02 | Validation timing | TC-COMP-03 | COMP | ✅ |
| UIR-AUTH-03 | Primary actions stay enabled | TC-COMP-01, TC-COMP-03 | COMP | ✅ |
| UIR-AUTH-04 | In-progress lock | TC-PL-01 | PL | ✅ |
| UIR-AUTH-05 | Code step entry | TC-COMP-04 | COMP | ✅ |
| UIR-AUTH-06 | Destination masking | TC-UNIT-06, TC-COMP-04 | COMP, UNIT | ✅ |
| UIR-AUTH-07 | Code input behavior | TC-UNIT-07, TC-COMP-04 | COMP, UNIT | ✅ |
| UIR-AUTH-08 | Explicit verification | TC-COMP-04 | COMP | ✅ |
| UIR-AUTH-09 | Incorrect code | TC-PL-01, TC-COMP-04 | COMP, PL | ✅ |
| UIR-AUTH-10 | Locked or expired code | TC-PL-01, TC-COMP-04 | COMP, PL | ✅ |
| UIR-AUTH-11 | Resend cooldown | TC-PL-02, TC-COMP-04 | COMP, PL | ✅ |
| UIR-AUTH-12 | New code issued | TC-PL-01, TC-COMP-04 | COMP, PL | ✅ |
| UIR-AUTH-13 | Change identifier | TC-PL-01, TC-COMP-04 | COMP, PL | ✅ |
| UIR-AUTH-14 | Post-login navigation | TC-UNIT-14, TC-E2E-05 | E2E, UNIT | ✅ |
| UIR-AUTH-15 | No flash for authenticated users | TC-INT-02 | INT | ✅ |
| UIR-AUTH-16 | Demo code hint | TC-COMP-04 | COMP | ✅ |
| UIR-AUTH-17 | Session-ended notice | TC-COMP-05 | COMP | ✅ |
| UIR-AUTH-18 | Theme control | TC-COMP-02 | COMP | ✅ |
| UIR-CONF-01 | Processing lock | TC-PL-08, TC-COMP-14 | COMP, PL | ⬜ |
| UIR-CONF-02 | Slow-response message | TC-PL-08, TC-COMP-14 | COMP, PL | ⬜ |
| UIR-CONF-03 | Bounded wait | TC-PL-08 | PL | ⬜ |
| UIR-CONF-04 | Verifying | TC-PL-08, TC-COMP-14 | COMP, PL | ⬜ |
| UIR-CONF-05 | Verification results | TC-PL-08, TC-COMP-14 | COMP, PL | ⬜ |
| UIR-CONF-06 | Unresolved verification | TC-PL-08, TC-COMP-14 | COMP, PL | ⬜ |
| UIR-CONF-07 | Success view = receipt | TC-E2E-19 | E2E | ⬜ |
| UIR-CONF-08 | Network error view | TC-COMP-14 | COMP | ⬜ |
| UIR-CONF-09 | Insufficient-funds view | TC-COMP-14 | COMP | ⬜ |
| UIR-CONF-10 | Unknown-error view | TC-COMP-14 | COMP | ⬜ |
| UIR-CONF-11 | Reference code on every non-success | TC-UNIT-19, TC-COMP-14, TC-E2E-23 | COMP, E2E, UNIT | ⬜ |
| UIR-CONF-12 | Receipt content | TC-COMP-15 | COMP | ⬜ |
| UIR-CONF-13 | Copy folio | TC-COMP-15 | COMP | ⬜ |
| UIR-CONF-14 | Receipt actions | TC-COMP-15 | COMP | ⬜ |
| UIR-CONF-15 | Revisitable receipt | TC-COMP-15 | COMP | ⬜ |
| UIR-CONF-16 | Leaving during processing | TC-PL-08 | PL | ⬜ |
| UIR-CONF-17 | Forced outcome (non-production) | TC-INT-10 | INT | ⬜ |
| UIR-HOME-01 | Independent sections | TC-COMP-08 | COMP | ⬜ |
| UIR-HOME-02 | Stable loading | TC-COMP-08 | COMP | ⬜ |
| UIR-HOME-03 | Primary action always visible | TC-COMP-08 | COMP | ⬜ |
| UIR-HOME-04 | Zero balance hint | TC-COMP-06 | COMP | ⬜ |
| UIR-HOME-05 | Hide/show balance | TC-PL-04, TC-COMP-06, TC-E2E-10 | COMP, E2E, PL | ⬜ |
| UIR-HOME-06 | Transaction item content | TC-COMP-07 | COMP | ⬜ |
| UIR-HOME-07 | Direction is never color-only | TC-UNIT-17, TC-COMP-07 | COMP, UNIT | ⬜ |
| UIR-HOME-08 | Relative dates | TC-UNIT-17, TC-COMP-07 | COMP, UNIT | ⬜ |
| UIR-HOME-09 | Long names | TC-COMP-07 | COMP | ⬜ |
| UIR-HOME-10 | Fresh data on every visit | TC-E2E-11 | E2E | ⬜ |
| UIR-HOME-11 | Just-completed transfer | TC-COMP-08 | COMP | ⬜ |
| UIR-HOME-12 | Section error | TC-PL-03, TC-COMP-08 | COMP, PL | ⬜ |
| UIR-HOME-13 | Header actions | TC-COMP-08 | COMP | ⬜ |
| UIR-TX-01 | Step indicator | TC-COMP-09 | COMP | ⬜ |
| UIR-TX-02 | Focus on step change | TC-COMP-09 | COMP | ⬜ |
| UIR-TX-03 | Favorites order and content | TC-UNIT-06, TC-COMP-09 | COMP, UNIT | ⬜ |
| UIR-TX-04 | Choosing a favorite | TC-COMP-09 | COMP | ⬜ |
| UIR-TX-05 | New contact form | TC-COMP-10 | COMP | ⬜ |
| UIR-TX-06 | Saving timing | TC-PL-07, TC-COMP-10 | COMP, PL | ⬜ |
| UIR-TX-07 | Duplicate contact | TC-PL-07, TC-COMP-10 | COMP, PL | ⬜ |
| UIR-TX-08 | Save failure does not block | TC-PL-07, TC-COMP-10 | COMP, PL | ⬜ |
| UIR-TX-09 | Recipient context | TC-COMP-09 | COMP | ⬜ |
| UIR-TX-10 | Amount input | TC-UNIT-02, TC-COMP-11 | COMP, UNIT | ⬜ |
| UIR-TX-11 | Balance next to amount | TC-COMP-11 | COMP | ⬜ |
| UIR-TX-12 | Rule feedback timing | TC-PL-06, TC-COMP-11 | COMP, PL | ⬜ |
| UIR-TX-13 | Primary actions stay enabled | TC-COMP-01, TC-COMP-11 | COMP | ⬜ |
| UIR-TX-14 | Step guard | TC-PL-05 | PL | ⬜ |
| UIR-TX-15 | Concept counter | TC-COMP-11 | COMP | ⬜ |
| UIR-TX-16 | Summary content | TC-COMP-12 | COMP | ⬜ |
| UIR-TX-17 | Specific edit actions | TC-COMP-12 | COMP | ⬜ |
| UIR-TX-18 | Confirm action label | TC-COMP-12 | COMP | ⬜ |
| UIR-TX-19 | Draft preserved in the flow | TC-UNIT-13 | UNIT | ⬜ |
| UIR-TX-20 | Cancel | TC-COMP-13 | COMP | ⬜ |
| UIR-TX-21 | Draft reset after completion | TC-UNIT-13 | UNIT | ⬜ |
| AC-AUTH-01 | Log in with a phone number | TC-E2E-01 | E2E | ✅ |
| AC-AUTH-02 | Log in with an email | TC-E2E-02 | E2E | ✅ |
| AC-AUTH-03 | Empty identifier | TC-COMP-03 | COMP | ✅ |
| AC-AUTH-04 | Invalid identifier format | TC-COMP-03 | COMP | ✅ |
| AC-AUTH-05 | No double submission | TC-COMP-03, TC-E2E-20 | COMP, E2E | ⬜ |
| AC-AUTH-06 | Correct code creates a session | TC-E2E-01 | E2E | ✅ |
| AC-AUTH-07 | Incorrect code | TC-COMP-04, TC-E2E-03 | COMP, E2E | ✅ |
| AC-AUTH-08 | Code locked after 3 failures | TC-COMP-04, TC-E2E-03 | COMP, E2E | ✅ |
| AC-AUTH-09 | Expired code | TC-INT-04, TC-E2E-04 | E2E, INT | ✅ |
| AC-AUTH-10 | Resend cooldown and invalidation | TC-COMP-04, TC-E2E-03 | COMP, E2E | ✅ |
| AC-AUTH-11 | Change identifier keeps input | TC-COMP-04 | COMP | ✅ |
| AC-AUTH-12 | Session persists on reload | TC-E2E-06 | E2E | ✅ |
| AC-AUTH-13 | Protected view and return to destination | TC-E2E-05 | E2E | ✅ |
| AC-AUTH-14 | Authenticated user opens Login | TC-INT-02, TC-E2E-05 | E2E, INT | ✅ |
| AC-AUTH-15 | Logout | TC-E2E-06 | E2E | ✅ |
| AC-AUTH-16 | Simulated service error is recoverable | TC-INT-03, TC-E2E-07 | E2E, INT | ✅ |
| AC-AUTH-17 | Paste a formatted code | TC-COMP-04 | COMP | ✅ |
| AC-AUTH-18 | Demo hint only outside production | TC-COMP-04 | COMP | ✅ |
| AC-AUTH-19 | Server rejects private requests without session | TC-INT-02 | INT | ✅ |
| AC-HOME-01 | Name and balance | TC-E2E-08 | E2E | ⬜ |
| AC-HOME-02 | Recent activity bounded to 10 | TC-E2E-08 | E2E | ⬜ |
| AC-HOME-03 | Transaction item content | TC-COMP-07, TC-E2E-08 | COMP, E2E | ⬜ |
| AC-HOME-04 | Loading state | TC-COMP-08 | COMP | ⬜ |
| AC-HOME-05 | Empty state | TC-COMP-07, TC-E2E-09 | COMP, E2E | ⬜ |
| AC-HOME-06 | Independent section errors | TC-E2E-09 | E2E | ⬜ |
| AC-HOME-07 | Start a transaction | TC-E2E-11 | E2E | ⬜ |
| AC-HOME-08 | Hide balance persists | TC-E2E-10 | E2E | ⬜ |
| AC-HOME-09 | Reflect a completed transfer | TC-E2E-11 | E2E | ⬜ |
| AC-HOME-10 | Zero balance | TC-COMP-06, TC-E2E-09 | COMP, E2E | ⬜ |
| AC-HOME-11 | Pending and failed transactions | TC-COMP-07, TC-E2E-08 | COMP, E2E | ⬜ |
| AC-HOME-12 | Logout from Home | TC-E2E-06 | E2E | ✅ |
| AC-TX-01 | Send to a favorite (happy path) | TC-E2E-11 | E2E | ⬜ |
| AC-TX-02 | Amount must be greater than zero (BR-01) | TC-COMP-11, TC-E2E-13 | COMP, E2E | ⬜ |
| AC-TX-03 | Amount cannot exceed balance (BR-02) | TC-COMP-11, TC-E2E-13 | COMP, E2E | ⬜ |
| AC-TX-04 | Amount format (BR-04) | TC-COMP-11, TC-E2E-13 | COMP, E2E | ⬜ |
| AC-TX-05 | Recipient required (BR-03) | TC-E2E-14 | E2E | ⬜ |
| AC-TX-06 | New contact saved by default | TC-E2E-12 | E2E | ⬜ |
| AC-TX-07 | New contact as one-off | TC-E2E-12 | E2E | ⬜ |
| AC-TX-08 | Duplicate contact (BR-08) | TC-E2E-12 | E2E | ⬜ |
| AC-TX-09 | Invalid new contact (BR-05, BR-10, BR-16) | TC-COMP-10, TC-E2E-12 | COMP, E2E | ⬜ |
| AC-TX-10 | No self-transfer (BR-09) | TC-COMP-10, TC-E2E-12 | COMP, E2E | ⬜ |
| AC-TX-11 | Concept limit (BR-15) | TC-COMP-11, TC-E2E-13 | COMP, E2E | ⬜ |
| AC-TX-12 | Edit from summary keeps data | TC-E2E-13 | E2E | ⬜ |
| AC-TX-13 | Cancel with data asks for confirmation | TC-E2E-14 | E2E | ⬜ |
| AC-TX-14 | Favorites error keeps new contact available | TC-COMP-09 | COMP | ⬜ |
| AC-TX-15 | Server enforces the rules (BR-06) | TC-INT-08 | INT | ⬜ |
| AC-TX-16 | Save failure does not block the transfer | TC-E2E-12 | E2E | ⬜ |
| AC-CONF-01 | Success shows the receipt | TC-E2E-11 | E2E | ⬜ |
| AC-CONF-02 | Processing cannot be triggered twice | TC-PL-08, TC-E2E-20 | E2E, PL | ⬜ |
| AC-CONF-03 | Network error says money was not sent | TC-E2E-15 | E2E | ⬜ |
| AC-CONF-04 | Retry never duplicates | TC-INT-09, TC-E2E-15 | E2E, INT | ⬜ |
| AC-CONF-05 | Insufficient funds | TC-E2E-16 | E2E | ⬜ |
| AC-CONF-06 | Timeout resolved as completed | TC-E2E-17 | E2E | ⬜ |
| AC-CONF-07 | Timeout resolved as not processed | TC-PL-08, TC-E2E-17 | E2E, PL | ⬜ |
| AC-CONF-08 | Timeout unresolved never asserts the result | TC-PL-08, TC-E2E-17 | E2E, PL | ⬜ |
| AC-CONF-09 | Unknown error fallback | TC-E2E-18 | E2E | ⬜ |
| AC-CONF-10 | Bounded wait | TC-PL-08, TC-E2E-17 | E2E, PL | ⬜ |
| AC-CONF-11 | Receipt cannot be resubmitted with Back | TC-E2E-19 | E2E | ⬜ |
| AC-CONF-12 | Revisit receipt | TC-E2E-19 | E2E | ⬜ |
| AC-CONF-13 | Copy folio | TC-E2E-19 | E2E | ⬜ |
| AC-CONF-14 | Send again | TC-E2E-19 | E2E | ⬜ |
| AC-CONF-15 | Forced outcomes only outside production | TC-INT-10 | INT | ⬜ |
| AC-CONF-16 | Random outcomes in normal use | TC-INT-10 | INT | ⬜ |
| AC-CONF-17 | Receipt of another user | TC-INT-11, TC-E2E-19 | E2E, INT | ⬜ |
| A11Y-01 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-02 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-03 | — | TC-COMP-01, TC-MAN-01 | COMP, MAN | ⬜ |
| A11Y-04 | — | TC-E2E-21, TC-MAN-01 | E2E, MAN | ⬜ |
| A11Y-05 | — | TC-COMP-01 | COMP | ✅ |
| A11Y-06 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-07 | — | TC-COMP-01 | COMP | ✅ |
| A11Y-08 | — | TC-COMP-01, TC-MAN-02 | COMP, MAN | ⬜ |
| A11Y-10 | — | TC-UNIT-24, TC-E2E-21, TC-MAN-04 | E2E, MAN, UNIT | ⬜ |
| A11Y-11 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-12 | — | TC-MAN-03 | MAN | ⬜ |
| A11Y-13 | — | TC-COMP-01, TC-MAN-03 | COMP, MAN | ⬜ |
| A11Y-14 | — | TC-MAN-02 | MAN | ⬜ |
| A11Y-16 | — | TC-MAN-02 | MAN | ⬜ |
| A11Y-17 | — | TC-MAN-02 | MAN | ⬜ |
| A11Y-18 | — | TC-COMP-01 | COMP | ✅ |
| A11Y-19 | — | TC-COMP-01 | COMP | ✅ |
| A11Y-20 | — | TC-MAN-04 | MAN | ⬜ |
| A11Y-21 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-22 | — | TC-MAN-04 | MAN | ⬜ |
| A11Y-23 | — | TC-E2E-21 | E2E | ⬜ |
| A11Y-24 | — | TC-COMP-01, TC-COMP-13, TC-MAN-01 | COMP, MAN | ⬜ |
| A11Y-25 | — | TC-MAN-03 | MAN | ⬜ |
| A11Y-26 | — | TC-COMP-02, TC-E2E-22 | COMP, E2E | ⬜ |
| FR-AUTH-01 | — | TC-INT-03 | INT | ✅ |
| FR-AUTH-02 | — | TC-INT-03 | INT | ✅ |
| FR-AUTH-06 | — | TC-INT-04 | INT | ✅ |
| FR-AUTH-07 | — | TC-E2E-01 | E2E | ✅ |
| FR-AUTH-08 | — | TC-E2E-05 | E2E | ✅ |
| FR-AUTH-10 | — | TC-INT-05 | INT | ✅ |
| FR-AUTH-12 | — | TC-INT-03 | INT | ✅ |
| FR-AUTH-13 | — | TC-INT-04 | INT | ✅ |
| FR-AUTH-14 | — | TC-INT-04 | INT | ✅ |
| FR-CONF-01 | — | TC-INT-10 | INT | ⬜ |
| FR-CONF-08 | — | TC-INT-09 | INT | ⬜ |
| FR-CONF-11 | — | TC-UNIT-18, TC-INT-10 | INT, UNIT | ⬜ |
| FR-CONF-13 | — | TC-INT-10 | INT | ⬜ |
| FR-HOME-01 | — | TC-INT-06 | INT | ✅ |
| FR-HOME-02 | — | TC-INT-06 | INT | ✅ |
| FR-HOME-03 | — | TC-INT-06 | INT | ✅ |
| FR-HOME-06 | — | TC-E2E-09 | E2E | ⬜ |
| FR-HOME-10 | — | TC-INT-06 | INT | ✅ |
| FR-TX-02 | — | TC-INT-07 | INT | ⬜ |
| FR-TX-04 | — | TC-INT-07 | INT | ⬜ |
| NFR-04 | — | TC-UNIT-19, TC-INT-13, TC-E2E-23 | E2E, INT, UNIT | ⬜ |
| NFR-05 | — | TC-UNIT-20 | UNIT | ✅ |
| NFR-06 | — | TC-UNIT-23 | UNIT | ✅ |
| NFR-10 | — | TC-UNIT-21, TC-INT-12 | INT, UNIT | ✅ |
| NFR-13 | — | TC-UNIT-17 | UNIT | ✅ |
| NFR-14 | — | TC-E2E-21 | E2E | ⬜ |
| NFR-16 | — | TC-UNIT-24 | UNIT | ✅ |
| NFR-17 | — | TC-INT-01 | INT | ✅ |
| UX-01 | — | TC-MAN-03 | MAN | ⬜ |
| UX-22 | — | TC-PL-09, TC-COMP-02, TC-INT-14, TC-E2E-22 | COMP, E2E, INT, PL | ⬜ |

## 6. Test cases

Levels and IDs follow the [specs README](../README.md#24-ids). Tests reference their TC ID and the IDs they cover in the test name, e.g. `it('[TC-UNIT-03][BR-02] rejects amount above balance', …)`.

### 6.1 Unit

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-UNIT-01 | Money value object | BR-04 | fromMinor/parse reject non-integers and negatives; add/subtract exact; isZero; never floats | `src/core/money.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-02 | Amount input parsing and formatting | BR-04, UIR-TX-10 | `12.345`→`12.34` rejected 3rd decimal; letters rejected; `007`→`7.00`; `25.`→`25.00`; `$1,250.50`→`1250.50` (FS-03 EC-01…04) | `src/core/money-input.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-03 | validateAmount | BR-01, BR-02 | empty, 0, −1 → INVALID_AMOUNT; 0.01 ok; = balance ok; > balance → INSUFFICIENT_FUNDS; balance 0 (FS-03 EC-01, 02, 05) | `src/core/transfer-rules.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-04 | validateRecipient | BR-03, BR-09 | null → RECIPIENT_REQUIRED; own identifier (any format) → SELF_TRANSFER (FS-03 EC-12) | `src/core/transfer-rules.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-05 | parseIdentifier | BR-10, BR-05, UIR-AUTH-01 | `+52 (55) 1234-5678`, `52 5512345678`, spaces → `5512345678`; `+1…` invalid; email trimmed/lowercased; >254 chars invalid; `@` → email (FS-01 EC-01…04) | `src/core/identifier.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-06 | maskIdentifier | UIR-AUTH-06, UIR-TX-03 | phone → `•••• 5678`; email → `a•••@correo.com` | `src/core/identifier.test.ts` | Medium | TASK-05 | ✅ |
| TC-UNIT-07 | parseOtpCode | BR-11, UIR-AUTH-07 | `123 456`/`123-456` → `123456`; letters, 5 or 7 digits → INVALID_CODE_FORMAT (FS-01 EC-05) | `src/core/otp.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-08 | evaluateOtpAttempt | BR-12 | valid; incorrect → attemptsLeft 2,1; third failure → locked; > TTL → expired; older code after reissue → incorrect | `src/core/otp.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-09 | canIssueCode | BR-13 | within 30 s → throttled with retryAfterSec; after 30 s ok; locked challenge → ok immediately | `src/core/otp.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-10 | validateConcept | BR-15 | optional; 40 chars ok; 41 rejected; spaces-only → empty; control chars/line breaks rejected (FS-03 EC-11) | `src/core/transfer-rules.test.ts` | Medium | TASK-05 | ✅ |
| TC-UNIT-11 | validateContactName | BR-16 | empty/whitespace → required; 50 chars ok; 51 rejected; accents/emoji counted as characters (FS-03 EC-07) | `src/core/contact.test.ts` | Medium | TASK-05 | ✅ |
| TC-UNIT-12 | Attempt status transitions | BR-17 | in_progress → completed/failed/not_processed; final states immutable; not_processed may be re-processed | `src/core/transfer-attempt.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-13 | Transfer draft reducer and fingerprint | BR-07, UIR-TX-19, UIR-TX-21 | every action; summaryReached keeps key if fingerprint unchanged, new key if recipient/amount/concept changed; reset clears; seedRecipient | `src/features/transfer/state/draft-reducer.test.ts` | High | TASK-15 | ⬜ |
| TC-UNIT-14 | sanitizeReturnTo | ADR-001, UIR-AUTH-14 | `/transfer/amount` ok; `//evil.com`, `https://…`, `javascript:` and `/login` rejected → `/` (FS-01 EC-14) | `src/core/return-to.test.ts` | High | TASK-05 | ✅ |
| TC-UNIT-15 | Session cookie signing | ADR-004, BR-14 | sign/verify round trip; tampered id or signature → invalid; constant-time compare | `src/server/session/cookie.test.ts` | High | TASK-09 | ✅ |
| TC-UNIT-16 | Error code → HTTP mapping | TS-00 §5 | every ErrorCode maps to its status; unknown exception → 500 INTERNAL_ERROR with requestId | `src/server/http/http.test.ts` | High | TASK-08 | ✅ |
| TC-UNIT-17 | Formatters | UIR-HOME-07, UIR-HOME-08, NFR-13 | es-MX currency; signed amount `−$250.00`/`+$1,000.00`; Hoy/Ayer/date in session time zone (FS-02 EC-09) | `src/lib/format/*.test.ts` | Medium | TASK-05 | ✅ |
| TC-UNIT-18 | Outcome simulator | ASM-16, FR-CONF-11 | weights respected over N rolls; forced outcomes honored with mock controls; ignored and logged without them; timeout sub-cases | `src/server/mock/outcome-simulator.test.ts` | High | TASK-06 | ✅ |
| TC-UNIT-19 | Request ID and reference code | NFR-04, UIR-CONF-11 | valid incoming UUID reused; invalid replaced; reference `3F9A-12C4` from first 8 hex chars | `src/server/logging/request-id.test.ts` | Medium | TASK-07 | ✅ |
| TC-UNIT-20 | Log redaction | NFR-05 | cookie, authorization, identifier, code, name, destination, sessionId removed | `src/server/logging/redaction.test.ts` | High | TASK-07 | ✅ |
| TC-UNIT-21 | Configuration | NFR-10 | defaults from ASM-15…17; missing SESSION_SECRET fails; production forces MOCK_CONTROLS_ENABLED=false | `src/lib/config.test.ts` | High | TASK-06 | ✅ |
| TC-UNIT-22 | Contact repository uniqueness | BR-08 | same normalized identifier → existing contact returned, no duplicate (FS-03 EC-08) | `src/server/repositories/contact.repository.test.ts` | High | TASK-06 | ✅ |
| TC-UNIT-23 | Browser HTTP client | NFR-06, ADR-009 | timeout aborts and returns TIMEOUT; fetch TypeError → NETWORK_ERROR; schema mismatch → INTERNAL_ERROR; sends x-request-id, idempotency-key, JSON content type; 401 triggers session-ended redirect | `src/lib/http/client.test.ts` | High | TASK-08 | ✅ |
| TC-UNIT-24 | Theme token contrast | A11Y-10, NFR-16 | every semantic text/background pair ≥ 4.5:1 and every boundary/focus/action color ≥ 3:1 in light AND dark, read from the real token file; default palette removed | `src/app/theme-tokens.test.ts` | High | TASK-03 | ✅ |

### 6.2 Presentation logic

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-PL-01 | useLoginFlow | UIR-AUTH-04, UIR-AUTH-09, UIR-AUTH-10, UIR-AUTH-12, UIR-AUTH-13 | identifier → requestingCode → code → verifying → success; incorrect/locked/expired branches; change identifier keeps value; new code resets attempts | `src/features/auth/use-login-flow.test.ts` | High | TASK-11 | ✅ |
| TC-PL-02 | useCountdown | UIR-AUTH-11 | counts down from server value; exposes `available` at zero once; cleans up on unmount (fake timers) | `src/features/auth/use-countdown.test.ts` | Medium | TASK-11 | ✅ |
| TC-PL-03 | useSectionRetry | UIR-HOME-12 | retry calls only its endpoint; loading → ready / error with requestId | `src/features/home/use-section-retry.test.ts` | Medium | TASK-13 | ⬜ |
| TC-PL-04 | useHideBalance | UIR-HOME-05 | toggle writes `hide_balance` cookie; initial value from server prop | `src/features/home/use-hide-balance.test.ts` | Medium | TASK-13 | ⬜ |
| TC-PL-05 | useStepGuard | UIR-TX-14, BR-03 | amount without recipient → replace to recipient; summary without amount → amount; completion marker → Home; renders nothing before redirect | `src/features/transfer/use-step-guard.test.ts` | High | TASK-15 | ⬜ |
| TC-PL-06 | useAmountField | UIR-TX-12 | BR-02 error as soon as exceeded; BR-01 only on continue; errors clear when valid | `src/features/transfer/use-amount-field.test.ts` | High | TASK-16 | ⬜ |
| TC-PL-07 | useSaveContact | UIR-TX-06, UIR-TX-07, UIR-TX-08 | 201 → saved message; 200 → duplicate message + existing recipient; 503/network → one-off + failure message | `src/features/transfer/use-save-contact.test.ts` | High | TASK-15 | ⬜ |
| TC-PL-08 | useConfirmTransfer | UIR-CONF-01, UIR-CONF-02, UIR-CONF-03, UIR-CONF-04, UIR-CONF-05, UIR-CONF-06, UIR-CONF-16, AC-CONF-02, AC-CONF-07, AC-CONF-08, AC-CONF-10 | every row of TS-04 §8 mapping table; slow at 3 s; abort at 10 s; checks at +2/+4/+8 s; unresolved after limit; same key on retry; timers and requests cleared on unmount (fake timers) | `src/features/confirmation/use-confirm-transfer.test.ts` | High | TASK-18 | ⬜ |
| TC-PL-09 | Theme state | UX-22 | system/light/dark selection updates `data-theme` immediately and calls the Server Action | `src/features/theme/theme-provider.test.tsx` | Medium | TASK-03 | ✅ |

### 6.3 Component

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-COMP-01 | Base components accessibility contracts | A11Y-03, A11Y-05, A11Y-07, A11Y-08, A11Y-13, A11Y-18, A11Y-19, A11Y-24, UIR-AUTH-03, UIR-TX-13 | Button busy ≠ disabled-for-invalid; TextField label/hint/error/invalid; Dialog focus trap + Escape + return focus; Toast polite; Skeleton hidden; ReferenceCode; axe clean | `src/components/ui/*.test.tsx` | High | TASK-04 | ✅ |
| TC-COMP-02 | ThemeSwitcher | A11Y-26, UIR-AUTH-18, UX-22 | accessible name and current value; keyboard operable; focus stays after change | `src/features/theme/theme-switcher.test.tsx` | High | TASK-03 | ✅ |
| TC-COMP-03 | IdentifierStep | UIR-AUTH-01, UIR-AUTH-02, UIR-AUTH-03, AC-AUTH-03, AC-AUTH-04, AC-AUTH-05 | error on blur not while typing; clears live; Continue enabled when empty → required error + focus; busy blocks second submit | `src/features/auth/identifier-step.test.tsx` | High | TASK-11 | ✅ |
| TC-COMP-04 | CodeStep and OneTimeCodeField | UIR-AUTH-05, UIR-AUTH-06, UIR-AUTH-07, UIR-AUTH-08, UIR-AUTH-09, UIR-AUTH-10, UIR-AUTH-11, UIR-AUTH-12, UIR-AUTH-13, UIR-AUTH-16, AC-AUTH-07, AC-AUTH-08, AC-AUTH-10, AC-AUTH-11, AC-AUTH-17, AC-AUTH-18 | focus + instructions with masked destination; paste normalized; no auto-submit; attempts-left message with selected content; locked state; cooldown text announced once at zero; demo hint only with flag | `src/features/auth/code-step.test.tsx` | High | TASK-11 | ✅ |
| TC-COMP-05 | SessionNotice | UIR-AUTH-17 | `reason=logged_out` and `reason=session_ended` messages announced | `src/features/auth/session-notice.test.tsx` | Medium | TASK-11 | ✅ |
| TC-COMP-06 | BalanceCard and HideBalanceToggle | UIR-HOME-04, UIR-HOME-05, AC-HOME-10 | zero balance note; masked `$ ••••••` with accessible 'Saldo oculto'; toggle aria-pressed | `src/components/wallet/balance-card.test.tsx` | High | TASK-13 | ⬜ |
| TC-COMP-07 | TransactionItem and ActivityList | UIR-HOME-06, UIR-HOME-07, UIR-HOME-08, UIR-HOME-09, AC-HOME-03, AC-HOME-05, AC-HOME-11 | one accessible sentence per item; sign + direction label; badges only for pending/failed; long names truncated with full accessible name; empty state copy | `src/components/wallet/transaction-item.test.tsx` | High | TASK-13 | ⬜ |
| TC-COMP-08 | Home sections | UIR-HOME-01, UIR-HOME-02, UIR-HOME-03, UIR-HOME-11, UIR-HOME-12, UIR-HOME-13, AC-HOME-04 | skeleton per section with aria-busy; SectionError with reference and retry; primary action always rendered; header actions; highlight respects reduced motion | `src/features/home/home-sections.test.tsx` | High | TASK-13 | ⬜ |
| TC-COMP-09 | Recipient step | UIR-TX-01, UIR-TX-02, UIR-TX-03, UIR-TX-04, UIR-TX-09, AC-TX-14 | step indicator text; heading focus; favorites order and accessible names; activating a favorite selects and navigates; favorites error keeps 'Nuevo contacto' | `src/features/transfer/recipient-step.test.tsx` | High | TASK-15 | ⬜ |
| TC-COMP-10 | NewContactForm | UIR-TX-05, UIR-TX-06, UIR-TX-07, UIR-TX-08, AC-TX-09, AC-TX-10 | fields + checkbox checked by default; per-field errors and focus on first; self-transfer error; saved / duplicate / save-failed messages | `src/features/transfer/new-contact-form.test.tsx` | High | TASK-15 | ⬜ |
| TC-COMP-11 | Amount step | UIR-TX-10, UIR-TX-11, UIR-TX-12, UIR-TX-13, UIR-TX-15, AC-TX-02, AC-TX-03, AC-TX-04, AC-TX-11 | caret preserved while formatting; balance linked as description; BR-02 live, BR-01 on continue; concept counter 40/40; balance error with retry | `src/features/transfer/amount-step.test.tsx` | High | TASK-16 | ⬜ |
| TC-COMP-12 | Summary step | UIR-TX-16, UIR-TX-17, UIR-TX-18 | all details; resulting balance (masked when hidden); specific edit actions; confirm label 'Enviar $250.00' | `src/features/transfer/summary-step.test.tsx` | High | TASK-16 | ⬜ |
| TC-COMP-13 | CancelTransferDialog | UIR-TX-20, A11Y-24 | asks only when data entered; Escape = keep editing; focus returns to Cancel | `src/features/transfer/cancel-dialog.test.tsx` | Medium | TASK-15 | ⬜ |
| TC-COMP-14 | Confirmation views | UIR-CONF-01, UIR-CONF-02, UIR-CONF-04, UIR-CONF-05, UIR-CONF-06, UIR-CONF-08, UIR-CONF-09, UIR-CONF-10, UIR-CONF-11 | processing busy; slow and verifying announced; each outcome view: heading focus, copy, actions, reference code; unresolved never asserts result | `src/features/confirmation/outcome-views.test.tsx` | High | TASK-18 | ⬜ |
| TC-COMP-15 | Receipt | UIR-CONF-12, UIR-CONF-13, UIR-CONF-14, UIR-CONF-15 | all receipt fields; balance masked when hidden; copy folio → 'Folio copiado'; actions order; not-found view | `src/features/confirmation/receipt.test.tsx` | High | TASK-19 | ⬜ |

### 6.4 Integration

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-INT-01 | CSRF protection matrix | NFR-17, ADR-004 | state-changing request with foreign Origin → 403; no Origin + Sec-Fetch-Site cross-site → 403; form-encoded → 415; missing x-request-id → 403; no CORS headers; GET never mutates | `src/proxy.int.test.ts` | High | TASK-09 | ✅ |
| TC-INT-02 | Session gate and authority | BR-14, UIR-AUTH-15, AC-AUTH-19, AC-AUTH-14 | private page without cookie → /login?returnTo; with cookie on /login → /; private API without session → 401; tampered cookie → 401; handler called directly (middleware bypassed) still → 401 | `src/server/session/session.int.test.ts` | High | TASK-09 | ✅ |
| TC-INT-03 | POST /api/auth/code | FR-AUTH-01, FR-AUTH-02, FR-AUTH-12, BR-10, BR-13, AC-AUTH-16 | 202 with masked destination; 422 INVALID_IDENTIFIER; 429 CODE_THROTTLED with retryAfterSec; unknown identifier → same 202; seeded `falla.login` → 503; no identifier/code in logs | `src/app/api/auth/code/route.int.test.ts` | High | TASK-10 | ✅ |
| TC-INT-04 | POST /api/auth/verify | FR-AUTH-06, FR-AUTH-13, FR-AUTH-14, BR-11, BR-12, AC-AUTH-09 | 200 + cookie attributes; INVALID_CODE_FORMAT consumes no attempt; CODE_INCORRECT attemptsLeft; CODE_LOCKED; `otp_expired` forced → CODE_EXPIRED; redirectTo sanitized; timeZone stored | `src/app/api/auth/verify/route.int.test.ts` | High | TASK-10 | ✅ |
| TC-INT-05 | POST /api/auth/logout | FR-AUTH-10 | 204; session deleted; replaying old cookie → 401; idempotent without session | `src/app/api/auth/logout/route.int.test.ts` | High | TASK-10 | ✅ |
| TC-INT-06 | Home endpoints | FR-HOME-01, FR-HOME-02, FR-HOME-03, FR-HOME-10 | summary and transactions for seeded users; limit clamped to 10; seeded failures → 503; Cache-Control no-store | `src/app/api/me/me.int.test.ts` | High | TASK-12 | ✅ |
| TC-INT-07 | Contacts endpoints | BR-08, BR-09, BR-10, BR-16, FR-TX-02, FR-TX-04 | GET ordered by lastUsedAt; POST 201 new / 200 duplicate; 422 INVALID_CONTACT_NAME, INVALID_IDENTIFIER, SELF_TRANSFER; forced 503 | `src/app/api/contacts/route.int.test.ts` | High | TASK-14 | ⬜ |
| TC-INT-08 | POST /api/transfers — rules | BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-09, BR-15, AC-TX-15 | each rule violated directly against the API → specific 422; foreign contactId → RECIPIENT_REQUIRED; no debit on any failure | `src/app/api/transfers/rules.int.test.ts` | High | TASK-17 | ⬜ |
| TC-INT-09 | POST /api/transfers — idempotency | BR-07, FR-CONF-08, AC-CONF-04 | same key + payload → stored 201 replay; same key + other payload → 409; concurrent same key → one debit, other 202; not_processed re-processed on retry | `src/app/api/transfers/idempotency.int.test.ts` | High | TASK-17 | ⬜ |
| TC-INT-10 | Forced outcomes and attempt status | FR-CONF-01, FR-CONF-11, FR-CONF-13, BR-17, UIR-CONF-17, AC-CONF-15, AC-CONF-16 | each outcome and timeout sub-case via x-mock-outcome; status endpoint reports in_progress/completed/failed/not_processed; unknown key → not_processed | `src/app/api/transfers/outcomes.int.test.ts` | High | TASK-17 | ⬜ |
| TC-INT-11 | Receipt ownership | AC-CONF-17 | getReceipt for another user's transfer → NOT_FOUND, indistinguishable from missing | `src/server/services/transfers.service.int.test.ts` | High | TASK-17 | ⬜ |
| TC-INT-12 | Mock controls disabled | NFR-10 | with MOCK_CONTROLS_ENABLED=false: x-mock-outcome ignored (logged), /api/mock/reset → 404, demo hint flag false | `src/server/mock/mock-controls.int.test.ts` | High | TASK-06 | ✅ |
| TC-INT-13 | Correlation and client logs | NFR-04 | every API response has x-request-id; error bodies include requestId; client-logs: >10 events → 400, >2 KB → 413, rate limit → 429 | `src/app/api/client-logs/route.int.test.ts`, `src/proxy.int.test.ts`, `src/server/http/http.test.ts` | Medium | TASK-07, TASK-09 | ✅ |
| TC-INT-14 | Theme Server Action | ADR-007, UX-22 | sets `theme` cookie (light/dark/system) and rejects other values | `src/server/actions/set-theme.int.test.ts` | Medium | TASK-03 | ✅ |

### 6.5 E2E

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-E2E-01 | Login with phone | AC-AUTH-01, AC-AUTH-06, FR-AUTH-07 | phone → code step `•••• 5678` → demo code → Home; Back does not show Login | `tests/e2e/auth.spec.ts` | High | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-02 | Login with email | AC-AUTH-02 | email with spaces/uppercase → masked email → Home | `tests/e2e/auth.spec.ts` | Medium | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-03 | Wrong code, lock and new code | AC-AUTH-07, AC-AUTH-08, AC-AUTH-10 | two wrong codes with attempts left; third locks; new code after cooldown (shortened); old code rejected | `tests/e2e/auth.spec.ts` | High | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-04 | Expired code | AC-AUTH-09 | `otp_expired` forced on verify → expired message → request new code | `tests/e2e/auth.spec.ts` | Medium | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-05 | Deep link and authenticated redirect | AC-AUTH-13, AC-AUTH-14, UIR-AUTH-14, FR-AUTH-08 | fresh context opens /transfer/recipient → Login → back to it; logged-in user opening /login → Home without form | `tests/e2e/auth.spec.ts` | High | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-06 | Session persistence and logout | AC-AUTH-12, AC-AUTH-15, AC-HOME-12 | reload keeps session; logout → 'Cerraste sesión.'; Home redirects to Login; Back doesn't reveal balance | `tests/e2e/auth.spec.ts` | High | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-07 | Login service error | AC-AUTH-16 | seeded `falla.login` → error with reference and retry; identifier kept | `tests/e2e/auth.spec.ts` | Medium | TASK-20 (written in TASK-11) | ✅ |
| TC-E2E-08 | Home — normal user | AC-HOME-01, AC-HOME-02, AC-HOME-03, AC-HOME-11 | greeting, balance, exactly 10 newest items, item content and badges | `tests/e2e/home.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-09 | Home — states and section retry | AC-HOME-05, AC-HOME-06, AC-HOME-10, FR-HOME-06 | empty user; zero-balance user; balance-error and activity-error users; retry reloads only that section | `tests/e2e/home.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-10 | Hide balance | AC-HOME-08, UIR-HOME-05 | toggle, reload: still hidden; summary and receipt balances masked | `tests/e2e/home.spec.ts` | Medium | TASK-20 | ⬜ |
| TC-E2E-11 | Transfer happy path | AC-TX-01, AC-CONF-01, AC-HOME-07, AC-HOME-09, UIR-HOME-10 | favorite → amount → summary → success receipt → Home shows new balance and first item | `tests/e2e/transfer.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-12 | New contact variants | AC-TX-06, AC-TX-07, AC-TX-08, AC-TX-09, AC-TX-10, AC-TX-16 | saved, one-off, duplicate, invalid fields, self-transfer, save failure (route-level forced 503) continues | `tests/e2e/transfer.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-13 | Amount rules, concept and edit | AC-TX-02, AC-TX-03, AC-TX-04, AC-TX-11, AC-TX-12 | zero, over balance (live), format, concept limit, edit amount from summary keeps recipient and concept | `tests/e2e/transfer.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-14 | Cancel and step guard | AC-TX-05, AC-TX-13 | direct /transfer/summary → recipient; cancel dialog keep/confirm; no transfer made | `tests/e2e/transfer.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-15 | Network error and safe retry | AC-CONF-03, AC-CONF-04 | forced network_error → 'Tu dinero no se envió' → retry succeeds → exactly one transaction | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-16 | Insufficient funds | AC-CONF-05 | forced insufficient_funds → updated balance → 'Cambiar monto' keeps amount with error | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-17 | Timeout sub-cases | AC-CONF-06, AC-CONF-07, AC-CONF-08, AC-CONF-10 | shortened timings; timeout-completed → receipt; timeout-not-processed → not sent; timeout-unresolved → no assertion of result; never stuck in 'Enviando…' | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-18 | Unknown error | AC-CONF-09 | forced unknown_error → fallback copy, reference, retry, Home | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-19 | Receipt navigation | AC-CONF-11, AC-CONF-12, AC-CONF-13, AC-CONF-14, AC-CONF-17, UIR-CONF-07 | Back → Home; reload same receipt, no new transaction; copy folio; send again pre-selects recipient; other user's receipt → not found | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-20 | No double submission | AC-AUTH-05, AC-CONF-02 | double click Continue/Verify/Enviar → one request each (network log) | `tests/e2e/confirmation.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-21 | Accessibility scan | NFR-14, A11Y-01, A11Y-02, A11Y-04, A11Y-06, A11Y-10, A11Y-11, A11Y-21, A11Y-23 | axe on every screen and outcome view in light and dark; page titles; focus to heading on navigation | `tests/e2e/a11y.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-22 | Theme | UX-22, A11Y-26 | no cookie + dark scheme → dark on first paint (before hydration); switching persists across reload | `tests/e2e/theme.spec.ts` | High | TASK-20 | ⬜ |
| TC-E2E-23 | Reference code correlation | NFR-04, UIR-CONF-11 | reference shown on a forced error equals the response x-request-id prefix | `tests/e2e/confirmation.spec.ts` | Medium | TASK-20 | ⬜ |

### 6.6 Manual

| TC | Title | Covers | Key cases → expected result | Location | Priority | Built in | Status |
|---|---|---|---|---|---|---|---|
| TC-MAN-01 | Keyboard-only walkthrough | A11Y-03, A11Y-04, A11Y-24 | login → home → transfer → each outcome → receipt with keyboard only; no traps; focus always visible and not obscured | Checklist §8 | High | TASK-21 | ⬜ |
| TC-MAN-02 | Screen-reader smoke test | A11Y-08, A11Y-17, A11Y-14, A11Y-16 | VoiceOver: login (paste code), balance and list reading, amount errors, outcomes, folio spelled out; cooldown not announced every second | Checklist §8 | High | TASK-21 | ⬜ |
| TC-MAN-03 | Resize and reflow | A11Y-12, A11Y-13, A11Y-25, UX-01 | 320 px width and 200 % text on every screen; portrait/landscape; targets ≥ 44 px for primary actions | Checklist §8 | High | TASK-21 | ⬜ |
| TC-MAN-04 | Forced colors, reduced motion, text spacing | A11Y-20, A11Y-10, A11Y-22 | OS forced-colors keeps focus/borders; no non-essential animation with reduced motion; spacing override doesn't break layout | Checklist §8 | Medium | TASK-21 | ⬜ |

## 7. Negative scenarios and edge cases

Edge cases from FS-01…FS-04 §11 are folded into the cases above (see the "Key cases" column). The highest-risk negatives:

| Scenario | TC |
|---|---|
| Duplicate submission / retry with the same idempotency key | TC-INT-09, TC-E2E-15, TC-E2E-20 |
| Session expires or is tampered with mid-flow | TC-INT-02, TC-UNIT-15 |
| Request from another origin, as a form, or without custom header | TC-INT-01 |
| Unknown outcome presented as known | TC-PL-08, TC-COMP-14, TC-E2E-17 |
| Mock controls active in production | TC-INT-12, TC-UNIT-21 |
| Sensitive data in logs | TC-UNIT-20, TC-INT-03 |

## 8. Non-functional tests and manual checklist

| Aspect | How it is verified | TC |
|---|---|---|
| Accessibility (automated) | axe in component tests and on every E2E screen, light and dark | TC-COMP-01, TC-E2E-21 |
| Accessibility (manual) | Checklist below | TC-MAN-01…04 |
| Observability | `x-request-id` on every response; reference code correlation; redaction | TC-INT-13, TC-E2E-23, TC-UNIT-20 |
| Security | CSRF matrix; session gate and authority | TC-INT-01, TC-INT-02 |
| Performance | Lighthouse (mobile) on Home and Login: LCP ≤ 2.5 s, CLS ≤ 0.1 | Manual, recorded in §11 |

**Manual checklist (TC-MAN-01…04)** — for each screen and outcome view:
- [ ] Reachable and operable with keyboard only; logical order; no traps; focus visible and not hidden by sticky elements.
- [ ] VoiceOver announces headings on navigation, field labels/hints/errors, status messages (once), amounts with currency and direction.
- [ ] Usable at 320 px width and at 200 % text size; portrait and landscape.
- [ ] Forced-colors mode keeps borders and focus; reduced motion disables non-essential animation; text-spacing override doesn't clip content.

## 9. Entry and exit criteria

**Entry:** specs approved; the task's code compiles; seed data and mock controls available.
**Exit (per task):** its TCs pass and are marked ✅ here.
**Exit (delivery):** all High-priority TCs pass; matrix has no ⬜ for Must items; E2E suite green 10 consecutive runs; manual checklist completed.

## 10. Running the tests

| Suite | Command |
|---|---|
| Unit / presentation logic / component / integration | `npm test` |
| Coverage report | `npm run test:coverage` |
| E2E (all projects) | `npm run test:e2e` |
| E2E, one project | `npm run test:e2e -- --project=chromium-light` |

## 11. Results

| Date | Suite | Total | ✅ | ❌ | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## 12. Test risks

| Risk | Mitigation |
|---|---|
| Flaky E2E due to randomness or timing | Forced outcomes per request; shortened, configurable timings; no sleeps |
| jsdom gaps (layout, focus-visible) | Covered by E2E and manual checks |
| Forced header leaking to other requests | Route-level injection only on the target call |

## 13. Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-14 | Claude (AI-assisted) | First draft generated from FS/TS; coverage verified for every BR, UIR and AC |
| 0.2 | 2026-10-14 | Claude (AI-assisted) | TASK-03: TC-UNIT-24 (theme token contrast) added; 89 cases |
