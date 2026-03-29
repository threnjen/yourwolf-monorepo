# AC Coverage Map: Missing Instruction Templates

**Date:** 2026-03-28

| AC | Description | Automated Coverage | Manual QA Needed? | Reason |
|----|-------------|--------------------|--------------------|--------|
| AC1 | `_change_to_team_instruction()` with team param + fallback | 2 unit tests: `test_change_to_team_with_param` (asserts "werewolf" in output), `test_change_to_team_no_param` (asserts non-None fallback) | No | Pure string generation from params — output is assertable |
| AC2 | `_perform_as_instruction()` returns deferred-action text | 1 unit test: `test_perform_as_instruction` asserts "copied role" or "wake" in output | No | Static string return — fully assertable |
| AC3 | `_perform_immediately_instruction()` returns immediate-action text | 1 unit test: `test_perform_immediately_instruction` asserts "perform" in output | No | Static string return — fully assertable |
| AC4 | `_stop_instruction()` returns non-None stop text | 1 unit test: `test_stop_instruction` asserts "stop" in output | No | Static string return — fully assertable |
| AC5 | `_random_num_players_instruction()` with options + fallback | 3 unit tests: with 3 options (asserts "2","3","4"), no options (generic fallback), single option (asserts "3") | No | String formatting from params — all branches assertable |
| AC6 | All 5 registered in templates dict (15 total) | 1 unit test: `test_all_15_types_produce_instructions` iterates all 15 types, asserts non-None | No | Dict lookup + return value — fully assertable |
| AC7 | All 15 types produce non-None instruction | Same test as AC6 | No | Same coverage |
| AC8 | Doppelganger preview includes `perform_immediately` text | 1 integration test: `test_doppelganger_preview_has_perform_immediately` with `wake_order=1`, asserts "perform" in preview actions | Partial — only live UI rendering | Service-level preview output is tested; manual QA covers that the preview panel actually renders the new instruction text in the browser |
| AC9 | PI preview includes `change_to_team` + `stop` text | 1 integration test: `test_pi_preview_has_change_to_team_and_stop` asserts "werewolf" and "stop" in preview actions | Partial — only live UI rendering | Service-level preview output is tested; manual QA covers that the preview panel renders both instruction lines visually |
| AC10 | Blob preview includes `random_num_players` with options | 1 integration test: `test_blob_preview_has_random_num_players` asserts "2","3","4" in preview actions | Partial — only live UI rendering | Service-level preview output is tested; manual QA covers that the formatted options text renders correctly in the preview panel |
