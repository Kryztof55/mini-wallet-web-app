# TASK-20 — Write the E2E suite

| Field | Value |
|---|---|
| **ID** | TASK-20 |
| **Status** | In review (10× stability run pending) |
| **Milestone** | M5 — Quality and delivery |
| **Covers** | NFR-09 · NFR-14 · AC-* (E2E level) |
| **Specs** | Test plan, ADR-005 |
| **Depends on** | [TASK-11](./TASK-11-login-screens.md), [TASK-13](./TASK-13-home-screen.md), [TASK-19](./TASK-19-receipt.md) |
| **Estimate** | 2 h |
| **Actual time** | ~1.5 h |
| **Branch / change request** | `chore/m5-quality-delivery` · commits `… [TASK-20]` |

---

## 1. Goal

End-to-end proof of every flow and every confirmation outcome, with accessibility scans in both themes.

## 2. Scope

**In scope:** Login, Home states, transfer flow, five outcomes + timeout sub-cases, Back/reload, deep link, CSRF smoke, axe on each screen (light and dark), mobile WebKit run.
**Out of scope:** Visual regression.

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `tests/e2e/*` | New |

## 4. Acceptance criteria

- [ ] Suite green 10 consecutive runs (no flakiness).
- [ ] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-E2E-01](../../05-testing/test-plan.md#6-test-cases) | E2E | Login with phone | ✅ |
| [TC-E2E-02](../../05-testing/test-plan.md#6-test-cases) | E2E | Login with email | ✅ |
| [TC-E2E-03](../../05-testing/test-plan.md#6-test-cases) | E2E | Wrong code, lock and new code | ✅ |
| [TC-E2E-04](../../05-testing/test-plan.md#6-test-cases) | E2E | Expired code | ✅ |
| [TC-E2E-05](../../05-testing/test-plan.md#6-test-cases) | E2E | Deep link and authenticated redirect | ✅ |
| [TC-E2E-06](../../05-testing/test-plan.md#6-test-cases) | E2E | Session persistence and logout | ✅ |
| [TC-E2E-07](../../05-testing/test-plan.md#6-test-cases) | E2E | Login service error | ✅ |
| [TC-E2E-08](../../05-testing/test-plan.md#6-test-cases) | E2E | Home — normal user | ✅ |
| [TC-E2E-09](../../05-testing/test-plan.md#6-test-cases) | E2E | Home — states and section retry | ✅ |
| [TC-E2E-10](../../05-testing/test-plan.md#6-test-cases) | E2E | Hide balance | ✅ |
| [TC-E2E-11](../../05-testing/test-plan.md#6-test-cases) | E2E | Transfer happy path | ✅ |
| [TC-E2E-12](../../05-testing/test-plan.md#6-test-cases) | E2E | New contact variants | ✅ |
| [TC-E2E-13](../../05-testing/test-plan.md#6-test-cases) | E2E | Amount rules, concept and edit | ✅ |
| [TC-E2E-14](../../05-testing/test-plan.md#6-test-cases) | E2E | Cancel and step guard | ✅ |
| [TC-E2E-15](../../05-testing/test-plan.md#6-test-cases) | E2E | Network error and safe retry | ✅ |
| [TC-E2E-16](../../05-testing/test-plan.md#6-test-cases) | E2E | Insufficient funds | ✅ |
| [TC-E2E-17](../../05-testing/test-plan.md#6-test-cases) | E2E | Timeout sub-cases | ✅ |
| [TC-E2E-18](../../05-testing/test-plan.md#6-test-cases) | E2E | Unknown error | ✅ |
| [TC-E2E-19](../../05-testing/test-plan.md#6-test-cases) | E2E | Receipt navigation | ✅ |
| [TC-E2E-20](../../05-testing/test-plan.md#6-test-cases) | E2E | No double submission | ✅ |
| [TC-E2E-21](../../05-testing/test-plan.md#6-test-cases) | E2E | Accessibility scan | ✅ |
| [TC-E2E-22](../../05-testing/test-plan.md#6-test-cases) | E2E | Theme | ✅ |
| [TC-E2E-23](../../05-testing/test-plan.md#6-test-cases) | E2E | Reference code correlation | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [ ] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [ ] Business logic lives in the domain/application layers, not in the UI.
- [ ] Loading / empty / error states implemented as the FS specifies.
- [ ] Errors mapped to domain codes; nothing swallowed silently.
- [ ] Log events per TS-05, with correlation ID and no sensitive data.
- [ ] Keyboard and assistive-technology accessible; responsive behavior checked.
- [ ] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | TC-E2E-13 and TC-E2E-14 written during TASK-16 (`tests/e2e/transfer.spec.ts`) as the real-browser check of the amount and summary steps. Login/logout helpers shared in `tests/e2e/session.ts`. |
| 2026-10-14 | TC-E2E-15…18 and TC-E2E-20 written during TASK-18 (`tests/e2e/confirmation.spec.ts`). TC-E2E-16 drains the balance with a second request while the summary is open, so insufficient funds is real, not forced. |
| 2026-10-14 | TC-E2E-11 (`transfer.spec.ts`) and TC-E2E-19 (`confirmation.spec.ts`) written during TASK-19. |
| 2026-10-14 | Added TC-E2E-12 (new-contact variants), TC-E2E-21 (`a11y.spec.ts`: axe on every screen and outcome view, titles, heading focus), TC-E2E-22 (`theme.spec.ts`: first paint with JavaScript off, persistence), TC-E2E-23 (reference code = response `x-request-id` prefix) and a CSRF smoke (cross-site POST → 403). |
| 2026-10-14 | Full suite green on the owner's Mac (all specs, 4 projects) after the fixes below. Still to do for the acceptance criterion: `npx playwright test --repeat-each=10`. |
| 2026-10-14 | First run found two real bugs. (1) Pressing "Continuar" while a field with a blur error is focused: mouse down blurs the field, its error renders, the layout shifts and the release lands off the button, so the form is not submitted. Fix: `Button type="submit"` prevents default on mouse down (no focus change); the submit handler still validates and focuses the first invalid field. (2) A contact saved during the flow was missing from favorites when returning to step 1 (server data loaded once per flow). Fix: `TransferDataProvider` keeps favorites as state and `rememberFavorite` adds it in the shared order (`compareByRecentUse`, now in `src/core/contact.ts` for server and client). Also: the not-found receipt's tab title now comes from `generateMetadata` (one cached read with the page), and the a11y test's code step uses another account (two code requests for Ana hit the resend cooldown). Regression tests: Button mouse down, recipient step favorites (fails without the fix), ordering. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| — | — | — | — |

**Decisions made by me, not by the AI:** —

## 9. Technical debt / follow-ups

- —
