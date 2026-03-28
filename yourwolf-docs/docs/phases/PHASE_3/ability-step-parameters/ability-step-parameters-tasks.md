# Tasks: Ability Step Parameter Inputs

**Issue:** 004 — Ability Steps Missing Target/Parameter Selectors  
**Date:** 2026-03-28

---

## Stage 1: `StepParameterInputs` Sub-Component

**File:** `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`

- [ ] Define `STRING_TARGET_OPTIONS: string[]` constant at module scope with the 12 predefined target values
- [ ] Define `StepParameterInputsProps` interface (private, not exported): `schema`, `values`, `onChange`
- [ ] Implement `StepParameterInputs` function component (private, not exported)
  - [ ] Guard: if `schema.properties` is absent or empty, return `null`
  - [ ] Iterate over `Object.entries(schema.properties)`
  - [ ] For each property, determine if it is in `schema.required` (default: not required)
  - [ ] Render label with param key + `*` if required, `(optional)` if not
  - [ ] Branch on `prop.type`:
    - [ ] `string` + `prop.enum` present → `<select>` with enum values as `<option>`s
    - [ ] `string` without `enum` → `<select>` with `STRING_TARGET_OPTIONS` as `<option>`s
    - [ ] `integer` → `<input type="number">` with current value or `prop.default ?? 1`
    - [ ] `array` → `<input type="text">` (comma-separated) with current value joined or empty
  - [ ] All `<select>` inputs use `selectStyles` from `../../../styles/shared`
  - [ ] All style objects defined as named `const` — no inline `style={{}}`

---

## Stage 2: Wire into `AbilitiesStep`

**File:** `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx`

- [ ] Update `handleAddAbility`:
  - [ ] After building `newStep`, look up the ability's `parameters_schema` from `abilities`
  - [ ] Scan `properties` for `integer` fields; pre-populate `parameters` with `default ?? 1`
  - [ ] Leave string and array fields absent from initial `parameters` (empty map)
- [ ] Add `handleParameterChange(stepIndex: number, paramKey: string, value: unknown)`:
  - [ ] For `integer` type: parse and clamp to minimum `1` if empty/NaN
  - [ ] For `array` type (comma-separated text): parse to `number[]`, filtering non-integers
  - [ ] For string types: store value as-is
  - [ ] Update `draft.ability_steps[stepIndex].parameters` immutably via spread
  - [ ] Call `onChange` with updated draft
- [ ] In the step list render, after the existing controls row, add:
  - [ ] `<StepParameterInputs>` receiving `schema` (looked up by `step.ability_type`), `values={step.parameters}`, and `onChange` wired to `handleParameterChange(index, ...)`
  - [ ] Wrap in a container `<div>` with consistent padding/spacing using `theme.spacing`

---

## Stage 3: Test Updates

**File:** `yourwolf-frontend/src/test/AbilitiesStep.test.tsx`

- [ ] Add reusable schema fixtures at the top of the file (not in `mocks.ts`):
  - [ ] `viewCardSchema` — `target` (string, required) + `count` (integer, default 1, optional)
  - [ ] `changeToTeamSchema` — `team` (string, enum, required)
  - [ ] `rotateAllSchema` — `direction` (string, enum, required) + `count` (integer, default 1, optional)
  - [ ] `stopSchema` — empty properties
  - [ ] `randomNumPlayersSchema` — `options` (array of integer, required)
- [ ] Add `describe('parameter inputs', () => { ... })` block
- [ ] AC1 — `test_renders_parameter_inputs_when_schema_has_properties`: step with `view_card` schema renders at least one input element
- [ ] AC2 — `test_enum_string_renders_select_with_enum_options`: `change_to_team` step renders a select with `village`, `werewolf`, etc. as options
- [ ] AC3 — `test_free_string_renders_select_with_target_options`: `view_card` step renders a select for `target` containing `player.self`, `player.other`, `center.main`
- [ ] AC4 — `test_integer_renders_number_input_with_default_1`: `view_card` step renders a number input for `count` with value `1`
- [ ] AC5 — `test_array_renders_comma_separated_input`: `random_num_players` step renders a text input for `options`
- [ ] AC6 — `test_changing_param_calls_onChange_with_updated_parameters`: selecting `werewolf` in `change_to_team` team dropdown fires `onChange` with `parameters: { team: 'werewolf' }`
- [ ] AC7 — `test_no_inputs_rendered_for_empty_schema`: step with `stop` schema renders no select or input in the parameter area
- [ ] AC8 — `test_required_param_has_asterisk_label`: required param label includes `*`; optional param label includes `(optional)`
- [ ] Verify all previously passing tests still pass (no regressions)
- [ ] Update mock abilities in existing tests if needed to explicitly set `parameters_schema: {}` (confirm existing behavior is unchanged)
