# QA Skeleton: Ability Step Parameter Inputs

**Date:** 2026-03-28
**Mode:** Pre-Implementation QA Skeleton
**Scope:** `AbilitiesStep.tsx` — `StepParameterInputs` sub-component, `handleParameterChange`, and `handleAddAbility` integer initialization
**Status:** Draft — to be expanded into a Release QA Plan after implementation

## References

- Plan: `ability-step-parameters-plan.md`
- Context: `ability-step-parameters-context.md`
- Tasks: `ability-step-parameters-tasks.md`

---

## Planned Feature Summary

The Role Builder's Abilities step currently creates ability steps with no parameter inputs. This feature adds inline parameter inputs to each step row, rendered according to the ability's `parameters_schema` from the API. Four input types are supported: enum string selects, free-string selects (from a predefined options list), integer number inputs, and array-of-integer text inputs. Abilities with no parameters render no additional inputs.

---

## Anticipated Manual QA Areas

### Input Rendering by Schema Type

**Acceptance Criteria:** AC1, AC2, AC3, AC4, AC5, AC7
**Why manual QA:** Visual rendering of dynamically-driven inputs from API schema cannot be fully verified through unit tests alone; confirms correct schema-to-input-type mapping end-to-end with real API data.

- [ ] **Enum string select renders for `change_to_team`** — Add a `change_to_team` ability step to a role draft. **Expected:** A `<select>` dropdown appears for `team` containing exactly the options: `village`, `werewolf`, `vampire`, `alien`, `neutral`

- [ ] **Enum string select renders for `rotate_all` direction** — Add a `rotate_all` ability step. **Expected:** A `<select>` dropdown appears for `direction` containing exactly the options: `left`, `right`

- [ ] **Free-string select renders for `view_card` target** — Add a `view_card` ability step. **Expected:** A `<select>` dropdown appears for `target` containing `player.self`, `player.other`, `center.main`, `center.bonus`, `previous`, `viewed`, `team.werewolf`, `team.vampire`, `team.alien`, `team.village`, `role.mason`, `players.actions`

- [ ] **Free-string select renders for other string-param abilities** — Add a `swap_card`, `flip_card`, or `touch` ability step. **Expected:** A `<select>` dropdown appears for each string parameter populated with the same 12 predefined target options

- [ ] **Integer number input renders for `view_card` count** — Add a `view_card` ability step. **Expected:** A `<input type="number">` appears for `count`

- [ ] **Integer number input renders for `rotate_all` count** — Add a `rotate_all` ability step. **Expected:** A `<input type="number">` appears for `count`

- [ ] **Array text input renders for `random_num_players` options** — Add a `random_num_players` ability step. **Expected:** A text input appears for `options` (comma-separated integers)

- [ ] **No parameter inputs render for empty-schema abilities** — Add a `stop`, `copy_role`, `perform_as`, `explicit_no_view`, or `perform_immediately` ability step. **Expected:** No `<select>` or `<input>` elements appear in the parameter area for that step

---

### Integer Initialization on Step Add

**Acceptance Criteria:** AC4
**Why manual QA:** Confirms the initialization logic in `handleAddAbility` runs correctly at interaction time — a unit test may mock the schema but this verifies the full flow from dropdown selection to pre-populated input.

- [ ] **`count` pre-populated to `1` on `view_card` add** — Add a `view_card` ability step without touching any inputs. **Expected:** The `count` number input displays `1` immediately upon step creation (not blank)

- [ ] **`count` pre-populated to `1` on `rotate_all` add** — Add a `rotate_all` ability step without touching any inputs. **Expected:** The `count` number input displays `1` immediately upon step creation

---

### Parameter Change Propagation

**Acceptance Criteria:** AC6
**Why manual QA:** Verifies that parameter changes survive the full round-trip through `handleParameterChange` → `onChange` → parent draft state → re-render, including the parse/clamp logic for integer and array types.

- [ ] **Enum select change persists** — Add a `change_to_team` step, select `werewolf` from the `team` dropdown, then navigate away and back to the Abilities step (or inspect displayed state). **Expected:** `team` value is `werewolf` and is retained

- [ ] **Free-string select change persists** — Add a `view_card` step, select `center.main` from the `target` dropdown. **Expected:** `target` value is `center.main` and is retained

- [ ] **Integer input change persists** — Add a `view_card` step, change `count` to `3`. **Expected:** `count` value is `3` and is retained

- [ ] **Integer input clamps to minimum 1** — Add a `view_card` step, clear the `count` field or enter `0`. **Expected:** `count` value is stored as `1`, not `0` or blank

- [ ] **Array input accepts comma-separated integers** — Add a `random_num_players` step, type `2,3,4` into the `options` field. **Expected:** Value is stored as `[2, 3, 4]`

- [ ] **Array input filters non-integer tokens** — Add a `random_num_players` step, type `2,abc,4` into the `options` field. **Expected:** Non-integer token `abc` is discarded; value is stored as `[2, 4]`

- [ ] **Multiple steps do not share parameter state** — Add two ability steps with different parameter values. Change a parameter in step 1. **Expected:** Step 2's parameters are unaffected

---

### Required / Optional Labels

**Acceptance Criteria:** AC8
**Why manual QA:** Label markup is a purely visual output that unit tests can check via DOM queries but a human should verify the rendered appearance is legible and correctly placed.

- [ ] **Required param shows asterisk** — Add a `view_card` step (where `target` is required). **Expected:** The label for `target` includes a `*` marker

- [ ] **Optional param shows "(optional)"** — Add a `view_card` step (where `count` is optional). **Expected:** The label for `count` includes `(optional)`

- [ ] **All required params in `change_to_team` are marked** — Add a `change_to_team` step. **Expected:** The `team` label includes `*`

---

## Anticipated Cross-Cutting Concerns

### Security
- [ ] **Free-string select only allows predefined options** — Attempt to submit a role draft with a `target` parameter value. **Expected:** Only values from `STRING_TARGET_OPTIONS` are selectable; no freeform text input is available for string-type parameters

---

## Open Questions

- What environment will manual testing occur in? (local dev vs. staging — affects whether real API seed data is available)
- Does the Role Builder require authentication, and are test credentials available?
- Are all 15 abilities present in the seeded database for the test environment?
