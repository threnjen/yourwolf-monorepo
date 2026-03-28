# Implementation Record: Modifier Dropdown Label

## Summary
Updated the modifier dropdown in AbilitiesStep to hide for the first step, show a "Then:" label with descriptive option text ("And then" / "Or instead" / "Only if") for subsequent steps, and updated ReviewStep to display the same descriptive labels. Raw `StepModifier` values remain unchanged throughout.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | First step (index 0) does NOT render a modifier dropdown | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Conditional render: nothing at index 0 |
| AC2 | Steps at index > 0 show "Then:" label before dropdown | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | `<span>` with `modifierLabelStyles` |
| AC3 | Dropdown options show descriptive text, values stay raw | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | `MODIFIER_LABELS` map for display, raw values for `<option value>` |
| AC4 | StepModifier type and data model unchanged | Done | — | No changes to `types/role.ts` |
| AC5 | ReviewStep shows descriptive modifier labels | Done | `src/components/RoleBuilder/steps/ReviewStep.tsx` | Same `MODIFIER_LABELS` map |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modified | Added `MODIFIER_LABELS` const, `modifierLabelStyles`, conditional render for modifier dropdown | AC1, AC2, AC3: hide dropdown at index 0, show "Then:" + descriptive options at index > 0 |
| `src/components/RoleBuilder/steps/ReviewStep.tsx` | Modified | Added `MODIFIER_LABELS` const, updated modifier `<span>` to use descriptive label | AC5: consistent labels in review |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/AbilitiesStep.test.tsx` | Modified | Replaced "first step modifier is always none" with "first step hides modifier dropdown"; added 3 new tests (Then: label, descriptive options, raw value change); updated empty-schema combobox count | AC1, AC2, AC3, AC4 |
| `src/test/ReviewStep.test.tsx` | Modified | Added "shows descriptive modifier labels instead of raw values" test | AC5 |

## Test Results
- **Baseline**: 275 passed, 0 failed (before implementation)
- **Final**: 279 passed, 0 failed (after implementation)
- **New tests added**: 4 net new (1 replaced existing test, 3 brand new in AbilitiesStep, 1 new in ReviewStep)
- **Regressions**: None

## Deviations from Plan
- Plan mentioned option of showing a muted "First action" badge for index 0. Implemented the simpler approach (render nothing) as the plan's default.
- `MODIFIER_LABELS` is duplicated in both files as a simple inline const, matching the plan's decision that a shared utility is overkill for a 4-entry map in 2 files.

## Gaps
None

## Reviewer Focus Areas
- Conditional render block in `AbilitiesStep.tsx` (~line 383–395) — verify the `{index > 0 && ...}` fragment correctly hides/shows the dropdown
- `MODIFIER_LABELS` values match the plan spec: "And then" / "Or instead" / "Only if"
- `'none'` is filtered from options for index > 0 via `.filter((m) => m !== 'none')`
- ReviewStep parenthesized format `(And then)` matches existing `(and)` pattern
