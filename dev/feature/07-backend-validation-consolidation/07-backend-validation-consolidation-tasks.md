# Tasks: Backend Validation Placement Consolidation

## Stage 1: Game-creation rule relocation (AC1, AC4)

- [ ] Transplant the role-count-vs-players rule from `app/routers/games.py` (~L40–L49) into `GameService.create_game`, copying the arithmetic and error message verbatim, placed alongside the existing four validators
- [ ] Raise feature 04's domain validation exception (not `ValueError`) for the relocated rule, consistent with how 04 left the other `create_game` validators
- [ ] Delete the router-level guard so the games router validates nothing
- [ ] Relocate card-count test cases from `tests/test_games_router.py` to `tests/test_game_service.py` (move, don't delete)
- [ ] Keep exactly one router-level integration case asserting the HTTP mapping (400 + `"Must select exactly N roles"` detail)
- [ ] Run full suite; confirm green and coverage ≥ 80%

## Stage 2: Role-name reconciliation + create-path validation (AC2, AC3, AC5)

- [ ] Change `RoleBase.name` bounds in `app/schemas/role.py` (L61) from 1–100 to 2–50 (seed audit confirmed all 30 seed names fit 2–50)
- [ ] Also change `RoleUpdate.name` bounds (L119) from 1–100 to 2–50 to keep the update path consistent
- [ ] Wire `RoleService.create_role` to invoke the same rule evaluation as `validate_role` and raise feature 04's domain validation exception when errors are non-empty; do not duplicate the rules
- [ ] Preserve the `POST /roles/validate` dry-run endpoint behavior (returns error list, does not raise)
- [ ] Add must-have test: boundary values at the agreed bounds (2 and 50 accepted; 1 and 51 rejected) — test names [PROPOSED - name TBD]
- [ ] Add must-have test: create/validate agreement — `create_role` rejects any payload `validate_role` rejects — test name [PROPOSED - name TBD]
- [ ] Update `tests/test_schemas.py` `test_name_min_length`/`test_name_max_length` boundaries from 1/101 to 2/51
- [ ] Update `tests/test_role_validation.py` cases built at old boundaries (`name="a"` at L61/L372, `name="a" * 51` at L68) — length violations now fail at pydantic (422) rather than in the service; adjust the layer each test targets
- [ ] Document in the implementation record: the validation placement policy (schema=shape, service=rules, router=nothing) and the user-visible contract change (names of length 1 or 51–100 no longer creatable; length errors now 422 instead of service error strings)
- [ ] Run full suite; confirm green and coverage ≥ 80%
