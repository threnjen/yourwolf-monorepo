# Context: Missing Instruction Templates

## Key Files

| File | Role | Lines of Interest |
|------|------|-------------------|
| `yourwolf-backend/app/services/script_service.py` | All changes go here. `_generate_step_instruction()` (L350–385) contains the `templates` dict with 10 entries — 5 are missing. Existing template methods (L387–475) establish the pattern. `STEP_DURATIONS` (L78–92) already has entries for all 15 types including the 5 missing ones. | L78–92, L350–385, L387–475 |
| `yourwolf-backend/app/seed/abilities.py` | Defines all 15 ability types with `parameters_schema`. Used to verify what parameters each ability type expects. `change_to_team` expects `team` (L178–191), `perform_as` / `perform_immediately` / `stop` have empty params (L193–220), `random_num_players` expects `options` array (L222–238). | L178–238 |
| `yourwolf-backend/app/seed/roles.py` | Reference roles using the missing ability types: Doppelganger (`perform_immediately`, L420–460), Copycat (`perform_as`, L480–520), Paranormal Investigator (`change_to_team` + `stop`, L620–670), Blob (`random_num_players`, L886–920). | L420–460, L480–520, L620–670, L886–920 |
| `yourwolf-backend/tests/test_script_service.py` | Tests go here. Existing `TestPreviewRoleScript` and `TestScriptInstructions` classes establish the test pattern. `_ensure_abilities()` helper (L306–330) needs entries for the 5 missing ability types. | L306–330, L340+ |
| `yourwolf-backend/app/models/ability_step.py` | `StepModifier` enum — confirms valid modifier values. | (whole file) |

## Decisions Made

### D1: Template text is unconditional

**Chose**: Template methods produce static instruction text. They do NOT interpret `condition_type` or `condition_params`.
**Why**: The phase doc explicitly lists conditional rendering as out of scope. The `change_to_team` instruction for Paranormal Investigator says "If you see a werewolf..." as baked-in text, not dynamically generated from `condition_type: "only_if_team"`. Conditional rendering is a future feature.

### D2: `_stop_instruction()` returns visible text (not empty/no-op)

**Chose**: Returns "Stop. Do not perform any further actions."
**Why**: The phase doc edge case table says "Template produces text — not silently skipped." The narrator reads this aloud to signal the end of a conditional branch.

### D3: `_change_to_team_instruction()` uses `team` param when available

**Chose**: `params.get("team")` → "If you see a [team], you are now on the [team] team." Fallback: "You change teams."
**Why**: The Paranormal Investigator seed data has `"parameters": {"team": "werewolf"}` — using it produces more helpful narrator text. The fallback covers roles that might not specify a team.

### D4: `_random_num_players_instruction()` formats the options list

**Chose**: Uses `options` parameter to produce "2, 3, or 4" style text. Fallback: generic message.
**Why**: Blob's seed data has `"parameters": {"options": [2, 3, 4]}` — formatting this into the instruction text is more informative than a generic message.

### D5: No changes to `STEP_DURATIONS`

**Chose**: Verified that all 5 types already exist in `STEP_DURATIONS`. No additions needed.
**Why**: `change_to_team: 2`, `perform_as: 2`, `perform_immediately: 2`, `stop: 0` are already defined. `random_num_players` is not explicitly listed — it falls through to the default `5` in `_get_step_duration()`. This is acceptable. (Note: if the implementer sees `random_num_players` is missing from `STEP_DURATIONS`, add it with a reasonable value like `5`.)

## Constraints

- Do NOT modify any of the 10 existing template methods.
- Do NOT modify `_generate_step_instruction()` beyond adding 5 new entries to the `templates` dict.
- Do NOT modify `STEP_DURATIONS` unless `random_num_players` is missing (add it if so).
- All new methods must follow the exact `(self, role: _RoleLike, params: dict[str, Any]) -> str` signature.
- Template methods must never return `None` — always return a string.

## Relationship to Sibling Plans

- **`preview-endpoint-fix`** is the critical path. This feature's results (instruction text for the 5 missing types) will only be visible in the narrator preview UI once the endpoint fix is deployed.
- However, the code changes are completely independent — this feature only adds new methods and dict entries to `script_service.py`, while `preview-endpoint-fix` changes the endpoint signature, the `preview_role_script()` guard, and the `generate_night_script()` query.
- **Suggested order**: Implement after `preview-endpoint-fix`, but can be done in parallel since changes touch different code regions.
- **Test interaction**: If implemented before `preview-endpoint-fix`, the integration preview tests for Doppelganger (`wake_order: 0`) will return empty actions. Tests that exercise the template methods directly (using `_StandInStep`) are unaffected.
