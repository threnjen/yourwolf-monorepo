# Tasks: Backend Service Validator Extraction & Pagination Helper

## Stage 1: Game-setup validator module

- [ ] Verify feature 07 has landed: confirm the post-consolidation rule set in `game_service.py` (including the relocated card-total rule) and the domain exception types it raises
- [ ] Create the game-setup validation module [PROPOSED - name TBD, e.g. `app/services/game_setup_validation.py`] and move `_validate_card_counts`, `_validate_primary_teams`, `_validate_dependencies`, and `_validate_wake_sequence` (plus the relocated count rule) into it as-is, preserving evaluation order and raise types
- [ ] Rewire `GameService` to delegate to the new module with no public method signature changes
- [ ] Split `tests/test_game_service.py`: relocate validation tests to a dedicated test module [PROPOSED - name TBD]; keep lifecycle tests and service-level delegation coverage in place
- [ ] Run full suite; confirm green (`uv run --with-requirements requirements-dev.txt --with-requirements requirements.txt pytest -q`)

## Stage 2: Role validator module

- [ ] Create the role validation module [PROPOSED - name TBD, e.g. `app/services/role_validation.py`] and move `validate_role` and `get_warnings` from `RoleService` into it, keeping the raising vs. advisory (non-raising) split intact
- [ ] Rewire `RoleService` (including the feature-07 create-path validation) to delegate to the new module with no public method signature changes
- [ ] Update the existing `tests/test_role_validation.py` imports/targets to exercise the new module; keep service-level delegation tests in `tests/test_role_service.py`
- [ ] Verify `tests/test_roles.py` router behavior is unchanged; run full suite green

## Stage 3: Pagination helper

- [ ] Pin current pagination edge behavior with new unit tests if untested: limit=0, empty result set, last partial page, out-of-range page (test names [PROPOSED - name TBD])
- [ ] Create the shared `paginate()` helper [PROPOSED - name TBD; location TBD, e.g. near `app/schemas/base.py`] implementing the `count → math.ceil(total/limit) → offset` logic once
- [ ] Replace the duplicated blocks in `role_service.py` (`list_roles`) and `game_service.py` (`list_games`) with the helper; both list endpoints return identical results to before
- [ ] Verify AC4: `game_service.py` and `role_service.py` each below ~400 lines; no public API changes (code-review evidence)
- [ ] Verify AC5: full suite passes with equal-or-higher assertion count vs. baseline (test_game_service 59, test_roles 103, test_role_validation 45, test_role_service 31)
- [ ] Run black, isort, and mypy; record final module names chosen for `[PROPOSED]` items in implementation notes
