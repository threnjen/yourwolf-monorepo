# Wake Order Backend — Tasks

## Stage 1: Alembic Migrations + Seed Data Fix

- [x] Create Alembic data migration to update Doppelganger/Copycat `wake_order` from `0` to `1` (`20260328_000000_update_doppelganger_copycat_wake_order.py`)
- [x] Create Alembic schema migration to add `wake_order_sequence` JSON column to `game_sessions` (`20260328_010000_add_wake_order_sequence_to_game_sessions.py`)
- [x] Update Doppelganger seed data `wake_order` from `0` to `1` in `app/seed/roles.py`
- [x] Update Copycat seed data `wake_order` from `0` to `1` in `app/seed/roles.py`

## Stage 2: Model + Schema Updates

- [x] Add `wake_order_sequence: Mapped[list[str] | None]` column to `GameSession` model (`app/models/game_session.py`)
- [x] Add `wake_order_sequence: list[UUID] | None = Field(default=None)` to `GameSessionCreate` schema (`app/schemas/game.py`)
- [x] Add `wake_order_sequence: list[UUID] | None = None` to `GameSessionResponse` schema (`app/schemas/game.py`)

## Stage 3: Validation in `create_game()`

- [x] Add duplicate-ID check in `create_game()` — raise `ValueError` if `len(sequence) != len(set(sequence))`
- [x] Add extra-ID check — raise `ValueError` if sequence contains IDs not in `role_ids`
- [x] Add non-waking role check — raise `ValueError` if sequence contains IDs for roles with `wake_order` of None or 0
- [x] Add missing-waking-role check — raise `ValueError` listing names of waking roles absent from sequence
- [x] Convert validated `list[UUID]` to `list[str]` before storing on `GameSession`

## Stage 4: Script Service Update

- [x] In `generate_night_script()`, add conditional branch: if `game.wake_order_sequence` is truthy, query waking roles and sort by position in the sequence list
- [x] Preserve existing `Role.wake_order` ordering as else branch (fallback for null sequence)
- [x] Add debug logging to distinguish which ordering path is used

## Stage 5: Backend Tests

- [x] `test_models.py` — `TestGameSessionWakeOrderSequence::test_game_session_wake_order_sequence_default_none`
- [x] `test_models.py` — `TestGameSessionWakeOrderSequence::test_game_session_wake_order_sequence_stores_uuid_strings`
- [x] `test_seed.py` — `TestSeedWakeOrder::test_doppelganger_wake_order_is_1`
- [x] `test_seed.py` — `TestSeedWakeOrder::test_copycat_wake_order_is_1`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_stores_valid_wake_order_sequence`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_rejects_extra_role_in_sequence`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_rejects_missing_waking_role_in_sequence`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_rejects_duplicate_ids_in_sequence`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_accepts_null_sequence`
- [x] `test_game_service.py` — `TestWakeOrderSequenceValidation::test_accepts_empty_sequence_no_waking_roles`
- [x] `test_script_service.py` — `TestScriptWakeOrderSequence::test_night_script_uses_wake_order_sequence`
- [x] `test_script_service.py` — `TestScriptWakeOrderSequence::test_fallback_to_role_wake_order`
- [x] `test_games_router.py` — `TestWakeOrderSequenceRouter` (API-level: valid sequence, invalid sequence, null sequence)
- [x] Run full backend test suite and confirm all tests pass
