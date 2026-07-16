# Tasks: Backend Validation Placement Consolidation

## Stage 1: Game-creation rule relocation (AC1, AC4)

- [x] Transplant the role-count-vs-players rule from `app/routers/games.py` (~L40–L49) into `GameService.create_game`, copying the arithmetic and error message verbatim, placed alongside the existing four validators
- [x] Raise feature 04's domain validation exception (not `ValueError`) for the relocated rule, consistent with how 04 left the other `create_game` validators
- [x] Delete the router-level guard so the games router validates nothing
- [~] Relocate card-count test cases from `tests/test_games_router.py` to `tests/test_game_service.py` (move, don't delete) — **N/A as written: only one such router test exists and the next task requires keeping it. No service-level test existed, so `TestRoleCountMatchesPlayersAndCenter` was written new. See implementation record, Deviation 1.**
- [x] Keep exactly one router-level integration case asserting the HTTP mapping (400 + `"Must select exactly N roles"` detail)
- [x] Run full suite; confirm green and coverage ≥ 80% (347 passed, 94.31%)

## Stage 2: Role-name reconciliation + create-path validation (AC2, AC3, AC5)

- [x] Change `RoleBase.name` bounds in `app/schemas/role.py` (L61) from 1–100 to 2–50 (seed audit confirmed all 30 seed names fit 2–50)
- [x] Also change `RoleUpdate.name` bounds (L119) from 1–100 to 2–50 to keep the update path consistent
- [x] Wire `RoleService.create_role` to invoke the same rule evaluation as `validate_role` and raise feature 04's domain validation exception when errors are non-empty; do not duplicate the rules
- [x] Preserve the `POST /roles/validate` dry-run endpoint behavior (returns error list, does not raise) — response shape unchanged; out-of-bounds names now 422 at parsing (recorded contract change)
- [x] Add must-have test: boundary values at the agreed bounds (2 and 50 accepted; 1 and 51 rejected) — `test_name_accepts_lower_bound`, `test_name_accepts_upper_bound`, `test_name_min_length`, `test_name_max_length`, `test_update_name_bounds_match_create`
- [x] Add must-have test: create/validate agreement — `create_role` rejects any payload `validate_role` rejects — `TestCreateValidateAgreement::test_create_rejects_what_validate_rejects` (7 parametrized cases) + `test_create_accepts_what_validate_accepts`
- [x] Update `tests/test_schemas.py` `test_name_min_length`/`test_name_max_length` boundaries from 1/101 to 2/51
- [x] Update `tests/test_role_validation.py` cases built at old boundaries — retargeted to the schema layer; added `test_name_short_after_strip_still_fails_in_service` to keep the still-reachable service guard covered
- [x] Document in the implementation record: the validation placement policy (schema=shape, service=rules, router=nothing) and the user-visible contract change (names of length 1 or 51–100 no longer creatable; length errors now 422 instead of service error strings) — **plus a second, unplanned contract change: `POST /roles` now requires ≥1 win condition and enforces the full rule set**
- [x] Run full suite; confirm green and coverage ≥ 80% (347 passed, 94.31%)
