# Tasks: Backend Narration Package (ScriptService Decomposition)

## Stage 1: Input dataclasses + templates module

- [ ] Install dev dependencies (`requirements-dev.txt`) and capture the passing test baseline — the existing suite is the parity oracle for AC4
- [ ] Create the `app/services/narration/` package [PROPOSED - name TBD]
- [ ] Define plain input dataclasses (e.g., `RoleScriptInput` [PROPOSED - name TBD]) covering role, step, and ability shapes; name fields to match the future TS `RoleInput`/`AbilityStepInput` contract where possible
- [ ] Resolve the `StepModifier` question: keep the enum import (non-ORM) or mirror it into the input module; record the decision in implementation notes
- [ ] Move the 15 `_*_instruction` generators (`script_service.py` L408–L530), `_get_wake_instruction` and its 5 wake-target branches, `STEP_DURATIONS` (L74–L90), and the dispatch dict (L364–L406) into a pure templates module [PROPOSED - name TBD] operating on input dataclasses
- [ ] Delete `_StandInRole`/`_StandInStep`/`_StandInAbility` dataclasses and `_RoleLike`/`_StepLike` Protocols (L23–L67)
- [ ] Verify no `sqlalchemy` or `app.models` ORM imports remain in the narration package (AC1 evidence)
- [ ] Run existing template-related tests against the new module — assertions unmodified, all green

## Stage 2: Script builder + thin service

- [ ] Move `generate_night_script` orchestration/ordering/assembly logic (L100–L211) into a pure script-builder module [PROPOSED - name TBD]
- [ ] Shrink `ScriptService` to DB access + adaptation (ORM → input dataclass, preview payload → input dataclass), preserving the public API (`generate_night_script`, `preview_role_script`)
- [ ] Add must-have unit tests for the two adapters (ORM → input, preview → input) — scenario-based; final names [PROPOSED - name TBD]
- [ ] Update imports in `routers/games.py` and `routers/roles.py` only if paths change; no behavioral edits
- [ ] AC6 decision: relocate `NarratorPreviewAction`/`NarratorPreviewResponse`/`PreviewScriptRequest` (`schemas/role.py` L219–L244) to `schemas/game.py` beside `NarratorAction`/`NightScript`, updating direct importers (`routers/roles.py`, `script_service.py`; note: these are not in the schemas barrel) — OR record the move as rejected in implementation notes
- [ ] Run the full suite: byte-identical scripts for all 30 seed roles, default and custom wake order, preview incl. `perform_immediately`/`perform_as` section-header behavior; all edge cases in the plan's Section B preserved; coverage ≥ 80%
- [ ] Manual QA: generate a night script for a seeded game in the running app and spot-check against pre-refactor output

## Stage 3: Test suite split

- [ ] Split `tests/test_script_service.py` (1,273 lines) into ~3 focused files along the new seams: instruction-template tests, script-builder/orchestration tests, preview/DB-facing tests [PROPOSED - names TBD]
- [ ] Verify assertion count is equal to or higher than the pre-split baseline (AC5)
- [ ] Run full suite green with the coverage gate; confirm no assertions were weakened
