# Implementation Record: Role Card Copies & Dependency Auto-Selection

## Summary
Implemented multi-copy role selection with +/– quantity controls, copy-count badges on RoleCard, and automatic REQUIRES dependency management in GameSetup. Backend was updated to expose dependency data on the list endpoint.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `RoleListItem` TS type includes `default_count`, `min_count`, `max_count` | Done | `yourwolf-frontend/src/types/role.ts` | |
| AC2 | `RoleCard` displays copy count badge when `max_count > 1` | Done | `yourwolf-frontend/src/components/RoleCard.tsx` | |
| AC3 | Clicking a role adds `default_count` copies | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC4 | +/– buttons adjust count between `min_count` and `max_count` | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC5 | Mason (min=max=2) adds/removes atomically; no +/– buttons | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC6 | Backend `RoleListItem` includes `dependencies` field | Done | `yourwolf-backend/app/schemas/role.py`, `yourwolf-backend/app/services/role_service.py` | |
| AC7 | Frontend `RoleListItem` includes `dependencies` field | Done | `yourwolf-frontend/src/types/role.ts` | |
| AC8 | Selecting a role auto-selects its REQUIRES dependencies | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC9 | Removing a required role cascade-removes dependents | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC10 | Removing a dependent does NOT remove the required role (one-way) | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | |
| AC11 | QA test plan updated with multi-copy and dependency sections | Done | `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/schemas/role.py` | Modified | Added `dependencies: list[RoleDependencyResponse]` field to `RoleListItem` | AC6: list endpoint must expose dependency data |
| `yourwolf-backend/app/services/role_service.py` | Modified | Added `joinedload` for dependencies in `list_roles()`; manual mapping of dependencies to `RoleDependencyResponse` | AC6: eager-load and serialize dependencies per role |
| `yourwolf-frontend/src/types/role.ts` | Modified | Added `RoleDependency` interface; added `default_count`, `min_count`, `max_count`, `dependencies` to `RoleListItem` | AC1, AC7 |
| `yourwolf-frontend/src/test/mocks.ts` | Modified | Added count and dependency defaults to `createMockRole`, `createMockOfficialRole`, `createMockRoles` | Keep mocks aligned with updated types |
| `yourwolf-frontend/src/components/RoleCard.tsx` | Modified | Added copy-count badge in footer ("×1–3" or "×2") when `max_count > 1` | AC2 |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Modified | Replaced `selectedRoleIds: string[]` with `selectedRoleCounts: Record<string, number>`; added `selectRole`, `adjustCount`, `removeRoleWithCascade`; added +/– quantity controls and dependency auto-selection | AC3–AC5, AC8–AC10 |
| `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | Modified | Added sections 1.6 (Multi-Copy Role Selection) and 1.7 (Role Dependency Auto-Selection) | AC11 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_roles.py` | Modified | Added `TestListRolesWithDependencies` class with test for dependencies in list response | AC6 |
| `yourwolf-frontend/src/test/RoleCard.test.tsx` | Modified | Added 3 tests for copy-count badge (range format, fixed format, no badge) | AC2 |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | Modified | Added 10 tests: multi-copy add/remove, +/– buttons, Mason atomicity, dependency auto-select, cascade remove, one-way remove | AC3–AC5, AC8–AC10 |

## Test Results
- **Backend baseline**: 186 passed, 0 failed
- **Backend final**: 187 passed, 0 failed
- **Frontend baseline**: 180 passed (19 files), 0 failed
- **Frontend final**: 193 passed (19 files), 0 failed
- **New tests added**: 14 (1 backend + 13 frontend)
- **Regressions**: None

## Deviations from Plan
- The plan references an `extended_role_set` fixture in conftest.py, but the actual fixture is named `seeded_roles_with_deps`. Used the correct existing fixture name.

## Gaps
None

## Reviewer Focus Areas
- Dependency cascade logic in `GameSetup.tsx` `removeRoleWithCascade` — verify one-level-deep removal is correct for all edge cases
- `list_roles()` eager loading in `role_service.py` — confirm `joinedload` with pagination doesn't cause duplicate rows (SQLAlchemy handles this with `unique()` implicitly for joined loads on the parent)
- `RoleListItem` schema addition is additive — safe for backward compatibility, but verify any other consumers of this schema aren't broken
- Quantity controls rendering: `stopPropagation` on the quantity controls container prevents the card click handler from firing when interacting with +/– buttons
