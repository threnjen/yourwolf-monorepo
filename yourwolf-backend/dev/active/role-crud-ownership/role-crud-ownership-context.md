# Role CRUD Ownership — Context

> Key files, decisions, constraints, and patterns for implementation.

---

## Key Files

| File | Role | What Changes |
|------|------|-------------|
| `app/schemas/role.py` | Pydantic schemas | Add `ability_steps` + `win_conditions` to `RoleUpdate`; add `creator_id` to `RoleCreate` |
| `app/services/role_service.py` | Business logic | Enhance `update_role()` with step/condition replacement; enhance `delete_role()` with official guard; wire `creator_id` in `create_role()` |
| `app/routers/roles.py` | HTTP endpoints | No changes — existing router already handles all CRUD and catches `PermissionError` |
| `app/models/ability_step.py` | AbilityStep model | Read-only — rows deleted/created during updates |
| `app/models/win_condition.py` | WinCondition model | Read-only — rows deleted/created during updates |
| `app/models/role.py` | Role model + `Visibility` enum | Read-only — `Visibility.OFFICIAL` checked in delete guard |
| `tests/test_roles.py` | Endpoint tests | Add new tests for update-with-steps, delete-official |
| `tests/test_role_service.py` | Service unit tests | Add new tests for replacement logic, official guard |
| `tests/conftest.py` | Test fixtures | May need `sample_official_role` fixture |

---

## Existing Patterns to Follow

### Update Pattern (current)

`update_role()` currently:
1. Queries role by ID
2. Checks `is_locked` — raises `PermissionError` if locked
3. Dumps `role_data.model_dump(exclude_unset=True)` — only set fields
4. Loops `setattr(role, field, value)` for each field
5. Commits and returns via `get_role(role.id)`

The enhancement adds step 3.5: pop `ability_steps` and `win_conditions` from `update_data`, handle them separately with delete-then-create.

### Create Step Pattern (existing in `create_role()`)

For each `step_data` in `role_data.ability_steps`:
1. Look up `Ability` by `step_data.ability_type`
2. Create `AbilityStep` with role_id, ability_id, and step fields
3. `self.db.add(step)`

Same pattern for win conditions. The update enhancement reuses this exact logic.

### Delete Pattern (current)

`delete_role()` currently:
1. Queries role by ID
2. Checks `is_locked` — raises `PermissionError`
3. `self.db.delete(role)` + commit
4. Returns `True`

The official guard adds a check between steps 2 and 3.

### PermissionError Handling (router)

`app/routers/roles.py` already catches `PermissionError` in both `update_role` and `delete_role` endpoints:
- Catches `PermissionError as e`
- Returns `HTTPException(status_code=403, detail=str(e))`

No router changes needed — the service just raises the same exception type.

---

## Key Decisions

### D1: Full Replacement, Not Partial Update for Steps

**Decision**: When `ability_steps` is provided on update, ALL existing steps are deleted and replaced.

**Rationale**: Partial step updates (add/remove/reorder individual steps) would require a complex diff algorithm and step-level IDs from the client. Full replacement is simpler, matches the Phase 3 spec, and aligns with how the wizard works (it always sends the complete step list).

### D2: `None` vs Empty List Semantics

**Decision**: `ability_steps: None` (field omitted) = no change. `ability_steps: []` (empty list provided) = delete all steps.

**Rationale**: This is standard Pydantic `exclude_unset` behavior. Omitting a field means "don't touch it." Explicitly sending `[]` means "I want zero steps." This distinction is handled by checking `if role_data.ability_steps is not None`.

### D3: creator_id as Optional Body Field

**Decision**: `creator_id` is an optional field on `RoleCreate`, not derived from auth headers.

**Rationale**: Auth middleware doesn't exist yet. Adding `creator_id` to the schema lets the field be stored when provided, preparing for auth without blocking on it. Future auth middleware will inject the user ID and the schema field will become required/derived.

### D4: No Validation on Update

**Decision**: `update_role()` does not call `validate_role()` on the new steps/conditions.

**Rationale**: Validation is a separate concern (handled by the `role-validation-service` feature). The frontend calls `/validate` before submitting. Coupling validation into update would create a circular dependency between features and change existing behavior.

---

## Constraints

1. **Backward compatibility** — All existing `POST /api/roles/` and `PUT /api/roles/{id}` callers continue to work (no breaking changes)
2. **No new endpoints** — This feature enhances existing endpoints only
3. **No auth** — Ownership checks (`creator_id != user_id`) are deferred to auth implementation
4. **FK cascades** — `AbilityStep.role_id` has `ondelete="CASCADE"`, but we use explicit delete for clarity and control over the transaction
5. **Transaction safety** — Both delete-old + create-new happen in the same commit; if any step fails, the entire update rolls back

---

## Relationship to Other Features

- **role-validation-service** (backend): Validation logic is independent. This feature does NOT call validation during CRUD. The frontend orchestrates: validate first, then create/update.
- **role-builder-wizard** (frontend): The wizard calls `PUT /api/roles/{id}` with the full step/condition lists. The contract is: when `ability_steps` or `win_conditions` are present in the request body, they fully replace existing data.
- **local-draft-storage** (frontend): Drafts are client-side only; no backend interaction until the user submits.

---

*Last updated: March 26, 2026*
