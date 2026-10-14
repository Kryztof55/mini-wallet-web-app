# ADR-008 — Headless primitives + own domain components + utility CSS on semantic tokens

| Field | Value |
|---|---|
| **ID** | ADR-008 |
| **Status** | Accepted |
| **Date** | 2026-10-14 |
| **Deciders** | Project owner (with Claude, AI-assisted) |
| **Affects** | TS-00, all UI |
| **Driven by** | NFR-11 (reusable components) · NFR-14 (WCAG 2.2 AA) · NFR-16 (tokens) · NFR-12 · UI rules (UIR-*) · Challenge "Composición React" |

---

## 1. Context

The challenge evaluates component composition and reusable components, and imposes no restriction on UI libraries. Our specs require WCAG 2.2 AA, dark mode on semantic tokens, and ~70 UI rules that must live in the presentation layer and be tested. Some widgets (dialog, toast, toggle/select) have complex accessibility behavior that is costly to get right from scratch.

## 2. Decision drivers

1. Show composition: domain components that are ours, readable and modifiable live.
2. Correct accessibility for complex widgets without reinventing them.
3. Styling driven by our tokens and themes (ADR-007), not a kit's theme system.
4. Small bundle and few dependencies (NFR-07, NFR-12).

## 3. Options considered

- **A — Styled component kit (MUI, Chakra, Ant):** ✅ fast to assemble. ❌ Most components come pre-made → little composition to show; theming fights our tokens; larger bundle.
- **B — Everything custom:** ✅ full control. ❌ High risk of subtle a11y bugs in dialogs, toasts, menus; time-consuming.
- **C — Headless primitives (Radix) for complex widgets + own components + utility CSS mapped to tokens:** ✅ a11y-correct behavior for hard widgets; all visible components are ours; styling fully token-driven.
- **D — shadcn/ui:** ✅ similar to C, code copied into the repo. ❌ Brings its own conventions and many components we don't need; less clearly "our" design.

## 4. Decision

**We choose Option C: Radix primitives only where behavior is complex (Dialog, Toast, theme selector), own presentation and domain components for everything else, styled with Tailwind CSS mapped to our CSS-variable tokens.**

## 5. Rationale

### Component layers

| Layer | Examples | Source |
|---|---|---|
| Primitives (behavior) | Dialog, Toast, RadioGroup/DropdownMenu (theme) | Radix, wrapped once |
| Base UI (ours) | `Button`, `TextField`, `Checkbox`, `Card`, `Skeleton`, `ErrorState`, `EmptyState`, `StepIndicator` | Own |
| Domain UI (ours) | `MoneyText`, `MoneyInput`, `MaskedIdentifier`, `TransactionItem`, `ContactItem`, `BalanceCard`, `OutcomeView`, `ReceiptDetails`, `OneTimeCodeField` | Own |
| Screens | Login steps, Home sections, transfer steps, outcome views | Own, composed |

- The accessible patterns in [accessibility requirements §3](../../00-context/accessibility-requirements.md#3-reusable-patterns-to-be-implemented-once-as-shared-components) are implemented once in base/domain components.
- **UI rules (UIR-*) live in these components or in their presentation-logic hooks**, never in services; each component documents the UIRs it implements and has component tests for them.
- Buttons are never disabled for invalid input (UIR-AUTH-03, UIR-TX-13); "busy" is a distinct, exposed state.
- Tailwind's theme maps to CSS variables (`bg-surface`, `text-primary`, `text-status-error`), so dark mode needs no `dark:` variants in components.

## 6. Consequences

**Positive**
- Composition and reuse visible in our own code; complex a11y behavior delegated to battle-tested primitives.
- Styling consistent and theme-safe by construction.

**Negative / accepted costs**
- More components to write than with a kit; mitigated by the small screen count.
- Utility classes in markup; mitigated by small components and token-named utilities.

## 7. Bindings introduced

| Concept | Binding |
|---|---|
| Complex accessible widgets | Radix UI primitives (Dialog, Toast, theme selector) |
| Styling | Tailwind CSS with theme mapped to CSS-variable tokens (ADR-007) |
| Base and domain components | Own components in the UI layer |

## 8. In production or with more time

- Component catalog (e.g. Storybook) with a11y and visual tests per state and theme.
- Publish base components as an internal design-system package.

## 9. How we validate the decision

- Every UIR has a component test; axe-core finds no violations in component and E2E runs.
- No styled-kit dependency in the bundle; client bundle size within the budget set in TS-00.

## 10. References

- Accessibility requirements §3 · ADR-007 · FS-01…FS-04 §5.2
