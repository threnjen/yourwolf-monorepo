# Review Record: Preview Endpoint Fix

## Summary
The implementation correctly addresses all 7 acceptance criteria. The core bug fix (decoupling preview from `RoleBase` via a new `PreviewScriptRequest` schema) is clean and well-targeted. Two test issues were found and fixed during review: a vacuous AC4 integration test and four preview tests passing the wrong schema type. All 208 backend + 318 frontend tests pass after fixes.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `app/schemas/role.py:232-242` | Standalone BaseModel, correct defaults, no `min_length` on `name`, `ge=0 le=40` on `wake_order` |
| AC2 | Verified | `app/routers/roles.py:106-107` | Endpoint parameter changed to `PreviewScriptRequest` |
| AC3 | Verified | `app/services/script_service.py:199` | Guard checks both `None` and `0` |
| AC4 | Verified | `app/services/script_service.py:124` | `Role.wake_order != 0` added to query filter alongside `isnot(None)` |
| AC5 | Verified | `src/api/roles.ts:60,118-133` | `draftToPreviewPayload()` sends only 4 fields |
| AC6 | Verified | `tests/test_script_service.py` | 11 new tests + 5 existing updated — all pass after review fixes |
| AC7 | Verified | `src/test/roles.api.test.ts:278-305` | Asserts minimal payload shape, no `description`/`team`/`votes`/`win_conditions` |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `test_night_script_excludes_wake_order_zero` was vacuous — `zero_roles` empty, assertion loop never ran, no role with `wake_order=0` in seeded fixture or game | High | `tests/test_script_service.py:718-751` | AC4 | Fixed |
| 2 | 4 preview tests (`test_seer_preview_full_turn`, `test_werewolf_preview_team_wake`, `test_or_modifier_prefixed`, `test_actions_have_sequential_order`) passed `RoleCreate` instead of `PreviewScriptRequest` to `preview_role_script()` — works by duck typing but doesn't test the actual schema path | Medium | `tests/test_script_service.py:343,356,450,462` | AC6 | Fixed |
| 3 | `_doppelganger_create()` helper is dead code — never called after test rewrites | Low | `tests/test_script_service.py:270` | — | Open |
| 4 | `PreviewScriptRequest` not exported from `app/schemas/__init__.py` (consistent with `NarratorPreviewAction`/`NarratorPreviewResponse` also being absent) | Low | `app/schemas/__init__.py` | Task 1.2 | Open |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `tests/test_script_service.py` | Rewrote `test_night_script_excludes_wake_order_zero`: creates a `wake_order=0` role, appends to `seeded_roles`, includes it as a player in the game via `role_indices`, and asserts its name is absent from the script | 1 |
| `tests/test_script_service.py` | Converted 4 preview tests from using `_seer_create()`/`_werewolf_create()` (`RoleCreate`) to inline `PreviewScriptRequest` construction | 2 |

## Remaining Concerns
- Issue #3: `_doppelganger_create()` is dead code — low severity, can be removed in next cleanup pass or kept for future non-preview tests
- Issue #4: `PreviewScriptRequest` not in `schemas/__init__.py` — consistent with other narrator schemas; no downstream consumers import via `__init__.py`

## Test Coverage Assessment
- Covered: AC1 (5 schema tests), AC2 (3 endpoint tests), AC3 (2 wake_order_zero tests), AC4 (1 night_script_excludes test — now non-vacuous), AC5 (1 frontend payload test), AC6 (all existing preview tests updated), AC7 (frontend test updated)
- Missing: No integration test for `ability_steps` mapping in `draftToPreviewPayload()` (frontend test uses empty array); not blocking since type system covers it

## Risk Summary
- `tests/test_script_service.py:718-751` — the original vacuous test masked a potential gap in AC4 coverage; now fixed with a proper integration test
- `_generate_step_instruction()` returns `None` for unrecognized ability types (e.g., `perform_immediately`, `perform_as`, `change_to_team`, `stop`) — these silently produce no instruction line but this is pre-existing behavior outside the scope of this fix
- The `PreviewScriptRequest.wake_order` field uses `ge=0` but negative values from the frontend would be caught by Pydantic validation (confirmed by `test_preview_schema_rejects_negative_wake_order` and `test_preview_returns_422_with_invalid_payload`)
