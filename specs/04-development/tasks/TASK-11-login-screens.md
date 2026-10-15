# TASK-11 — Build the login screens

| Field | Value |
|---|---|
| **ID** | TASK-11 |
| **Status** | Done |
| **Milestone** | M1 — Security core + Login |
| **Covers** | FR-AUTH-01…05, 07, 11…16 · UIR-AUTH-01…17 · AC-AUTH-01…12, 15…18 |
| **Specs** | FS-01, TS-01 §6 |
| **Depends on** | [TASK-04](./TASK-04-base-ui-components.md), [TASK-10](./TASK-10-auth-api.md) |
| **Estimate** | 2 h |
| **Actual time** | ~2.5 h |
| **Branch / change request** | `feat/m1-security-login` · commits `… [TASK-11]` |

---

## 1. Goal

The two-step login of FS-01 with every UI rule, state and message.

## 2. Scope

**In scope:** `useLoginFlow` reducer, `useCountdown`, `IdentifierStep`, `CodeStep`, `OneTimeCodeField`, `ResendCountdown`, `SessionNotice`, demo hint, logout button component, copy keys.
**Out of scope:** —

## 3. Solution design

Follow the referenced specs; if the implementation needs to deviate, update the TS (or write an ADR) first.

**Files / modules to create or modify**

| Path | Change |
|---|---|
| `src/app/(public)/login/page.tsx` | Server shell: reads `reason` and `returnTo`, renders `LoginView` in a card |
| `src/features/auth/{api,login-state,use-login-flow,use-countdown}.ts` | Typed API client, pure reducer, flow hook (single-flight, retry), countdown |
| `src/features/auth/{login-view,identifier-step,code-step,one-time-code-field,resend-countdown,session-notice,step-error,logout-button}.tsx` | Screens and parts |
| `src/components/ui/notice.tsx` | New base component (info/success/warning) |
| `src/app/(private)/page.tsx` | Temporary Home gets the logout button |
| `src/components/bfcache-guard.tsx` | Reloads pages restored from the back/forward cache (Login and private layout) |
| `src/lib/i18n/messages.es-MX.ts` | Auth keys |
| `tests/e2e/auth.spec.ts` | TC-E2E-01…06 + change identifier + service error (owned by TASK-20, written now to verify in a real browser) |

## 4. Acceptance criteria

- [x] All FS-01 acceptance criteria pass.
- [x] Every UIR-AUTH has a named test.
- [x] Definition of Done in [specs README §5](../../README.md#5-quality-gates) met.

## 5. Required tests

| TC | Level | What it verifies | Status |
|---|---|---|---|
| [TC-PL-01](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useLoginFlow | ✅ |
| [TC-PL-02](../../05-testing/test-plan.md#6-test-cases) | Presentation logic | useCountdown | ✅ |
| [TC-COMP-03](../../05-testing/test-plan.md#6-test-cases) | Component | IdentifierStep | ✅ |
| [TC-COMP-04](../../05-testing/test-plan.md#6-test-cases) | Component | CodeStep and OneTimeCodeField | ✅ |
| [TC-COMP-05](../../05-testing/test-plan.md#6-test-cases) | Component | SessionNotice | ✅ |

Defined in the [test plan](../../05-testing/test-plan.md); a task is done when these pass.

## 6. Quality checklist

- [x] Contracts and types are explicit; no escape hatches that bypass type safety (see TS-00 coding standards).
- [x] Business logic lives in the domain/application layers, not in the UI.
- [x] Loading / empty / error states implemented as the FS specifies.
- [x] Errors mapped to domain codes; nothing swallowed silently.
- [x] Log events per TS-05, with correlation ID and no sensitive data.
- [x] Keyboard and assistive-technology accessible; responsive behavior checked.
- [x] Static analysis and all tests pass.

## 7. Dev log

| Date | Note |
|---|---|
| 2026-10-14 | Pure `loginReducer` + `useLoginFlow` hook (requests, outcome mapping, single-flight by ref so two quick presses send one request, retry of the last failed request). Client validation (BR-10/11 via `src/core`) stays in the step components; the server stays the authority. |
| 2026-10-14 | Code step remounts per new code (`key=codeVersion`): clears the field and focuses it without setState-in-effect. Countdown derives from the server's `resendAvailableInSec`; announced once at zero, never per second. |
| 2026-10-14 | `?step=code` mirrored in the URL with `history.pushState`; Back returns to step 1 with the value focused. Found that the URL reaches `useSearchParams` one render later than the step change, which would have bounced the user straight back; Back is recognised only after the URL has shown the code step. Reload on `?step=code` drops the param. |
| 2026-10-14 | EC-08 refinement: Continue within the cooldown (e.g. after a reload) goes to the code step with "Ya te enviamos un código…" instead of a dead-end error (FS-01 1.4). |
| 2026-10-14 | `OneTimeCodeField` has no `maxLength` on purpose: it would truncate a pasted "123 456" before normalizing. |
| 2026-10-14 | Lint (React Compiler rules) rejected setState in effects and ref writes during render; reworked `useCountdown` (state adjusted during render on target change) and the flow hook (identifier ref written in the handler). |
| 2026-10-14 | 411 tests pass (48 files); lint, typecheck, format, build ✅. Static render checked in light and dark. Real-browser verification: `tests/e2e/auth.spec.ts` on the owner's machine. |
| 2026-10-14 | First E2E run (owner): 32/40 green; TC-E2E-01 and TC-E2E-06 failed in all 4 projects. (1) After login, Back showed the Login form: `router.replace` kept the `/login` entry in Next's client router cache, which restores it without a server request, so the proxy never redirected. Fix: full navigation with `location.replace` after login, plus `BfcacheGuard` (reload on `pageshow.persisted`) on Login and private pages so a back/forward-cache restore also goes through the proxy. (2) The test expected `reason=session_ended` after logout, but logout clears the cookie, so the visitor correctly gets plain `/login`: test fixed. |

## 8. AI usage

| Tool | Used for | Accepted as-is | Corrected or rejected (and why) |
|---|---|---|---|
| Claude | Login state machine, hooks, screens, tests, E2E spec | Structure and copy | Caught the URL/step race on Back; replaced a dead-end throttle error with the "code already sent" path; removed `maxLength` from the code field |

**Decisions made by me, not by the AI:** Two-step login with identifier + code (OQ-02); random demo code shown outside production.

## 9. Technical debt / follow-ups

- The demo hint is hidden on the "code already sent" path (the code isn't returned on a throttled request).
- Login card has no brand illustration; visual polish in TASK-21.
