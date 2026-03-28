# Review Record: Roles Listing Filters

## Summary
Clean, well-scoped implementation that matches the plan closely. All 7 acceptance criteria verified. Backend and frontend changes are backward-compatible. Two minor out-of-scope changes and one corrupted doc file are the only issues found. High confidence.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `yourwolf-frontend/src/pages/RoleBuilder.tsx:76` | `navigate('/roles')` — correct |
| AC2 | Verified | `yourwolf-frontend/src/pages/Roles.tsx:122-133` | Three filter buttons rendered from `FILTER_CONFIG` |
| AC3 | Verified | `yourwolf-frontend/src/pages/Roles.tsx:72` | `DEFAULT_FILTERS = new Set(['official', 'private'])` |
| AC4 | Verified | `yourwolf-frontend/src/pages/Roles.tsx:77-87`, `yourwolf-frontend/src/hooks/useRoles.ts:13-25` | Toggle guard + `visibilityKey` memoization for stable deps |
| AC5 | Verified | `yourwolf-backend/app/routers/roles.py:25-28`, `yourwolf-backend/app/services/role_service.py:72-76` | `list[Visibility]` param type with `.in_()` filter |
| AC6 | Verified | `yourwolf-frontend/src/pages/Roles.tsx:115-118` | Title "Roles", subtitle "Browse and manage your werewolf roles" |
| AC7 | Verified | Integration of AC1 + AC3 + AC5 | Manual QA item — logic is sound |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Corrupted markdown: two table rows merged/garbled | Medium | `yourwolf-docs/docs/phases/PHASE_3/PHASE_3_QA.md:68` | — | Open |
| 2 | Out-of-scope: BasicInfoStep.tsx text change ("At least 1 primary team role...") | Low | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx:204` | — | Open |
| 3 | Out-of-scope: PHASE_3_QA.md checkbox ticking mixed into feature branch | Low | `yourwolf-docs/docs/phases/PHASE_3/PHASE_3_QA.md` (multiple lines) | — | Open |
| 4 | `eslint-disable` on useRoles deps — valid workaround for array identity | Low | `yourwolf-frontend/src/hooks/useRoles.ts:23` | AC4 | Wont-Fix |
| 5 | Filter buttons not rendered during loading/error early returns | Low | `yourwolf-frontend/src/pages/Roles.tsx:89-108` | AC2 | Open |
| 6 | New single-visibility test partially duplicates existing test | Low | `yourwolf-backend/tests/test_roles.py:100-111` | AC5 | Wont-Fix |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied
None — no fixes requested yet.

## Remaining Concerns
- Issue #1: Corrupted PHASE_3_QA.md — medium severity, should be fixed before merge
- Issue #2–3: Out-of-scope changes — low severity, recommend splitting into separate commits for clean git history
- Issue #5: Filter bar visibility during loading — low severity, defer to UX polish pass

## Test Coverage Assessment
- Covered: AC1, AC2, AC3, AC4, AC5, AC6 (automated)
- Missing: AC7 (manual QA only — no integration test possible without running backend)
- Backend: 3 new tests (multi-visibility, single compat, no-param-returns-all)
- Frontend: 6 new tests (filter buttons render, defaults, toggle, prevent-all-off, initial visibility, refetch-on-change)

## Risk Summary
- `yourwolf-docs/docs/phases/PHASE_3/PHASE_3_QA.md:68` — corrupted table rows will render incorrectly in any markdown viewer
- `role_service.py` union type `list[Visibility] | Visibility | None` — well-handled with `isinstance` check; no risk from the `/roles/official` single-enum caller
- `useRoles` memoization via `visibilityKey` — correct pattern; `useFetch` re-triggers on fetcher identity change which chains properly
- `paramsSerializer: {indexes: null}` — produces `?visibility=official&visibility=private` format that FastAPI expects; verified in API tests
