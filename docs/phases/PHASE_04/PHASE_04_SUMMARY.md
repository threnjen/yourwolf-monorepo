# Phase 4: Client-Side Game Engine

**Status**: Planned
**Depends on**: Phase 3.6 (Wake Order Resolution)
**Estimated complexity**: Large
**Cross-references**: Python source in `yourwolf-backend/app/services/script_service.py`, `yourwolf-backend/app/services/game_service.py`

## Objective

Port the night script generation engine, wake order logic, ability resolution, and narrator preview from the Python backend to TypeScript so the game can run entirely client-side with no server dependency.

## Scope

### In Scope
- TypeScript game engine module: `src/engine/` directory with pure functions (no React, no API calls)
- Port `ScriptService.generate_night_script()` logic to TypeScript
- Port `ScriptService._generate_role_script()` and `ScriptService._generate_step_instruction()` to TypeScript
- Port `ScriptService._get_wake_instruction()` — 5 `wake_target` pattern branches (`player.self`, `team.werewolf`, `team.alien`, `team.vampire`, `role.*`)
- Port `ScriptService.preview_role_script()` — draft role narrator preview using stand-in objects (reuses `_generate_role_script()`)
- Port step duration map (`STEP_DURATIONS`) and instruction template generation for all 15 ability types
- Port wake order sorting with custom sequence support (from Phase 3.6)
- Port `StepModifier` conditional logic (AND/OR/IF) resolution
- TypeScript types for engine inputs/outputs: `NightScript`, `NarratorAction`, `RoleInput`, `AbilityStepInput`
- Game state machine: phase transitions (setup → night → discussion → voting → resolution → complete)
- In-memory game session management (create, progress, complete — no persistence yet)
- Comprehensive unit tests for the engine matching existing Python test coverage (~1,270 lines in `test_script_service.py`)
- Engine works in both browser and Tauri contexts (pure TypeScript, no DOM or Node dependencies)
- Frontend integration: replace all game-flow and preview API calls with local engine calls (see Frontend Integration Map below)

### Out of Scope
- Data persistence (Phase 05 — Local Data Layer)
- Tauri integration or native packaging (Phase 06)
- Audio narration (Phase 07)
- Removing or modifying the Python backend (it remains for future cloud use)
- Conditional ability builder UI (Phase 11 — Advanced Features)
- Role CRUD operations — `rolesApi.create()`, `rolesApi.validate()`, and the roles list endpoint still call the backend; only `rolesApi.previewScript()` moves to local engine
- Any persistence or network calls from the engine itself — it operates on in-memory data structures

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Engine Types | TypeScript interfaces for engine inputs/outputs: roles, ability steps, scripts, actions, game state | Type definitions |
| 2 | Instruction Templates | Port of `_generate_step_instruction()` — all 15 ability type templates, plus `_get_wake_instruction()` with 5 wake target patterns | Template functions |
| 3 | Script Generator | Port of `generate_night_script()` — takes roles + sequence, produces ordered `NarratorAction[]` | Core engine function |
| 4 | Narrator Preview | Port of `preview_role_script()` — generates preview from draft role data without persisting | Preview function |
| 5 | Wake Order Resolver | Sort roles by wake order with custom sequence override | Sort utility |
| 6 | Game State Machine | Phase transitions, timer state, current wake index tracking, in-memory session create/start/advance/complete | State management |
| 7 | Frontend Integration | Replace 6 API call sites with local engine calls (see Frontend Integration Map) | Hook/service/page updates |

## Frontend Integration Map

These are the specific API calls that must be replaced with local engine equivalents:

| Current Call Site | Current API Call | Replacement |
|---|---|---|
| `WakeOrderResolution.tsx` | `gamesApi.create()` | Local engine creates in-memory game session from role selections |
| `GameFacilitator.tsx` | `gamesApi.start()` | Local engine shuffles role assignments and transitions to night phase |
| `GameFacilitator.tsx` / `useGame()` | `gamesApi.getById()` | Local session manager returns in-memory game state |
| `GameFacilitator.tsx` / `useNightScript()` | `gamesApi.getNightScript()` | Local script generator produces `NightScript` from in-memory game |
| `GameFacilitator.tsx` | `gamesApi.advancePhase()` | Local state machine advances phase (night → discussion → voting → resolution → complete) |
| `RoleBuilder.tsx` | `rolesApi.previewScript()` | Local preview generator produces `NarratorPreviewResponse` from draft role data |

**Hooks and API clients affected**: `useGame.ts` (both `useGame` and `useNightScript`), `useGameSetup.ts` (navigate-to-game flow), `api/games.ts` (game CRUD — may be gutted or wrapped), `api/roles.ts` (`previewScript` method only).

**Components affected**: `WakeOrderResolution.tsx`, `GameFacilitator.tsx`, `RoleBuilder.tsx`.

## Technical Context

- Python source to port: `yourwolf-backend/app/services/script_service.py` — `ScriptService` class (~540 lines), contains `generate_night_script()`, `_generate_role_script()`, `_generate_step_instruction()`, `_get_wake_instruction()`, `preview_role_script()`
- Python game service: `yourwolf-backend/app/services/game_service.py` — game creation, phase management, `PHASE_ORDER` list, role shuffling, wake sequence validation
- Python models to mirror: `app/models/ability_step.py` (`StepModifier` enum), `app/models/game_session.py` (`GamePhase` enum)
- Existing Python test suite: `tests/test_script_service.py` (~1,270 lines) — comprehensive coverage to replicate
- Existing frontend types: `src/types/role.ts` (`Role`, `AbilityStep`, `StepModifier`, `Team`, `NarratorPreviewAction`, `NarratorPreviewResponse`), `src/types/game.ts` (`GameSession`, `GamePhase`, `NarratorAction`, `NightScript`, `GameSessionCreate`)
- Existing frontend hooks: `src/hooks/useGame.ts` (`useGame`, `useNightScript`), `src/hooks/useGameSetup.ts` — currently call API; will be updated to use local engine
- Existing API clients: `src/api/games.ts` (game create/start/advance/script/delete), `src/api/roles.ts` (`previewScript` method)
- Step durations map: 15 ability types with specific second values (8s for `view_card`, 6s for `swap_card`, etc.)
- Instruction templates: string generation per ability type with parameter interpolation (`wake_target`, card counts, direction, team names, etc.)
- Wake instruction generation: `_get_wake_instruction()` has 5 branches based on `wake_target` pattern — `player.self`, `team.werewolf`, `team.alien`, `team.vampire`, `role.*` (extracts role name from pattern)
- Preview script: `preview_role_script()` builds stand-in objects (`_StandInRole`, `_StandInStep`, `_StandInAbility`) from draft data, reuses `_generate_role_script()`, and adds a section header for `perform_immediately`/`perform_as` steps
- The engine module must have zero dependencies on React, DOM APIs, or Node.js — pure TypeScript functions that can run anywhere

## Edge Cases & Failure Modes

- **Roles with no ability steps**: A role that wakes but has no steps — engine should still produce wake + close-eyes actions (the Python code handles this naturally via the loop)
- **Roles with `wake_order == null` or `wake_order == 0`**: Must be excluded from night script generation — the Python code explicitly filters these out
- **Unknown ability types**: `_generate_step_instruction()` returns `None` for unrecognized types — the TS engine should silently skip (no action added), matching Python behavior
- **Empty night script**: A game where no roles wake (all have `wake_order == null` or 0) — engine should still produce the opening "close your eyes" and closing "open your eyes" narrator actions
- **`StepModifier.OR` interaction**: Steps with `OR` modifier get "OR " prefixed to their instruction text *and* set `requires_player_action = true` — both behaviors must be preserved
- **`preview_role_script()` with `wake_order == null` or 0**: Returns empty actions array (no script generated) — must match this behavior
- **`perform_immediately` / `perform_as` in preview**: Preview adds a special section header action when these ability types are present — this logic is unique to preview and must be ported
- **Custom wake order sequence with missing roles**: If a role ID in the sequence is not in the game's waking roles, it should be ignored during sort (Python uses `.get()` with a fallback index)
- **Duplicate role instances in the same game**: Multiple copies of the same role in a game — the script should only generate one script block per unique role (Python de-duplicates via `set()` on role IDs)

## Dependencies & Risks

- **Dependency**: Phase 3.6 wake order sequence logic must be stable — the engine must support both default and custom ordering
- **Risk**: Python-to-TypeScript translation errors — mitigate by writing matching test cases from existing Python tests (~1,270 lines of test coverage to replicate) and verifying output parity
- **Risk**: Edge cases in conditional step resolution (AND/OR/IF chains) — the Python implementation handles these; tests must cover the same scenarios
- **Risk**: Frontend integration complexity — 6 API call sites across 3 pages and 2 hooks need replacement; mitigate by creating an adapter layer so hooks keep their existing public interface (`useGame` still returns `{ game, loading, error, refetch }`)
- **Risk**: Game state management — in-memory game sessions are lost on page refresh (acceptable for Phase 04; persistence comes in Phase 05)
- **Mitigation**: Keep the Python backend running during development as a reference; run both engines with the same inputs and compare outputs

## Success Criteria

- [ ] TypeScript engine generates identical night scripts to the Python backend for all 30 seed roles
- [ ] All 15 ability type instruction templates produce correct narrator text
- [ ] All 5 `_get_wake_instruction()` branches produce correct wake-up text
- [ ] Wake order sorting matches Python behavior (default order and custom sequence)
- [ ] Step modifier conditionals (AND/OR/IF) resolve correctly
- [ ] `preview_role_script()` produces identical preview output to the Python backend, including section headers for `perform_immediately`/`perform_as`
- [ ] Game state machine progresses through all phases (setup → night → discussion → voting → resolution → complete)
- [ ] All 6 API call sites replaced with local engine calls (see Frontend Integration Map)
- [ ] Role Builder narrator preview works without backend
- [ ] Frontend game flow works without any backend API calls for script generation or game management
- [ ] Engine has no dependencies on DOM, Node, or React APIs
- [ ] Unit test coverage ≥90% for engine module
- [ ] Edge cases documented above are covered by tests

## QA Considerations

- End-to-end game flow must be manually tested: create game → review wake order → run night phase → verify script matches expected output → complete game
- Compare engine output against Python backend for regression (same roles, same wake order → same script)
- Role Builder narrator preview must be manually tested: create a role with abilities → verify preview matches what the backend produced
- The facilitator UI (`GameFacilitator.tsx`, `ScriptReader.tsx`) should behave identically after switching to local engine
- Verify page refresh behavior: game state is lost (expected for Phase 04) — the UI should handle this gracefully rather than crashing

## Notes for Feature - Decomposer

Natural decomposition: **(1)** engine types → **(2)** instruction templates + wake instructions → **(3)** script generator + wake order resolver → **(4)** narrator preview → **(5)** game state machine → **(6)** frontend integration.

Key guidance:
- Features 2–4 are tightly coupled — instruction templates are used by both the script generator and preview. The instruction templates feature should be completed first since it's a shared dependency.
- Feature 4 (narrator preview) reuses `_generate_role_script()` from the script generator, so it comes after Feature 3.
- Feature 6 (frontend integration) should be last since it changes existing code across multiple pages and hooks.
- The frontend integration replaces 6 specific API calls (see Frontend Integration Map). Consider splitting it: game flow integration (5 calls in `WakeOrderResolution`, `GameFacilitator`, `useGame`) vs. preview integration (1 call in `RoleBuilder`).
- Hooks should keep their existing public interfaces where possible (`useGame` returns `{ game, loading, error, refetch }`) — the change is internal (local engine vs. API call).
- State management approach for in-memory game sessions is an implementation decision for Feature 5/6, not prescribed by this phase doc.
