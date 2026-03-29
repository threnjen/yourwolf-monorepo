# Wake Order Frontend — AC Coverage Map

**Date:** 2026-03-28

| AC | Description | Automated Coverage | Manual QA Needed? | Reason |
|----|-------------|--------------------|--------------------|--------|
| AC1 | GameSetup "Next" navigates to `/games/new/wake-order` with state | Unit test: `GameSetup.test.tsx` verifies navigation + state | No | Pure navigation logic, assertable |
| AC2 | Route `/games/new/wake-order` renders WakeOrderResolutionPage | Unit test: `routes.test.tsx` verifies route and title | No | Route mapping, assertable |
| AC3 | Only waking roles shown as tiles | Unit test: `only shows waking roles (wake_order > 0) as tiles` | No | Filtering logic, assertable |
| AC4 | Duplicate copies produce one tile | Unit test: `deduplicates copies of the same role into one tile` | No | Dedup logic, assertable |
| AC5 | Group headers with "Wake #N" labels | Unit test: `renders group headers with correct labels` + `tiles appear within their respective wake order groups` | Partial — visual appearance only | Header text is tested; visual styling (font, color, spacing between groups) requires human eyes |
| AC6 | Random shuffle within groups on load | Unit test: `tiles within a multi-role group are not always in the same order across renders` (20 renders, 4 roles) | No | Probabilistic assertion covers this thoroughly |
| AC7 | Drag tiles to reorder within group | No automated tests (jsdom lacks pointer events for drag simulation) | Yes | Drag-and-drop is a physical interaction that cannot be tested in jsdom |
| AC8 | Tiles cannot be dragged across group boundaries | Structural test: separate `SortableContext` per group; `handleDragEnd` scopes to group | Partial — runtime enforcement only | Structure is tested; actual cross-group drag rejection requires real pointer interaction |
| AC9 | "Start Game" always enabled | Unit test: `"Start Game" is always enabled on page load` + `enabled even when multiple roles share same wake_order` | No | Button state, assertable |
| AC10 | "Start Game" constructs sequence and creates game | Unit tests: `calls gamesApi.create with wake_order_sequence` + `respects group ordering` + `navigates to /games/{id}` | No | API payload and navigation, assertable |
| AC11 | Tiles show role name with team-colored left border | Unit test: `displays tile with role name and team-colored border` | Partial — visual appearance only | Border existence is tested; actual color correctness per team requires visual verification |
| AC12 | Redirect without Router state | Unit test: `redirects to /games/new when Router state is missing` | No | Redirect logic, assertable |
| AC13 | `GameSessionCreate` includes `wake_order_sequence` | Compile-time TypeScript check | No | Type system, compile-time |
| AC14 | `@dnd-kit` deps listed | `package.json` inspection | No | Dependency presence, verifiable |
