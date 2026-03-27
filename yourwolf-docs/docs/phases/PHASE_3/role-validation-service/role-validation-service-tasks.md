# Role Validation Service — Task Checklist

> Work items ordered by stage. Each item should be completed and tested before moving on.

---

## Stage 0: Test Prerequisites

- [ ] **0.1** Confirm existing tests pass: run `pytest tests/test_roles.py tests/test_role_service.py`
- [ ] **0.2** Review `tests/conftest.py` fixtures — confirm `sample_ability`, `sample_role`, `sample_roles` are available
- [ ] **0.3** Verify no existing validation tests to avoid duplication

---

## Stage 1: Validation Schema

- [ ] **1.1** In `app/schemas/role.py`, add `RoleValidationResponse` class:
  - `is_valid: bool`
  - `errors: list[str] = Field(default_factory=list)`
  - `warnings: list[str] = Field(default_factory=list)`
- [ ] **1.2** In `app/schemas/role.py`, add `RoleNameCheckResponse` class:
  - `name: str`
  - `is_available: bool`
  - `message: str`
- [ ] **1.3** Update `app/schemas/role.py` imports in `app/routers/roles.py` if needed
- [ ] **1.4** Run existing tests — confirm no regressions

---

## Stage 2: Validation Logic

- [ ] **2.1** In `app/services/role_service.py`, add `check_duplicate_name(self, name: str, exclude_role_id: UUID | None = None) -> bool`:
  - Query `Role` filtering `func.lower(Role.name) == name.lower()` and `Role.visibility.in_([Visibility.PUBLIC, Visibility.OFFICIAL])`
  - Exclude `exclude_role_id` if provided
  - Return `True` if match found
- [ ] **2.2** In `app/services/role_service.py`, add `validate_role(self, data: RoleCreate, exclude_role_id: UUID | None = None) -> list[str]`:
  - Name: strip and check length 2–50
  - Duplicate: call `check_duplicate_name(data.name, exclude_role_id)`
  - Ability steps: for each step, query `Ability` by `step.ability_type` — error if not found or not active
  - Ability steps: if steps exist, first step's modifier must be `"none"`
  - Ability steps: collect orders, check sequential from 1 with no gaps/duplicates
  - Win conditions: must have at least 1
  - Win conditions: exactly 1 with `is_primary=True`
  - Return accumulated error list
- [ ] **2.3** In `app/services/role_service.py`, add `get_warnings(self, data: RoleCreate) -> list[str]`:
  - Warn if `len(data.ability_steps) > 5`
  - Warn if `data.ability_steps` is non-empty and `data.wake_order is None`
  - Warn if both `copy_role` and `change_to_team` types present in steps
  - Return accumulated warning list
- [ ] **2.4** Write unit tests in `tests/test_role_validation.py` for `validate_role()`:
  - `test_valid_role_passes`
  - `test_name_too_short`
  - `test_name_too_long`
  - `test_name_whitespace_only`
  - `test_duplicate_name_case_insensitive`
  - `test_duplicate_name_private_allowed`
  - `test_invalid_ability_type`
  - `test_first_step_modifier_not_none`
  - `test_duplicate_step_orders`
  - `test_gap_in_step_orders`
  - `test_no_win_conditions`
  - `test_multiple_primary_win_conditions`
  - `test_no_primary_win_condition`
- [ ] **2.5** Write unit tests for `check_duplicate_name()`:
  - `test_name_available`
  - `test_name_taken_official`
  - `test_name_taken_public`
  - `test_name_excludes_role_id`
- [ ] **2.6** Write unit tests for `get_warnings()`:
  - `test_no_warnings_clean_role`
  - `test_warning_many_steps`
  - `test_warning_no_wake_order_with_steps`
  - `test_warning_conflicting_abilities`
- [ ] **2.7** Run all unit tests — all pass

---

## Stage 3: Router Endpoints

- [ ] **3.1** In `app/routers/roles.py`, add `POST /validate` endpoint:
  - Import `RoleValidationResponse` from schemas
  - Accept `RoleCreate` body
  - Call `service.validate_role(role_data)` and `service.get_warnings(role_data)`
  - Return `RoleValidationResponse(is_valid=len(errors)==0, errors=errors, warnings=warnings)`
  - Register this route BEFORE `/{role_id}` routes
- [ ] **3.2** In `app/routers/roles.py`, add `GET /check-name` endpoint:
  - Import `RoleNameCheckResponse` from schemas
  - Accept `name: str = Query(...)` parameter
  - Call `service.check_duplicate_name(name)`
  - Return `RoleNameCheckResponse` with appropriate message
  - Register this route BEFORE `/{role_id}` routes
- [ ] **3.3** Write integration tests in `tests/test_role_validation.py`:
  - `test_validate_endpoint_valid_role` — POST valid data, assert 200 + `is_valid=true`
  - `test_validate_endpoint_invalid_role` — POST invalid data, assert 200 + `is_valid=false` + errors non-empty
  - `test_check_name_available` — GET with novel name, assert `is_available=true`
  - `test_check_name_taken` — seed an official role, GET with its name, assert `is_available=false`
  - `test_check_name_case_insensitive` — seed "Werewolf", check "WEREWOLF"
- [ ] **3.4** Run full test suite — all tests pass (new + existing)

---

## Final Verification

- [ ] All acceptance criteria AC1–AC12 covered by at least one test
- [ ] No existing tests broken
- [ ] Endpoints appear in `/docs` Swagger UI
- [ ] Route ordering verified (no conflict with `/{role_id}`)

---

*Last updated: March 26, 2026*
