# ADR-003 — Manage client state with React Context + useReducer, scoped to where it is used

| Field | Value |
|---|---|
| **ID** | ADR-003 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, TS-03, TS-04 |
| **Driven by** | CON-04 (state management choice justified) · NFR-03, NFR-12 · UX-06 · UIR-TX-19, UIR-TX-21 |

---

## 1. Context

Most data in this app is **server state** (balance, activity, favorites, receipts) and is read on the server (ADR-002). What remains on the client is small: the transfer draft shared by three steps, the theme selection, and local form state. The challenge asks to choose and justify a state approach (Context, Zustand, Redux…).

## 2. Decision drivers

1. Fit the actual amount of client state (small, low-frequency updates).
2. Type safety and testability of state transitions (NFR-03).
3. No dependency without a current need (NFR-12).
4. State lifecycle tied to the flow: the draft must survive navigation between steps and disappear on exit (UIR-TX-19, UIR-TX-21).

## 3. Options considered

### Option A — Redux Toolkit
- ✅ Mature devtools, predictable.
- ❌ Global store and boilerplate disproportionate to one draft and one preference.

### Option B — Zustand
- ✅ Tiny API, selective subscriptions.
- ❌ A dependency for state that is small and short-lived; global by default, so lifecycle scoping is manual.

### Option C — React Context + useReducer
- ✅ Native; zero dependencies.
- ✅ Reducer = pure function with typed actions → unit-testable, explicit transitions.
- ✅ Provider placed in the transfer layout → state lives exactly as long as the flow.
- ❌ Every consumer re-renders on change; acceptable at this size and mitigated by splitting state and dispatch contexts.

### Option D — Server-state cache library (e.g. TanStack Query)
- ✅ Excellent for client-fetched server data.
- ❌ Server data is read on the server here; only a few client fetches (retries, status checks) exist.

| Driver | A | B | C | D |
|---|---|---|---|---|
| Fits small client state | ● | ●●● | ●●● | ● |
| Typed, testable transitions | ●●● | ●● | ●●● | ●● |
| No extra dependency | ● | ● | ●●● | ● |
| Lifecycle scoped to flow | ● | ●● | ●●● | ● |

## 4. Decision

**We choose Option C: React Context + `useReducer`, with providers scoped to the subtree that needs them.**

## 5. Rationale

| State | Where it lives | Lifecycle |
|---|---|---|
| Session | Server (cookie + session store, ADR-004) | Until logout |
| Server data (balance, activity, favorites, receipt) | Server Components; client fetch only for retries/status checks | Per request |
| **Transfer draft** (recipient, amount, concept, attempt key) | `TransferDraftContext` + reducer, provider in the `/transfer` layout | Created on entering the flow; cleared on success or cancel; gone when leaving the layout |
| **Theme preference** | `ThemeContext` in the root layout, seeded from the cookie (ADR-007) | Persistent via cookie |
| Hide-balance preference | Small context or hook backed by device storage (UIR-HOME-05) | Persistent per device |
| Form fields, field errors | Local component state | Per view |
| Current step | URL (`/transfer/amount`) | Shareable, survives reload; guarded (UIR-TX-14) |

Implementation rules:
- Actions are a discriminated union (`{ type: 'recipientSelected', recipient } | { type: 'amountSet', … } | …`); the reducer handles them exhaustively.
- State and dispatch are provided through **separate contexts**, so components that only dispatch don't re-render.
- The attempt key for idempotency (BR-07) is created when the summary is reached with a given recipient/amount/concept and regenerated when any of them changes — a reducer rule, unit-tested.
- Security note: Context and Zustand hold state in browser memory alike; neither is a security boundary. The choice is about fit and zero dependencies. No sensitive data (session token, codes) is ever kept in client state.

## 6. Consequences

**Positive**
- No state library; transitions are pure and testable.
- Draft lifecycle matches the flow with no manual cleanup across the app.

**Negative / accepted costs**
- A full reload on a later step loses the in-memory draft; the step guard sends the user to the first incomplete step (UIR-TX-14, FS-03 EC-09).

**Neutral / to watch**
- If client-fetched server data grows (polling, infinite lists), revisit Option D.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Client store (flow draft) | React Context + `useReducer` (`TransferDraftProvider` in `/transfer` layout) |
| Client store (preferences) | React Context (`ThemeProvider` in root layout) |
| Navigation state | URL path segments |

## 8. In production or with more time

- Persist the draft in session storage to survive reloads.
- Adopt a server-state cache if client-side data fetching becomes significant.

## 9. How we validate the decision

- Unit tests of the reducer cover every action, including attempt-key regeneration.
- E2E: going back and forth between steps preserves data (AC-TX-12); cancel and success clear it.

## 10. References

- FS-03 §5.2 · FS-04 UIR-CONF-07 · ADR-007
