# Tasks: Backend Service Validator Extraction & Pagination Helper

## Stage 1: Game-setup validator module

- [x] Verify feature 07 has landed: confirm the post-consolidation rule set in `game_service.py` (including the relocated card-total rule) and the domain exception types it raises — confirmed: card-total rule inline in `create_game`, raises `DomainValidationError` (feature 04's `app/exceptions.py`)
- [x] Create the game-setup validation module (`app/services/game_setup_validation.py`) and move `_validate_card_counts`, `_validate_primary_teams`, `_validate_dependencies`, and `_validate_wake_sequence` (plus the relocated count rule) into it as-is, preserving evaluation order and raise types — diff-verified against `2d0d8f3`: only `self`-removal and black reflow, zero logic change
- [x] Rewire `GameService` to delegate to the new module with no public method signature changes — verified by diffing public method signatures against baseline
- [x] Split `tests/test_game_service.py`: relocate validation tests to a dedicated test module (`tests/test_game_setup_validation.py`); keep lifecycle tests and service-level delegation coverage in place
- [x] Run full suite; confirm green

## Stage 2: Role validator module

- [x] Create the role validation module (`app/services/role_validation.py`) and move `validate_role` and `get_warnings` from `RoleService` into it, keeping the raising vs. advisory (non-raising) split intact — also moved `check_duplicate_name` (a direct dependency of `validate_role`)
- [x] Rewire `RoleService` (including the feature-07 create-path validation) to delegate to the new module with no public method signature changes
- [~] Update the existing `tests/test_role_validation.py` imports/targets to exercise the new module; keep service-level delegation tests in `tests/test_role_service.py` — **deviated**: left `test_role_validation.py` on `RoleService` to preserve delegation coverage; added `tests/test_role_validation_module.py` for direct seam coverage instead (see implementation record, Deviation 2)
- [x] Verify `tests/test_roles.py` router behavior is unchanged; run full suite green — unchanged, 42 tests still pass

## Stage 3: Pagination helper

- [x] Pin current pagination edge behavior with new unit tests: limit=0, empty result set, last partial page, out-of-range page — `tests/test_pagination.py` (17 tests), written before the switch
- [x] Create the shared `paginate()` helper (`app/services/pagination.py`) implementing the `count → math.ceil(total/limit) → offset` logic once
- [x] Replace the duplicated blocks in `role_service.py` (`list_roles`) and `game_service.py` (`list_games`) with the helper; both list endpoints return identical results to before — differential test recomputes the original expressions
- [~] Verify AC4: `game_service.py` and `role_service.py` each below ~400 lines; no public API changes — **partial**: `game_service.py` 520→321 ✅; `role_service.py` 528→425 ❌ (blocked by the DTO-mapping non-goal; see implementation record, Gap 1). Public API unchanged ✅
- [x] Verify AC5: full suite passes with equal-or-higher assertion count — 246→282 asserts, 147→184 tests, 0 lost (measured against an isolated `2d0d8f3` extract to exclude feature 10's concurrent additions)
- [x] Run black, isort, and mypy; record final module names chosen for `[PROPOSED]` items in implementation notes — black/isort clean; mypy net-zero (23→23); names recorded in the implementation record Summary
