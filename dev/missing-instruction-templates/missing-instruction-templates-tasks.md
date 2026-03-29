# Tasks: Missing Instruction Templates

## Stage 1: Add Template Methods

- [ ] **1.1** Add `_change_to_team_instruction(self, role, params)` to `ScriptService` in `yourwolf-backend/app/services/script_service.py`
  - Use `params.get("team")` — if present, produce team-specific text (e.g., "If you see a werewolf, you are now on the werewolf team.")
  - If absent, produce generic fallback: "You change teams."
  - Place after `_copy_role_instruction()` method (around L475)
- [ ] **1.2** Add `_perform_as_instruction(self, role, params)` to `ScriptService`
  - Return: "At the copied role's normal wake time, perform their night actions."
  - No parameters needed
- [ ] **1.3** Add `_perform_immediately_instruction(self, role, params)` to `ScriptService`
  - Return: "Now perform the copied role's night actions."
  - No parameters needed
- [ ] **1.4** Add `_stop_instruction(self, role, params)` to `ScriptService`
  - Return: "Stop. Do not perform any further actions."
  - No parameters needed
- [ ] **1.5** Add `_random_num_players_instruction(self, role, params)` to `ScriptService`
  - Use `params.get("options")` — if present and non-empty, format as comma-separated with "or" before last (e.g., "2, 3, or 4")
  - Produce text like: "A random number of adjacent players (2, 3, or 4) are now part of your group."
  - If `options` absent/empty, fallback: "A random number of players are selected."
  - Handle single-option list: "3 adjacent players are now part of your group."
- [ ] **1.6** Register all 5 new methods in the `templates` dict inside `_generate_step_instruction()`
  - Add entries: `"change_to_team"`, `"perform_as"`, `"perform_immediately"`, `"stop"`, `"random_num_players"`
  - Verify dict now has 15 entries total
- [ ] **1.7** Verify `random_num_players` exists in `STEP_DURATIONS` — if missing, add `"random_num_players": 5`

## Stage 2: Unit Tests

- [ ] **2.1** Add `TestMissingInstructionTemplates` class to `yourwolf-backend/tests/test_script_service.py`
- [ ] **2.2** Add `test_change_to_team_with_param` — step with `params: {"team": "werewolf"}` → instruction contains "werewolf"
- [ ] **2.3** Add `test_change_to_team_no_param` — step with `params: {}` → instruction is non-None string (generic fallback)
- [ ] **2.4** Add `test_perform_as_instruction` — instruction contains "copied role" or "wake time"
- [ ] **2.5** Add `test_perform_immediately_instruction` — instruction contains "perform" and "immediately" (or similar)
- [ ] **2.6** Add `test_stop_instruction` — instruction contains "stop" (case-insensitive)
- [ ] **2.7** Add `test_random_num_players_with_options` — step with `params: {"options": [2, 3, 4]}` → instruction mentions "2", "3", "4"
- [ ] **2.8** Add `test_random_num_players_no_options` — step with `params: {}` → instruction is non-None string (generic fallback)
- [ ] **2.9** Add `test_all_15_types_produce_instructions` — iterate all 15 ability types, build a `_StandInStep` for each, call `_generate_step_instruction()`, assert result is not None
- [ ] **2.10** Add `test_pi_preview_has_change_to_team_and_stop` — build a Paranormal Investigator-like preview request with `wake_order > 0`, call `preview_role_script()`, assert actions contain change_to_team and stop instruction text
- [ ] **2.11** Add `test_blob_preview_has_random_num_players` — build a Blob-like preview request with `wake_order: 10`, call `preview_role_script()`, assert actions contain random_num_players instruction text with options
- [ ] **2.12** Update `_ensure_abilities()` helper — add entries for `change_to_team`, `stop`, `random_num_players` if not already present (needed for integration tests that touch the DB)
