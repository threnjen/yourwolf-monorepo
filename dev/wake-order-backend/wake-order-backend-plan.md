# Wake Order Backend — Plan

## Summary

Add backend support for a per-game wake order sequence: Alembic migrations (schema + data), model/schema updates, `create_game()` validation, `generate_night_script()` ordering with fallback, and Doppelganger/Copycat seed data fix. This establishes the backend contract consumed by the frontend Review Wake Order page (Feature 2).

---

## A. Requirements & Traceability

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | Alembic schema migration adds nullable `wake_order_sequence` JSON column to `game_sessions` |
| AC2 | `GameSession` model exposes `wake_order_sequence: list[str] \| None` mapped to the JSON column |
| AC3 | Alembic data migration updates Doppelganger and Copycat `wake_order` from `0` to `1` in existing databases |
| AC4 | Seed data for Doppelganger and Copycat has `wake_order: 1` (fresh databases) |
| AC5 | `GameSessionCreate` schema accepts optional `wake_order_sequence: list[UUID] \| None` |
| AC6 | `create_game()` rejects sequences containing role IDs not in `role_ids` (400) |
| AC7 | `create_game()` rejects sequences missing a waking role that is in `role_ids` (400) |
| AC8 | `create_game()` rejects sequences with duplicate IDs (400) |
| AC9 | `create_game()` accepts null/omitted `wake_order_sequence` |
| AC10 | `generate_night_script()` orders roles by `wake_order_sequence` when present |
| AC11 | `generate_night_script()` falls back to `Role.wake_order` ordering when sequence is null |
| AC12 | `GameSessionResponse` includes `wake_order_sequence: list[UUID] \| None` |
| AC13 | `create_game()` rejects sequences containing non-waking role IDs (400) |

### Non-Goals

- Frontend implementation (separate Feature 2)
- Persisting wake order preferences across games
- Cross-group reordering logic (only sequence storage; group constraints are frontend-only)
- Modifying the Role Builder or preview endpoint

### Traceability Matrix

| AC | Code Areas / Modules | Planned Tests |
|----|---------------------|---------------|
| AC1 | `alembic/versions/20260328_010000_add_wake_order_sequence_to_game_sessions.py` | `test_models.py::TestGameSessionWakeOrderSequence::test_game_session_wake_order_sequence_default_none` |
| AC2 | `app/models/game_session.py` — `wake_order_sequence` column | `test_models.py::TestGameSessionWakeOrderSequence::test_game_session_wake_order_sequence_stores_uuid_strings` |
| AC3 | `alembic/versions/20260328_000000_update_doppelganger_copycat_wake_order.py` | Manual: `alembic upgrade head` on existing DB |
| AC4 | `app/seed/roles.py` — Doppelganger and Copycat entries | `test_seed.py::TestSeedWakeOrder::test_doppelganger_wake_order_is_1`, `test_seed.py::TestSeedWakeOrder::test_copycat_wake_order_is_1` |
| AC5 | `app/schemas/game.py` — `GameSessionCreate` | `test_schemas.py` (if applicable), `test_game_service.py::TestWakeOrderSequenceValidation::test_stores_valid_wake_order_sequence` |
| AC6 | `app/services/game_service.py` — `create_game()` extra-IDs check | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_extra_role_in_sequence` |
| AC7 | `app/services/game_service.py` — `create_game()` missing-waking check | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_missing_waking_role_in_sequence` |
| AC8 | `app/services/game_service.py` — `create_game()` duplicate check | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_duplicate_ids_in_sequence` |
| AC9 | `app/services/game_service.py` — `create_game()` null path | `test_game_service.py::TestWakeOrderSequenceValidation::test_accepts_null_sequence` |
| AC10 | `app/services/script_service.py` — `generate_night_script()` custom ordering | `test_script_service.py::TestScriptWakeOrderSequence::test_night_script_uses_wake_order_sequence` |
| AC11 | `app/services/script_service.py` — `generate_night_script()` fallback | `test_script_service.py::TestScriptWakeOrderSequence::test_fallback_to_role_wake_order` |
| AC12 | `app/schemas/game.py` — `GameSessionResponse` | `test_games_router.py::TestWakeOrderSequenceRouter` |
| AC13 | `app/services/game_service.py` — `create_game()` non-waking check | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_non_waking_role_in_sequence` (implicit in existing validation) |

---

## B. Correctness & Edge Cases

### Key Workflows

1. **Happy path**: Client sends `wake_order_sequence` with all waking role UUIDs in desired order → stored on `GameSession` → `generate_night_script()` uses it
2. **Null sequence**: Client omits field → null stored → script falls back to `Role.wake_order`
3. **Empty sequence, no waking roles**: All selected roles are non-waking → empty list is valid
4. **Existing games (pre-migration)**: `wake_order_sequence` is null → fallback works

### Failure Modes

| Case | Expected |
|------|----------|
| Sequence contains role ID not in `role_ids` | `ValueError` → 400 |
| Sequence missing a waking role from `role_ids` | `ValueError` → 400 with names of missing roles |
| Duplicate IDs in sequence | `ValueError` → 400 |
| Non-waking role ID in sequence | `ValueError` → 400 |

### Validation Rules

- `wake_order_sequence` must contain exactly the set of unique waking role IDs (roles with `wake_order is not None and wake_order != 0`) from `role_ids`
- No duplicates, no extras, no missing waking roles
- Stored as `list[str]` (UUID strings) in JSON column for SQLite/PostgreSQL compatibility

### Error-Handling Strategy

- All validation errors are raised as `ValueError` from `GameService.create_game()`, consistent with existing card-count and dependency validation
- The router layer catches `ValueError` and returns 400 (already implemented in `games_router.py`)

---

## C. Consistency & Architecture Fit

### Existing Patterns Followed

- **Models**: `GameSession` already uses `Mapped` + `mapped_column` pattern; new column follows the same style (see `current_wake_order` precedent)
- **Schemas**: `GameSessionCreate` uses Pydantic `BaseModel` with `Field`; new field uses `Field(default=None)` consistent with optional fields
- **Validation**: `create_game()` already validates role counts, primary team roles, and dependencies with `errors` list and `ValueError`; sequence validation follows the same accumulate-and-raise pattern
- **Alembic**: Existing migrations use `op.add_column` pattern; data migration uses `op.execute` with raw SQL
- **JSON storage**: UUID strings stored as `list[str]` since JSON doesn't natively support UUID type; conversion happens at the service layer boundary
- **Naming**: snake_case for Python, matches existing column naming (`current_wake_order`, `center_card_count`)

### Interfaces / Contracts

- **Input**: `GameSessionCreate.wake_order_sequence: list[UUID] | None = None`
- **Storage**: `GameSession.wake_order_sequence: list[str] | None` (JSON column, UUID strings)
- **Output**: `GameSessionResponse.wake_order_sequence: list[UUID] | None = None`
- **Script service**: Reads `game.wake_order_sequence` (list of UUID strings) and uses position in list as sort key

---

## D. Clean Design & Maintainability

### Design Approach

The simplest design: a single nullable JSON column storing an ordered list of UUID strings. No new tables, no normalization of the sequence. This is a per-game ephemeral ordering — not shared or reused across games.

### Complexity Risks

- **UUID string conversion**: The schema accepts `list[UUID]` but storage is `list[str]`. Conversion happens in `create_game()` (UUID → str) and is reversed in `GameSessionResponse` (str → UUID via Pydantic). This is already implemented and working.
- **JSON column portability**: SQLAlchemy `JSON` type works on both PostgreSQL and SQLite. No risk here.

### Keep-It-Clean Checklist

- [ ] No new tables — single column addition
- [ ] Validation logic lives in `GameService.create_game()`, consistent with other validations
- [ ] No changes to the router layer needed (it already forwards the schema)
- [ ] Fallback in `generate_night_script()` is a single conditional branch

---

## E. Completeness: Observability, Security, Operability

### Logging

- `create_game()`: Existing info-level log already captures role count; no additional logging needed
- `generate_night_script()`: Already has debug log distinguishing custom vs default ordering path

### Security

- Wake order sequence is validated server-side (role IDs must match `role_ids`, must be waking roles, no duplicates)
- No user authentication changes (facilitator_id is already nullable)
- No secrets or sensitive data involved

### Operability

- **Deploy**: Run `alembic upgrade head` — applies both the data migration (Doppelganger/Copycat fix) and schema migration (new column)
- **Verify**: `POST /api/games` with `wake_order_sequence` returns it in response; `GET /api/games/{id}/script` uses custom order
- **Rollback**: `alembic downgrade -1` removes column; `-2` reverts Doppelganger/Copycat to `wake_order: 0`
- **Monitor**: Existing error logging in the router catches and logs 400s

---

## F. Test Plan

### Test Mapping

| AC | Test Type | Test Name |
|----|-----------|-----------|
| AC1–AC2 | Unit | `test_models.py::TestGameSessionWakeOrderSequence` (2 tests) |
| AC4 | Unit | `test_seed.py::TestSeedWakeOrder` (2 tests) |
| AC5 | Integration | `test_game_service.py::TestWakeOrderSequenceValidation::test_stores_valid_wake_order_sequence` |
| AC6 | Integration | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_extra_role_in_sequence` |
| AC7 | Integration | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_missing_waking_role_in_sequence` |
| AC8 | Integration | `test_game_service.py::TestWakeOrderSequenceValidation::test_rejects_duplicate_ids_in_sequence` |
| AC9 | Integration | `test_game_service.py::TestWakeOrderSequenceValidation::test_accepts_null_sequence` |
| AC10 | Integration | `test_script_service.py::TestScriptWakeOrderSequence::test_night_script_uses_wake_order_sequence` |
| AC11 | Integration | `test_script_service.py::TestScriptWakeOrderSequence::test_fallback_to_role_wake_order` |
| AC12 | API | `test_games_router.py::TestWakeOrderSequenceRouter` (3 tests) |

### Top 5 High-Value Test Cases

1. **Given** a valid `wake_order_sequence` in reversed default order, **When** `create_game()` is called, **Then** the game stores the sequence and `generate_night_script()` produces roles in that reversed order
2. **Given** a sequence missing one waking role, **When** `create_game()` is called, **Then** a `ValueError` is raised naming the missing role
3. **Given** a game created without `wake_order_sequence`, **When** `generate_night_script()` is called, **Then** roles appear in ascending `Role.wake_order` order (backward compatibility)
4. **Given** the seed data file, **When** Doppelganger and Copycat entries are inspected, **Then** both have `wake_order: 1`
5. **Given** `POST /api/games` with a valid sequence, **When** the response is returned, **Then** `wake_order_sequence` is present in the response body

### Test Data / Fixtures

- Uses existing `seeded_roles` fixture (Werewolf wake=1, Seer wake=4, Insomniac wake=9, Robber wake=3, Troublemaker wake=5, Villager×3 wake=None)
- Wake order sequence tests pass subsets/reorderings of waking role IDs from this fixture
- No new fixtures needed

---

## Stages

### Stage 1: Alembic Migrations + Seed Data Fix

**Goal**: Database schema and data are updated
**Success Criteria**: Migration adds `wake_order_sequence` column; data migration updates Doppelganger/Copycat; seed data file has `wake_order: 1` for both
**Status**: Already implemented — migrations exist at `20260328_000000` and `20260328_010000`; seed data already updated

### Stage 2: Model + Schema Updates

**Goal**: `GameSession` model and Pydantic schemas reflect the new column
**Success Criteria**: `GameSession.wake_order_sequence` column exists; `GameSessionCreate` accepts optional sequence; `GameSessionResponse` includes it
**Status**: Already implemented

### Stage 3: Validation in `create_game()`

**Goal**: Server-side validation rejects invalid sequences
**Success Criteria**: All validation error cases (AC6–AC8, AC13) raise `ValueError`; valid sequences (AC5, AC9) are accepted and stored
**Status**: Already implemented

### Stage 4: Script Service Update

**Goal**: `generate_night_script()` uses custom sequence when present, falls back otherwise
**Success Criteria**: AC10 and AC11 pass
**Status**: Already implemented

### Stage 5: Backend Tests

**Goal**: Full test coverage for all acceptance criteria
**Success Criteria**: All tests in `test_models.py`, `test_seed.py`, `test_game_service.py`, `test_script_service.py`, and `test_games_router.py` pass for wake_order_sequence features
**Status**: Already implemented
