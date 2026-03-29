# Feature Plan: Missing Instruction Templates

> Add the 5 missing ability instruction templates so all 15 ability types produce narrator text.

## Source Phase

[PHASE_3.5_NARRATOR_PREVIEW_FIXES.md](../../yourwolf-docs/docs/phases/PHASE_3.5/PHASE_3.5_NARRATOR_PREVIEW_FIXES.md) — Bug 3

---

## A. Requirements & Traceability

### Acceptance Criteria

| AC  | Description |
|-----|-------------|
| AC1 | `_change_to_team_instruction()` exists and returns non-None text. Uses `team` parameter when present; falls back to generic text when absent. |
| AC2 | `_perform_as_instruction()` exists and returns non-None text describing deferred action at the copied role's normal wake time. |
| AC3 | `_perform_immediately_instruction()` exists and returns non-None text describing immediate action. |
| AC4 | `_stop_instruction()` exists and returns non-None text (e.g., "Stop. Do not perform any further actions."). Duration is 0. |
| AC5 | `_random_num_players_instruction()` exists and returns non-None text. Uses `options` parameter when present; falls back to generic text when absent. |
| AC6 | All 5 new templates are registered in the `templates` dict inside `_generate_step_instruction()`. |
| AC7 | All 15 ability types now produce non-None instruction text from `_generate_step_instruction()` (no silent skips). |
| AC8 | Doppelganger preview (when `wake_order > 0`) includes `perform_immediately` instruction text in the action list. |
| AC9 | Paranormal Investigator preview includes `change_to_team` and `stop` instruction text. |
| AC10 | Blob preview includes `random_num_players` instruction text with options from parameters. |

### Non-Goals

- Conditional step rendering — `condition_type` / `condition_params` fields are stored but NOT interpreted by templates. A `change_to_team` step with `condition_type: "only_if_team"` still produces unconditional instruction text (e.g., "If you see a werewolf, you are now on the werewolf team." — the "if" is baked into the template text, not driven by `condition_type`).
- Duration tuning — use the values already in `STEP_DURATIONS` (already defined for all 5 types).
- Modifying any existing template methods.

### Traceability Matrix

| AC  | Code Areas | Planned Tests |
|-----|-----------|---------------|
| AC1 | `script_service.py` → `_change_to_team_instruction()`, `templates` dict | `test_change_to_team_with_param`, `test_change_to_team_no_param` |
| AC2 | `script_service.py` → `_perform_as_instruction()`, `templates` dict | `test_perform_as_instruction` |
| AC3 | `script_service.py` → `_perform_immediately_instruction()`, `templates` dict | `test_perform_immediately_instruction` |
| AC4 | `script_service.py` → `_stop_instruction()`, `templates` dict | `test_stop_instruction` |
| AC5 | `script_service.py` → `_random_num_players_instruction()`, `templates` dict | `test_random_num_players_with_options`, `test_random_num_players_no_options` |
| AC6 | `script_service.py` → `_generate_step_instruction()` `templates` dict | `test_all_15_types_produce_instructions` |
| AC7 | `script_service.py` → all templates | `test_all_15_types_produce_instructions` |
| AC8 | `script_service.py` → preview path | `test_doppelganger_has_perform_immediately_text` |
| AC9 | `script_service.py` → preview path | `test_pi_has_change_to_team_and_stop_text` |
| AC10 | `script_service.py` → preview path | `test_blob_has_random_num_players_text` |

---

## B. Correctness & Edge Cases

### Key Workflows

1. `_generate_step_instruction()` looks up `ability.type` in `templates` dict → calls the matching method → returns instruction string.
2. Currently, 5 types have no entry in the dict → `generator` is `None` → returns `None` → step is silently skipped.
3. After this feature, all 15 types have entries → every step produces text.

### Edge Cases

| Case | Expected |
|------|----------|
| `change_to_team` with `team: "werewolf"` | "If you see a werewolf, you are now on the werewolf team." (or similar team-specific text) |
| `change_to_team` with no `team` parameter | Generic fallback: "You change teams." |
| `random_num_players` with `options: [2, 3, 4]` | "A random number of adjacent players (2, 3, or 4) are now part of your group." |
| `random_num_players` with empty `options` | Generic fallback: "A random number of players are selected." |
| `random_num_players` with `options: [3]` | "3 adjacent players are now part of your group." (single option) |
| `stop` step | "Stop. Do not perform any further actions." (duration = 0 per `STEP_DURATIONS`) |
| `perform_immediately` step | "Now perform the copied role's night actions." |
| `perform_as` step | "At the copied role's normal wake time, perform their night actions." |
| `stop` step with `OR` modifier | "OR Stop. Do not perform any further actions." (the modifier prefix is applied by the caller, not the template) |

### Error-Handling Strategy

- Template methods receive `(role, params)` — `params` may be empty. Always use `.get()` with a fallback.
- No exceptions should be raised by template methods. They always return a string.

---

## C. Consistency & Architecture Fit

### Patterns to Follow

- Each template is a private method: `def _<ability_type>_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str`.
- Method signature matches the existing 10 templates exactly.
- Registration in `templates` dict follows the existing pattern: `"ability_type": self._ability_type_instruction`.
- `STEP_DURATIONS` already has entries for all 5 missing types — no changes needed there.

### Deviations

None. This is a pure additive change following the established pattern exactly.

### Interfaces

Each new method:
- **Input**: `role: _RoleLike` (has `.name`, `.wake_target`), `params: dict[str, Any]` (step parameters)
- **Output**: `str` (instruction text, never `None`)

---

## D. Clean Design & Maintainability

### Simplest Design

1. Add 5 private methods to `ScriptService`, one per missing ability type.
2. Add 5 entries to the `templates` dict in `_generate_step_instruction()`.
3. Add unit tests.

No new files, no new classes, no new abstractions.

### Complexity Risks

- None. This is 5 small methods + 5 dict entries.

### Keep-It-Clean Checklist

- [ ] Each method follows the exact `(self, role, params) -> str` signature
- [ ] Each method uses `params.get()` with fallbacks — no `KeyError` risk
- [ ] No modification to existing template methods
- [ ] `STEP_DURATIONS` already covers all 5 types — verify, do not add duplicates

---

## E. Completeness: Observability, Security, Operability

### Logging

- No additional logging needed. `_generate_step_instruction()` already handles the flow.

### Security

- Template methods only format strings from the step's `parameters` dict (which is stored in the DB or comes from a validated Pydantic schema). No injection risk — the output is used as plain text narration.

### Runbook

- **Deploy**: Backend-only change (no frontend changes, no migrations).
- **Verify**: Call preview for a Paranormal Investigator-like role → should now see `change_to_team` and `stop` instructions in the output instead of silently missing steps.
- **Rollback**: Revert changes in `script_service.py` and `test_script_service.py`.

---

## F. Test Plan

### Test ↔ AC Mapping

| Test | AC |
|------|-----|
| `test_change_to_team_with_param` | AC1 |
| `test_change_to_team_no_param` | AC1 |
| `test_perform_as_instruction` | AC2 |
| `test_perform_immediately_instruction` | AC3 |
| `test_stop_instruction` | AC4 |
| `test_random_num_players_with_options` | AC5 |
| `test_random_num_players_no_options` | AC5 |
| `test_all_15_types_produce_instructions` | AC6, AC7 |
| `test_doppelganger_has_perform_immediately_text` | AC8 |
| `test_pi_has_change_to_team_and_stop_text` | AC9 |
| `test_blob_has_random_num_players_text` | AC10 |

### Top 5 High-Value Test Cases

1. **Given** a `change_to_team` step with `params: {"team": "werewolf"}`, **When** `_generate_step_instruction()` is called, **Then** the returned instruction contains "werewolf team".

2. **Given** a `random_num_players` step with `params: {"options": [2, 3, 4]}`, **When** `_generate_step_instruction()` is called, **Then** the returned instruction mentions "2, 3, or 4".

3. **Given** a `stop` step, **When** `_generate_step_instruction()` is called, **Then** the returned instruction is non-None and contains "stop" (case-insensitive).

4. **Given** all 15 ability types, each constructed as a `_StandInStep`, **When** `_generate_step_instruction()` is called for each, **Then** every call returns a non-None string (no silent skips).

5. **Given** a Paranormal Investigator-like role with `view_card` + `change_to_team` + `stop` steps and `wake_order > 0`, **When** `preview_role_script()` is called, **Then** the actions list contains instruction text for all three steps (plus wake and close eyes).

### Test Data / Fixtures

- Use `_StandInRole` and `_StandInStep` directly for unit-level template tests (no DB needed).
- For integration-level preview tests, use `PreviewScriptRequest` (or `RoleCreate` if `preview-endpoint-fix` hasn't landed yet — note this in the test).
- `_ensure_abilities()` helper needs entries for `change_to_team`, `perform_as`, `perform_immediately`, `stop`, and `random_num_players` if integration tests touch the DB.

---

## Stages

### Stage 1: Add Template Methods

**Goal**: Implement the 5 missing `_*_instruction()` methods and register them in `templates`.

**Changes**:
- `yourwolf-backend/app/services/script_service.py` — add 5 methods, add 5 entries to `templates` dict

**Success Criteria**: `_generate_step_instruction()` returns non-None for all 15 ability types.

**Status**: Not Started

### Stage 2: Unit Tests

**Goal**: Add tests for each new template and a comprehensive coverage test.

**Changes**:
- `yourwolf-backend/tests/test_script_service.py` — add `TestMissingInstructionTemplates` class with 8–11 test methods

**Success Criteria**: All tests pass. AC1–AC10 verified.

**Status**: Not Started
