# Phase 4: Client-Side Game Engine

**Status**: Planned
**Depends on**: Phase 3.6 (Wake Order Resolution)
**Estimated complexity**: Large
**Cross-references**: Python source in `yourwolf-backend/app/services/script_service.py`, `yourwolf-backend/app/services/game_service.py`

## Objective

Port the night script generation engine, wake order logic, and ability resolution from the Python backend to TypeScript so the game can run entirely client-side with no server dependency.

## Scope

### In Scope
- TypeScript game engine module: `src/engine/` directory with pure functions (no React, no API calls)
- Port `ScriptService.generate_night_script()` logic to TypeScript
- Port `ScriptService._generate_role_script()` and `ScriptService._generate_step_instruction()` to TypeScript
- Port step duration map (`STEP_DURATIONS`) and instruction template generation for all 15 ability types
- Port wake order sorting with custom sequence support (from Phase 3.6)
- Port `StepModifier` conditional logic (AND/OR/IF) resolution
- TypeScript types for engine inputs/outputs: `NightScript`, `NarratorAction`, `RoleInput`, `AbilityStepInput`
- Game state machine: phase transitions (setup → night → discussion → voting → resolution → complete)
- In-memory game session management (create, progress, complete — no persistence yet)
- Comprehensive unit tests for the engine matching existing Python test coverage
- Engine works in both browser and Tauri contexts (pure TypeScript, no DOM or Node dependencies)

### Out of Scope
- Data persistence (Phase 05 — Local Data Layer)
- Tauri integration or native packaging (Phase 06)
- Audio narration (Phase 07)
- Removing or modifying the Python backend (it remains for future cloud use)
- Conditional ability builder UI (Phase 11 — Advanced Features)
- Any API calls — the engine operates on in-memory data structures

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Engine Types | TypeScript interfaces for engine inputs/outputs: roles, ability steps, scripts, actions | Type definitions |
| 2 | Script Generator | Port of `generate_night_script()` — takes roles + sequence, produces ordered `NarratorAction[]` | Core engine function |
| 3 | Instruction Templates | Port of `_generate_step_instruction()` — all 15 ability type templates | Template functions |
| 4 | Wake Order Resolver | Sort roles by wake order with custom sequence override | Sort utility |
| 5 | Game State Machine | Phase transitions, timer state, current wake index tracking | State management |
| 6 | Frontend Integration | Replace API calls to script/game endpoints with local engine calls | Hook/service updates |

## Technical Context

- Python source to port: `yourwolf-backend/app/services/script_service.py` — `ScriptService` class (~450 lines), contains `generate_night_script()`, `_generate_role_script()`, `_generate_step_instruction()`, `preview_role_script()`
- Python game service: `yourwolf-backend/app/services/game_service.py` — game creation and phase management
- Python models to mirror: `app/models/ability_step.py` (`StepModifier` enum), `app/models/game_session.py` (`GamePhase` enum)
- Existing frontend types: `src/types/role.ts` (Role, AbilityStep, Team types), `src/types/game.ts` (GameSession, GamePhase, NarratorAction types)
- Existing frontend hooks: `src/hooks/useGame.ts`, `src/hooks/useGameSetup.ts` — currently call API; will be updated to use local engine
- Existing API client: `src/api/games.ts` — game creation/management calls to backend
- Step durations map: 15 ability types with specific second values (8s for view_card, 6s for swap_card, etc.)
- Instruction templates: string generation per ability type with parameter interpolation (wake_target, card counts, etc.)
- The engine module must have zero dependencies on React, DOM APIs, or Node.js — pure TypeScript functions that can run anywhere

## Dependencies & Risks

- **Dependency**: Phase 3.6 wake order sequence logic must be stable — the engine must support both default and custom ordering
- **Risk**: Python-to-TypeScript translation errors — mitigate by writing matching test cases from existing Python tests and verifying output parity
- **Risk**: Edge cases in conditional step resolution (AND/OR/IF chains) — the Python implementation handles these; tests must cover the same scenarios
- **Risk**: Frontend integration complexity — switching from API-driven to local engine requires updating hooks and removing server round-trips; mitigate by creating an adapter layer so hooks don't change their public interface
- **Mitigation**: Keep the Python backend running during development as a reference; run both engines with the same inputs and compare outputs

## Success Criteria

- [ ] TypeScript engine generates identical night scripts to the Python backend for all 30 seed roles
- [ ] All 15 ability type instruction templates produce correct narrator text
- [ ] Wake order sorting matches Python behavior (default order and custom sequence)
- [ ] Step modifier conditionals (AND/OR/IF) resolve correctly
- [ ] Game state machine progresses through all phases (setup → night → discussion → voting → resolution → complete)
- [ ] Frontend game flow works without any backend API calls for script generation or game management
- [ ] Engine has no dependencies on DOM, Node, or React APIs
- [ ] Unit test coverage ≥90% for engine module

## QA Considerations

- End-to-end game flow must be manually tested: create game → run night phase → verify script matches expected output
- Compare engine output against Python backend for regression (same roles, same wake order → same script)
- The facilitator UI (`GameFacilitator.tsx`, `ScriptReader.tsx`) should behave identically after switching to local engine

## Notes for Feature - Decomposer

Natural decomposition: engine types → instruction templates → script generator → wake order resolver → game state machine → frontend integration. The instruction templates and script generator are tightly coupled. Frontend integration should be last since it changes existing code. Consider having a temporary "dual mode" where both local engine and API are available for comparison testing.
- Token expiry and refresh behavior should be tested with time manipulation

## Notes for Feature - Decomposer

Suggested decomposition: (1) Cognito backend integration + auth dependencies, (2) User model + migration + API, (3) role endpoint auth integration, (4) frontend auth context + SDK wrapper, (5) auth pages (login/signup/verify), (6) profile page + "My Roles". Features 1-3 are backend-only; 4-6 are frontend-only after the backend is ready. The auth context (feature 4) is a prerequisite for all other frontend features.
