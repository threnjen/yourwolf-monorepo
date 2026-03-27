# Role Validation Service

> **Goal**: Add role data validation logic and two new endpoints — `/api/roles/validate` (dry-run) and `/api/roles/check-name` (duplicate detection) — so the frontend can validate roles before submission.

---

## Requirements & Acceptance Criteria

| ID | Acceptance Criteria |
|----|---------------------|
| AC1 | `POST /api/roles/validate` accepts a `RoleCreate` body and returns `{ is_valid, errors, warnings }` without persisting |
| AC2 | `GET /api/roles/check-name?name=X` returns `{ name, is_available, message }` checking public/official roles |
| AC3 | Name validation: minimum 2 chars, maximum 50 chars |
| AC4 | Duplicate name check: case-insensitive match against public + official roles |
| AC5 | Ability step validation: all `ability_type` values must reference active abilities in the DB |
| AC6 | Ability step validation: first step must have modifier `none` |
| AC7 | Ability step validation: step orders must be sequential starting at 1 with no gaps/duplicates |
| AC8 | Win condition validation: at least one win condition required |
| AC9 | Win condition validation: exactly one primary win condition |
| AC10 | Wake order validation: if present, must be 0–20 |
| AC11 | Warnings (non-blocking): roles with >5 ability steps, abilities+wake_order mismatch, conflicting ability types |
| AC12 | Validation errors returned as a list of human-readable strings |

### Non-Goals

- Authentication/authorization (future work)
- Parameter-level validation against `parameters_schema` on each ability (future — requires JSON Schema validation library)
- Rate limiting on check-name endpoint

### Traceability

| AC | Code Areas | Planned Tests |
|----|-----------|---------------|
| AC1 | `routers/roles.py`, `services/role_service.py`, `schemas/role.py` | `test_validate_role_valid`, `test_validate_role_invalid` |
| AC2 | `routers/roles.py`, `services/role_service.py` | `test_check_name_available`, `test_check_name_taken` |
| AC3 | `services/role_service.py` — `_validate_role()` | `test_name_too_short`, `test_name_too_long` |
| AC4 | `services/role_service.py` — `check_duplicate_name()` | `test_duplicate_case_insensitive`, `test_duplicate_excludes_private` |
| AC5 | `services/role_service.py` — `_validate_role()` | `test_invalid_ability_type` |
| AC6 | `services/role_service.py` — `_validate_role()` | `test_first_step_modifier_not_none` |
| AC7 | `services/role_service.py` — `_validate_role()` | `test_duplicate_step_orders`, `test_gap_in_step_orders` |
| AC8–AC9 | `services/role_service.py` — `_validate_role()` | `test_no_win_conditions`, `test_multiple_primary_wc` |
| AC10 | Already handled by Pydantic `Field(ge=0, le=20)` | `test_wake_order_out_of_range` |
| AC11 | `routers/roles.py` — `_get_warnings()` | `test_warnings_many_steps`, `test_warnings_no_wake_order` |

---

## Stage 0: Test Prerequisites

**Goal**: Assess existing test coverage for role validation paths.

**Success Criteria**: Confirm existing test suite; identify gaps for new validation logic.

**Status**: Not Started

**Assessment**: Backend has strong test coverage for CRUD operations in `tests/test_roles.py` and `tests/test_role_service.py`. No existing validation-specific tests since validation doesn't exist yet. New test file `tests/test_role_validation.py` will be created. Baseline coverage is healthy — this stage is a quick check, not a blocker.

---

## Stage 1: Validation Schema

**Goal**: Add `RoleValidationResponse` schema to `schemas/role.py`.

**Success Criteria**: Schema compiles; no existing tests broken.

**Status**: Not Started

### Changes

1. **`app/schemas/role.py`** — Add `RoleValidationResponse` class with fields: `is_valid: bool`, `errors: list[str]`, `warnings: list[str]`
2. **`app/schemas/role.py`** — Add `RoleNameCheckResponse` class with fields: `name: str`, `is_available: bool`, `message: str`

### Design Notes

- Follow existing schema pattern: `BaseModel` with `Field(...)` annotations
- No `ConfigDict(from_attributes=True)` needed — these are pure response models, not ORM-mapped

---

## Stage 2: Validation Logic in RoleService

**Goal**: Add `_validate_role()` and `check_duplicate_name()` methods to `RoleService`.

**Success Criteria**: Unit tests for all validation rules pass.

**Status**: Not Started

### Changes

1. **`app/services/role_service.py`** — Add `check_duplicate_name(name: str, exclude_role_id: UUID | None = None) -> bool`
   - Query `Role` where `func.lower(Role.name) == name.lower()` and visibility in `[PUBLIC, OFFICIAL]`
   - If `exclude_role_id` provided, exclude that role from the check
   - Return `True` if duplicate found

2. **`app/services/role_service.py`** — Add `validate_role(data: RoleCreate, exclude_role_id: UUID | None = None) -> list[str]`
   - Name length: 2–50 chars (after strip)
   - Duplicate name check via `check_duplicate_name()`
   - Ability steps: verify each `ability_type` exists in DB as an active `Ability`
   - Ability steps: first step modifier must be `none`
   - Ability steps: orders must be sequential `[1, 2, 3, ...]` with no gaps or duplicates
   - Win conditions: at least 1 required
   - Win conditions: exactly 1 with `is_primary=True`
   - Return list of error strings (empty = valid)

3. **`app/services/role_service.py`** — Add `get_warnings(data: RoleCreate) -> list[str]`
   - Warn if `len(ability_steps) > 5`
   - Warn if ability steps present but `wake_order is None`
   - Warn if both `copy_role` and `change_to_team` ability types are used

### Design Notes

- `validate_role()` is public (not `_validate_role()` as in the Phase 3 spec) — it's called from the router, making it part of the public API
- Uses `func.lower()` from SQLAlchemy for case-insensitive name comparison (works across SQLite and PostgreSQL)

---

## Stage 3: Router Endpoints

**Goal**: Add `POST /api/roles/validate` and `GET /api/roles/check-name` endpoints.

**Success Criteria**: Integration tests pass for both endpoints.

**Status**: Not Started

### Changes

1. **`app/routers/roles.py`** — Add `POST /validate` endpoint
   - Accepts `RoleCreate` body
   - Calls `service.validate_role(data)` and `service.get_warnings(data)`
   - Returns `RoleValidationResponse`
   - Must be registered **before** `/{role_id}` routes to avoid path conflict

2. **`app/routers/roles.py`** — Add `GET /check-name` endpoint
   - Accepts `name: str` query parameter (required)
   - Calls `service.check_duplicate_name(name)`
   - Returns `RoleNameCheckResponse`
   - Must also be registered before `/{role_id}` routes

### Design Notes

- FastAPI route ordering matters — `/validate` and `/check-name` must appear before `/{role_id}` in the router to avoid being matched as a UUID path parameter
- No authentication required for these read-only/validation endpoints

---

## Stage 4: Tests

**Goal**: Comprehensive test coverage for all validation logic and endpoints.

**Success Criteria**: All new tests pass; existing tests unaffected.

**Status**: Not Started

### Test Cases (Given/When/Then)

**T1: Valid role passes validation**
- Given: A `RoleCreate` with valid name, team, one ability step (modifier=none), one primary win condition
- When: `POST /api/roles/validate`
- Then: `{ is_valid: true, errors: [], warnings: [] }`

**T2: Missing name fails**
- Given: A `RoleCreate` with `name=""`
- When: `POST /api/roles/validate`
- Then: `is_valid: false`, errors contains "name" substring

**T3: Duplicate name detected**
- Given: An existing official role named "Werewolf"
- When: `POST /api/roles/validate` with `name="werewolf"` (different case)
- Then: `is_valid: false`, errors contains "already exists"

**T4: Name available**
- Given: No public/official role named "Custom Hero"
- When: `GET /api/roles/check-name?name=Custom Hero`
- Then: `{ is_available: true }`

**T5: Name taken**
- Given: Official role "Werewolf" exists
- When: `GET /api/roles/check-name?name=Werewolf`
- Then: `{ is_available: false }`

### Additional Unit Tests (in `tests/test_role_validation.py`)

- `test_name_too_short` — name with 1 char
- `test_name_too_long` — name with 51 chars
- `test_invalid_ability_type` — step references nonexistent ability
- `test_first_step_modifier_not_none` — first step has modifier `and`
- `test_duplicate_step_orders` — two steps with order=1
- `test_gap_in_step_orders` — orders [1, 3] missing 2
- `test_no_win_conditions` — empty win_conditions list
- `test_multiple_primary_wc` — two win conditions with `is_primary=True`
- `test_warnings_many_steps` — 6+ steps triggers warning
- `test_warnings_no_wake_order` — steps present but wake_order is None

---

## API Contract

This contract is shared with the frontend `role-builder-wizard` feature.

### `POST /api/roles/validate`

**Request**: `RoleCreate` body (same schema used for `POST /api/roles/`)

**Response** (200):
```
{
  "is_valid": boolean,
  "errors": string[],
  "warnings": string[]
}
```

### `GET /api/roles/check-name`

**Request**: `?name=string` query parameter

**Response** (200):
```
{
  "name": string,
  "is_available": boolean,
  "message": string
}
```

---

## Correctness & Edge Cases

- Empty name (after strip) → validation error
- Name with only whitespace → validation error
- Private role with same name as official → allowed (duplicates only block against public/official)
- Role with ability steps but no wake_order → warning (not error)
- Role with no ability steps and no wake_order → valid (e.g., Villager)
- Empty `ability_steps` list → valid
- `exclude_role_id` in duplicate check → used during updates to avoid self-conflict

## Clean Design Checklist

- [ ] `validate_role()` returns `list[str]`, not exceptions — caller decides severity
- [ ] `get_warnings()` is separate from validation — warnings never block
- [ ] No new dependencies added
- [ ] Follows existing `RoleService` class pattern
- [ ] Route ordering: static paths before parameterized paths

---

*Last updated: March 26, 2026*
