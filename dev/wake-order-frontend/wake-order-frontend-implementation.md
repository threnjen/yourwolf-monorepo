# Implementation Record: Wake Order Frontend

## Summary
Modified `WakeOrderResolution.tsx` to group waking roles by `wake_order` value with visible group headers, random shuffle within each group on page load, per-group `SortableContext` for drag-constrained reordering, and always-enabled "Start Game" button. Updated page title to "Review Wake Order" and subtitle. Updated all corresponding tests and the route test.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | GameSetup "Next" navigates to `/games/new/wake-order` with state | Done (pre-existing) | `src/hooks/useGameSetup.ts`, `src/pages/GameSetup.tsx` | Already implemented |
| AC2 | Route `/games/new/wake-order` renders WakeOrderResolutionPage | Done (pre-existing) | `src/routes.tsx` | Already implemented |
| AC3 | Only waking roles (`wake_order > 0`) shown as tiles | Done | `src/pages/WakeOrderResolution.tsx` | Unchanged filtering logic |
| AC4 | Duplicate copies produce only one tile | Done | `src/pages/WakeOrderResolution.tsx` | Unchanged `seen` Set deduplication |
| AC5 | Roles grouped by `wake_order` with visible group headers | Done | `src/pages/WakeOrderResolution.tsx` | `<h3>` headers with `data-testid="wake-group-header"` |
| AC6 | Random shuffle within each group on page load | Done | `src/pages/WakeOrderResolution.tsx` | Fisher-Yates shuffle in `useState` initializer |
| AC7 | Users can drag tiles to reorder within their group | Done | `src/pages/WakeOrderResolution.tsx` | Per-group `SortableContext` |
| AC8 | Tiles cannot be dragged across group boundaries | Done | `src/pages/WakeOrderResolution.tsx` | Separate `SortableContext` per group + `handleDragEnd` group check |
| AC9 | "Start Game" always enabled on page load | Done | `src/pages/WakeOrderResolution.tsx` | Removed `hasConflicts`; `canStart = !submitting` |
| AC10 | "Start Game" constructs `wake_order_sequence` and creates game | Done | `src/pages/WakeOrderResolution.tsx` | Flattens `groupOrders` by group key |
| AC11 | Tiles show role name with team-colored left border | Done | `src/pages/WakeOrderResolution.tsx` | `SortableTile` unchanged |
| AC12 | Redirect to `/games/new` without Router state | Done | `src/pages/WakeOrderResolution.tsx` | Unchanged redirect logic |
| AC13 | `GameSessionCreate` includes `wake_order_sequence: string[]` | Done (pre-existing) | `src/types/game.ts` | Already existed |
| AC14 | `@dnd-kit` deps listed | Done (pre-existing) | `package.json` | Already existed |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/pages/WakeOrderResolution.tsx` | Modified | Replaced flat `tileOrder` state with `groupOrders: Record<number, string[]>`; added `shuffleArray` Fisher-Yates function; removed `resolvedGroups`, `hasConflicts`; restructured render to group-by with `<h3>` headers and per-group `SortableContext`; updated title/subtitle text; simplified `canStart` | AC5, AC6, AC7, AC8, AC9, AC10 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/WakeOrderResolution.test.tsx` | Modified | Removed 3 conflict-related tests; added 10 new tests for group headers, random shuffle, always-enabled button, group ordering, page text | AC5, AC6, AC8, AC9, AC10 |
| `src/test/routes.test.tsx` | Modified | Updated page title assertion from "Wake Order Resolution" to "Review Wake Order" | AC2 title change |

## Test Results
- **Baseline**: 333 passed, 3 failed (pre-existing in `useRoles.test.ts`)
- **Final**: 340 passed, 3 failed (same pre-existing failures)
- **New tests added**: 10 (7 net new after removing 3 old conflict tests)
- **Regressions**: None

## Deviations from Plan
- None

## Gaps
- None

## Reviewer Focus Areas
- `src/pages/WakeOrderResolution.tsx` — `shuffleArray` function and `useState` initializer pattern for one-time shuffle on mount
- `src/pages/WakeOrderResolution.tsx` — `handleDragEnd` now scopes reorder to the group containing the dragged item via `groupOrders` Record
- `src/pages/WakeOrderResolution.tsx` — `handleStartGame` flattens `groupOrders` using `sortedGroupKeys.flatMap()` to build `wake_order_sequence`
- Test for random shuffle (`tiles within a multi-role group are not always in the same order across renders`) — renders 20 times with 4 roles, verifies >1 unique ordering
- `src/test/routes.test.tsx` — title assertion updated to match new page title
