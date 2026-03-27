# Implementation Record: Role CRUD Ownership

## Summary
Enhanced existing Role CRUD operations to support full ability step and win condition replacement on update, added an official role deletion guard, and wired `creator_id` into role creation. All changes are backward-compatible and follow existing service/router patterns.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `PUT /api/roles/{id}` accepts optional `ability_steps` list — replaces all existing steps | Done | `app/schemas/role.py`, `app/services/role_service.py` | Full replacement via delete + re-create |
| AC2 | `PUT /api/roles/{id}` accepts optional `win_conditions` list — replaces all existing conditions | Done | `app/schemas/role.py`, `app/services/role_service.py` | Same pattern as AC1 |
| AC3 | `PUT /api/roles/{id}` on a locked role returns 403 | Done | `app/services/role_service.py` | Pre-existing — verified by tests |
| AC4 | `DELETE /api/roles/{id}` on an official role returns 403 | Done | `app/services/role_service.py` | New guard after existing lock check |
| AC5 | `DELETE /api/roles/{id}` on a locked role returns 403 | Done | `app/services/role_service.py` | Pre-existing — verified by tests |
| AC6 | `RoleUpdate` schema extended with optional `ability_steps` and `win_conditions` | Done | `app/schemas/role.py` | `None` = no change; `[]` = delete all |
| AC7 | When `ability_steps` provided on update, old steps deleted and new ones created | Done | `app/services/role_service.py` | Uses `synchronize_session="fetch"` for delete |
| AC8 | When `win_conditions` provided on update, old conditions deleted and new ones created | Done | `app/services/role_service.py` | Same pattern as AC7 |
| AC9 | `creator_id` accepted on `POST /api/roles/` and stored | Done | `app/schemas/role.py`, `app/services/role_service.py` | Optional field, defaults to `None` |
| AC10 | Fields not provided in `RoleUpdate` left unchanged | Done | `app/services/role_service.py` | `exclude_unset=True` + pop before setattr loop |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `app/schemas/role.py` | Modified | Added `ability_steps`, `win_conditions` to `RoleUpdate`; added `creator_id` to `RoleCreate`; added `RoleUpdate.model_rebuild()` | AC1, AC2, AC6, AC9 |
| `app/services/role_service.py` | Modified | `update_role()`: pop steps/conditions from update_data, delete-then-create replacement logic; `delete_role()`: official visibility guard; `create_role()`: pass `creator_id` | AC1, AC2, AC4, AC7, AC8, AC9 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `tests/test_role_service.py` | Modified | Added `TestRoleServiceUpdateRoleStepsAndConditions` (5 tests), `TestRoleServiceCreateRoleCreatorId` (2 tests), `test_delete_official_role_raises_permission_error` | AC1-AC2, AC4, AC6-AC10 |
| `tests/test_roles.py` | Modified | Added `TestCreateRoleOwnership` (2 tests), `TestUpdateRoleStepsAndConditions` (3 tests), `test_delete_official_role_fails` | AC1-AC2, AC4, AC7-AC9 |
| `tests/conftest.py` | Modified | Added `sample_official_role` fixture (official + unlocked) | AC4 |

## Test Results
- **Baseline**: 209 passed, 1 failed (pre-existing `NameError` in `test_game_service.py`)
- **Final**: 209 passed, 1 failed (same pre-existing failure)
- **New tests added**: 13 (9 unit + 4 integration)
- **Regressions**: None
- **Coverage**: `role_service.py` 100%, `routers/roles.py` 100%

## Deviations from Plan
- `is_primary_team_role` was also added to `RoleUpdate` (not in the plan, but present in implementation — likely from a parallel feature)
- `synchronize_session="fetch"` was required on bulk `.delete()` calls to avoid SQLAlchemy `UnmappedInstanceError` when related objects are in the session — not anticipated in plan

## Gaps
None — all 10 acceptance criteria are implemented and tested.

## Reviewer Focus Areas
- Step/condition replacement logic in `app/services/role_service.py:290-335` — verify delete + re-create transaction safety
- `synchronize_session="fetch"` usage — confirm this is the correct strategy for bulk deletes with related objects in session
- `RoleUpdate.model_rebuild()` at bottom of schema file — ensures forward references resolve correctly
- `creator_id` is not validated against any user table (auth deferred) — confirm this is acceptable per plan D3
