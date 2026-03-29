# Review Record: Missing Instruction Templates

## Summary
Implementation correctly adds 5 missing ability instruction template methods to `ScriptService`, registers them in the dispatch dict, and provides comprehensive test coverage (12 new tests). Two issues found: a grammatical formatting bug in `_random_num_players_instruction` for 2-item options lists, and duplicated ability-creation logic in integration tests instead of centralizing in the `_ensure_abilities` helper. Both fixed during review. Confidence: High.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `app/services/script_service.py:462-469` | `_change_to_team_instruction` uses `params.get("team")` with generic fallback |
| AC2 | Verified | `app/services/script_service.py:471-475` | `_perform_as_instruction` returns static text about copied role's wake time |
| AC3 | Verified | `app/services/script_service.py:477-481` | `_perform_immediately_instruction` returns "Now perform the copied role's night actions." |
| AC4 | Verified | `app/services/script_service.py:483-485` | `_stop_instruction` returns "Stop. Do not perform any further actions." |
| AC5 | Verified | `app/services/script_service.py:487-505` | `_random_num_players_instruction` formats options with fallback. Fixed 2-item grammar issue. |
| AC6 | Verified | `app/services/script_service.py:369-375` | All 5 new entries added to `templates` dict (15 total) |
| AC7 | Verified | `app/services/script_service.py:355-375` | All 15 ability types have dict entries; verified by `test_all_15_types_produce_instructions` |
| AC8 | Verified | `tests/test_script_service.py` → `test_doppelganger_preview_has_perform_immediately` | Uses `wake_order=1` (>0), asserts `perform` in instructions |
| AC9 | Verified | `tests/test_script_service.py` → `test_pi_preview_has_change_to_team_and_stop` | Asserts both "werewolf" and "stop" appear in instructions |
| AC10 | Verified | `tests/test_script_service.py` → `test_blob_preview_has_random_num_players` | Asserts "2", "3", "4" all appear in instructions |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `_random_num_players_instruction` produces "2, or 3" (spurious comma) for 2-item options lists — should be "2 or 3" | Medium | `app/services/script_service.py:493-497` | AC5 | Fixed |
| 2 | `_ensure_abilities()` helper not updated per task 2.12 — integration tests duplicate inline ability-creation for `change_to_team`, `stop`, `random_num_players` | Medium | `tests/test_script_service.py:306-316` | — | Fixed |
| 3 | New 2-option branch in `_random_num_players_instruction` not covered by tests | Low | `app/services/script_service.py:495-496` | AC5 | Open |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `app/services/script_service.py` | Split 2+ options handling into separate 2-item ("X or Y") and 3+-item ("X, Y, or Z") branches | 1 |
| `tests/test_script_service.py` | Added `change_to_team`, `stop`, `random_num_players` to `_ensure_abilities()` helper | 2 |
| `tests/test_script_service.py` | Removed duplicated inline ability-creation from `test_pi_preview_has_change_to_team_and_stop` | 2 |
| `tests/test_script_service.py` | Removed duplicated inline ability-creation from `test_blob_preview_has_random_num_players` | 2 |

## Remaining Concerns
- Issue #3: The new 2-option branch (`len(options) == 2`) is not exercised by any test. Low severity — the 1-option and 3-option cases are tested, and Blob seed data uses 3 options. Defer to next pass.

## Test Coverage Assessment
- Covered: AC1 (2 tests), AC2 (1 test), AC3 (1 test), AC4 (1 test), AC5 (3 tests), AC6 (1 test), AC7 (1 test), AC8 (1 test), AC9 (1 test), AC10 (1 test)
- Missing: No test for the 2-item options formatting path in `_random_num_players_instruction`
- All 220 tests pass after fixes. No regressions.

## Risk Summary
- `app/services/script_service.py:495-496` — new 2-option branch untested but straightforward string interpolation
- Template text is static/hardcoded — future localization or narrator customization would require rework, but this is consistent with all 10 existing templates
- `_ensure_abilities()` now creates 10 ability types; any future ability types added to `script_service.py` will also need helper entries for integration tests
