# Role CRUD Ownership — Task Checklist

> Work items ordered by stage. Each item should be completed and tested before moving on.

---

## Stage 1: Extend RoleUpdate Schema

- [ ] **1.1** In `app/schemas/role.py`, add to `RoleUpdate`:
  - `ability_steps: list[AbilityStepCreateInRole] | None = None`
  - `win_conditions: list[WinConditionCreate] | None = None`
- [ ] **1.2** In `app/schemas/role.py`, add `RoleUpdate.model_rebuild()` at the bottom (same pattern as `RoleCreate.model_rebuild()`)
- [ ] **1.3** In `app/schemas/role.py`, add to `RoleCreate`:
  - `creator_id: UUID | None = None`
- [ ] **1.4** Run existing tests — confirm no regressions from schema changes

---

## Stage 2: Enhanced Update Logic

- [ ] **2.1** In `app/services/role_service.py` — `update_role()`:
  - After `update_data = role_data.model_dump(exclude_unset=True)`, pop `ability_steps` and `win_conditions` from `update_data` if present
  - Store popped values in local variables: `new_steps = update_data.pop("ability_steps", None)` and `new_wcs = update_data.pop("win_conditions", None)`
- [ ] **2.2** In `update_role()`, after the scalar field loop:
  - If `new_steps is not None`:
    - `self.db.query(AbilityStep).filter(AbilityStep.role_id == role_id).delete()`
    - For each step_data, look up `Ability` by type and create `AbilityStep` (follow `create_role()` pattern)
  - If `new_wcs is not None`:
    - `self.db.query(WinCondition).filter(WinCondition.role_id == role_id).delete()`
    - For each wc_data, create `WinCondition` (follow `create_role()` pattern)
- [ ] **2.3** Verify the `update_data` loop now only sets scalar `Role` columns (no `ability_steps`/`win_conditions` leaking into `setattr`)
- [ ] **2.4** In `create_role()`, add `creator_id=role_data.creator_id` to the `Role(...)` constructor (if `creator_id` field exists on `RoleCreate`)
- [ ] **2.5** Write unit tests in `tests/test_role_service.py`:
  - `test_update_role_replaces_ability_steps` — create role with 2 steps, update with 1 step, verify only 1 step remains
  - `test_update_role_replaces_win_conditions` — create role with 1 wc, update with 2 wcs, verify 2 remain
  - `test_update_role_empty_steps_clears_all` — update with `ability_steps=[]`, verify no steps remain
  - `test_update_role_omitted_steps_unchanged` — update with only `name`, verify steps untouched
  - `test_update_role_omitted_wc_unchanged` — update with only `name`, verify win conditions untouched
- [ ] **2.6** Run unit tests — all pass

---

## Stage 3: Official Role Deletion Guard

- [ ] **3.1** In `app/services/role_service.py` — `delete_role()`:
  - After the `is_locked` check, add: if `role.visibility == Visibility.OFFICIAL`, raise `PermissionError("Cannot delete official roles")`
- [ ] **3.2** Write unit test in `tests/test_role_service.py`:
  - `test_delete_official_role_raises` — create role with `visibility=OFFICIAL`, attempt delete, assert `PermissionError`
- [ ] **3.3** Write integration test in `tests/test_roles.py`:
  - `test_delete_official_role_returns_403` — create official role, `DELETE /api/roles/{id}`, assert 403
- [ ] **3.4** Run all tests — pass

---

## Stage 4: creator_id Support

- [ ] **4.1** Write integration test in `tests/test_roles.py`:
  - `test_create_role_with_creator_id` — POST with `creator_id` set, verify response includes it
  - `test_create_role_without_creator_id` — POST without `creator_id`, verify `creator_id` is null
- [ ] **4.2** Run all tests — pass

---

## Stage 5: Integration Tests for Update Endpoints

- [ ] **5.1** Write integration tests in `tests/test_roles.py`:
  - `test_update_role_with_ability_steps` — PUT with new `ability_steps`, verify response
  - `test_update_role_with_win_conditions` — PUT with new `win_conditions`, verify response
  - `test_update_role_partial_no_steps` — PUT with only `name`, verify steps preserved
- [ ] **5.2** Run full test suite — all tests pass (new + existing)

---

## Final Verification

- [ ] All acceptance criteria AC1–AC10 covered by at least one test
- [ ] Existing tests (`test_roles.py`, `test_role_service.py`) unbroken
- [ ] `PUT /api/roles/{id}` Swagger doc shows `ability_steps` and `win_conditions` as optional fields
- [ ] `POST /api/roles/` Swagger doc shows `creator_id` as optional field

---

*Last updated: March 26, 2026*
