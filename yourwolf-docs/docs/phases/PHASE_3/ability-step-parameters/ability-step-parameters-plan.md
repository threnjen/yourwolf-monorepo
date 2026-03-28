# Plan: Ability Step Parameter Inputs

**Issue:** 004 — Ability Steps Missing Target/Parameter Selectors  
**Area:** Frontend — Role Builder, AbilitiesStep  
**Date:** 2026-03-28

---

## Requirements & Traceability

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC1 | Each step row renders inline parameter inputs when its ability's `parameters_schema.properties` is non-empty |
| AC2 | `string` + `enum` → `<select>` populated with the enum values (covers `direction`, `team`) |
| AC3 | `string` without `enum` → `<select>` populated from a shared `STRING_TARGET_OPTIONS` constant |
| AC4 | `integer` → `<input type="number">` always shown, initialized to schema `default` if present, otherwise `1` |
| AC5 | `array`-of-integer → comma-separated `<input type="text">` |
| AC6 | Parameter values stored in `step.parameters` and propagated to parent via `onChange` |
| AC7 | Abilities with empty `properties` (e.g., `stop`, `copy_role`) render no additional inputs |
| AC8 | Required params labelled with `*`; optional params labelled with `(optional)` |

### Non-Goals

- Validating that required params are filled before saving a draft (belongs in the Review step)
- Dynamically populating dropdowns with live role or player names
- Supporting JSON Schema features beyond: `type`, `enum`, `items`, `required`, `default`
- Any backend changes

### Traceability Matrix

| AC | Code Area | Planned Tests |
|----|-----------|---------------|
| AC1 | `AbilitiesStep` step list render block | `test_renders_parameter_inputs_when_schema_has_properties` |
| AC2 | `StepParameterInputs` — enum branch | `test_enum_string_renders_select_with_enum_options` |
| AC3 | `StepParameterInputs` — free-string branch | `test_free_string_renders_select_with_target_options` |
| AC4 | `StepParameterInputs` — integer branch | `test_integer_renders_number_input_with_default_1` |
| AC5 | `StepParameterInputs` — array branch | `test_array_renders_comma_separated_input` |
| AC6 | `handleParameterChange` + `onChange` | `test_changing_param_calls_onChange_with_updated_parameters` |
| AC7 | `StepParameterInputs` — empty props guard | `test_no_inputs_rendered_for_empty_schema` |
| AC8 | Required/optional label markup | `test_required_param_has_asterisk_label` |

---

## Correctness & Edge Cases

### Key Workflows

1. User adds an ability step → `handleAddAbility` fires → new step created with `parameters: {}` **plus** integer-type params initialized to their default (or `1`)
2. Step row renders → looks up ability by `step.ability_type` from `abilities` array → passes `ability.parameters_schema` to `StepParameterInputs`
3. User changes a param input → `handleParameterChange(stepIndex, paramKey, value)` → updates `draft.ability_steps[stepIndex].parameters` immutably → calls `onChange`

### Failure Modes

| Scenario | Handling |
|----------|----------|
| Ability not found in loaded abilities list (race condition / mismatch) | `StepParameterInputs` receives `undefined` schema → render nothing |
| `parameters_schema` has no `properties` key | Guard: treat as empty, render nothing |
| `parameters_schema.properties` is empty object `{}` | Guard: render nothing (AC7) |
| Integer input cleared by user | Store as `1` (min constraint) |
| Array input contains non-numeric tokens | Parse: filter out non-integer tokens, store valid ones only |

### Initialization Rule

When `handleAddAbility` creates a new step, pre-populate `parameters` with defaults for **integer** fields only:
- If schema property has `"default"`: use that value
- Otherwise: use `1`

String and array fields start empty (blank select = first option selected by default).

---

## Consistency & Architecture Fit

### Existing Patterns to Follow

- Inline style objects defined as `const xStyles: React.CSSProperties` at module scope — follow this for any new style blocks
- `selectStyles` from `../../../styles/shared` already used for the modifier dropdown — reuse for enum/string `<select>` param inputs
- Handler functions as plain `function` declarations inside the component (not arrow functions) — match existing `handleAddAbility`, `handleRemoveStep` style
- No external form libraries used anywhere in the codebase

### Predefined `STRING_TARGET_OPTIONS`

Define as a module-scope constant in `AbilitiesStep.tsx`. Values sourced from actual seed role data:

```
player.self
player.other
center.main
center.bonus
previous
viewed
team.werewolf
team.vampire
team.alien
team.village
role.mason
players.actions
```

### Component Structure

`StepParameterInputs` is a **private sub-component** declared in the same file as `AbilitiesStep`. It is not exported. If this component grows substantially in a future phase, it can be extracted to its own file then.

**Props interface:**
```
interface StepParameterInputsProps {
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}
```

### Schema Shape (JSON Schema subset to support)

```
{
  type: "object",
  properties: {
    [paramKey]: {
      type: "string" | "integer" | "array",
      enum?: string[],          // present for string enums
      items?: { type: string }, // present for array type
      default?: unknown,
      description?: string
    }
  },
  required?: string[]
}
```

---

## Clean Design & Maintainability

### Simplest Design That Meets Requirements

- One switch/if-else on `prop.type` inside `StepParameterInputs` to choose the input element
- No abstraction layers, no context, no form state management
- The predefined options array is a plain `string[]` constant — no external config

### Complexity Risks

- `parameters_schema` is typed as `Record<string, unknown>` in the `Ability` type. The sub-component will need narrow type assertions when reading schema properties. Keep casting local to `StepParameterInputs` so the rest of the component stays clean.
- Array input (comma-separated text) introduces a parse step. Keep the parse in `handleParameterChange` at the `AbilitiesStep` level, not inside `StepParameterInputs`.

### Keep-It-Clean Checklist

- [ ] No new dependencies added
- [ ] `StepParameterInputs` is not exported
- [ ] `STRING_TARGET_OPTIONS` is defined once at module scope, not inline
- [ ] Integer min is enforced in `handleParameterChange`, not in the input's `min` attribute alone
- [ ] No inline `style={{}}` objects — all styles use named constants

---

## Test Plan

### Test Coverage Assessment

`AbilitiesStep.test.tsx` already exists with 10+ passing test cases and full mock infrastructure (`createMockAbility`, `createMockDraft`, `vi.mock` for `useAbilities`). No new test infrastructure setup required.

### Test Case Mapping

All new tests go into `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` in a new `describe('parameter inputs', ...)` block.

### Top 5 High-Value Test Cases

**TC1 — String enum renders select (AC2)**  
Given: a step with `change_to_team` (schema has `team` with enum `[village, werewolf, vampire, alien, neutral]`)  
When: the step list renders  
Then: a `<select>` appears containing exactly those 5 options

**TC2 — Free string renders predefined select (AC3)**  
Given: a step with `view_card` (schema has `target` as plain string)  
When: the step list renders  
Then: a `<select>` appears containing `player.self`, `player.other`, `center.main`, etc.

**TC3 — Integer with default renders correctly (AC4)**  
Given: a step with `view_card` (schema has `count` integer with `default: 1`)  
When: the step list renders  
Then: a `<input type="number">` appears with value `1`

**TC4 — Param change propagates to draft (AC6)**  
Given: a step with `change_to_team` rendered  
When: user selects `werewolf` from the `team` dropdown  
Then: `onChange` is called with `ability_steps[0].parameters = { team: "werewolf" }`

**TC5 — Empty schema renders no inputs (AC7)**  
Given: a step with `stop` (schema has empty `properties: {}`)  
When: the step list renders  
Then: no `<select>` or `<input>` elements appear within that step's parameter area

### Mock / Fixture Updates Required

- `createMockAbility` in `mocks.ts` — `parameters_schema` currently defaults to `{}`. Existing tests pass empty schema, so **no change needed** to the default. New tests will pass explicit schemas via `overrides`.
- Example schemas to use in new tests:
  - `view_card` schema (string `target` + integer `count` with default 1)
  - `change_to_team` schema (string `team` with enum)
  - `stop` schema (empty properties)

---

## Stages

### Stage 1: `StepParameterInputs` Sub-Component

**Goal:** Implement the private `StepParameterInputs` component with all four input type branches and the empty-schema guard.

**Files touched:**
- `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`

**Success Criteria:**
- Renders a `<select>` for string+enum params with enum values as options
- Renders a `<select>` for plain-string params with `STRING_TARGET_OPTIONS` as options
- Renders a `<input type="number">` for integer params
- Renders a `<input type="text">` for array-of-integer params
- Renders nothing when `properties` is empty or absent
- Required params have a `*` suffix label; optional params have an `(optional)` suffix

**Status:** Not Started

---

### Stage 2: Wire `StepParameterInputs` into `AbilitiesStep`

**Goal:** Connect the sub-component into the step list, implement `handleParameterChange`, and initialize integer defaults on step add.

**Files touched:**
- `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`

**Changes:**
1. `handleAddAbility` — after creating the step, compute initial `parameters` by scanning the schema for integer fields and setting them to `default ?? 1`
2. New `handleParameterChange(stepIndex: number, paramKey: string, value: unknown)` — updates the step's `parameters` immutably and calls `onChange`
3. Each step row renders `<StepParameterInputs schema={...} values={step.parameters} onChange={(key, val) => handleParameterChange(index, key, val)} />` beneath the existing controls

**Success Criteria:**
- Adding a `view_card` step produces `parameters: { count: 1 }` (integer default pre-populated, string `target` left empty)
- Changing a param select fires `onChange` with the correct updated `parameters` object
- Removing a step or reordering does not corrupt other steps' parameters

**Status:** Not Started

---

### Stage 3: Test Updates

**Goal:** Add AC1–AC8 coverage to `AbilitiesStep.test.tsx`.

**Files touched:**
- `yourwolf-frontend/src/test/AbilitiesStep.test.tsx`

**Changes:**
- Add `describe('parameter inputs', () => { ... })` block with at minimum one test per AC
- Use explicit `parameters_schema` overrides in `createMockAbility` calls — no changes to the `createMockAbility` default

**Success Criteria:**
- All 8 ACs have at least one failing test before Stage 1–2 implementation, and all pass after
- All previously passing tests continue to pass

**Status:** Not Started
