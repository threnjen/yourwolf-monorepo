# Phase 4: Client-Side Game Engine

**Status**: Planned
**Depends on**: Phase 3.6 (Wake Order Resolution)
**Estimated complexity**: Large
**Cross-references**: Python source in `yourwolf-backend/app/services/narration/`, `yourwolf-backend/app/services/script_service.py`, `yourwolf-backend/app/services/game_service.py`

> **Note**: A refactor-remediation phase landed after this document was first written. The script-generation logic it describes has been extracted from `ScriptService` into the pure `app/services/narration/` package, and the frontend now has a pure `src/domain/` layer. The port is correspondingly cheaper than originally scoped: the Python side to transcribe is already free of ORM and framework dependencies. Symbol names below have been updated to match the current source; the phase's scope and success criteria are unchanged.

## Objective

Port the night script generation engine, wake order logic, ability resolution, and narrator preview from the Python backend to TypeScript so the game can run entirely client-side with no server dependency.

## Scope

### In Scope
- TypeScript game engine module: `src/engine/` directory with pure functions (no React, no API calls). ESLint boundary rules for this path are already active.
- Port `narration/script_builder.build_night_script_actions()` (called by `ScriptService.generate_night_script()`)
- Port `narration/script_builder.build_role_script()` and `narration/templates.build_step_instruction()`
- Port `narration/templates.build_wake_instruction()` — branches on `wake_target` pattern (`player.self`, `team.*`, `role.*`)
- Port `narration/script_builder.build_preview_actions()` — draft role narrator preview
- Port step duration map (`STEP_DURATIONS`) and instruction template generation for all 15 ability types
- Port wake order sorting with custom sequence support (from Phase 3.6)
- Port `StepModifier` conditional logic (AND/OR/IF) resolution
- TypeScript types for engine inputs/outputs: `NightScript`, `NarratorAction`, `RoleInput`, `AbilityStepInput`
- Game state machine: phase transitions (setup → night → discussion → voting → resolution → complete)
- In-memory game session management (create, progress, complete — no persistence yet)
- Comprehensive unit tests for the engine matching existing Python test coverage (~1,230 lines in `test_script_service.py` plus ~310 lines in `test_narration_templates.py`)
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
| 1 | Engine Types | TypeScript interfaces for engine inputs/outputs, transcribed from `narration/inputs.py` (`RoleScriptInput`, `AbilityStepInput`) plus scripts, actions, game state. Build on `src/domain/` types; do not import `src/types`. | Type definitions |
| 2 | Instruction Templates | Port of `templates.py` — all 15 ability type templates via `build_step_instruction()`, plus `build_wake_instruction()`, `STEP_DURATIONS`, `get_step_duration()` | Template functions |
| 3 | Script Generator | Port of `build_night_script_actions()` / `build_role_script()` — takes roles + sequence, produces ordered `NarratorAction[]` | Core engine function |
| 4 | Narrator Preview | Port of `build_preview_actions()` — generates preview from draft role data without persisting | Preview function |
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

- **Primary source to port**: `yourwolf-backend/app/services/narration/` — a pure package with no DB, ORM, or session access. `templates.py` (`STEP_DURATIONS`, `build_step_instruction()`, `build_wake_instruction()`, `get_step_duration()`) and `script_builder.py` (`build_role_script()`, `build_night_script_actions()`, `build_preview_actions()`, `total_duration_seconds()`).
- **Port input contract**: `app/services/narration/inputs.py` — `RoleScriptInput` and `AbilityStepInput` frozen dataclasses. Field names were chosen to be transcribed one-for-one into the TS engine's types; start here.
- `yourwolf-backend/app/services/script_service.py` (~195 lines) — DB access and ORM→input adaptation only. Its `_role_to_input()` / `_preview_request_to_input()` adapters show what the engine must be fed, but the adapters themselves are backend-only and are not ported.
- Python game service: `yourwolf-backend/app/services/game_service.py` — phase management, `PHASE_ORDER`, role shuffling. Setup validation lives in `app/services/game_setup_validation.py`.
- Python models to mirror: `app/models/ability_step.py` (`StepModifier` enum), `app/models/game_session.py` (`GamePhase` enum)
- Existing Python test suites to replicate: `tests/test_script_service.py` and `tests/test_narration_templates.py` (the latter pins narrator copy verbatim — it is the parity oracle for this port)
- Existing frontend domain layer: `src/domain/` — `teams.ts` (`Team`, `TEAMS`), `roleDraft.ts` (`StepModifier`, `RoleDraft`, `AbilityStepDraft`), `wakeOrder.ts` (wake grouping/flattening, injectable RNG), `abilitySteps.ts`, `roleSelection.ts`, `constants.ts`. These are pure and are what the engine should build on.
- Existing frontend types: `src/types/transport.ts` (wire DTOs: `Role`, `AbilityStep`, `Visibility`, `NarratorPreviewAction`, `NarratorPreviewResponse`), `src/types/game.ts` (`GameSession`, `GamePhase`, `NarratorAction`, `NightScript`, `GameSessionCreate`). Note `src/types/role.ts` no longer exists, and `src/engine/` may not import from `src/types` at all — ESLint blocks it.
- Existing frontend hooks: `src/hooks/useGame.ts` (`useGame`, `useNightScript`), `src/hooks/useGameSetup.ts` — currently call API; will be updated to use local engine
- Existing API clients: `src/api/games.ts` (game create/start/advance/script/delete), `src/api/roles.ts` (`previewScript` method)
- Step durations map: 15 ability types with specific second values (8s for `view_card`, 6s for `swap_card`, etc.)
- Instruction templates: string generation per ability type with parameter interpolation (`wake_target`, card counts, direction, team names, etc.)
- Wake instruction generation: `build_wake_instruction()` branches on `wake_target` pattern — `player.self`, `team.*`, `role.*` (extracts role name from pattern); `None` is treated as `player.self`
- Preview script: `build_preview_actions()` takes the same `RoleScriptInput` as the night script path and adds a section header for `perform_immediately`/`perform_as` steps. The old `_StandInRole` / `_StandInStep` / `_StandInAbility` shim classes are gone — preview and night script now share one input type, so there is only one shape to port.
- **Narrator copy is frozen and must be transcribed verbatim, bugs included.** `_thumbs_up_instruction` renders `team.werewolf` as "Werewolfs" while `build_wake_instruction` says "Werewolves". This inconsistency is deliberate, pinned at source and in `tests/test_narration_templates.py`. The port is correct only when it reproduces it. Do not silently fix copy during the port — that is a separate change that must update source, pinned test, and port together.
- The engine module must have zero dependencies on React, DOM APIs, or Node.js — pure TypeScript functions that can run anywhere. This is now machine-enforced: `eslint.config.js` restricts `src/engine/**` from importing React, `api`, `hooks`, `components`, `pages`, `styles`, and `types`.

## Edge Cases & Failure Modes

- **Roles with no ability steps**: A role that wakes but has no steps — engine should still produce wake + close-eyes actions (the Python code handles this naturally via the loop)
- **Roles with `wake_order == null` or `wake_order == 0`**: Must be excluded from night script generation — the Python code explicitly filters these out
- **Unknown ability types**: `build_step_instruction()` returns `None` for unrecognized types — the TS engine should silently skip (no action added), matching Python behavior. `get_step_duration()` falls back to a default for types absent from `STEP_DURATIONS`.
- **Empty night script**: A game where no roles wake (all have `wake_order == null` or 0) — engine should still produce the opening "close your eyes" and closing "open your eyes" narrator actions
- **`StepModifier.OR` interaction**: Steps with `OR` modifier get "OR " prefixed to their instruction text *and* set `requires_player_action = true` — both behaviors must be preserved
- **Preview with `wake_order == null` or 0**: `ScriptService.preview_role_script()` returns an empty actions array (no script generated) — must match this behavior. Note this filter lives in `ScriptService`, not in the narration package, so the engine must apply it explicitly.
- **`perform_immediately` / `perform_as` in preview**: Preview adds a special section header action when these ability types are present — this logic is unique to preview and must be ported
- **Custom wake order sequence with missing roles**: If a role ID in the sequence is not in the game's waking roles, it should be ignored during sort (Python uses `.get()` with a fallback index)
- **Duplicate role instances in the same game**: Multiple copies of the same role in a game — the script should only generate one script block per unique role (Python de-duplicates via `set()` on role IDs)

## Dependencies & Risks

- **Dependency**: Phase 3.6 wake order sequence logic must be stable — the engine must support both default and custom ordering
- **Risk**: Python-to-TypeScript translation errors — mitigate by writing matching test cases from existing Python tests (~1,540 lines across `test_script_service.py` and `test_narration_templates.py`) and verifying output parity. `test_narration_templates.py` pins narrator copy exactly and is the parity oracle.
- **Risk**: Edge cases in conditional step resolution (AND/OR/IF chains) — the Python implementation handles these; tests must cover the same scenarios
- **Risk**: Frontend integration complexity — 6 API call sites across 3 pages and 2 hooks need replacement; mitigate by creating an adapter layer so hooks keep their existing public interface (`useGame` still returns `{ game, loading, error, refetch }`)
- **Risk**: Game state management — in-memory game sessions are lost on page refresh (acceptable for Phase 04; persistence comes in Phase 05)
- **Mitigation**: Keep the Python backend running during development as a reference; run both engines with the same inputs and compare outputs

## Success Criteria

- [ ] TypeScript engine generates identical night scripts to the Python backend for all 30 seed roles
- [ ] All 15 ability type instruction templates produce narrator text identical to `templates.py`, including the frozen "Werewolfs" output pinned in `test_narration_templates.py`
- [ ] All `build_wake_instruction()` branches produce correct wake-up text
- [ ] Wake order sorting matches Python behavior (default order and custom sequence)
- [ ] Step modifier conditionals (AND/OR/IF) resolve correctly
- [ ] `build_preview_actions()` produces identical preview output to the Python backend, including section headers for `perform_immediately`/`perform_as`
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
