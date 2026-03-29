# Implementation Record: Preview Endpoint Fix

## Summary
Fixed the narrator preview endpoint to accept a minimal payload (`PreviewScriptRequest`) instead of the full `RoleCreate` schema, preventing 422 errors when the frontend sends drafts without `description`, `team`, `votes`, etc. Also fixed `wake_order == 0` handling in both the preview service and night script query.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `PreviewScriptRequest` schema with only preview fields, no `min_length` on `name` | Done | `app/schemas/role.py` | Standalone BaseModel, does not inherit RoleBase |
| AC2 | `POST /api/roles/preview-script` accepts `PreviewScriptRequest`, minimal payloads return 200 | Done | `app/routers/roles.py` | Import + parameter type changed |
| AC3 | `preview_role_script()` returns empty actions when `wake_order` is `0` or `None` | Done | `app/services/script_service.py` | Added `or data.wake_order == 0` to guard |
| AC4 | `generate_night_script()` excludes roles with `wake_order == 0` | Done | `app/services/script_service.py` | Added `Role.wake_order != 0` to query filter |
| AC5 | Frontend `previewScript()` sends only preview-relevant fields | Done | `src/api/roles.ts` | New `draftToPreviewPayload()` helper |
| AC6 | All existing backend preview tests pass, updated for new schema | Done | `tests/test_script_service.py` | Updated 5 existing tests to use PreviewScriptRequest |
| AC7 | All existing frontend preview tests pass, updated for new payload shape | Done | `src/test/roles.api.test.ts` | Updated previewScript test to assert minimal payload |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/schemas/role.py` | Modified | Added `PreviewScriptRequest` model (name, wake_order, wake_target, ability_steps) | AC1: Lightweight schema for preview endpoint |
| `yourwolf-backend/app/routers/roles.py` | Modified | Changed `preview_script()` parameter from `RoleCreate` to `PreviewScriptRequest`, added import | AC2: Accept minimal payloads without 422 |
| `yourwolf-backend/app/services/script_service.py` | Modified | Changed import from `RoleCreate` to `PreviewScriptRequest`, changed type hint on `preview_role_script()`, added `wake_order == 0` to early-return guard, added `Role.wake_order != 0` to `generate_night_script()` query filter | AC3 + AC4: Handle wake_order 0 correctly |
| `yourwolf-frontend/src/api/roles.ts` | Modified | Added `PreviewScriptPayload` interface and `draftToPreviewPayload()` helper, changed `previewScript()` to use it | AC5: Send only preview-relevant fields |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_script_service.py` | Modified | Added 11 new tests (5 schema, 3 endpoint, 2 wake_order_zero, 1 night_script_excludes); updated 5 existing tests to use PreviewScriptRequest | AC1-AC4, AC6 |
| `yourwolf-frontend/src/test/roles.api.test.ts` | Modified | Updated previewScript test to assert minimal payload shape (no description/team/votes/win_conditions) | AC5, AC7 |

## Test Results
- **Baseline**: Backend 197 passed, Frontend 318 passed
- **Final**: Backend 208 passed, Frontend 318 passed
- **New tests added**: 11 backend
- **Regressions**: None

## Deviations from Plan
- None. All changes followed the plan exactly.

## Gaps
- None. All ACs fully implemented.

## Reviewer Focus Areas
- `PreviewScriptRequest` schema in `yourwolf-backend/app/schemas/role.py` — verify it does NOT inherit from `RoleBase` and has correct defaults
- `wake_order == 0` guard in `preview_role_script()` at `yourwolf-backend/app/services/script_service.py` — verify both `None` and `0` return empty actions
- `Role.wake_order != 0` filter in `generate_night_script()` — verify this integrates correctly with the existing `isnot(None)` filter
- `draftToPreviewPayload()` in `yourwolf-frontend/src/api/roles.ts` — verify it sends only the 4 preview-relevant fields
- Updated test for `test_doppelganger_multi_section` — now uses `wake_order=1` to test multi-section; the `wake_order=0` behavior is covered by the new `TestWakeOrderZero` class
