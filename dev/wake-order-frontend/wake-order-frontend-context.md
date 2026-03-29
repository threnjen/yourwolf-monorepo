# Wake Order Frontend — Context

## Key Files

| File | Role | Lines of Interest |
|------|------|------------------|
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Main page component — needs modification for grouped layout, shuffle, always-enabled button | Full file (~230 lines) |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Game setup page — already has "Next" button calling `handleNext()` | L277–L286: "Next" button |
| `yourwolf-frontend/src/hooks/useGameSetup.ts` | Hook — already has `handleNext()` navigating to `/games/new/wake-order` with Router state | L104–L115: `handleNext()` |
| `yourwolf-frontend/src/routes.tsx` | Routes — already has `/games/new/wake-order` route mapped to `WakeOrderResolutionPage` | L16: route definition |
| `yourwolf-frontend/src/types/game.ts` | TypeScript types — `GameSessionCreate` already has `wake_order_sequence?: string[]` | L12: field definition |
| `yourwolf-frontend/src/api/games.ts` | API client — `gamesApi.create()` sends `GameSessionCreate` including `wake_order_sequence` | L23–L26: create method |
| `yourwolf-frontend/src/styles/theme.ts` | Theme constants, `TEAM_COLORS` map, `theme.colors`, `theme.spacing`, `theme.borderRadius` | Full file |
| `yourwolf-frontend/src/styles/shared.ts` | Shared page styles: `pageContainerStyles`, `pageHeaderStyles`, `pageTitleStyles`, `pageSubtitleStyles` | Full file |
| `yourwolf-frontend/src/components/ErrorBanner.tsx` | Error display component — used on WakeOrder page for API errors | Referenced in imports |
| `yourwolf-frontend/src/test/WakeOrderResolution.test.tsx` | Existing tests for the page — needs updates for new grouped behavior | Full file (~250 lines) |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | Existing tests for GameSetup — verify "Next" navigation | Relevant navigation tests |
| `yourwolf-frontend/src/test/mocks.ts` | Test helpers — `createMockOfficialRole(name, team, wakeOrder)`, `createMockGameSession()` | L62–L95 |
| `yourwolf-frontend/package.json` | Dependencies — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` already listed | L13–L15 |

## Current State vs Desired State

### What exists now (`WakeOrderResolution.tsx`)

1. **Flat tile list**: All waking roles in a single `SortableContext` — no group separation
2. **Deterministic sort**: Tiles sorted by `wake_order` ascending, no random shuffle
3. **Conflict-resolution paradigm**: A `hasConflicts` check counts roles sharing the same `wake_order`; if conflicts exist, "Start Game" is disabled and a warning message is shown
4. **"Resolved" tracking**: A `resolvedGroups` Set tracks which `wake_order` groups have been manually reordered; roles in resolved groups are excluded from the conflict count
5. **Title**: "Wake Order Resolution"
6. **Subtitle**: "Drag roles to set the wake order. Roles with the same wake number must be resolved."

### What needs to change

1. **Grouped tile list**: Group tiles by `wake_order` value; render a group header (e.g., "Wake #1") before each group; each group gets its own `SortableContext`
2. **Random shuffle**: Within each group, shuffle role order randomly using `useState` initializer
3. **Always-enabled button**: Remove `hasConflicts` check; remove `resolvedGroups` state; "Start Game" is always enabled (unless `submitting`)
4. **Remove conflict warning**: Remove the `hasConflicts` warning paragraph
5. **Title**: "Review Wake Order"
6. **Subtitle**: "Drag roles to customize order within each wake group"
7. **Tile order state**: Instead of a single `tileOrder: string[]`, use a Map/Record of `groupNumber → string[]` so each group's order is independent

### What stays the same

- `SortableTile` component (role name + team-colored left border)
- `WakeOrderRouterState` interface
- Redirect logic for missing Router state
- `handleStartGame()` flow (construct role_ids, call `gamesApi.create`, navigate)
- `ErrorBanner` for API errors
- `@dnd-kit` sensor setup (PointerSensor + KeyboardSensor)
- Import structure and style patterns

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Modify existing `WakeOrderResolution.tsx` rather than creating a new file | The existing file has ~80% of the needed structure; creating a new file would duplicate imports, types, and the game creation flow |
| Use one `DndContext` with multiple `SortableContext`s (one per group) | This is the `@dnd-kit` recommended pattern for constrained sorting within groups. Each `SortableContext` independently manages its items' order. |
| Use `useState` initializer function for random shuffle | Ensures shuffle happens once on mount, not on every render. The initializer runs only on the first render. |
| Store group order as `Record<number, string[]>` | Makes it easy to pass each group's IDs to its `SortableContext`; flattening to a single array happens only on "Start Game" click |
| Keep component name as `WakeOrderResolutionPage` | Renaming would require updating routes.tsx, test imports, etc. with no functional benefit. Only the visible title text changes. |

## Constraints

- `@dnd-kit/sortable` v10 uses `SortableContext` with `items` prop (array of string IDs) and `verticalListSortingStrategy`
- `@dnd-kit` `useSortable` hook provides `transform`, `transition`, `attributes`, `listeners`, `setNodeRef` — all used in current `SortableTile`
- `CSS.Transform.toString()` from `@dnd-kit/utilities` is used for inline transform styles
- Tests use `vitest`, `@testing-library/react`, `@testing-library/user-event`, `MemoryRouter`
- Cannot directly test drag-and-drop interactions in jsdom (no pointer events) — drag tests rely on structural assertions (separate SortableContexts) and manual QA

## Relationship to Sibling Plans

- **Depends on wake-order-backend**: Backend API must accept `wake_order_sequence` in `POST /api/games` — this is already implemented
- Backend feature is fully implemented; this frontend feature can proceed independently
- No changes to the backend are needed from this feature
