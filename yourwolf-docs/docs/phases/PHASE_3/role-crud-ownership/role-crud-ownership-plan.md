# Role CRUD Ownership

> **Goal**: Enhance the existing Role CRUD operations to support full ability step + win condition replacement on update, ownership-based write protection, and official role deletion guard.

---

## Requirements & Acceptance Criteria

| ID | Acceptance Criteria |
|----|---------------------|
| AC1 | `PUT /api/roles/{id}` accepts optional `ability_steps` list — when provided, replaces all existing steps |
| AC2 | `PUT /api/roles/{id}` accepts optional `win_conditions` list — when provided, replaces all existing win conditions |
| AC3 | `PUT /api/roles/{id}` on a locked role returns 403 (already implemented — verify) |
| AC4 | `DELETE /api/roles/{id}` on an official role returns 403 with "Cannot delete official roles" |
| AC5 | `DELETE /api/roles/{id}` on a locked role returns 403 (already implemented — verify) |
| AC6 | `RoleUpdate` schema extended with optional `ability_steps` and `win_conditions` fields |
| AC7 | When `ability_steps` provided on update, old steps are deleted and new ones created (full replacement) |
| AC8 | When `win_conditions` provided on update, old conditions are deleted and new ones created (full replacement) |
| AC9 | `creator_id` is accepted on `POST /api/roles/` and stored on the role (prep for future auth) |
| AC10 | Fields not provided in `RoleUpdate` are left unchanged (existing partial-update behavior preserved) |

### Non-Goals

- Authentication middleware (future work — `creator_id` is passed in request body for now)
- Ownership-gated update/delete based on `creator_id` (requires auth; not enforced yet)
- Role publishing workflow (changing visibility from private→public)
- Vote/score system

### Traceability

| AC | Code Areas | Planned Tests |
|----|-----------|---------------|
| AC1–AC2 | `services/role_service.py` — `update_role()` | `test_update_role_replaces_steps`, `test_update_role_replaces_win_conditions` |
| AC3 | `services/role_service.py` — `update_role()` | `test_update_locked_role_raises` (existing — verify) |
| AC4 | `services/role_service.py` — `delete_role()` | `test_delete_official_role_blocked` |
| AC5 | `services/role_service.py` — `delete_role()` | `test_delete_locked_role_blocked` (existing — verify) |
| AC6 | `schemas/role.py` — `RoleUpdate` | `test_role_update_schema_accepts_steps` |
| AC7–AC8 | `services/role_service.py` — `update_role()` | `test_update_steps_deletes_old`, `test_update_wc_deletes_old` |
| AC9 | `schemas/role.py` — `RoleCreate`, `services/role_service.py` | `test_create_role_with_creator_id` |
| AC10 | `services/role_service.py` — `update_role()` | `test_update_partial_fields_only` |

---

## Stage 1: Extend RoleUpdate Schema

**Goal**: Add optional `ability_steps` and `win_conditions` fields to `RoleUpdate`.

**Success Criteria**: Schema compiles; existing update tests still pass.

**Status**: Not Started

### Changes

1. **`app/schemas/role.py`** — Add to `RoleUpdate`:
   - `ability_steps: list[AbilityStepCreateInRole] | None = None`
   - `win_conditions: list[WinConditionCreate] | None = None`
   - These use the same sub-schemas as `RoleCreate`

2. **`app/schemas/role.py`** — Add `creator_id: UUID | None = None` to `RoleCreate`

### Design Notes

- `None` means "don't touch" — only when explicitly provided does replacement happen
- `RoleUpdate.model_rebuild()` may be needed after adding the forward-ref fields, following the same pattern as `RoleCreate.model_rebuild()`

---

## Stage 2: Enhanced Update Logic

**Goal**: `update_role()` handles ability step and win condition replacement when provided.

**Success Criteria**: Unit tests confirm old steps/conditions deleted and new ones created.

**Status**: Not Started

### Changes

1. **`app/services/role_service.py`** — In `update_role()`, after updating scalar fields:
   - If `role_data.ability_steps is not None`:
     - Delete all existing `AbilityStep` rows for this `role_id`
     - Create new steps from `role_data.ability_steps` (same pattern as `create_role()`)
   - If `role_data.win_conditions is not None`:
     - Delete all existing `WinCondition` rows for this `role_id`
     - Create new conditions from `role_data.win_conditions` (same pattern as `create_role()`)

2. **`app/services/role_service.py`** — In `create_role()`, set `creator_id=role_data.creator_id` if the field exists on `RoleCreate`

### Design Notes

- Step deletion uses `self.db.query(AbilityStep).filter(AbilityStep.role_id == role_id).delete()` — cascading from the FK would also work, but explicit delete is clearer
- The `update_data = role_data.model_dump(exclude_unset=True)` loop already skips `None` fields. `ability_steps` and `win_conditions` need to be handled separately (popped from `update_data` before the loop) since they're not direct columns on `Role`

---

## Stage 3: Official Role Deletion Guard

**Goal**: `delete_role()` blocks deletion of official roles.

**Success Criteria**: Test confirms 403 when deleting an official role.

**Status**: Not Started

### Changes

1. **`app/services/role_service.py`** — In `delete_role()`, after the lock check:
   - If `role.visibility == Visibility.OFFICIAL`: raise `PermissionError("Cannot delete official roles")`

2. **`app/routers/roles.py`** — Already catches `PermissionError` and returns 403; no router changes needed

---

## Stage 4: Tests

**Goal**: Full test coverage for all new and modified behavior.

**Success Criteria**: All tests pass; no regressions.

**Status**: Not Started

### Test Cases (Given/When/Then)

**T1: Update role replaces ability steps**
- Given: An existing role with 2 ability steps
- When: `PUT /api/roles/{id}` with `ability_steps` containing 1 new step
- Then: Response shows 1 ability step; old steps no longer in DB

**T2: Update role replaces win conditions**
- Given: An existing role with 1 win condition
- When: `PUT /api/roles/{id}` with `win_conditions` containing 2 new conditions
- Then: Response shows 2 win conditions; old condition no longer in DB

**T3: Update without steps/conditions preserves them**
- Given: An existing role with ability steps and win conditions
- When: `PUT /api/roles/{id}` with only `name` changed
- Then: Ability steps and win conditions unchanged

**T4: Delete official role blocked**
- Given: An official role
- When: `DELETE /api/roles/{id}`
- Then: 403 with "Cannot delete official roles"

**T5: Create role with creator_id**
- Given: A valid `RoleCreate` with `creator_id` set
- When: `POST /api/roles/`
- Then: Response includes the `creator_id`

### Test Fixtures Needed

- `sample_role_with_steps` — already exists in `conftest.py`
- `sample_official_role` — may need new fixture, or use `sample_roles` which includes official roles

---

## Correctness & Edge Cases

- Update with `ability_steps: []` (empty list) → deletes all steps (valid — some roles have no abilities)
- Update with `win_conditions: []` → deletes all conditions (allowed at schema level, but validation service would flag it)
- Update with `ability_steps: None` (field omitted) → no change to steps
- Concurrent updates → last-write-wins (no optimistic locking — acceptable for MVP)
- Ability type lookup during step creation → if `ability_type` not found, step is silently skipped (matches existing `create_role()` behavior; future: validation service would catch this pre-submission)

## Clean Design Checklist

- [ ] `ability_steps` / `win_conditions` popped from scalar update loop
- [ ] Step/condition replacement follows same creation pattern as `create_role()`
- [ ] No changes to existing endpoint signatures
- [ ] Official guard uses same `PermissionError` pattern as lock guard
- [ ] `creator_id` is optional — existing tests that omit it still pass

---

*Last updated: March 26, 2026*
