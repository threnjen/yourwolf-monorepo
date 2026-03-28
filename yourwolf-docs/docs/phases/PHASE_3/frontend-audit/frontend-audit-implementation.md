# Implementation Record: Frontend Audit Fixes

## Summary

Implemented all actionable findings from the frontend code audit across the `yourwolf-frontend/` codebase. This covers 30+ findings spanning correctness bugs, security improvements, DRY refactoring, type safety, and code decomposition. The orphaned `dashboard/` directory was removed entirely.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 (#1) | Unify AbilityStep/AbilityStepDraft types | Done | `src/types/role.ts` | Changed to type alias |
| AC2 (#2) | Merge identical stepItemStyles/wcItemStyles | Done | `src/components/RoleBuilder/steps/ReviewStep.tsx` | Unified to `listItemStyles` |
| AC3 (#3,#4,#7,#8,#17,#30,#34) | Remove orphaned dashboard directory | Done | Removed `dashboard/` | `git rm -rf` resolves all 7 dashboard findings |
| AC4 (#5) | Guard gameId in GameFacilitator | Done | `src/pages/GameFacilitator.tsx` | Split into Page (guard) + Content component |
| AC5 (#6) | Fix no-op useCallback in Timer | Done | `src/components/Timer.tsx` | Replaced with useRef latest-value pattern |
| AC6 (#9) | Add draftToPayload return type | Done | `src/api/roles.ts` | Added `RoleCreatePayload` interface |
| AC7 (#14) | Decompose GameSetup.tsx | Done | `src/hooks/useGameSetup.ts`, `src/pages/GameSetup.tsx` | Extracted `useGameSetup` hook; page reduced from ~407 to 273 lines |
| AC8 (#15,#16) | Replace magic numbers | Done | `src/components/Timer.tsx`, `src/hooks/useGameSetup.ts` | Named constants for circle geometry, warning threshold, input bounds |
| AC9 (#18,#32) | Validate API_URL fallback | Done | `src/api/client.ts` | Scoped localhost fallback to DEV mode; added console.error for missing config |
| AC10 (#19,#33) | Sanitize error logging | Done | `src/api/client.ts` | Structured log object instead of raw error.response.data |
| AC11 (#21) | Standardize component return types | Done | Multiple | Removed explicit `React.ReactElement` return types |
| AC12 (#22) | Fix inconsistent destructuring in games.ts | Done | `src/api/games.ts` | Changed to `const {data: game} = await...` |
| AC13 (#23) | Create shared ErrorBanner component | Done | `src/components/ErrorBanner.tsx` | Shared with `role="alert"`, optional dismiss |
| AC14 (#24) | Extract capitalize utility | Done | `src/styles/theme.ts` | Added `capitalize()` function |
| AC15 (#25) | Extract shared TEAM_COLORS | Done | `src/styles/theme.ts`, `src/components/RoleCard.tsx`, ReviewStep, BasicInfoStep | Central `TEAM_COLORS` record replaces 3 local copies |
| AC16 (#26,#27) | Extract shared page styles | Done | `src/styles/shared.ts` | `loadingStyles`, `errorStyles`, `pageContainerStyles`, etc. |
| AC17 (#28) | Extract shared selectStyles | Done | `src/styles/shared.ts`, AbilitiesStep, WinConditionsStep | Deduplicated select element styles |
| AC18 (#29) | Create generic useFetch hook | Done | `src/hooks/useFetch.ts` | Generic hook reduces boilerplate in useRoles, useAbilities, useGame |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/pages/GameFacilitator.tsx` | Modified | Split into guard + content pattern; removed local styles | AC4, AC11, AC16 |
| `src/api/games.ts` | Modified | Consistent destructuring in `create` | AC12 |
| `src/components/RoleBuilder/steps/ReviewStep.tsx` | Modified | Merged duplicate styles; uses shared TEAM_COLORS | AC2, AC15 |
| `src/components/Timer.tsx` | Modified | useRef pattern for onComplete; named constants | AC5, AC8 |
| `src/api/client.ts` | Modified | DEV-only localhost fallback; structured error logging | AC9, AC10 |
| `src/styles/theme.ts` | Modified | Added TeamColor type, TEAM_COLORS record, capitalize utility | AC14, AC15 |
| `src/styles/shared.ts` | Created | Shared page/loading/error/select styles | AC16, AC17 |
| `src/components/RoleCard.tsx` | Modified | Uses shared TEAM_COLORS and capitalize | AC14, AC15 |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modified | Uses shared TEAM_COLORS and capitalize | AC14, AC15 |
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Modified | Uses shared selectStyles | AC17 |
| `src/components/RoleBuilder/steps/WinConditionsStep.tsx` | Modified | Uses shared selectStyles | AC17 |
| `src/pages/Roles.tsx` | Modified | Uses shared page styles | AC16 |
| `src/pages/GameSetup.tsx` | Modified | Uses useGameSetup hook; shared page styles; removed explicit return type | AC7, AC8, AC11, AC16 |
| `src/pages/RoleBuilder.tsx` | Modified | Uses shared page styles | AC16 |
| `src/components/ScriptReader.tsx` | Modified | Removed explicit return type | AC11 |
| `src/hooks/useFetch.ts` | Created | Generic fetch hook with data/loading/error/refetch | AC18 |
| `src/hooks/useRoles.ts` | Modified | Refactored to use useFetch | AC18 |
| `src/hooks/useAbilities.ts` | Modified | Refactored to use useFetch | AC18 |
| `src/hooks/useGame.ts` | Modified | useGame refactored to use useFetch | AC18 |
| `src/hooks/useGameSetup.ts` | Created | Extracted game setup state/logic from GameSetup page | AC7, AC8 |
| `src/api/roles.ts` | Modified | Added RoleCreatePayload interface and return type | AC6 |
| `src/types/role.ts` | Modified | AbilityStepDraft → type alias for AbilityStep | AC1 |
| `src/components/ErrorBanner.tsx` | Created | Shared error display component | AC13 |
| `dashboard/` | Deleted | Removed entire orphaned directory (4 files) | AC3 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/useFetch.test.ts` | Created | 6 tests for generic fetch hook | AC18 |
| `src/test/ErrorBanner.test.tsx` | Created | 5 tests for error banner component | AC13 |
| `src/test/GameFacilitator.test.tsx` | Modified | Added missing gameId guard test | AC4 |

## Test Results
- **Baseline**: 28 files, 293 tests passed (before implementation)
- **Final**: 30 files, 305 tests passed (after implementation)
- **New tests added**: 12 (6 useFetch + 5 ErrorBanner + 1 GameFacilitator guard)
- **Regressions**: None

## Deviations from Plan
- **Dashboard removal instead of fix-only**: The audit said "Decide: keep or remove `dashboard/` entirely." We removed it since the code imports non-existent modules (`from role_builder ...`) and cannot function. This resolves findings #3, #4, #7, #8, #17, #30, #34 in one action.
- **Finding #37 (Zod runtime validation)**: Not implemented. The audit flagged this as a "consider" item. Adding Zod would introduce a new dependency and is better suited as a separate task.
- **Finding #36 (pagination metadata)**: Not implemented. Would require API contract changes.
- **GameSetup decomposition scope**: Extracted `useGameSetup` hook but did not further split the JSX into sub-components (e.g., `RoleSelectionGrid`, `GameConfigInputs`). The page is now 273 lines — well under the concern threshold — and the hook extraction was the highest-value decomposition.
- **Input clamping logic**: The onBlur clamping handlers remain in the page component JSX rather than being moved into the hook, since they manage both the display input state and the validated numeric state together. Moving them would add complexity for minimal benefit.
- **`useNightScript` not migrated to `useFetch`**: The `useNightScript` hook in `useGame.ts` retains the manual `useState`/`useEffect` pattern because it requires an `enabled` parameter to conditionally fetch. Migrating it would require adding conditional-fetch support to `useFetch`, which adds complexity for a single consumer.

## Gaps
- **Finding #37**: Runtime response validation with Zod — deferred as separate task (new dependency)
- **Finding #36**: Pagination metadata handling — deferred (API contract change)

## Reviewer Focus Areas
- **`src/hooks/useGameSetup.ts`** — New hook with all role selection logic including cascade removal. Verify state management is identical to the original inline code.
- **`src/components/Timer.tsx` useRef pattern** — Replaced no-op `useCallback(onComplete, [onComplete])` with `useRef` latest-value pattern. Verify the ref is correctly read in the timeout callback.
- **`src/api/client.ts` API_URL validation** — DEV-only fallback and missing-config error log. Verify production builds get the empty string case handled correctly.
- **`src/pages/GameFacilitator.tsx` guard pattern** — Split into Page/Content to eliminate `!` assertions. Verify all downstream code receives guaranteed `gameId: string`.
- **`dashboard/` removal** — Entire directory deleted. Confirm no other code references it.
