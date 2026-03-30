# Phase 2: Game Facilitation

**Status**: Complete
**Depends on**: Phase 01 (Foundation)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Enable a facilitator to run a complete One Night Ultimate Werewolf game using the app, with generated narration scripts, a wake order engine, and a configurable discussion timer.

## Scope

### In Scope
- Game session model and CRUD API
- Night script generator based on selected roles
- Wake order engine with AND/OR/IF ability step logic
- Discussion timer with configurable duration
- Facilitator UI: game setup, role selection, script reader, timer display
- Game phase progression (setup → night → discussion → voting → resolution → complete)

### Out of Scope
- Custom role creation (Phase 03)
- User accounts and game ownership (Phase 04)
- Live multiplayer / real-time sync (non-goal)
- Audio narration (Phase 06)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | GameSession Model | SQLAlchemy model with phase state machine, player/center counts, timer config | Model, migration |
| 2 | Game API | CRUD endpoints for game sessions with role assignment | Router, service, schemas |
| 3 | Script Generator | Night script generation from selected roles and their ability steps | ScriptService |
| 4 | Wake Order Engine | Deterministic ordering with conditional step resolution | Step sequencing logic |
| 5 | Facilitator UI | Game setup page, role selection, script reader, timer | Frontend pages and components |

## Technical Context

- Game model: `app/models/game_session.py`
- Game service: `app/services/game_service.py`
- Script service: `app/services/script_service.py`
- Game router: `app/routers/games.py`
- Frontend: `src/pages/GameSetup.tsx`, facilitator page, timer component
- Builds on Role and AbilityStep models from Phase 01

## Dependencies & Risks

- **Dependency**: Phase 01 role/ability models and seed data must be stable
- **Risk**: Wake order collisions (multiple roles sharing the same wake_order value) produce non-deterministic script ordering; addressed in Phase 3.6

## Success Criteria

- [x] Facilitator can create a game session with selected roles
- [x] Night script generates correct wake/action/sleep instructions per role
- [x] Ability step conditionals (AND/OR/IF) resolve correctly
- [x] Discussion timer counts down with configurable duration
- [x] Full game flow works end-to-end with 5+ player roles

## QA Considerations

- Facilitator UI requires manual QA: game setup flow, script readability, timer behavior
- Script correctness must be verified against official game rules for all 30 seed roles

## Notes for Feature - Decomposer

Natural decomposition: game model/API → script generator → wake order engine → frontend facilitator flow → timer. The script generator depends on the wake order engine, so those are tightly coupled. QA docs exist in this folder.
