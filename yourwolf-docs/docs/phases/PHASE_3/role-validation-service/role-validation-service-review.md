# Review Record: Role Validation Service

## Summary

Implementation is functionally correct and complete against all 12 acceptance criteria. Route ordering is properly enforced, service logic is clean, and test coverage is broadly solid. One High severity gap was found: the `/validate` endpoint does not expose `exclude_role_id`, making it unreliable for edit-mode validation (a use case explicitly documented in the context doc). All other issues are Low–Medium and non-blocking.

**Verdict confidence: High**

## Verdict

**Approved with Reservations** — Issue #1 (missing `exclude_role_id` on `/validate` endpoint) should be resolved before the frontend role-builder-wizard consumes this endpoint for edit flows.

---

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `app/routers/roles.py:82-97`, `app/services/role_service.py:380-435`, `app/schemas/role.py:207-214` | Returns `{ is_valid, errors, warnings }` without persisting |
| AC2 | Verified | `app/routers/roles.py:103-122`, `app/services/role_service.py:359-378`, `app/schemas/role.py:216-222` | Returns `{ name, is_available, message }` |
| AC3 | Verified | `app/services/role_service.py:382-390` | Post-strip length check 2–50 |
| AC4 | Partial | `app/services/role_service.py:359-378` | Case-insensitive public/official check correct; `exclude_role_id` supported in service but not exposed by endpoint — see Issue #1 |
| AC5 | Verified | `app/services/role_service.py:399-410` | `Ability.is_active.is_(True)` query per step |
| AC6 | Verified | `app/services/role_service.py:393-396` | First step `modifier != "none"` check |
| AC7 | Verified | `app/services/role_service.py:413-424` | Sequential order check with duplicate/gap differentiation |
| AC8 | Verified | `app/services/role_service.py:427-428` | Empty `win_conditions` error |
| AC9 | Verified | `app/services/role_service.py:430-436` | Zero and >1 primary count both caught |
| AC10 | Verified | `app/schemas/role.py:71` | `Field(ge=0, le=20)` on `wake_order` — Pydantic 422 before service |
| AC11 | Verified | `app/services/role_service.py:449-471` | All three warning conditions present |
| AC12 | Verified | `app/services/role_service.py:380-436` | Returns `list[str]`; router checks `len(errors) == 0` |

---

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `/validate` endpoint missing `exclude_role_id` query param — edit-mode callers get false duplicate error when role keeps its own name | High | `app/routers/roles.py:82-97` | AC4 | Fixed |
| 2 | `/check-name?name=` (empty string) accepted — returns `{ is_available: true }` with empty name | Medium | `app/routers/roles.py:107` | AC2 | Fixed |
| 3 | `validate_role()` passes raw `data.name` to `check_duplicate_name` while stripped `name` is already in scope | Low | `app/services/role_service.py:396` | AC4 | Fixed |
| 4 | `RoleNameCheckResponse` echoes un-stripped query param in `name` field | Low | `app/routers/roles.py:118-122` | AC2 | Fixed |
| 5 | `test_validate_endpoint_returns_warnings` doesn't inject `sample_ability`; role fails validation; test never asserts warnings list is non-empty | Low | `tests/test_role_validation.py:332-356` | AC11 | Fixed |
| 6 | No integration test for `/validate` with `exclude_role_id` (unit coverage exists) | Low | `tests/test_role_validation.py` | AC4 | Fixed |
| 7 | Stale deviation note in implementation record states schema imports were added to service; they are not present | Low | `dev/active/role-validation-service/role-validation-service-implementation.md` | — | Fixed |
| 8 | No boundary-value tests for name exactly 2 or 50 chars | Low | `tests/test_role_validation.py:52-67` | AC3 | Fixed |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

---

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `app/routers/roles.py` | Added `exclude_role_id: UUID \| None = Query(default=None)` param to `POST /validate`; passed through to `service.validate_role()` | 1 |
| `app/routers/roles.py` | Added `min_length=1` to `name` Query param on `GET /check-name` | 2 |
| `app/services/role_service.py` | Changed `data.name` → `name` (stripped) in `check_duplicate_name()` call | 3 |
| `app/routers/roles.py` | Added `name = name.strip()` before first use in `check_role_name()` handler | 4 |
| `tests/test_role_validation.py` | Added `sample_ability` fixture to `test_validate_endpoint_returns_warnings`; replaced shape-only assertions with content assertions (`is_valid=True`, `errors==[]`, `len(warnings)>0`) | 5 |
| `tests/test_role_validation.py` | Added `test_validate_endpoint_exclude_role_id` integration test | 6 |
| `dev/active/role-validation-service/role-validation-service-implementation.md` | Removed incorrect deviation row and replaced with accurate note that schemas are router-only imports | 7 |
| `tests/test_role_validation.py` | Added `test_name_at_minimum_boundary` (2 chars) and `test_name_at_maximum_boundary` (50 chars) | 8 |

---

## Remaining Concerns

None — all issues have been resolved.

---

## Test Coverage Assessment

- **Covered:** AC1, AC2, AC3, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12
- **Partially covered:** AC4 — `exclude_role_id` path tested at unit level (`test_name_excludes_role_id`) but not at HTTP integration level
- **Missing:**
  - Integration test for `POST /validate` with `exclude_role_id` query param (blocked until Issue #1 is fixed)
  - `test_validate_endpoint_returns_warnings` does not assert warning content — needs `sample_ability` fixture and `len(warnings) > 0` assertion
  - Boundary value tests: name = 2 chars (valid), name = 50 chars (valid)

---

## Risk Summary

- `app/routers/roles.py:82-97` — `/validate` endpoint missing `exclude_role_id`; will emit false positives in edit scenarios
- `app/routers/roles.py:107` — `/check-name` accepts empty string; add `min_length=1` guard
- `app/services/role_service.py:396` — `data.name` passed where stripped `name` should be used; functionally safe but inconsistent
- Route ordering is correct: `/validate` and `/check-name` are registered before `/{role_id}` in all HTTP methods — no path conflict risk
- `Ability.is_active.is_(True)` SQLite boolean comparison is correct; verified via existing test suite
