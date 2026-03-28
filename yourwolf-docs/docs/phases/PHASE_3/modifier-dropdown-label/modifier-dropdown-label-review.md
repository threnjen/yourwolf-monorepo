# Review Record: Modifier Dropdown Label

## Summary
Implementation correctly addresses all 5 acceptance criteria from the plan. One medium-severity accessibility issue found and fixed. High confidence in correctness.

## Verdict
Approved

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `src/components/RoleBuilder/steps/AbilitiesStep.tsx:396` | `{index > 0 && ...}` hides dropdown at index 0 |
| AC2 | Verified | `src/components/RoleBuilder/steps/AbilitiesStep.tsx:397` | `<span style={modifierLabelStyles}>Then:</span>` before `<select>` |
| AC3 | Verified | `src/components/RoleBuilder/steps/AbilitiesStep.tsx:402` | Options display `MODIFIER_LABELS[m]`; `value` stays raw |
| AC4 | Verified | `src/types/role.ts:3` | `StepModifier` type unchanged |
| AC5 | Verified | `src/components/RoleBuilder/steps/ReviewStep.tsx:127` | Uses `MODIFIER_LABELS[step.modifier]` in parenthesized span |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Modifier `<select>` had no accessible name (no `aria-label` or linked `<label>`) | Medium | `AbilitiesStep.tsx:398` | AC2 | Fixed |
| 2 | "Then:" span not programmatically linked to select via `<label htmlFor>` | Low | `AbilitiesStep.tsx:397` | AC2 | Open |
| 3 | `MODIFIER_LABELS` duplicated across AbilitiesStep and ReviewStep | Low | `AbilitiesStep.tsx:30`, `ReviewStep.tsx:4` | AC5 | Wont-Fix |
| 4 | Test `first step hides modifier dropdown` asserts combobox count = 1 globally; fragile if mock abilities gain schemas with `<select>` elements | Low | `AbilitiesStep.test.tsx:161` | AC1 | Open |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Added `aria-label="Step modifier"` to the modifier `<select>` | 1 |

## Remaining Concerns
- Issue #2: "Then:" is a visual-only `<span>`. Converting to `<label htmlFor>` would improve accessibility further but requires generating an `id` per step. Low severity — defer to an accessibility pass.
- Issue #3: Duplication is per plan decision (4-entry map in 2 files). Acceptable.
- Issue #4: Test fragility is theoretical — only triggers if mock abilities change to include parameter schemas. Low risk.

## Test Coverage Assessment
- Covered: AC1 (hide dropdown), AC2 (Then: label), AC3 (descriptive options), AC4 (raw values preserved, type unchanged), AC5 (ReviewStep descriptive labels)
- Missing: No gap — all ACs have dedicated tests

## Risk Summary
- Conditional render `{index > 0 && ...}` is clean and handles all edge cases (single step, reorder, remove first) naturally
- `MODIFIER_LABELS` map covers all `StepModifier` variants — no missing key risk
- `'none'` correctly filtered from options for index > 0 via `.filter((m) => m !== 'none')`
