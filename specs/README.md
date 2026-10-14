# Specs — Mini Wallet Web App

Single source of truth for **what** gets built, **how**, and **why**, before and during development.
Every requirement must be traceable from the challenge document down to the test that verifies it.

```
Challenge (PDF) → 00-context (requirements with IDs)
                → 01-functional (FS: what the system does)
                → 02-technical (TS: how it is built) + adr/ (why it was decided that way)
                → 03-plan (in what order)
                → 04-development (TASK: execution and log)
                → 05-testing (TC: how it is verified)
```

---

## 1. Structure

| Folder | Contents | Template |
|---|---|---|
| `_templates/` | Base templates for each artifact. **Never edited for a specific case**: copy them. | — |
| `00-context/` | Challenge analysis: requirements with IDs, assumptions, ambiguities, glossary. | — |
| `01-functional/` | One functional spec per screen or flow (`FS-NN-name.md`). | `functional-spec.md` |
| `02-technical/` | Overall architecture and one technical spec per module (`TS-NN-name.md`). | `technical-spec.md` |
| `02-technical/adr/` | One record per architecture decision (`ADR-NNN-name.md`). | `adr.md` |
| `03-plan/` | Implementation plan: milestones, tasks, dependencies, time log. | `implementation-plan.md` |
| `04-development/tasks/` | One card per development task, with dev log and AI usage (`TASK-NN-name.md`). | `dev-task.md` |
| `05-testing/` | Strategy, test cases and traceability matrix. | `test-plan.md` |

---

## 2. Conventions

### 2.1 Language
- **All artifacts are written in English**: specs, ADRs, tasks, test plans, code, comments, commit messages, and project docs (`README.md`, `DECISIONS.md`, `AI_USAGE.md`).
- User-facing UI copy is defined per FS in §12 "Copy and messages"; its language is a product decision recorded there.

### 2.2 Technology-agnostic templates
- Templates, FS and TS describe **concepts** (presentation layer, server entry point, client store, persistence adapter), never frameworks or libraries.
- **FS** never mention technology at all.
- **ADRs** are the only artifacts where concrete technologies are evaluated and chosen.
- **TS-00 §Technology bindings** is the single table that maps each concept to the technology chosen by an ADR. Module TS only list deviations.
- Result: changing a technology means a new ADR plus one row in TS-00, not rewriting every spec.

### 2.3 File names
- `PREFIX-NN-kebab-case-name.md` (e.g. `FS-03-new-transaction.md`, `ADR-002-rendering-strategy.md`).

### 2.4 IDs
IDs are **stable**: once assigned they are never reused or renumbered, even if the item is removed (it is marked `Deprecated`).

| Prefix | Meaning | Example | Lives in |
|---|---|---|---|
| `FR-<MOD>-NN` | Functional requirement | `FR-TX-03` | 00-context, FS |
| `BR-NN` | Business rule | `BR-02` (sufficient balance) | 00-context, FS, TS |
| `NFR-NN` | Non-functional requirement | `NFR-04` (traceability) | 00-context, TS |
| `AC-<MOD>-NN` | Acceptance criterion | `AC-AUTH-05` | FS |
| `UIR-<MOD>-NN` | UI rule (presentation-only behavior; see glossary) | `UIR-TX-03` | FS §5.2 |
| `UX-NN` | Usability / experience requirement | `UX-09` (honest outcomes) | 00-context, FS |
| `A11Y-NN` | Accessibility requirement (WCAG 2.2 AA) | `A11Y-07` | 00-context, FS, TS |
| `N-NN` | User need | `N-05` (certainty of outcome) | 00-context |
| `CON-NN` | Technical constraint imposed by the source | `CON-02` | 00-context, ADR |
| `DEL-NN` | Deliverable required by the source | `DEL-03` (`DECISIONS.md`) | 00-context, plan |
| `ASM-NN` | Assumption | `ASM-03` | 00-context, FS |
| `OQ-NN` | Open question | `OQ-02` | 00-context, FS |
| `FS-NN` | Functional spec | `FS-03` | 01-functional |
| `TS-NN` | Technical spec | `TS-05` | 02-technical |
| `ADR-NNN` | Architecture decision record | `ADR-002` | 02-technical/adr |
| `TASK-NN` | Development task | `TASK-07` | 04-development/tasks |
| `TC-<LEVEL>-NN` | Test case (`UNIT`, `PL` presentation logic, `COMP`, `INT`, `E2E`, `MAN` manual) | `TC-E2E-04` | 05-testing |
| `ERR-<CODE>` | Domain error code | `ERR-INSUFFICIENT_FUNDS` | TS |
| `EVT-<domain.event>` | Log / telemetry event | `EVT-tx.confirm.failed` | TS-05 |

**Modules (`<MOD>`):** `AUTH` (login/session) · `HOME` (balance/transactions) · `TX` (new transaction) · `CONF` (confirmation/receipt) · `OBS` (observability) · `CORE` (cross-cutting).

---

## 3. Artifact lifecycle

```
Draft → In review → Approved → Implemented
                            ↘ Superseded by <ID> / Deprecated
```

- **Draft:** being written; may have open questions.
- **In review:** complete, awaiting validation by the owner.
- **Approved:** implementation can start from it. Later changes bump the version and are logged in the change history.
- **Implemented:** the code and the tests covering it are on `main`.
- **ADRs** have their own lifecycle: `Proposed → Accepted → Superseded by ADR-NNN`. An accepted ADR is **never edited**: a new one supersedes it.

**Version:** `MAJOR.MINOR` — bump MINOR for clarifications, MAJOR when behavior or a contract changes.

---

## 4. Traceability rules

1. Every `FR`/`BR`/`UX`/`A11Y` in `00-context` appears in at least one **FS** (or TS-00 when cross-cutting).
2. Every FS links to the **TS** that implements it.
3. Every significant technology or architecture choice (including those the challenge asks to justify) has an **ADR**, and its bindings appear in TS-00.
4. Every `TASK` declares which `FR`/`BR`/`UIR`/`TS` it covers.
5. Every `BR`, every `UIR` and every critical acceptance criterion has at least one **TC**. BRs are tested at domain and server level; UIRs at component or presentation-logic level.
6. Every rule is classified with the glossary's *rule classification test*: server-enforced (`BR`) or presentation-only (`UIR`).
7. The matrix in `05-testing/` is the consolidated view: **no requirement without a test**.

Links are relative (`[FS-03](../01-functional/FS-03-new-transaction.md)`) so they work on GitHub.

---

## 5. Quality gates

**Definition of Ready (a spec can move to `Approved` when):**
- [ ] All mandatory sections are complete (or marked `N/A` with a reason).
- [ ] No blocking `OQ` remains open.
- [ ] Acceptance criteria are verifiable (Given/When/Then).
- [ ] Upstream (origin) and downstream (TS/TASK/TC) traceability is declared.

**Definition of Done (a task moves to `Implemented` when):**
- [ ] Acceptance criteria are met.
- [ ] Static analysis passes with no errors, per the coding standards in TS-00.
- [ ] Required tests are written and green.
- [ ] Errors and states (loading/empty/error) are handled as the FS specifies.
- [ ] Log events are emitted per TS-05, with no sensitive data.
- [ ] The task's dev log and AI usage sections are filled in.

---

## 6. Creating a new artifact

1. Copy the template from `_templates/` into the target folder as `PREFIX-NN-kebab-case-name.md`.
2. Assign the next free ID (check the index below).
3. Fill in the header; remove the `<!-- ... -->` guidance comments when done.
4. Add the row to the index in this README.

---

## 7. Mapping to challenge deliverables

| Deliverable | Built from |
|---|---|
| Project `README.md` | TS-00 (technology bindings, how to run), plan (actual time spent), limitations from each TS |
| `DECISIONS.md` | ADR summaries + FS edge-case sections + each ADR's "with more time" section |
| `AI_USAGE.md` | The "AI usage" section of every TASK and of each spec phase |

---

## 8. Artifact index

| ID | Title | Phase | Status | Version |
|---|---|---|---|---|
| — | Templates (`_templates/`) | 0 | Approved | 1.0 |
| — | Requirements analysis (`00-context/requirements-analysis.md`) | 1 | Approved | 1.0 |
| — | User needs & UX analysis (`00-context/user-needs-ux-analysis.md`) | 1 | Approved | 1.0 |
| — | Accessibility requirements (`00-context/accessibility-requirements.md`) | 1 | Approved | 1.0 |
| — | Assumptions & open questions (`00-context/assumptions-and-questions.md`) | 1 | Approved | 1.0 |
| — | Glossary (`00-context/glossary.md`) | 1 | Approved | 1.0 |
| FS-01 | Login | 2 | Approved | 1.2 |
| FS-02 | Home | 2 | Approved | 1.1 |
| FS-03 | New transaction | 2 | Approved | 1.1 |
| FS-04 | Confirmation and receipt | 2 | Approved | 1.1 |
| TS-00 | Overall architecture and technology bindings | 3 | Approved | 1.3 |
| TS-01…04 | Auth & session, Home, Transactions, Confirmation | 3 | Approved | 1.0 |
| TS-05 | Observability and traceability (server and client logging) | 3 | Approved | 1.0 |
| ADR-001…008 | Routing, rendering, state, session & CSRF, testing, logging, theming, UI components | 3 | Accepted | — |
| ADR-009 | Runtime validation at boundaries (Zod) | 3 | Accepted | — |
| — | Implementation plan (`03-plan/implementation-plan.md`) | 4 | Draft | 0.1 |
| TASK-01…22 | Task cards (`04-development/tasks/`) | 4 | Pending | — |
| — | Test plan (`05-testing/test-plan.md`) — 88 TCs, full BR/UIR/AC matrix | 5 | Draft | 0.1 |
