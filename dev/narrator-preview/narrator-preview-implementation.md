# Implementation Record: Narrator Preview

## Summary
Added a live narrator instruction preview panel to the Role Builder wizard. A new backend endpoint (`POST /roles/preview-script`) generates narrator text from a draft `RoleCreate` payload using the existing `ScriptService` instruction templates, without persisting any data. The frontend calls this endpoint on a debounced timer alongside the existing validation call, and renders the preview on all four wizard tabs via a new `NarratorPreview` component.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Preview panel visible on all 4 wizard tabs | Done | `Wizard.tsx`, `NarratorPreview.tsx` | Rendered between step content and nav buttons |
| AC2 | Full narrator turn: wake → steps → close eyes | Done | `script_service.py` (`preview_role_script`), `NarratorPreview.tsx` | Reuses `_generate_role_script` and all `_*_instruction` methods |
| AC3 | Live updates on draft change | Done | `RoleBuilder.tsx` (debounced `previewScript` call) | Uses same debounce timer as validation |
| AC4 | Multi-section for `perform_immediately`/`perform_as` | Done | `script_service.py`, `NarratorPreview.tsx` | Section header appended with `is_section_header=true` |
| AC5 | Backend endpoint `POST /roles/preview-script` | Done | `routers/roles.py`, `schemas/role.py`, `script_service.py` | Accepts `RoleCreate`, returns `NarratorPreviewResponse` |
| AC6 | Graceful empty/non-waking state | Done | `script_service.py`, `NarratorPreview.tsx` | Empty actions for `wake_order=None`; component shows context-appropriate message |
| AC7 | Debounced requests (~1s) | Done | `RoleBuilder.tsx` | Shares debounce timer with validation; own stale-request guard via `previewIdRef` |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/schemas/role.py` | Modified | Added `NarratorPreviewAction` and `NarratorPreviewResponse` schemas | AC5: response schema for preview endpoint |
| `yourwolf-backend/app/services/script_service.py` | Modified | Added `preview_role_script()` method + `_StandInRole`, `_StandInStep`, `_StandInAbility` dataclasses | AC2, AC4, AC5, AC6: generates preview without DB persistence |
| `yourwolf-backend/app/routers/roles.py` | Modified | Added `POST /preview-script` endpoint | AC5: new endpoint |
| `yourwolf-frontend/src/types/role.ts` | Modified | Added `NarratorPreviewAction` and `NarratorPreviewResponse` types | AC5: frontend types |
| `yourwolf-frontend/src/api/roles.ts` | Modified | Added `previewScript()` method to `rolesApi` | AC5: API client method |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Modified | Added `preview`, `previewLoading` state; debounced preview call in `handleDraftChange` | AC3, AC7: state management and debounce |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Modified | Added `preview`/`previewLoading` props; renders `NarratorPreview` component | AC1: preview visible on all tabs |
| `yourwolf-frontend/src/components/RoleBuilder/NarratorPreview.tsx` | Created | Presentational component for narrator preview panel | AC1, AC2, AC4, AC6: all visual rendering |
| `yourwolf-frontend/src/test/mocks.ts` | Modified | Added `createMockPreviewResponse()` helper | Test infrastructure |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_script_service.py` | Modified | Added `TestPreviewRoleScript` (7 tests) and `TestPreviewEndpoint` (2 tests) | AC2, AC4, AC5, AC6 |
| `yourwolf-frontend/src/test/NarratorPreview.test.tsx` | Created | 8 tests for component rendering, empty/loading states, section headers | AC1, AC2, AC4, AC6 |
| `yourwolf-frontend/src/test/roles.api.test.ts` | Modified | Added 2 tests for `previewScript()` API method | AC5 |
| `yourwolf-frontend/src/test/Wizard.test.tsx` | Modified | Added 3 tests for preview on all tabs; updated existing props | AC1 |
| `yourwolf-frontend/src/test/RoleBuilder.test.tsx` | Modified | Added 2 tests for debounced preview calls; updated mock | AC3, AC7 |

## Test Results
- **Backend Baseline**: 187 passed, 0 failed (before implementation)
- **Backend Final**: 196 passed, 0 failed (after implementation) — 86.43% coverage
- **Frontend Baseline**: 301 passed, 0 failed across 28 test files
- **Frontend Final**: 317 passed, 0 failed across 29 test files
- **New tests added**: 9 backend + 16 frontend = 25 total
- **Regressions**: None

## Deviations from Plan
- **Shared debounce timer**: The plan suggested preview could have its own debounce timer or share with validation. Implementation shares the same setTimeout but uses a separate `previewIdRef` for stale-request guarding. Both API calls fire sequentially within the same callback for simplicity.
- **Stand-in objects as module-level dataclasses**: The plan mentioned "dataclass or named tuple". Implemented as `@dataclass` classes at module level in `script_service.py` for clarity and type safety.

## Gaps
None. All acceptance criteria are fully implemented and tested.

## Reviewer Focus Areas
- **Stand-in dataclass compatibility** in `script_service.py:23-45` — verify `_StandInRole`/`_StandInStep` satisfy the interface expected by `_generate_role_script()` and `_get_wake_instruction()`. These duck-type against the ORM `Role`/`AbilityStep` models.
- **Multi-section logic** in `preview_role_script()` — the section header for `perform_immediately`/`perform_as` is appended after all regular actions. Verify this correctly represents the Doppelganger-style two-wake pattern.
- **Debounce + stale-request guard** in `RoleBuilder.tsx` — preview and validation share a timer but have separate ID refs. Confirm no race conditions between the two parallel API calls.
- **NarratorPreview empty state logic** — the component determines which message to show based on `roleName.trim().length >= 2`. This threshold matches the wizard's `canProceedFromStep` check.
