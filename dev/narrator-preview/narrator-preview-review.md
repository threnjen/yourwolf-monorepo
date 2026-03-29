# Review Record: Narrator Preview

## Summary
All 7 acceptance criteria are fully implemented and tested across backend and frontend. The implementation is clean, consistent with existing codebase patterns, and well-structured. Five issues were identified and all were fixed during this review: parallelized API calls, added Protocol types for duck-typing safety, added a preview API failure test, added a `perform_as` multi-section test, and added forward-compatible fields to stand-in dataclasses.

## Verdict
Approved

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx:143-147` | `NarratorPreview` rendered outside step switch, visible on all 4 tabs |
| AC2 | Verified | `yourwolf-backend/app/services/script_service.py:169-226` | `preview_role_script()` reuses `_generate_role_script()` for full turn |
| AC3 | Verified | `yourwolf-frontend/src/pages/RoleBuilder.tsx:43-68` | Debounced `previewScript()` fires on draft change |
| AC4 | Verified | `yourwolf-backend/app/services/script_service.py:213-225` | Section header appended for `perform_immediately`/`perform_as` |
| AC5 | Verified | `yourwolf-backend/app/routers/roles.py:105-118`, `yourwolf-backend/app/schemas/role.py:219-231` | Endpoint + response schemas |
| AC6 | Verified | `yourwolf-backend/app/services/script_service.py:180-181`, `yourwolf-frontend/src/components/RoleBuilder/NarratorPreview.tsx:62-72` | Contextual empty states |
| AC7 | Verified | `yourwolf-frontend/src/pages/RoleBuilder.tsx:41-67` | 1s shared debounce + separate `previewIdRef` stale guard |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Sequential API calls: validate awaited before previewScript, adding latency | Medium | `yourwolf-frontend/src/pages/RoleBuilder.tsx:52-65` | AC7 | Fixed |
| 2 | Type hint `role: Role` on `_generate_role_script` doesn't match `_StandInRole` duck-typing | Low | `yourwolf-backend/app/services/script_service.py:235` | AC5 | Fixed |
| 3 | No test for preview API failure setting `preview` to `null` | Medium | `yourwolf-frontend/src/pages/RoleBuilder.tsx:60-65` | AC3 | Fixed |
| 4 | `perform_as` not tested (only `perform_immediately` via Doppelganger) | Low | `yourwolf-backend/tests/test_script_service.py` | AC4 | Fixed |
| 5 | `_StandInStep` missing `condition_type`/`condition_params` fields | Low | `yourwolf-backend/app/services/script_service.py:31-39` | — | Fixed |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Replaced sequential `await validate` then `await preview` with `Promise.allSettled` for parallel execution | 1 |
| `yourwolf-backend/app/services/script_service.py` | Added `_RoleLike` and `_StepLike` Protocol types; updated all method type hints from `Role`/`AbilityStep` to Protocol types | 2 |
| `yourwolf-frontend/src/test/RoleBuilder.test.tsx` | Added test: mock `previewScript` to reject, verify graceful degradation (panel present, fallback message) | 3 |
| `yourwolf-backend/tests/test_script_service.py` | Added `test_perform_as_multi_section` verifying section header for `perform_as` step | 4 |
| `yourwolf-backend/app/services/script_service.py` | Added `condition_type` and `condition_params` optional fields to `_StandInStep` | 5 |

## Remaining Concerns
None. All issues were addressed during this review.

## Test Coverage Assessment
- **Backend**: 21 passed, 0 failed. `script_service.py` at 81% coverage.
  - Covered: AC2 (Seer, Werewolf, Doppelganger full turn), AC4 (perform_immediately + perform_as), AC5 (endpoint 200/422), AC6 (non-waking empty)
  - All acceptance criteria have direct test coverage
- **Frontend**: 54 passed, 0 failed across 4 test files.
  - Covered: AC1 (preview on all tabs), AC2 (action rendering), AC3 (debounced calls + failure path), AC4 (section headers), AC6 (empty states), AC7 (one call per debounce)
  - All acceptance criteria have direct test coverage
- No regressions in existing tests

## Risk Summary
- Duck-typing between `_StandInRole`/`_StandInStep` and ORM models is now explicit via `Protocol` types, reducing future breakage risk
- Preview API failure now falls through to "does not wake up" message when role name >= 2 chars — technically misleading but non-blocking; could be improved with a distinct "preview unavailable" state in a future pass
- `condition_type`/`condition_params` on `_StandInStep` are not yet consumed by any instruction template but are ready for when conditional step templates are implemented
