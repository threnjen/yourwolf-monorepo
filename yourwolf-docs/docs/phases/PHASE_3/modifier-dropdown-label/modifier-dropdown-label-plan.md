# Modifier Dropdown Label — Plan

**Issue**: [005-modifier-dropdown-needs-label.md](../issues/005-modifier-dropdown-needs-label.md)
**Area**: Frontend — Role Builder, AbilitiesStep
**Status**: Not Started

## Acceptance Criteria

| ID  | Criterion |
|-----|-----------|
| AC1 | First step (index 0) does NOT render a modifier dropdown — displays nothing or a muted "First action" badge instead |
| AC2 | Steps at index > 0 show a visible label ("Then:") before the modifier dropdown |
| AC3 | Dropdown option display text is descriptive: "And then" / "Or instead" / "Only if" — underlying values stay `'and'`/`'or'`/`'if'` |
| AC4 | Underlying `StepModifier` type and data model values remain unchanged |
| AC5 | ReviewStep displays the same descriptive modifier labels for consistency |

## Non-Goals

- Changing the `StepModifier` type, API contract, or seed data
- Refactoring the step list into a separate component
- Adding tooltip/help-text beyond the label and descriptive options

## Traceability

| AC  | Code Areas | Planned Tests |
|-----|------------|---------------|
| AC1 | `AbilitiesStep.tsx` — step list render block (~lines 383–393) | `test_first_step_hides_modifier_dropdown` |
| AC2 | `AbilitiesStep.tsx` — new `<span>` before `<select>` | `test_subsequent_steps_show_then_label` |
| AC3 | `AbilitiesStep.tsx` — `<option>` display text | `test_modifier_options_show_descriptive_text` |
| AC4 | No changes to `types/role.ts` or backend | Existing tests remain green |
| AC5 | `ReviewStep.tsx` — modifier `<span>` (~lines 119–121) | `test_review_step_shows_descriptive_modifier` |

---

## Stage 1: Update AbilitiesStep.tsx

**Goal**: Improve modifier dropdown UX per AC1–AC3
**Success Criteria**: First step has no dropdown; subsequent steps have "Then:" label + descriptive option text; all existing tests pass or are updated
**Status**: Not Started

### Changes

1. Add a `MODIFIER_LABELS` constant mapping `StepModifier` values to display strings:

   | Value    | Display       |
   |----------|---------------|
   | `'none'` | —             |
   | `'and'`  | "And then"    |
   | `'or'`   | "Or instead"  |
   | `'if'`   | "Only if"     |

2. Add a `modifierLabelStyles` constant following existing `paramLabelStyles` pattern — muted text, small font.

3. In the step list render block, replace the current `<select>` with conditional logic:
   - **index === 0**: Render nothing (or a small muted "First action" `<span>`) instead of the disabled `<select>`.
   - **index > 0**: Render a `<span>` with "Then:" followed by the `<select>`. Remove `'none'` from the options list for non-first steps. Use `MODIFIER_LABELS` for `<option>` display text.

---

## Stage 2: Update ReviewStep.tsx

**Goal**: Consistent descriptive labels in the review summary (AC5)
**Success Criteria**: ReviewStep shows "And then" / "Or instead" / "Only if" instead of raw "and" / "or" / "if"
**Status**: Not Started

### Changes

1. Add an inline `MODIFIER_LABELS` map (same values as Stage 1) or import from a shared location.
2. Update the modifier `<span>` at ~line 120 to use `MODIFIER_LABELS[step.modifier]` instead of raw `step.modifier`.

---

## Stage 3: Update Tests

**Goal**: Test coverage for all new behavior
**Success Criteria**: New tests pass; existing tests updated to match new DOM structure
**Status**: Not Started

### Changes in `AbilitiesStep.test.tsx`

1. **Update** "first step modifier is always none" test — assert no combobox for index 0 (currently asserts `disabled`).
2. **Add** `test_first_step_hides_modifier_dropdown` — render a draft with one step, assert no `<select>`/combobox for that step.
3. **Add** `test_subsequent_steps_show_then_label` — render a draft with two steps, assert "Then:" text appears.
4. **Add** `test_modifier_options_show_descriptive_text` — render a draft with two steps, assert options contain "And then", "Or instead", "Only if".
5. **Verify** existing modifier-change tests still pass — `handleModifierChange` still receives raw values (`'and'`, `'or'`, `'if'`).

### Changes in ReviewStep tests (if they exist for modifier display)

6. **Add** `test_review_step_shows_descriptive_modifier` — render ReviewStep with a step that has `modifier: 'and'`, assert "And then" appears in the output.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Single step only | No modifier dropdown rendered at all |
| Reorder step to position 0 | `handleMoveUp`/`handleMoveDown` already force `modifier: 'none'` — UI hides dropdown naturally |
| Remove first step | Second step becomes index 0, already gets `modifier: 'none'` — conditional render handles it |
| "none" option for index > 0 | Not offered in the dropdown — prevents invalid selection |

## Keep-It-Clean Checklist

- [ ] No new files created — all changes in existing files
- [ ] `MODIFIER_LABELS` is a simple const object, not over-engineered
- [ ] Style constants follow the existing `*Styles` naming convention
- [ ] No changes to `StepModifier` type or any API contracts
- [ ] No unnecessary abstraction
