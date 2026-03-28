# Modifier Dropdown Label — Tasks

## Stage 1: Update AbilitiesStep.tsx

- [ ] Add `MODIFIER_LABELS` constant mapping `StepModifier` → display string
- [ ] Add `modifierLabelStyles` constant (muted text, small font, matching `paramLabelStyles`)
- [ ] Replace modifier `<select>` at index 0 with hidden/no render
- [ ] Add "Then:" `<span>` before `<select>` for index > 0
- [ ] Update `<option>` display text to use `MODIFIER_LABELS` values
- [ ] Filter out `'none'` from dropdown options for index > 0
- [ ] Verify component renders correctly with 0, 1, and 2+ steps

## Stage 2: Update ReviewStep.tsx

- [ ] Add `MODIFIER_LABELS` map (inline or imported)
- [ ] Update modifier `<span>` to use descriptive label instead of raw value

## Stage 3: Update Tests

- [ ] Update "first step modifier is always none" test — assert no combobox at index 0
- [ ] Add `test_first_step_hides_modifier_dropdown`
- [ ] Add `test_subsequent_steps_show_then_label`
- [ ] Add `test_modifier_options_show_descriptive_text`
- [ ] Verify existing modifier-change tests pass with raw values
- [ ] Add `test_review_step_shows_descriptive_modifier` (in ReviewStep tests)
- [ ] Run full test suite — all tests green
