# Implementation Record: Role Validation Service

## Summary

Added a role validation service layer with two new API endpoints — `POST /api/roles/validate` (dry-run validation) and `GET /api/roles/check-name` (duplicate detection) — enabling the frontend role builder wizard to validate roles before submission without persisting them.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `POST /api/roles/validate` accepts `RoleCreate`, returns `{ is_valid, errors, warnings }` without persisting | Done | `app/routers/roles.py`, `app/services/role_service.py`, `app/schemas/role.py` | |
| AC2 | `GET /api/roles/check-name?name=X` returns `{ name, is_available, message }` | Done | `app/routers/roles.py`, `app/services/role_service.py`, `app/schemas/role.py` | |
| AC3 | Name validation: minimum 2 chars, maximum 50 chars (after strip) | Done | `app/services/role_service.py` — `validate_role()` | Pydantic allows 1–100; service enforces 2–50 post-strip |
| AC4 | Duplicate name check: case-insensitive against public + official roles | Done | `app/services/role_service.py` — `check_duplicate_name()` | Uses `func.lower()` for SQLite/PostgreSQL compat |
| AC5 | Ability step validation: `ability_type` must reference an active `Ability` | Done | `app/services/role_service.py` — `validate_role()` | Queries `Ability` with `is_active=True` |
| AC6 | Ability step validation: first step must have modifier `none` | Done | `app/services/role_service.py` — `validate_role()` | |
| AC7 | Step orders must be sequential starting at 1, no gaps/duplicates | Done | `app/services/role_service.py` — `validate_role()` | Differentiates duplicate vs. gap error messages |
| AC8 | Win condition: at least one required | Done | `app/services/role_service.py` — `validate_role()` | |
| AC9 | Win condition: exactly one primary | Done | `app/services/role_service.py` — `validate_role()` | Catches both zero and multiple primary conditions |
| AC10 | Wake order: 0–20 if present | Done | `app/schemas/role.py` — existing `Field(ge=0, le=20)` | Already handled by Pydantic; returns 422 before service |
| AC11 | Warnings: >5 steps, steps without wake_order, conflicting abilities | Done | `app/services/role_service.py` — `get_warnings()` | |
| AC12 | Validation errors returned as list of human-readable strings | Done | `app/services/role_service.py` — `validate_role()` | Returns `list[str]`; router checks `len(errors) == 0` |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `app/schemas/role.py` | Modified | Added `RoleValidationResponse` and `RoleNameCheckResponse` | AC1, AC2: response schemas for new endpoints |
| `app/services/role_service.py` | Modified | Added `check_duplicate_name()`, `validate_role()`, `get_warnings()`; added `func` and new schema imports | AC3–AC11: all validation business logic |
| `app/routers/roles.py` | Modified | Added `POST /validate` and `GET /check-name` endpoints; added new schema imports | AC1, AC2: HTTP surface; routes registered before `/{role_id}` |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `tests/test_role_validation.py` | Created | 28 tests across 5 test classes | AC1–AC12 |

## Test Results

- **Baseline**: 80 passed (running `tests/test_roles.py tests/test_role_service.py` only)
- **Full suite baseline**: 212 passed, 1 pre-existing failure (`test_game_service.py::TestPrimaryTeamRoleValidation::test_rejects_multiple_teams_each_missing_primary` — `NameError: Team undefined`)
- **Final**: 240 passed, 1 pre-existing failure (unchanged)
- **New tests added**: 28
- **Regressions**: None

## Deviations from Plan

| Deviation | Rationale | Risk |
|-----------|-----------|------|
| `validate_role()` is named `validate_role` not `_validate_role` | Context doc D1: method is public API called from router; private naming wrong by convention | None — plan explicitly documents this decision |
> Note: `RoleValidationResponse` and `RoleNameCheckResponse` are imported only in `app/routers/roles.py`. The service methods return `bool` and `list[str]` and do not import these schemas directly — the deviation note in the original implementation record was inaccurate and has been corrected.

## Gaps

None. All AC1–AC12 are implemented and covered by tests.

## Reviewer Focus Areas

- **Route ordering** in [app/routers/roles.py](../../../app/routers/roles.py) — `/validate` and `/check-name` are registered before `/{role_id}`; verify no path conflict with a real `role_id` UUID value
- **`validate_role()` name-length logic** in `app/services/role_service.py` — duplicate check is only performed when `len(name) >= 2 and len(name) <= 50`; confirm this short-circuit is the intended behavior
- **`Ability.is_active.is_(True)`** — uses SQLAlchemy's `.is_()` for boolean comparison (avoids `== True` linting warning); confirm this works correctly against SQLite in tests
- **Pre-existing test failure** — `tests/test_game_service.py::TestPrimaryTeamRoleValidation::test_rejects_multiple_teams_each_missing_primary` was already failing before this change (`NameError: Team` missing in that test); out of scope
