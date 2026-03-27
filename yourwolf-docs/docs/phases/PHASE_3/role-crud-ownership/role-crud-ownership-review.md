# Review Record: Role CRUD Ownership

## Summary
Implementation is clean, correct, and complete against all 10 acceptance criteria. Three missing edge-case tests were identified and added during review. No bugs found. Approved with minor reservations about the silent-skip behavior for unknown ability types (pre-existing design choice, now documented by test).

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `app/services/role_service.py:290-315` | Full replacement via delete + re-create |
| AC2 | Verified | `app/services/role_service.py:317-333` | Same pattern as AC1 |
| AC3 | Verified | `app/services/role_service.py:279-282` | Pre-existing `is_locked` check |
| AC4 | Verified | `app/services/role_service.py:346-347` | New guard, correct PermissionError |
| AC5 | Verified | `app/services/role_service.py:341-344` | Pre-existing lock check |
| AC6 | Verified | `app/schemas/role.py:131-149` | Both fields with descriptive docs |
| AC7 | Verified | `app/services/role_service.py:290-315` | Bulk delete + re-create in same transaction |
| AC8 | Verified | `app/services/role_service.py:317-333` | Same pattern |
| AC9 | Verified | `app/schemas/role.py:101`, `app/services/role_service.py:231` | Optional field, defaults to None |
| AC10 | Verified | `app/services/role_service.py:285-289` | Pop before setattr loop |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Silent skip of unknown `ability_type` during step replacement — old steps already deleted, new step silently dropped | Medium | `app/services/role_service.py:297-303` | AC7 | Fixed (test added) |
| 2 | No integration test for combined `ability_steps` + `win_conditions` in single PUT | Low | `tests/test_roles.py` | AC1, AC2 | Fixed |
| 3 | No integration test for win_conditions preservation on partial update | Low | `tests/test_roles.py` | AC10 | Fixed |
| 4 | `is_primary_team_role` in `RoleUpdate` not in the plan | Low | `app/schemas/role.py:130` | — | Open (acknowledged in impl record) |
| 5 | Unlocked official role can have visibility downgraded then deleted | Low | `app/services/role_service.py:289` | AC4 | Open (defer to auth) |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `tests/test_role_service.py` | Added `test_update_role_skips_unknown_ability_type` documenting silent-skip behavior | 1 |
| `tests/test_roles.py` | Added `test_update_role_combined_steps_and_conditions` integration test | 2 |
| `tests/test_roles.py` | Added `test_update_role_partial_leaves_win_conditions_unchanged` integration test | 3 |

## Remaining Concerns
- Issue #4: `is_primary_team_role` on `RoleUpdate` — low severity, likely from a parallel feature, already acknowledged in implementation record
- Issue #5: Visibility downgrade bypass — low practical risk since official roles are normally locked; address when auth is added

## Test Coverage Assessment
- Covered: AC1–AC10 all have at least one unit test AND one integration test
- Added: Unknown ability_type behavior (Issue #1), combined update (Issue #2), win_conditions preservation (Issue #3)
- Missing: No integration test for the visibility downgrade + delete path (Issue #5) — deferred to auth feature

## Risk Summary
- `app/services/role_service.py:297-303` — Unknown `ability_type` silently skipped after old steps deleted. Now documented by test; future validation service should catch this pre-submission.
- `app/services/role_service.py:289` — `setattr` on visibility allows downgrade; an unlocked official role could be re-classified then deleted. Low risk until auth is implemented.
- `synchronize_session="fetch"` on bulk deletes is correct and necessary; verified against SQLAlchemy docs.
