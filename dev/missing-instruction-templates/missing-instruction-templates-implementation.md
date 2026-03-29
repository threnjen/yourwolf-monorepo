# Implementation Record: Missing Instruction Templates

## Summary

Added 5 missing ability instruction template methods (`change_to_team`, `perform_as`, `perform_immediately`, `stop`, `random_num_players`) to `ScriptService` so all 15 ability types produce narrator text. Also added `random_num_players` to `STEP_DURATIONS` (was missing) and registered all 5 new templates in the `_generate_step_instruction()` dispatch dict.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `_change_to_team_instruction()` with team param + fallback | Done | `app/services/script_service.py` | Uses `params.get("team")` with generic fallback |
| AC2 | `_perform_as_instruction()` describes deferred action | Done | `app/services/script_service.py` | Static text about copied role's wake time |
| AC3 | `_perform_immediately_instruction()` describes immediate action | Done | `app/services/script_service.py` | Static text: "Now perform the copied role's night actions." |
| AC4 | `_stop_instruction()` returns non-None stop text | Done | `app/services/script_service.py` | "Stop. Do not perform any further actions." |
| AC5 | `_random_num_players_instruction()` with options + fallback | Done | `app/services/script_service.py` | Formats options list with "or" separator; handles single/empty |
| AC6 | All 5 registered in templates dict | Done | `app/services/script_service.py` | Dict now has 15 entries |
| AC7 | All 15 types produce non-None instruction | Done | `app/services/script_service.py` | Verified by `test_all_15_types_produce_instructions` |
| AC8 | Doppelganger preview includes perform_immediately text | Done | `app/services/script_service.py` | Verified by `test_doppelganger_preview_has_perform_immediately` |
| AC9 | PI preview includes change_to_team + stop text | Done | `app/services/script_service.py` | Verified by `test_pi_preview_has_change_to_team_and_stop` |
| AC10 | Blob preview includes random_num_players with options | Done | `app/services/script_service.py` | Verified by `test_blob_preview_has_random_num_players` |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `app/services/script_service.py` | Modified | Added `random_num_players: 5` to `STEP_DURATIONS` | AC5: was missing from duration map, falls through to default but should be explicit |
| `app/services/script_service.py` | Modified | Added 5 entries to `templates` dict in `_generate_step_instruction()` | AC6: register all 5 new template methods |
| `app/services/script_service.py` | Modified | Added `_change_to_team_instruction()` method | AC1: team-specific or generic fallback text |
| `app/services/script_service.py` | Modified | Added `_perform_as_instruction()` method | AC2: deferred action text |
| `app/services/script_service.py` | Modified | Added `_perform_immediately_instruction()` method | AC3: immediate action text |
| `app/services/script_service.py` | Modified | Added `_stop_instruction()` method | AC4: stop text |
| `app/services/script_service.py` | Modified | Added `_random_num_players_instruction()` method | AC5: options-aware text with formatting |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `tests/test_script_service.py` | Modified | Added `TestMissingInstructionTemplates` class with 12 test methods | AC1–AC10 |

## Test Results
- **Baseline**: 208 passed, 0 failed (before implementation)
- **Final**: 220 passed, 0 failed (after implementation)
- **New tests added**: 12
- **Regressions**: None
- **Coverage**: 87% → 88%

## Deviations from Plan

- Added `random_num_players: 5` to `STEP_DURATIONS` — the plan noted this might be missing and to add it if so. It was indeed missing from the dict (the context doc D5 noted it "falls through to the default 5" but adding it explicitly is cleaner and consistent with the other 4 types).
- Added `test_random_num_players_single_option` as an extra test (beyond planned list) to cover the single-option edge case documented in the plan's edge case table.

## Gaps

None. All 10 ACs are implemented and verified.

## Reviewer Focus Areas

- Template text in `_change_to_team_instruction()` — uses `params.get("team")` to produce "If you see a {team}, you are now on the {team} team." Verify this matches the Paranormal Investigator's expected narrator text.
- `_random_num_players_instruction()` formatting logic — handles 0, 1, and 2+ options. Verify the comma-separated "or" format matches expected output ("2, 3, or 4").
- Templates dict now has 15 entries — verify no typos in the 5 new key strings vs. the ability type strings used in seed data.
- No existing template methods were modified — verify no unintended changes to the 10 existing methods.
