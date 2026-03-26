# Review Record: Role Card Copies & Dependency Auto-Selection

## Summary
Implementation faithfully covers all 11 acceptance criteria with correct logic, good test coverage, and clean code. One medium-severity pagination correctness issue was found in the backend (`joinedload` + `LIMIT`/`OFFSET`), along with missing edge-case and integration tests on the frontend. All issues have been fixed. Confidence: High.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `yourwolf-frontend/src/types/role.ts:52-54` | `default_count`, `min_count`, `max_count` added |
| AC2 | Verified | `yourwolf-frontend/src/components/RoleCard.tsx:157-164` | Badge renders when `max_count > 1`; correct formatting |
| AC3 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:136-139` | `selectRole` adds at `default_count` |
| AC4 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:156-167` | `adjustCount` clamps between min/max; removes below min |
| AC5 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:216-217` | No +/– when `min_count === max_count` |
| AC6 | Verified | `yourwolf-backend/app/schemas/role.py:174`, `yourwolf-backend/app/services/role_service.py:69-99` | `dependencies` field + eager loading + manual mapping |
| AC7 | Verified | `yourwolf-frontend/src/types/role.ts:44-55` | `RoleDependency` interface + field on `RoleListItem` |
| AC8 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:142-149` | Iterates REQUIRES deps, auto-selects at `default_count` |
| AC9 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:112-126` | `removeRoleWithCascade` checks all selected roles' REQUIRES deps |
| AC10 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:131-133` | Deselect only cascades from the removed role |
| AC11 | Verified | `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md:49-79` | Sections 1.6 and 1.7 added |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `joinedload` + `LIMIT`/`OFFSET` can return fewer unique roles per page | Medium | `yourwolf-backend/app/services/role_service.py:73-82` | AC6 | Fixed |
| 2 | No test for `selectedRoleIds` flat-array derivation (API submission) | Medium | `yourwolf-frontend/src/pages/GameSetup.tsx:120-128` | AC3, AC4 | Fixed |
| 3 | No test for "required role not in fetched list" edge case | Low | `yourwolf-frontend/src/pages/GameSetup.tsx:147` | AC8 | Fixed |
| 4 | No test for auto-selecting a multi-copy dependency at its `default_count` | Low | `yourwolf-frontend/src/pages/GameSetup.tsx:148` | AC8 | Fixed |
| 5 | Frontend `RoleDependency` type missing `id` field from API | Low | `yourwolf-frontend/src/types/role.ts:44-48` | AC7 | Fixed |
| 6 | `−` character in decrement button is U+2212 MINUS SIGN | Low | `yourwolf-frontend/src/pages/GameSetup.tsx:229` | AC4 | Wont-Fix |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/app/services/role_service.py` | Switched `joinedload` to `selectinload` in `list_roles()` for correct pagination with `LIMIT`/`OFFSET`; added `selectinload` import | 1 |
| `yourwolf-frontend/src/types/role.ts` | Added optional `id?: string` field to `RoleDependency` interface | 5 |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | Added 3 new tests: "required role not in fetched list" edge case, multi-copy dependency auto-select at `default_count`, and `role_ids` flat-array API submission verification; added `waitFor` and `gamesApi` imports | 2, 3, 4 |

## Remaining Concerns
- Issue #6: U+2212 MINUS SIGN in the decrement button is typographically correct and tests use `getByLabelText` (not text content matching), so no functional impact. Deferred.
- Transitive dependency chains (A→B→C) are unhandled per design decision D3. If the seed data introduces chains in the future, cascade removal logic in `removeRoleWithCascade` will need recursion.

## Test Coverage Assessment
- Covered: AC1–AC11 all verified by automated tests
- Previously missing, now added:
  - API submission with duplicated `role_ids` for multi-copy roles
  - Dependency on a role not in the fetched list (silent skip)
  - Auto-selecting a multi-copy dependency role at its own `default_count`
- Still uncovered (low risk): Backend pagination correctness test with `selectinload` — would require a test with enough roles + dependencies to exceed a small page limit. Low priority given the fix is mechanical.

## Risk Summary
- `yourwolf-backend/app/services/role_service.py:73-82` — `selectinload` fix is correct but untested at the pagination boundary; manual QA with `?limit=2` on a dataset with dependencies would confirm
- `yourwolf-frontend/src/pages/GameSetup.tsx:112-126` — cascade removal is single-level; future transitive chains would break silently
- Frontend quantity logic is advisory only; backend `GameService.create_game()` remains the enforcement point for min/max and REQUIRES validation
