# Issue 005: Ability Step Modifier Dropdown Needs Label/Explanation

**Source:** Phase 3 QA  
**Severity:** Medium  
**Area:** Frontend — Role Builder, AbilitiesStep

## Problem

Each ability step has a dropdown that shows "none" / "and" / "or" / "if", but there is no label or explanation for what this dropdown controls. It is confusing for users who don't understand the step-chaining concept.

## Current Behavior

In `AbilitiesStep.tsx`, the modifier `<select>` is rendered inline in the step item with no label:

```tsx
<select
  style={selectStyles}
  value={step.modifier}
  onChange={(e) => handleModifierChange(index, e.target.value as StepModifier)}
  disabled={index === 0}
>
  {MODIFIERS.map((m) => (
    <option key={m} value={m}>{m}</option>
  ))}
</select>
```

- The first step's dropdown is disabled and shows "none", which is meaningless to the user.
- For subsequent steps, "and" / "or" / "if" have no context.

## Expected Behavior

- Add a visible label like **"Then:"** or **"Connector:"** before the dropdown, or use a prefix like "**then** [and/or/if]".
- For the first step where the modifier is always "none" and the dropdown is disabled, either hide the dropdown entirely or display a "First action" label instead.
- Consider making the option labels more readable: "And then" / "Or instead" / "Only if" rather than bare "and" / "or" / "if".

## Affected Files

- `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`

## Suggested Approach

1. Hide the modifier dropdown for the first step (index === 0), since it's always "none".
2. For subsequent steps, add a small label before the select: e.g., a `<span>` with "Then:" styled as muted text.
3. Optionally update option display text to be more descriptive (the underlying value stays "and"/"or"/"if").
