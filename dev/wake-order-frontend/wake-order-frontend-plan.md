# Wake Order Frontend — Plan

## Summary

Add a "Review Wake Order" page between role selection and game creation. The page displays waking roles in a single-column drag-and-drop list, grouped by `wake_order` value with visible group headers. Within each group, roles are randomly shuffled on page load. Drag is constrained to within-group only. "Start Game" is always enabled. The existing `GameSetup` page changes "Start Game" to "Next" and navigates via Router state.

---

## A. Requirements & Traceability

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | GameSetup "Next" button navigates to `/games/new/wake-order` with game config in Router state |
| AC2 | Route `/games/new/wake-order` exists and renders `WakeOrderResolutionPage` (existing name) or new `ReviewWakeOrder` component |
| AC3 | Page shows only waking roles (`wake_order > 0`) as tiles |
| AC4 | Duplicate copies of the same role produce only one tile |
| AC5 | Roles are grouped by `wake_order` with visible group headers (e.g., "Wake #1", "Wake #4") |
| AC6 | Within each group, roles are **randomly shuffled** on page load |
| AC7 | Users can drag tiles to reorder within their wake order group |
| AC8 | Tiles **cannot** be dragged across wake order group boundaries |
| AC9 | "Start Game" button is enabled immediately on page load (always enabled) |
| AC10 | Clicking "Start Game" constructs `wake_order_sequence` from current tile order, creates game via API, and navigates to `/games/{id}` |
| AC11 | Role tiles show role name with team-colored left border |
| AC12 | Page redirects to `/games/new` when accessed without Router state |
| AC13 | `GameSessionCreate` TypeScript type includes `wake_order_sequence: string[]` |
| AC14 | `@dnd-kit/core` and `@dnd-kit/sortable` are listed as dependencies |

### Non-Goals

- Reordering roles across wake order groups
- Persisting user preferred wake order across games
- Touch-optimized mobile drag-and-drop (basic @dnd-kit touch support is sufficient)
- Displaying non-waking roles on the wake order page
- Wake order review in the Role Builder preview

### Traceability Matrix

| AC | Code Areas / Modules | Planned Tests |
|----|---------------------|---------------|
| AC1 | `src/hooks/useGameSetup.ts` — `handleNext()`, `src/pages/GameSetup.tsx` — "Next" button | `GameSetup.test.tsx` — navigation test |
| AC2 | `src/routes.tsx` — `/games/new/wake-order` route | `routes.test.tsx` |
| AC3 | `src/pages/WakeOrderResolution.tsx` — waking role filter | `WakeOrderResolution.test.tsx::tile rendering::only shows waking roles` |
| AC4 | `src/pages/WakeOrderResolution.tsx` — `seen` Set deduplication | `WakeOrderResolution.test.tsx::tile rendering::deduplicates copies` |
| AC5 | `src/pages/WakeOrderResolution.tsx` — group headers rendering | `WakeOrderResolution.test.tsx` — new test needed |
| AC6 | `src/pages/WakeOrderResolution.tsx` — initial shuffle logic | `WakeOrderResolution.test.tsx` — new test needed |
| AC7 | `src/pages/WakeOrderResolution.tsx` — `DndContext` + `SortableContext` per group | Manual QA + unit test |
| AC8 | `src/pages/WakeOrderResolution.tsx` — separate `SortableContext` per group | `WakeOrderResolution.test.tsx` — new test needed |
| AC9 | `src/pages/WakeOrderResolution.tsx` — button always enabled | `WakeOrderResolution.test.tsx::no conflicts::Start Game enabled` |
| AC10 | `src/pages/WakeOrderResolution.tsx` — `handleStartGame()` | `WakeOrderResolution.test.tsx::game creation` |
| AC11 | `src/pages/WakeOrderResolution.tsx` — `SortableTile` component | `WakeOrderResolution.test.tsx::tile rendering::displays tile with role name and team-colored border` |
| AC12 | `src/pages/WakeOrderResolution.tsx` — redirect effect | `WakeOrderResolution.test.tsx::redirect without state` |
| AC13 | `src/types/game.ts` — `GameSessionCreate` | Compile-time check |
| AC14 | `package.json` — dependencies | Compile-time check |

---

## B. Correctness & Edge Cases

### Key Workflows

1. **Full flow**: GameSetup → select roles → click "Next" → Review Wake Order page → roles grouped with headers, shuffled within groups → click "Start Game" → API call with `wake_order_sequence` → navigate to facilitator
2. **No waking roles**: All selected roles are non-waking → page shows "No waking roles selected" message → "Start Game" enabled → creates game with empty/undefined sequence
3. **Single role per group**: No drag interaction possible — group has one tile
4. **Direct URL access**: Navigating to `/games/new/wake-order` without Router state → redirect to `/games/new`

### Edge Cases (from phase doc)

| Case | Expected Behavior |
|------|-------------------|
| No wake order conflicts (all unique values) | Single-item groups, "Start Game" enabled |
| Only non-waking roles selected | No tiles, "Start Game" enabled, empty/undefined sequence |
| Single waking role selected | One tile in one group, "Start Game" enabled |
| Group has only one role | That tile is not draggable (no reordering possible) |
| Direct navigation without state | Redirect to `/games/new` |
| Browser back from wake order page | Returns to GameSetup (Router state preserved) |

### Error-Handling Strategy

- API errors on game creation: Display in `ErrorBanner` component (already implemented in current `WakeOrderResolution.tsx`)
- Missing Router state: Redirect silently to `/games/new`

---

## C. Consistency & Architecture Fit

### Existing Patterns to Follow

- **Page components**: Exported named function component (e.g., `GameSetupPage`, `WakeOrderResolutionPage`), using inline styles from `theme` and `shared` style modules
- **Styling**: Inline `React.CSSProperties` objects, using `theme.colors`, `theme.spacing`, `theme.borderRadius` from `src/styles/theme.ts` and shared styles from `src/styles/shared.ts`
- **Navigation**: `useNavigate()` from react-router-dom, Router state for passing data between pages
- **Hooks**: Custom hooks in `src/hooks/` — `useGameSetup` already has `handleNext()` with Router state navigation
- **API calls**: Through typed API client (`gamesApi.create()` in `src/api/games.ts`)
- **Testing**: Vitest + `@testing-library/react`, mock `useNavigate`, mock API modules, `createMockOfficialRole()` helper from `src/test/mocks.ts`
- **Component data-testid**: Used for test targeting (e.g., `data-testid="wake-tile"`, `data-testid="team-section"`)

### Deviations from Phase Doc

The current `WakeOrderResolution.tsx` implementation has some differences from the phase doc spec that need to be addressed:

1. **No group headers**: Current implementation renders a flat list of tiles without "Wake #1", "Wake #4" group headers → needs group headers added
2. **No random shuffle**: Current implementation sorts by `wake_order` deterministically → needs random shuffle within each group on initial load
3. **No within-group drag constraint**: Current implementation uses a single `SortableContext` for all tiles → needs separate `SortableContext` per group to constrain drag
4. **"Start Game" button is conditionally disabled**: Current implementation has a "conflict resolution" paradigm where the button is disabled until conflicts are resolved → needs to be always enabled
5. **Page title says "Wake Order Resolution"**: Phase doc specifies "Review Wake Order" → update title
6. **Instructional text differs**: Current says "Drag roles to set the wake order..." → Phase doc says "Drag roles to customize order within each wake group"

### Interfaces / Contracts

- **Router state** (GameSetup → WakeOrder): `{ playerCount, centerCount, timerSeconds, selectedRoleCounts, roles }`
- **API call**: `gamesApi.create({ player_count, center_card_count, discussion_timer_seconds, role_ids, wake_order_sequence })`
- **TypeScript type**: `GameSessionCreate.wake_order_sequence: string[]` (already exists in `src/types/game.ts`)

---

## D. Clean Design & Maintainability

### Design Approach

Modify the existing `WakeOrderResolution.tsx` rather than creating a new file. The page already has the core structure (DnD setup, tile component, game creation flow). The changes are:

1. Restructure rendering to group tiles by `wake_order` with group headers
2. Use one `SortableContext` per group (constrains drag within group)
3. Add random shuffle within each group on initial state computation
4. Remove conflict-resolution logic; make "Start Game" always enabled
5. Update title and instructional text

### Complexity Risks

- **Multiple DndContexts or SortableContexts**: Using one `DndContext` with multiple `SortableContext`s (one per group) is the recommended `@dnd-kit` pattern for group-constrained sorting. Each `SortableContext` manages its own items independently.
- **Random shuffle on load**: Use `useState` initializer function to shuffle once on mount, not on every render.

### Keep-It-Clean Checklist

- [ ] Reuse existing `SortableTile` component with minimal changes
- [ ] Keep inline style patterns consistent with rest of codebase
- [ ] Keep `WakeOrderRouterState` interface unchanged
- [ ] No new utility files — shuffle logic is simple enough to inline

---

## E. Completeness: Observability, Security, Operability

### Logging

- No frontend logging needed — browser DevTools suffice for debugging

### Security

- Router state is ephemeral (in-memory, not URL-persisted) — no data leakage
- API call validates `wake_order_sequence` server-side (backend Feature 1)

### Operability

- **Deploy**: `npm install` (adds `@dnd-kit` if not already present — already in `package.json`), build, deploy
- **Verify**: Navigate GameSetup → select roles → click "Next" → see grouped wake order page → click "Start Game"
- **Rollback**: Revert frontend code; backend is backward compatible (accepts null sequence)

---

## F. Test Plan

### Test Mapping

| AC | Test Type | Test Name |
|----|-----------|-----------|
| AC1 | Unit | `GameSetup.test.tsx` — "Next" navigates with state (existing test to verify) |
| AC2 | Unit | `routes.test.tsx` — route exists (existing) |
| AC3 | Unit | `WakeOrderResolution.test.tsx::tile rendering::only shows waking roles` (existing) |
| AC4 | Unit | `WakeOrderResolution.test.tsx::tile rendering::deduplicates copies` (existing) |
| AC5 | Unit | `WakeOrderResolution.test.tsx` — **new**: group headers render with correct labels |
| AC6 | Unit | `WakeOrderResolution.test.tsx` — **new**: tiles within groups are shuffled (not in deterministic order) |
| AC7 | Manual | Drag a tile within its group and verify reorder |
| AC8 | Unit | `WakeOrderResolution.test.tsx` — **new**: separate SortableContext per group (structural assertion) |
| AC9 | Unit | `WakeOrderResolution.test.tsx` — **update existing**: "Start Game" always enabled (remove conflict-disabled tests) |
| AC10 | Unit | `WakeOrderResolution.test.tsx::game creation` (existing — verify it still passes) |
| AC11 | Unit | `WakeOrderResolution.test.tsx::tile rendering::displays tile with role name and team-colored border` (existing) |
| AC12 | Unit | `WakeOrderResolution.test.tsx::redirect without state` (existing) |
| AC13 | Compile | TypeScript type already includes field |
| AC14 | Verify | `package.json` already lists deps |

### Top 5 High-Value Test Cases

1. **Given** roles with `wake_order` values [1, 4, 4, 5], **When** the page renders, **Then** group headers "Wake #1", "Wake #4", "Wake #5" are shown, and the Wake #4 group contains 2 tiles
2. **Given** roles with `wake_order` values [4, 4, 4], **When** the page renders multiple times, **Then** the initial order within the group is not always the same (random shuffle)
3. **Given** roles in two groups (Wake #1: Werewolf; Wake #4: Seer, Robber), **When** user drags Seer, **Then** Seer can only be reordered within the Wake #4 group
4. **Given** any valid role selection, **When** the page loads, **Then** "Start Game" is enabled immediately without any user interaction
5. **Given** the user clicks "Start Game", **When** the API call succeeds, **Then** `wake_order_sequence` in the payload matches the current tile order (top to bottom) and includes all waking role IDs

### Test Data / Mocks

- Uses existing `createMockOfficialRole(name, team, wakeOrder)` factory from `src/test/mocks.ts`
- Uses existing `createMockGameSession()` factory for API response mocking
- Mock `gamesApi.create` via `vi.mock('../api/games')`
- Mock `useNavigate` via `vi.mock('react-router-dom')`
- Render with `MemoryRouter` and `initialEntries` containing state

---

## Stages

### Stage 0: Verify Dependencies and Existing Infrastructure

**Goal**: Confirm `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in `package.json`; existing route and type exist
**Success Criteria**: `npm install` succeeds; route `/games/new/wake-order` exists in `routes.tsx`; `GameSessionCreate` type has `wake_order_sequence`
**Status**: Already satisfied — all deps already in `package.json`, route exists, type exists

### Stage 1: Update `WakeOrderResolution.tsx` — Grouped Layout with Headers

**Goal**: Restructure tile rendering to group by `wake_order` with visible group headers; each group gets its own `SortableContext`
**Success Criteria**: AC5 (group headers), AC8 (within-group constraint), AC3 (only waking roles)
**Status**: Not Started

### Stage 2: Add Random Shuffle Within Groups

**Goal**: On page load, roles within each wake order group are randomly shuffled
**Success Criteria**: AC6 (random shuffle on load)
**Status**: Not Started

### Stage 3: Always-Enabled "Start Game"

**Goal**: Remove conflict-resolution paradigm; "Start Game" is always enabled
**Success Criteria**: AC9 ("Start Game" enabled on load regardless of grouping)
**Status**: Not Started

### Stage 4: Update Page Text and Title

**Goal**: Change title to "Review Wake Order"; update instructional text to "Drag roles to customize order within each wake group"
**Success Criteria**: Title and subtitle match phase doc spec
**Status**: Not Started

### Stage 5: Update/Add Frontend Tests

**Goal**: Tests cover group headers, random shuffle, always-enabled button, within-group constraint
**Success Criteria**: All tests pass; existing tests updated to match new behavior (no conflict-disabled state)
**Status**: Not Started
