# Review Record: Wake Order Frontend

## Summary
Clean implementation that satisfies all 14 acceptance criteria. Grouped layout with headers, Fisher-Yates shuffle, per-group `SortableContext`, and always-enabled "Start Game" button are all correctly implemented. No regressions — test suite confirms 340 passed (7 net new), 3 pre-existing failures in `useRoles.test.ts`. High confidence.

## Verdict
Approved

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `src/hooks/useGameSetup.ts:108-115` | Pre-existing `handleNext()` navigates with Router state |
| AC2 | Verified | `src/routes.tsx:16` | Route maps to `WakeOrderResolutionPage` |
| AC3 | Verified | `src/pages/WakeOrderResolution.tsx:101` | `!role.wake_order \|\| role.wake_order <= 0` filter |
| AC4 | Verified | `src/pages/WakeOrderResolution.tsx:97-99` | `seen` Set deduplication |
| AC5 | Verified | `src/pages/WakeOrderResolution.tsx:187-196` | `<h3>` group headers with `Wake #N` text and `data-testid="wake-group-header"` |
| AC6 | Verified | `src/pages/WakeOrderResolution.tsx:43-49, 118` | Fisher-Yates `shuffleArray` in `useState` initializer — runs once on mount |
| AC7 | Verified | `src/pages/WakeOrderResolution.tsx:197-203` | Per-group `SortableContext` with `verticalListSortingStrategy` |
| AC8 | Verified | `src/pages/WakeOrderResolution.tsx:127-137` | `handleDragEnd` scopes to group via `draggedRole.wake_order`; cross-group `indexOf` returns -1, early return |
| AC9 | Verified | `src/pages/WakeOrderResolution.tsx:168` | `canStart = !submitting` — no `hasConflicts` gating |
| AC10 | Verified | `src/pages/WakeOrderResolution.tsx:146-162` | Flattens `groupOrders` via `sortedGroupKeys.flatMap()`, calls `gamesApi.create`, navigates on success |
| AC11 | Verified | `src/pages/WakeOrderResolution.tsx:55-76` | `SortableTile` renders role name + team-colored `borderLeft` |
| AC12 | Verified | `src/pages/WakeOrderResolution.tsx:87-89` | `useEffect` redirects to `/games/new` when state is null |
| AC13 | Verified | `src/types/game.ts:15` | `wake_order_sequence?: string[]` on `GameSessionCreate` |
| AC14 | Verified | `package.json:16-18` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` all listed |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Single-item groups show `cursor: grab` — phase doc says "not draggable" for single-item groups. Functionally a no-op (drag starts but cannot reorder), so UX impact is minimal. | Low | `src/pages/WakeOrderResolution.tsx:68` | — | Open |
| 2 | Each tile redundantly shows `Wake #N` badge when group header already displays this information | Low | `src/pages/WakeOrderResolution.tsx:74-76` | — | Open |
| 3 | `wakingRoles`, `roleById`, `sortedGroupKeys` recomputed every render instead of using `useMemo` — harmless since derived from immutable Router state and data is small | Low | `src/pages/WakeOrderResolution.tsx:91-117` | — | Open |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

None — no Blocker, High, or Medium severity issues found.

## Remaining Concerns

- Issue #1: `cursor: grab` on single-item group tiles — cosmetic, defer to next cleanup pass
- Issue #2: Redundant `Wake #N` badge on tiles — arguably improves usability during drag, defer
- Issue #3: No `useMemo` on derived computations — plan explicitly chose this approach for simplicity

## Test Coverage Assessment

- **Covered**: AC1–AC6, AC8–AC14 (21 tests in WakeOrderResolution.test.tsx, route assertions in routes.test.tsx)
- **AC7 (within-group drag reorder)**: Manual QA only — jsdom doesn't support pointer events for drag simulation. Structural test (separate `SortableContext` per group) partially covers this.
- **Shuffle test is robust**: 20 renders of 4 roles, checks >1 unique ordering — probability of false failure is ~(1/24)^19 ≈ 0
- **Game creation tests cover both deterministic (single-role groups) and probabilistic (multi-role group ordering) scenarios**

## Risk Summary

- `src/pages/WakeOrderResolution.tsx:113-119` — `useState` initializer captures `sortedGroupKeys` and `wakingRoles` from closure; safe because both derive from immutable Router state
- `src/pages/WakeOrderResolution.tsx:127-137` — cross-group drag rejection relies on `indexOf` returning -1 for items not in the dragged role's group; verified correct
- Router state is ephemeral — page refresh loses state and redirects to `/games/new`; acceptable for MVP per plan
- `shuffleArray` uses `Math.random()` — not cryptographic, but sufficient for game UX randomization
