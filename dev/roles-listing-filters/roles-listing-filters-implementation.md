# Implementation Record: Roles Listing Filters

## Summary
Added visibility filter toggles (Official / My Roles / Downloaded) to the Roles page, fixed post-save redirect to `/roles`, and enabled multi-visibility backend queries via repeated query params.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Redirect to `/roles` after role creation | Done | `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Changed `navigate(\`/roles/\${role.id}\`)` → `navigate('/roles')` |
| AC2 | Three filter toggle buttons visible | Done | `yourwolf-frontend/src/pages/Roles.tsx` | Official, My Roles, Downloaded buttons rendered |
| AC3 | Official + My Roles active by default | Done | `yourwolf-frontend/src/pages/Roles.tsx` | Default state: `new Set(['official', 'private'])` |
| AC4 | Toggle on/off refetches; at least one must remain active | Done | `yourwolf-frontend/src/pages/Roles.tsx`, `yourwolf-frontend/src/hooks/useRoles.ts` | Guard prevents deselecting last filter |
| AC5 | Backend accepts multiple visibility query params | Done | `yourwolf-backend/app/routers/roles.py`, `yourwolf-backend/app/services/role_service.py` | `list[Visibility] | None` param type with `.in_()` filter |
| AC6 | Page title "Roles" (was "Official Roles") | Done | `yourwolf-frontend/src/pages/Roles.tsx` | Title and subtitle updated |
| AC7 | New private roles appear with "My Roles" active | Done | Integration of AC1 + AC3 + AC5 | Manual QA item |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/routers/roles.py` | Modified | `visibility` param type: `Visibility \| None` → `list[Visibility] \| None` | AC5: support multiple visibility values |
| `yourwolf-backend/app/services/role_service.py` | Modified | Accept `list[Visibility]` or single `Visibility`; use `.in_()` for list | AC5: multi-visibility filtering |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Modified | `navigate(\`/roles/\${role.id}\`)` → `navigate('/roles')`, removed unused `role` variable | AC1: redirect to listing |
| `yourwolf-frontend/src/api/roles.ts` | Modified | `visibility` type `string` → `string[]`; added `paramsSerializer: {indexes: null}` | AC5: array serialization for repeated keys |
| `yourwolf-frontend/src/hooks/useRoles.ts` | Modified | Added `visibility` param; switched from `listOfficial()` to `list({visibility})`; memoized key for refetch | AC4: filter-driven fetching |
| `yourwolf-frontend/src/pages/Roles.tsx` | Modified | Added filter state, toggle buttons, updated title/subtitle | AC2, AC3, AC4, AC6 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_roles.py` | Modified | Added 3 tests: multi-visibility, single compat, no-param-returns-all | AC5 |
| `yourwolf-frontend/src/test/RoleBuilder.test.tsx` | Modified | Updated redirect assertion to expect `/roles` | AC1 |
| `yourwolf-frontend/src/test/Roles.test.tsx` | Modified | Updated title/subtitle assertions; added 5 filter tests | AC2, AC3, AC4, AC6 |
| `yourwolf-frontend/src/test/useRoles.test.ts` | Modified | Rewrote to test `rolesApi.list` with visibility; added refetch-on-visibility-change test | AC4, AC5 |
| `yourwolf-frontend/src/test/roles.api.test.ts` | Modified | Updated assertions for `paramsSerializer` and `visibility` as array | AC5 |
| `yourwolf-frontend/src/test/routes.test.tsx` | Modified | Updated title assertion from "Official Roles" to "Roles" | AC6 |

## Test Results
- **Baseline**: Backend 184 passed, Frontend 283 passed
- **Final**: Backend 187 passed, Frontend 289 passed
- **New tests added**: Backend 3, Frontend 6 (net new, plus updated existing)
- **Regressions**: None

## Deviations from Plan
- `role_service.py` accepts `list[Visibility] | Visibility | None` (union) instead of only `list[Visibility] | None` — this preserves compatibility with the `/roles/official` endpoint which passes a single `Visibility` enum value directly. No risk.
- `useRoles` uses a `useMemo`-based `visibilityKey` for stable `useCallback` deps instead of a raw array — prevents infinite re-render loops since arrays don't have stable identity.

## Gaps
None — all ACs fully implemented.

## Reviewer Focus Areas
- Visibility filter logic in `yourwolf-frontend/src/pages/Roles.tsx` — verify toggle guard (last-filter-cannot-be-deselected) and state management
- `useRoles` hook memoization in `yourwolf-frontend/src/hooks/useRoles.ts` — the `visibilityKey` pattern for stable deps
- Backend `list[Visibility] | Visibility | None` union type in `yourwolf-backend/app/services/role_service.py` — confirm `isinstance` check is correct
- `paramsSerializer: {indexes: null}` in `yourwolf-frontend/src/api/roles.ts` — ensures `?visibility=official&visibility=private` format for FastAPI
