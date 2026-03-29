# Phase 3.6: Wake Order Resolution

> **Add a manual wake order resolution step to the game creation flow so users can break ties between roles that share the same default wake order**

## Overview

**Goal**: Insert a new "Wake Order Resolution" page between role selection and game creation. Users arrange waking roles into a single-column sequence by dragging tiles, resolving any ties from roles sharing the same default `wake_order`. The resolved sequence is stored per-game and used by the night script generator instead of the static `Role.wake_order` values.

**Prerequisites**: Phase 3.5 (Narrator Preview Fixes) applied; `narrator-preview` branch

---

## Problem Statement

Multiple official roles share the same `wake_order` value. The seed data contains these collisions:

| Wake Order | Roles |
|------------|-------|
| 1 | Werewolf, Dream Wolf, Cow, **Doppelganger** (updated from 0), **Copycat** (updated from 0) |
| 2 | Minion, Mystic Wolf, Alpha Wolf, Apprentice Tanner, Squire |
| 4 | Robber, Apprentice Seer, Seer, Witch, Marksman, Paranormal Investigator, Beholder, Mortician |
| 5 | Troublemaker, Village Idiot |
| 7 | Revealer, Aura Seer |
| 8 | Bodyguard, Thing |

Currently `generate_night_script()` sorts roles by `Role.wake_order`. When two roles share a value, the DB returns them in arbitrary order. There is no mechanism for the user to control this. The result is a non-deterministic night script — the narrator may call roles in a different order each time the script is generated for the same game.

User-created roles (from the Role Builder) can also introduce new `wake_order` collisions with official roles or with each other.

**Key files**:
- `yourwolf-backend/app/services/script_service.py` — `generate_night_script()` sorts by `Role.wake_order`
- `yourwolf-backend/app/services/game_service.py` — `create_game()` stores `role_ids` but no ordering info
- `yourwolf-frontend/src/pages/GameSetup.tsx` — "Start Game" button triggers `create_game` directly
- `yourwolf-frontend/src/hooks/useGameSetup.ts` — `handleStartGame()` calls API and navigates to facilitator page

---

## In Scope

### Seed data fix
- Update Doppelganger `wake_order` from `0` to `1`
- Update Copycat `wake_order` from `0` to `1`
- These roles wake first in the official game; `wake_order: 0` is reserved for "non-waking" after Phase 3.5

### Backend — wake order sequence
- Add a nullable `wake_order_sequence` JSON column to the `game_sessions` table (Alembic migration)
- Update the `GameSession` model with the new column (`list[uuid.UUID] | None`)
- Add `wake_order_sequence: list[UUID]` to the `GameSessionCreate` Pydantic schema
- Validate in `create_game()`:
  - Every role ID in `wake_order_sequence` must exist in `role_ids`
  - The sequence must contain exactly the set of unique waking role IDs from `role_ids` (no extras, no missing)
  - No duplicate IDs in the sequence
- Store the validated sequence on the `GameSession` record
- Update `generate_night_script()` to use `game.wake_order_sequence` for role ordering when present
- Fall back to the current `Role.wake_order` ordering when `wake_order_sequence` is null (backward compatibility for games created before this feature)
- Add `wake_order_sequence` to `GameSessionResponse`

### Frontend — game setup flow change
- Change the "Start Game" button on `GameSetupPage` to "Next"
- "Next" navigates to `/games/new/wake-order` using React Router state, passing: `playerCount`, `centerCount`, `timerSeconds`, `selectedRoleCounts`, and the full `roles` list (so the wake order page has role metadata without an extra API call)
- Add the new route to `routes.tsx`

### Frontend — Wake Order Resolution page
- New page at `/games/new/wake-order`
- Add `@dnd-kit/core` and `@dnd-kit/sortable` as dependencies
- Reads game config and selected roles from Router state; redirects to `/games/new` if state is missing
- **Layout**:
  - "Start Game" button at the top — enabled when all conflicts are resolved, disabled otherwise
  - When disabled, display message: "Resolve wake order conflicts to start the game"
  - Below the button: a vertical column of role tiles representing the wake sequence
  - Only waking roles appear (roles with `wake_order > 0`); non-waking roles are excluded entirely
  - If more than one copy of a role is selected, only one tile appears for that role
- **Initial state**: Tiles arranged by their default `wake_order`. Roles sharing the same `wake_order` render in the same row (visually indicating a conflict)
- **Interaction**: Users drag tiles up and down to reorder. Moving a tile out of a shared row resolves that conflict. The goal is a single column — every row has exactly one tile.
- **Role tile design**: Compact card showing only the role name, with a team-colored border
- **Start Game**: When clicked, constructs the `wake_order_sequence` from the resolved tile order, creates the game via API (same `gamesApi.create()` call with the new field), and navigates to `/games/{id}`

### Frontend — API client update
- Update `GameSessionCreate` TypeScript type to include `wake_order_sequence: string[]`
- Update the game creation call to include the sequence

### Tests
- Backend: Validate `wake_order_sequence` acceptance and rejection (missing roles, extras, duplicates)
- Backend: Verify `generate_night_script()` uses the sequence when present
- Backend: Verify `generate_night_script()` falls back to `Role.wake_order` when sequence is null
- Backend: Seed data — Doppelganger and Copycat have `wake_order: 1`
- Frontend: Wake Order Resolution page renders tiles grouped by default wake order
- Frontend: Dragging a tile out of a conflict row resolves the conflict
- Frontend: "Start Game" button is disabled when conflicts exist, enabled when resolved
- Frontend: Page redirects to `/games/new` when accessed without Router state
- Frontend: Game creation sends `wake_order_sequence` in the payload

## Out of Scope

- Auto-resolve option (e.g., "use alphabetical order for ties") — could be a future enhancement
- Persisting a user's preferred wake order across games (would require user accounts, Phase 4)
- Non-waking roles appearing anywhere on the wake order page
- Wake order resolution in the Role Builder preview — the preview shows a single role in isolation, not a multi-role game context
- Touch-optimized mobile drag-and-drop — basic touch support comes from `@dnd-kit` by default, but fine-tuning for mobile is out of scope

---

## Dependencies

- **Phase 3.5 applied**: Bug fixes for `wake_order == 0` handling, preview endpoint, and instruction templates must be in place. Phase 3.5 establishes that `wake_order == 0` means non-waking — this phase builds on that by moving Doppelganger/Copycat to `wake_order: 1`.
- **New npm dependency**: `@dnd-kit/core` and `@dnd-kit/sortable`
- **Alembic migration**: One new migration to add `wake_order_sequence` to `game_sessions`

---

## Success Criteria

| # | Criterion | Testable Via |
|---|-----------|-------------|
| SC1 | GameSetup "Next" button navigates to `/games/new/wake-order` with game config in Router state | Frontend test |
| SC2 | Wake Order Resolution page shows only waking roles (`wake_order > 0`) | Frontend test |
| SC3 | Roles with the same default `wake_order` appear in the same row initially | Frontend test |
| SC4 | Duplicate copies of the same role produce only one tile | Frontend test |
| SC5 | Users can drag tiles to reorder them | Manual QA |
| SC6 | "Start Game" button is disabled with message when any row has multiple tiles | Frontend test |
| SC7 | "Start Game" button is enabled when every row has exactly one tile | Frontend test |
| SC8 | Clicking "Start Game" creates a game with `wake_order_sequence` and navigates to facilitator page | Frontend test |
| SC9 | Role tiles show role name with team-colored border | Manual QA |
| SC10 | `POST /api/games` accepts and stores `wake_order_sequence` | Backend test |
| SC11 | `POST /api/games` rejects invalid sequences (missing roles, extras, duplicates) | Backend test |
| SC12 | `generate_night_script()` orders roles by `wake_order_sequence` when present | Backend test |
| SC13 | `generate_night_script()` falls back to `Role.wake_order` when sequence is null | Backend test |
| SC14 | Doppelganger and Copycat seed data have `wake_order: 1` | Backend test |
| SC15 | Navigating directly to `/games/new/wake-order` without state redirects to `/games/new` | Frontend test |

---

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| No wake order conflicts (all selected waking roles have unique values) | Page shows single-column layout, "Start Game" enabled immediately |
| Only non-waking roles selected (e.g., all Villagers + Tanner) | No tiles on the chart; "Start Game" enabled immediately (empty sequence is valid) |
| Single waking role selected | One tile, no conflicts, "Start Game" enabled immediately |
| User navigates directly to `/games/new/wake-order` without Router state | Redirect to `/games/new` |
| Browser back button from wake order page | Returns to GameSetup with selections preserved (via Router state) |
| `wake_order_sequence` contains a role ID not in `role_ids` | Backend returns 400 |
| `wake_order_sequence` is missing a waking role that's in `role_ids` | Backend returns 400 |
| `wake_order_sequence` has duplicate entries | Backend returns 400 |
| Existing game with null `wake_order_sequence` (created before this feature) | `generate_night_script()` falls back to `Role.wake_order` ordering |

---

## Technical Context

| Area | Key Files |
|------|-----------|
| Backend model — GameSession | `yourwolf-backend/app/models/game_session.py` — add `wake_order_sequence` column |
| Backend model — GameRole | `yourwolf-backend/app/models/game_role.py` — unchanged |
| Backend schema | `yourwolf-backend/app/schemas/game.py` — `GameSessionCreate`, `GameSessionResponse` |
| Backend game service | `yourwolf-backend/app/services/game_service.py` — `create_game()` validation and storage |
| Backend script service | `yourwolf-backend/app/services/script_service.py` — `generate_night_script()` ordering logic |
| Backend seed data | `yourwolf-backend/app/seed/roles.py` — Doppelganger/Copycat `wake_order` update |
| Backend migration | `yourwolf-backend/alembic/versions/` — new migration file |
| Frontend routes | `yourwolf-frontend/src/routes.tsx` — add `/games/new/wake-order` route |
| Frontend game setup | `yourwolf-frontend/src/pages/GameSetup.tsx` — "Start Game" → "Next" |
| Frontend game setup hook | `yourwolf-frontend/src/hooks/useGameSetup.ts` — `handleStartGame()` → navigation |
| Frontend new page | `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` — new file |
| Frontend API types | `yourwolf-frontend/src/types/game.ts` — `GameSessionCreate` |
| Frontend API client | `yourwolf-frontend/src/api/games.ts` — unchanged (schema handles new field) |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `@dnd-kit` bundle size impact | Low | `@dnd-kit/core` + `@dnd-kit/sortable` are ~20KB gzipped combined; acceptable |
| DnD accessibility on mobile/touch | Medium | `@dnd-kit` includes keyboard and screen reader support by default; touch works out of the box. Fine-tuning is out of scope. |
| Router state lost on page refresh | Medium | Redirect to `/games/new` when state is missing — user re-selects roles. This is acceptable for an MVP. |
| JSON column compatibility across DB backends | Low | SQLAlchemy `JSON` type is supported by PostgreSQL and SQLite (used in tests) |
| Existing games break when `wake_order_sequence` is added | Low | Column is nullable; `generate_night_script()` falls back to `Role.wake_order` when null |
| Seed data migration for Doppelganger/Copycat in existing DBs | Medium | Seed script uses upsert logic — needs to update existing rows, not just skip. Verify the seed runner handles updates. |

---

## Notes for Feature Decomposer

This phase has two natural features:

**Feature 1: Backend — wake order sequence support** — Alembic migration (add `wake_order_sequence` JSON column to `game_sessions`), update `GameSession` model, update `GameSessionCreate` and `GameSessionResponse` schemas, add validation in `create_game()`, update `generate_night_script()` to use sequence with fallback, update Doppelganger/Copycat seed data (`wake_order: 0` → `1`), backend tests for all of the above.

**Feature 2: Frontend — Wake Order Resolution page** — Add `@dnd-kit/core` + `@dnd-kit/sortable` dependencies, create `WakeOrderResolution` page component with drag-and-drop sortable tile list, create compact role tile component (name + team-color border), add `/games/new/wake-order` route, change `GameSetup` "Start Game" to "Next" with Router state navigation, update `useGameSetup` hook (remove game creation, add navigation), move game creation logic to wake order page, update `GameSessionCreate` TypeScript type, add frontend tests.

Feature 1 should be implemented first — it establishes the backend contract. Feature 2 builds the UI that calls it.
