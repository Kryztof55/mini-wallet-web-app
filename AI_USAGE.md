# AI usage

I used AI heavily in this challenge, and deliberately: as a pair that drafts, implements
and checks, while I set the direction, review, run the tests on my machine and make the
decisions. This note answers the three questions in the challenge. The detail per task is
in the "AI usage" section of every [task card](./specs/04-development/tasks/), and every
spec's change history says whether a change came from me ("Project owner") or was
AI-assisted.

## 1. Tools and where I used them

| Tool                                                                                                     | Used for         |
| -------------------------------------------------------------------------------------------------------- | ---------------- |
| **Claude** (Anthropic; Claude Opus model, agentic mode with access to the project folder and a terminal) | Everything below |

| Phase                  | What the AI did                                                                                                                                                                         | What I did                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Analysis and specs** | Drafted the requirements analysis, the open questions with recommendations, the four functional specs, the technical specs, the ADRs, the plan and the test plan from the challenge PDF | Answered every open question, reviewed and approved each document before any code (the specs only move to "Approved" with my sign-off), asked for changes (e.g. no dates or daily checkpoints in the plan) |
| **Implementation**     | Wrote the code and its tests task by task, following the approved specs; logged deviations in each task card                                                                            | Reviewed the result of each task, decided when to commit, and asked for changes in structure and behavior                                                                                                  |
| **Testing**            | Wrote unit, component, integration and E2E tests; ran the static checks and the unit/integration suites; ran a scripted accessibility pass in a headless browser                        | Installed dependencies myself and ran the E2E suite on my own machine (4 browser projects), reported the failures back with their output                                                                   |
| **Debugging**          | Diagnosed failures from my reports (races, flaky tests, hydration and layout issues) and fixed them                                                                                     | Reproduced issues in the browser, decided which fixes were acceptable                                                                                                                                      |
| **Docs**               | Drafted README, DECISIONS and this file from the specs and task cards                                                                                                                   | Reviewed and corrected them; declared the time spent                                                                                                                                                       |

## 2. What I accepted, corrected or rejected

**Accepted largely as proposed** (after review):

- **Domain and services:** the domain model (money in integer cents, branded IDs, `Result`
  types, a closed error catalog) and the service/repository split with in-memory adapters.
- **Confirmation design:** idempotency keys, an attempt-status endpoint, a "verifying"
  state after a client timeout, and safe retry.
- **Tooling:** Vitest + Testing Library + Playwright + axe; Zod at the boundaries;
  Context + `useReducer` for the transfer draft.
- **Platform:** design tokens with light/dark themes; Radix only for dialog, toast and
  radio group.

**Corrected or redirected by me:**

- **Folder structure.** After several tasks I found the structure hard to follow: it was
  unclear what belonged in `components`, `lib` and the domain folder, and component
  exports went through central files. I asked for one folder per component with its test
  and `index.ts`, kept the names `core` and `features`, asked for `core` to be grouped by
  concept, and for a `src/styles` folder. The AI wrote ADR-010, moved the code and added
  ESLint rules that enforce the import direction. Tests stayed green.
- **Names.** `src/domain` → `src/core`, then `components/domain` → `components/wallet`, to
  avoid confusing folder names.
- **Demo one-time code.** The first spec used a fixed `123456`. I asked for a random code
  per request, shown only outside production, so the "wrong code" and "expired code" cases
  stay real.
- **Unknown phone or email.** The spec showed a decoy code that could never work (to avoid
  revealing which accounts exist). Testing it myself, I found it confusing. I decided that
  outside production no code is shown for an unknown account, and that demo accounts are
  documented in the README instead of on the login screen. Production keeps the secure
  behavior.
- **Dependencies.** I install packages from my own terminal, chose `@latest` versions
  instead of pinned ones, and kept TypeScript 6. An `npm audit fix --force` suggestion from
  npm was not applied; the matching version was pinned instead (TASK-01).

**Rejected:**

- **Hiding a browser-extension warning.** A browser extension added an attribute to
  `<body>` and React warned about a hydration mismatch. The AI added
  `suppressHydrationWarning` to `<body>`; I removed it before committing. The mismatch
  came from the extension, not from the app.
- **Committing on the AI's initiative.** Commits happen only when I ask, with me as author.
  Pushing to GitHub is done from my machine.

**Corrected by the tests and the review process** (the AI's first versions were wrong; the
fix is logged in each task card):

- **Cancel race:** cancelling the transfer raced with the step guard. Found by E2E.
- **Lost submit:** a blur error shifted the layout and swallowed the click on "Continuar".
  Found by E2E on my machine.
- **Screen-reader text:** the masked number of a favorite was read as "bullet bullet…"
  instead of "celular terminación 5432".
- **Fake-timer tests:** timeout tests with fake timers first hung, then passed for the
  wrong reason.
- **Spec deviation:** a design in TS-04 ("reset the draft on success") would have raced the
  step guard. It was changed and documented as a deviation.
- **Production check:** client-module boundary errors were found by rendering the
  production build, not by unit tests.
- **Accessibility pass:** 8 reflow and screen-reader issues found in the TASK-21 pass were
  fixed.

## 3. Decisions I made, not the AI

**Product and scope**

- **Language:** UI copy in Spanish (es-MX); code and docs in English.
- **Login:** two steps, phone or email first, then a one-time code.
- **Unknown accounts:** the login continues to the code step for an unknown phone or email
  (no account enumeration). Later, outside production only, no code is shown for them.
- **Transfer flow:**
  - **Steps:** recipient → amount → summary.
  - **Concept:** an optional concept field is included.
  - **Saving contacts:** optional and checked by default.
  - **Self-transfer:** blocked.
- **Home:** hide/show balance included.
- **Theme:** dark mode required, following the OS by default with a manual switch.
- **Not included** (left for "more time"): search in favorites; share or download of the
  receipt (copying the folio is supported).
- **Timeout UX:** after a timeout, verify the transfer's status automatically before
  offering a safe retry.

**Architecture and security**

- **Route protection:** a proxy as the first barrier, with the server as the authority
  (ADR-001).
- **Session and CSRF:** a server-side session with a signed cookie and five CSRF layers
  (ADR-004).
- **Folder structure:** ADR-010 and its later refinements (`core` grouped by concept,
  `src/styles`).

**Process**

- **Specs before code:** each spec approved before implementation, and one branch per
  milestone.
- **Commits and push:** commits only on my request; push from my machine.
- **E2E:** run on my machine as the gate before each commit that touches a flow.

---

The AI is a tool; I own the result. I can explain and change any part of this code in
the next stage.
