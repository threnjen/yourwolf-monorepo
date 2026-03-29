# Wake Order Backend — Context

## Key Files

| File | Role | Lines of Interest |
|------|------|------------------|
| `yourwolf-backend/app/models/game_session.py` | `GameSession` ORM model with `wake_order_sequence` JSON column | L82–L85: `wake_order_sequence: Mapped[list[str] \| None]` mapped to `JSON, nullable=True` |
| `yourwolf-backend/app/models/game_role.py` | `GameRole` junction table — unchanged by this feature | Entire file |
| `yourwolf-backend/app/schemas/game.py` | Pydantic schemas — `GameSessionCreate` (L18: `wake_order_sequence: list[UUID] \| None = Field(default=None)`), `GameSessionResponse` (L50: `wake_order_sequence: list[UUID] \| None = None`) | L11–L19, L38–L54 |
| `yourwolf-backend/app/services/game_service.py` | `create_game()` with sequence validation (L133–L183), stores as `list[str]` (L185–L191) | L133–L195 |
| `yourwolf-backend/app/services/script_service.py` | `generate_night_script()` — custom sequence branch (L107–L124) vs fallback branch (L126–L138) | L105–L140 |
| `yourwolf-backend/app/seed/roles.py` | Seed data — Doppelganger at L413 (`wake_order: 1`), Copycat at L444 (`wake_order: 1`) | L413, L444 |
| `yourwolf-backend/alembic/versions/20260328_000000_update_doppelganger_copycat_wake_order.py` | Data migration: `UPDATE roles SET wake_order = 1 WHERE name IN ('Doppelganger', 'Copycat') AND wake_order = 0` | Full file |
| `yourwolf-backend/alembic/versions/20260328_010000_add_wake_order_sequence_to_game_sessions.py` | Schema migration: adds `wake_order_sequence` JSON column | Full file |
| `yourwolf-backend/tests/conftest.py` | `seeded_roles` fixture — 8 roles (Werewolf wake=1, Seer wake=4, Insomniac wake=9, Robber wake=3, Troublemaker wake=5, Villager×3 wake=None) | L308–L430 |
| `yourwolf-backend/tests/test_game_service.py` | `TestWakeOrderSequenceValidation` class (L760+) — 6 tests covering AC5–AC9 | L760–L870 |
| `yourwolf-backend/tests/test_script_service.py` | `TestScriptWakeOrderSequence` class (L1221+) — tests for AC10, AC11 | L1221+ |
| `yourwolf-backend/tests/test_seed.py` | `TestSeedWakeOrder` — tests Doppelganger and Copycat seed `wake_order` | Full file |
| `yourwolf-backend/tests/test_games_router.py` | `TestWakeOrderSequenceRouter` (L237+) — API-level tests | L237–L292 |
| `yourwolf-backend/tests/test_models.py` | `TestGameSessionWakeOrderSequence` (L358+) — model column tests | L358–L385 |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Store UUIDs as strings in JSON column | JSON has no native UUID type; SQLite and PostgreSQL both support `JSON` with string values. Pydantic handles UUID ↔ str conversion at the schema boundary. |
| Nullable column with fallback | Backward compatibility: existing games (pre-feature) have `wake_order_sequence = null` and continue to work via the `Role.wake_order` fallback path in `generate_night_script()`. |
| Validate sequence in `create_game()` rather than a separate endpoint | Follows the existing pattern where all game creation validation lives in `GameService.create_game()`. No new endpoints needed. |
| Separate data migration from schema migration | The data migration (Doppelganger/Copycat `wake_order` fix) and schema migration (new column) are independent operations. Separate migrations allow independent rollback. |
| Seed data updated in-place | The seed runner is insert-or-skip — it won't update existing rows. The Alembic data migration handles existing databases; the seed data change is for fresh databases only. |

## Constraints

- Must run on both PostgreSQL (production) and SQLite (tests) — `JSON` column type is compatible with both
- Alembic migration chain: `c3d4e5f6a7b8` → `d4e5f6a7b8c9` (data migration) → `e5f6a7b8c9d0` (schema migration)
- The `seeded_roles` fixture in `conftest.py` does NOT include Doppelganger or Copycat — seed data tests use `ROLES_DATA` directly from the seed module

## Relationship to Sibling Plans

- **wake-order-frontend** depends on this feature's backend contract (`GameSessionCreate.wake_order_sequence`, `GameSessionResponse.wake_order_sequence`)
- This feature should be implemented and verified first
- The frontend feature adds no backend changes — it only consumes the API

## Current Implementation Status

Based on codebase review, **all backend work for this feature appears to already be implemented**:

1. ✅ Alembic migrations exist (`20260328_000000` and `20260328_010000`)
2. ✅ `GameSession` model has `wake_order_sequence` column (L82–L85)
3. ✅ `GameSessionCreate` schema has `wake_order_sequence` field (L18)
4. ✅ `GameSessionResponse` schema has `wake_order_sequence` field (L50)
5. ✅ `create_game()` has full validation logic (L133–L183)
6. ✅ `generate_night_script()` has custom sequence + fallback logic (L107–L138)
7. ✅ Seed data has Doppelganger `wake_order: 1` and Copycat `wake_order: 1`
8. ✅ Tests exist for all acceptance criteria

The Implementer should verify all tests pass and review for correctness, but no new code needs to be written.
