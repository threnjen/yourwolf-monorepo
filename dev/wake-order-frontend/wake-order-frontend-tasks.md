# Wake Order Frontend — Tasks

## Stage 0: Verify Dependencies and Existing Infrastructure

- [x] Confirm `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in `package.json` dependencies
- [x] Confirm `/games/new/wake-order` route exists in `src/routes.tsx`
- [x] Confirm `GameSessionCreate` type has `wake_order_sequence?: string[]` in `src/types/game.ts`
- [x] Confirm `useGameSetup.handleNext()` navigates to `/games/new/wake-order` with Router state
- [x] Confirm GameSetup page has "Next" button (not "Start Game")

## Stage 1: Restructure `WakeOrderResolution.tsx` — Grouped Layout with Headers

- [ ] Compute grouped structure from `wakingRoles`: `Record<number, WakingRole[]>` keyed by `wake_order` value
- [ ] Replace single `tileOrder: string[]` state with `groupOrders: Record<number, string[]>`
- [ ] Remove `resolvedGroups` state entirely
- [ ] Remove `hasConflicts` computation entirely
- [ ] Render group headers as `<h3>` elements with text "Wake #N" for each group (e.g., "Wake #1", "Wake #4")
- [ ] Wrap each group's tiles in its own `SortableContext` with `verticalListSortingStrategy`
- [ ] Keep single `DndContext` wrapping all groups
- [ ] Update `handleDragEnd` to only reorder within the group that contains the dragged item
- [ ] Update `handleStartGame` to flatten `groupOrders` into a single `wake_order_sequence` array (ordered by group number, then by position within group)

## Stage 2: Add Random Shuffle Within Groups

- [ ] In the `useState` initializer for `groupOrders`, shuffle each group's role IDs using Fisher-Yates or `Array.sort(() => Math.random() - 0.5)`
- [ ] Ensure shuffle runs once on mount only (use initializer function pattern, not effect)

## Stage 3: Always-Enabled "Start Game"

- [ ] Remove `const canStart = !hasConflicts && !submitting` — replace with `const canStart = !submitting`
- [ ] Remove the conflict warning `<p>` element ("Resolve wake order conflicts to start the game")
- [ ] Ensure `handleStartGame` no longer checks `hasConflicts`

## Stage 4: Update Page Text

- [ ] Change page title `<h1>` from "Wake Order Resolution" to "Review Wake Order"
- [ ] Change subtitle `<p>` from "Drag roles to set the wake order. Roles with the same wake number must be resolved." to "Drag roles to customize order within each wake group"

## Stage 5: Update Frontend Tests

### Update existing tests
- [ ] Update test "tiles are sorted by wake_order initially" — verify tiles appear within their respective groups (group headers between them)
- [ ] Remove test "shows conflict message when roles share the same wake_order" — conflicts no longer shown
- [ ] Remove test '"Start Game" is disabled when conflicts exist' — button is always enabled
- [ ] Update test '"Start Game" enabled when all roles have unique wake_order' — change to '"Start Game" is always enabled on page load'
- [ ] Update test "clicking 'Start Game' calls gamesApi.create with wake_order_sequence" — verify sequence reflects grouped+shuffled order

### Add new tests
- [ ] Add test: group headers render with correct labels (e.g., "Wake #1", "Wake #4") when roles span multiple groups
- [ ] Add test: group header shows for each unique `wake_order` value
- [ ] Add test: tiles within a multi-role group are not always in the same order across renders (random shuffle verification — render N times, check at least one ordering differs)
- [ ] Add test: single-role groups display one tile under their header
- [ ] Add test: "Start Game" is enabled even when multiple roles share the same `wake_order` (no conflict-disabling)
- [ ] Add test: `wake_order_sequence` payload respects group ordering (group 1 IDs come before group 4 IDs)

### Verify existing tests still pass
- [ ] `WakeOrderResolution.test.tsx::redirect without state` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::tile rendering::only shows waking roles` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::tile rendering::deduplicates copies` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::tile rendering::displays tile with role name and team-colored border` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::no waking roles` tests — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::game creation::navigates to /games/{id}` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::game creation::shows error on API failure` — should pass unchanged
- [ ] `WakeOrderResolution.test.tsx::game creation::does not send wake_order_sequence when no waking roles` — should pass unchanged
- [ ] `GameSetup.test.tsx` — all existing tests should pass unchanged
- [ ] Run full frontend test suite (`npm test`) and confirm all tests pass
