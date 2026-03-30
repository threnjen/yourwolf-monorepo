# Phase 3.6: Wake Order Resolution

**Status**: Complete
**Depends on**: Phase 3.5 (Narrator Preview Fixes)
**Estimated complexity**: Medium
**Cross-references**: None

## Objective

Add a "Review Wake Order" step between role selection and game creation so users can customize the order of roles within each wake order group, solving non-deterministic script generation when multiple roles share the same wake order value.

## Scope

### In Scope
- Fix seed data: Doppelganger and Copycat `wake_order` from 0 to 1 (with Alembic data migration)
- Add `wake_order_sequence` JSON column to `game_sessions` table
- Validate sequence on game creation (exact match to waking role IDs, no duplicates)
- Update `generate_night_script()` to use stored sequence when present
- New "Review Wake Order" page at `/games/new/wake-order` with drag-to-reorder
- Add `@dnd-kit/core` and `@dnd-kit/sortable` dependencies
- Roles grouped by wake order value, randomly shuffled within groups on load
- Drag reordering within groups only (not across group boundaries)
- "Start Game" always enabled (random initial order is valid)

### Out of Scope
- Reordering roles across wake order groups
- Persisting preferred orderings across games
- Ability to skip the wake order review step

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Seed Data Fix | Update Doppelganger/Copycat wake_order; Alembic data migration | Migration, seed update |
| 2 | Wake Order Sequence | New column on GameSession, validation in game creation | Model, schema, service |
| 3 | Script Generator Update | Use stored sequence for role ordering, fall back to default | Backend service |
| 4 | Review Wake Order Page | Drag-to-reorder UI with grouped tiles, team-colored borders | Frontend page |
| 5 | Game Setup Flow Change | "Start Game" → "Next" button, Router state passing | Frontend navigation |

## Technical Context

- Game session model: `app/models/game_session.py`
- Game service: `app/services/game_service.py` (`create_game`)
- Script service: `app/services/script_service.py` (`generate_night_script`)
- Frontend game setup: `src/pages/GameSetup.tsx`
- New page: `src/pages/ReviewWakeOrder.tsx` (or similar)
- Hook: `src/hooks/useGameSetup.ts`
- Routes: `src/routes.tsx`
- Drag library: `@dnd-kit/core`, `@dnd-kit/sortable`

## Dependencies & Risks

- **Dependency**: Phase 3.5 must be applied (wake_order == 0 semantics established)
- **Risk**: Backward compatibility — games created before this feature have no `wake_order_sequence`; mitigated by null fallback to default ordering

## Success Criteria

- [x] Doppelganger and Copycat have `wake_order: 1` in fresh and existing databases
- [x] Review Wake Order page renders tiles grouped by wake order
- [x] Tiles randomly shuffled within groups on load
- [x] Drag reorders within group; cannot cross group boundaries
- [x] Game creation includes `wake_order_sequence` in payload
- [x] Night script uses stored sequence when present
- [x] Night script falls back to `Role.wake_order` when sequence is null

## QA Considerations

- Drag-to-reorder interaction requires manual QA across browsers
- QA doc exists in this folder

## Notes for Feature - Decomposer

Natural split: seed data fix (standalone migration) → backend sequence storage/validation → script generator update → frontend page. The frontend page is the largest feature and could be further split into layout/rendering vs. drag interaction.
