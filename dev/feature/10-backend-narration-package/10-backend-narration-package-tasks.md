# Tasks: Backend Narration Package (ScriptService Decomposition)

## Stage 0: Parity oracle (added — not in original plan)

The plan assumed `tests/test_script_service.py` was a strong parity oracle for AC4. It was
not: 83 asserts / 1,273 lines, and every template test asserted only non-None / `len > 0` /
lowercase-substring. None pinned an exact string. See the implementation record's
"Plan Accuracy Findings".

- [x] Verify the claimed anchor's actual contents and coverage before relying on it
- [x] Capture pre-refactor behavior exhaustively (41 instruction branches, 10 wake targets, 15 durations, OR-prefix, unknown-type)
- [x] Cross-check the transcribed expectation tables against the OLD implementation directly
- [x] Write `tests/test_narration_templates.py` (exact-equality oracle) BEFORE moving any code

## Stage 1: Input dataclasses + templates module

- [x] Install dev dependencies and capture the passing test baseline (349 passed, 94.31% — pytest already available; context's "not capturable" note was stale)
- [x] Create the `app/services/narration/` package
- [x] Define plain input dataclasses (`RoleScriptInput`, `AbilityStepInput`) covering role, step, and ability shapes; fields named for the future TS contract
- [x] Resolve the `StepModifier` question — kept as a plain enum import (non-ORM); recorded in the implementation record
- [x] Move the 15 `_*_instruction` generators, `_get_wake_instruction`, `STEP_DURATIONS`, and the dispatch dict into a pure templates module
- [x] Delete `_StandInRole`/`_StandInStep`/`_StandInAbility` and `_RoleLike`/`_StepLike` Protocols
- [x] Verify no `sqlalchemy` or ORM imports remain in the narration package (AC1 evidence — verified clean)
- [x] Run template tests against the new module — all green

## Stage 2: Script builder + thin service

- [x] Move `generate_night_script` orchestration/ordering/assembly into a pure script-builder module
- [x] Shrink `ScriptService` to DB access + adaptation, preserving the public API (541 → 195 lines)
- [x] Add must-have unit tests for the two adapters (`TestRoleToInputAdapter`, `TestPreviewRequestToInputAdapter`)
- [x] Update imports in `routers/games.py` and `routers/roles.py` — **not needed**; zero changes (import path and public API unchanged)
- [x] AC6 decision: **move rejected**, rationale recorded in the implementation record
- [x] Run the full suite: byte-identical scripts verified old-vs-new for all 30 real seed roles, default + custom + partial-fallback wake order, and preview section headers; all Section B edge cases preserved; coverage 96.08% (≥ 80%)
- [ ] Manual QA: generate a night script for a seeded game in the running app and spot-check against pre-refactor output — **not performed** (no app instance in subagent context). Superseded in strength by the automated 30-role old-vs-new byte-parity check; flagged as a gap for the reviewer.

## Stage 3: Test suite split

- [x] Split `tests/test_script_service.py` into 3 focused files along the new seams: `test_narration_templates.py` (instruction copy), `test_narration_script_builder.py` (ordering/assembly), `test_script_service.py` (preview + DB-facing + adapters)
- [x] Verify assertion count ≥ pre-split baseline (AC5): 83 → 139 raw asserts; 47 → 86 test defs
- [x] Run full suite green with the coverage gate; confirm no assertions were weakened (strength raised from substring/non-None to exact equality; 9 superseded weak tests deleted per AGENTS.md, each with a stronger replacement)
