# AC Coverage Map: Preview Endpoint Fix

**Date:** 2026-03-28

| AC | Description | Automated Coverage | Manual QA Needed? | Reason |
|----|-------------|--------------------|--------------------|--------|
| AC1 | `PreviewScriptRequest` schema with relaxed validation | 5 unit tests (`TestPreviewScriptRequest`) verify defaults, all-fields, no-description-required, empty-name-allowed, rejects-negative-wake-order | No | Schema structure and validation rules are pure assertable logic |
| AC2 | `POST /api/roles/preview-script` accepts minimal payload, returns 200 | 3 integration tests (`TestPreviewEndpointMinimalPayload`) verify 200 with minimal payload, no-description, and empty-name | Partial — only live full-stack flow | HTTP status codes and payload acceptance are tested; manual QA covers the actual frontend→backend round-trip in a running environment |
| AC3 | `preview_role_script()` returns empty actions for `wake_order` 0 or `None` | 2 unit tests (`TestWakeOrderZero`) cover both `wake_order=0` and `wake_order=None` | Partial — only visual UI behavior | Return value logic is tested; manual QA covers that the preview panel actually renders the correct fallback message |
| AC4 | `generate_night_script()` excludes `wake_order == 0` roles | 1 integration test (`test_night_script_excludes_wake_order_zero`) creates a wake_order=0 role in a game and asserts exclusion | No | Query behavior is fully assertable in an integration test with a real DB session |
| AC5 | Frontend `previewScript()` sends only preview-relevant fields | 1 unit test verifies payload shape (no description/team/votes/win_conditions) + 1 test verifies empty-actions response | Partial — only live round-trip | Payload shape is tested via mock; manual QA covers that the real API accepts the real frontend payload |
| AC6 | All existing backend preview tests pass, updated for new schema | 32/32 backend tests pass; 5 existing tests updated to use `PreviewScriptRequest` | No | Pass/fail status is fully automated |
| AC7 | All existing frontend preview tests pass, updated for new payload | 27/27 frontend tests pass; previewScript test updated for minimal payload | No | Pass/fail status is fully automated |
