# Review Record: Ability Step Parameter Inputs

## Summary
Implementation matches the plan across all 8 acceptance criteria. Three issues found — all low-to-medium severity, all fixed during this review. No blockers. High confidence in correctness.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `AbilitiesStep.tsx:365` | `StepParameterInputs` wired into step list render |
| AC2 | Verified | `AbilitiesStep.tsx:152-163` | enum branch renders `<select>` with enum values |
| AC3 | Verified | `AbilitiesStep.tsx:164-178` | free-string branch uses `STRING_TARGET_OPTIONS` |
| AC4 | Verified | `AbilitiesStep.tsx:179-190`, `AbilitiesStep.tsx:253-260` | Renders and initializes correctly; initialization now tested |
| AC5 | Verified | `AbilitiesStep.tsx:191-201` | array branch renders comma-separated text input |
| AC6 | Verified | `AbilitiesStep.tsx:302-319` | `handleParameterChange` updates immutably and calls `onChange` |
| AC7 | Verified | `AbilitiesStep.tsx:141` | early-return guard on empty/absent `properties` |
| AC8 | Verified | `AbilitiesStep.tsx:143-146` | required/optional label computed from `schema.required` |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Duplicate `id` attributes on parameter inputs when multiple steps share the same ability type | Medium | `AbilitiesStep.tsx:148` | AC1 | Fixed |
| 2 | `handleAddAbility` integer initialization not directly tested | Low | `AbilitiesStep.test.tsx:68` | AC4 | Fixed |
| 3 | No HTML `min` attribute on integer `<input>` | Low | `AbilitiesStep.tsx:183` | AC4 | Fixed |
| 4 | `rotateAllSchema` fixture from task plan absent in tests | Low | `AbilitiesStep.test.tsx` | — | Wont-Fix — no AC depends on it |
| 5 | Empty string stored when placeholder `—` option selected | Low | `AbilitiesStep.tsx:155` | AC6 | Wont-Fix — validation is Review step's responsibility per plan |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `AbilitiesStep.tsx` | Added `stepIndex` prop to `StepParameterInputsProps`; changed `inputId` to `` `param-${stepIndex}-${key}` ``; passed `stepIndex={index}` at call site | 1 |
| `AbilitiesStep.tsx` | Added `min={1}` attribute to the integer `<input type="number">` | 3 |
| `AbilitiesStep.test.tsx` | Added `'adding ability with integer params initializes defaults'` test in the `'adding abilities'` describe block | 2 |

## Remaining Concerns
- Issue #5: empty-string parameter values are stored when the placeholder `—` option is left selected. This is acceptable per plan (validation belongs to the Review step), but should be addressed when that step is implemented.

## Test Coverage Assessment
- Covered: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8
- Missing: No integration test for the multi-step-same-ability-type scenario (duplicate ID bug was structural, not behavioral — fix is verified by code inspection)

## Risk Summary
- `StepParameterInputs` type narrowing via casts from `Record<string, unknown>` — safe but brittle if schema shape changes
- Array input parsing (comma-separated text → `number[]`) silently drops non-integer tokens — correct per plan, but no user feedback on invalid input
- `parameters_schema` fallback to `{}` when ability not found is a safe no-op, but could mask data loading issues in production
