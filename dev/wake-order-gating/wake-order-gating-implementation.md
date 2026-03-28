# Implementation Record: Wake Order Gating

## Summary
Defaulted wake order to 0 ("does not wake"), added label range hint and "Does not wake up" subtext, and gated AbilitiesStep editing when wake order is 0 or null. Frontend-only changes across 3 source files and 4 test/mock files.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Empty draft defaults `wake_order` to `0` (not `null`) | Done | `src/pages/RoleBuilder.tsx` | `createEmptyDraft()` now returns `wake_order: 0` |
| AC2 | Wake Order label reads "Wake Order (0–40)" | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Label text updated |
| AC3 | When `wake_order === 0`, hint "Does not wake up" shown | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Also shows for `null` (legacy compat) |
| AC4 | AbilitiesStep shows disabled state when `wake_order === 0` | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Gating banner + disabled palette |
| AC5 | AbilitiesStep becomes interactive when wake order ≥ 1 | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Normal render path unchanged |
| AC6 | Previously-added ability steps preserved when back to 0 | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Steps shown read-only with warning |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/pages/RoleBuilder.tsx` | Modified | `createEmptyDraft()` returns `wake_order: 0` instead of `null` | AC1: default to "does not wake" |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modified | Label changed to "Wake Order (0–40)"; conditional hint "Does not wake up" added; `handleWakeOrderChange('')` → `0` instead of `null` | AC2, AC3 |
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modified | Added `isDisabled` check; disabled state renders gating banner; warning when steps exist at wake_order 0; steps shown read-only | AC4, AC5, AC6 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/mocks.ts` | Modified | `createMockDraft()` default `wake_order: null` → `0` | AC1 mock cascade |
| `src/test/useDrafts.test.ts` | Modified | `makeDraft()` default `wake_order: null` → `0` | AC1 existing test alignment |
| `src/test/BasicInfoStep.test.tsx` | Modified | Added 5 tests: label range, hint at 0, hint hidden at >0, hint at null, clearing→0 | AC1, AC2, AC3 |
| `src/test/AbilitiesStep.test.tsx` | Modified | Added 6 gating tests; updated 19 existing tests to use `wake_order: 3` | AC4, AC5, AC6 |

## Test Results
- **Baseline**: 290 passed, 0 failed (before implementation)
- **Final**: 301 passed, 0 failed (after implementation)
- **New tests added**: 11
- **Regressions**: None

## Deviations from Plan
None

## Gaps
None

## Reviewer Focus Areas
- Gating logic in `AbilitiesStep.tsx` — early return for disabled state means the palette/handlers are completely bypassed when `isDisabled` is true; verify no edge case where the normal render path is accidentally reached
- `handleWakeOrderChange` in `BasicInfoStep.tsx` — empty string now maps to `0` instead of `null`; verify this matches the plan's intent for clearing the input
- Mock cascade — 19 existing AbilitiesStep tests were updated to pass `wake_order: 3` to keep the palette active; verify no test intent was altered
- Legacy `null` handling — both `BasicInfoStep` hint and `AbilitiesStep` gating treat `null` the same as `0`; this preserves backward compat with localStorage drafts
