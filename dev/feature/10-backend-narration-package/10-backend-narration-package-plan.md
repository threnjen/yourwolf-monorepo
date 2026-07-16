# Plan: Backend Narration Package (ScriptService Decomposition)

## Execution Metadata

- **Wave:** 4
- **Parallel safe:** yes
- **Depends on:** 04-backend-domain-exceptions
- **Key files modified:** `yourwolf-backend/app/services/narration/templates.py` [PROPOSED - name TBD] (new), `yourwolf-backend/app/services/narration/script_builder.py` [PROPOSED - name TBD] (new), `yourwolf-backend/app/services/script_service.py`, `yourwolf-backend/app/routers/games.py`, `yourwolf-backend/app/routers/roles.py`, `yourwolf-backend/app/schemas/game.py` (verify), `yourwolf-backend/app/schemas/role.py` (verify), `yourwolf-backend/tests/test_script_service.py` (split into ~3 files [PROPOSED - names TBD])
- **Sequential reason:** shares `routers/games.py` with upstream 04-backend-domain-exceptions (and 07 in Wave 3). Parallel-safe within Wave 4 (disjoint from 09's service files and 11).

Source: refactor audit findings 3.1 (High), 4.2 (Medium), 5.4, 3.4, 1.3, restructuring item 8 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`. **Phase 04 note:** this module is precisely what gets ported to TypeScript next — a clean pure-function decomposition here is the template for the TS engine and materially de-risks the port.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: A narration templates module contains the 15 `_*_instruction` generators (`script_service.py` L408–L530), `_get_wake_instruction` and its 5 wake-target branches, `STEP_DURATIONS` (L74–L90), and instruction dispatch (L364–L406) — as pure functions with no DB or ORM imports. Clarification: importing plain enums (`StepModifier`, `Team`) from `app/models` is permitted — "no ORM imports" means no SQLAlchemy session/engine/mapped-class dependencies, not a ban on shared enum types.
- **AC2**: Pure functions operate on plain input dataclasses (e.g., `RoleScriptInput` [PROPOSED - name TBD]) constructed from either ORM objects or preview payloads. The `_StandInRole`/`_StandInStep`/`_StandInAbility` dataclasses and `_RoleLike`/`_StepLike` Protocols (L23–L67) are deleted — their purpose disappears.
- **AC3**: A script-builder module owns ordering/assembly (`generate_night_script` orchestration logic, L100–L211); `ScriptService` shrinks to DB access + adaptation (ORM→input dataclass, preview payload→input dataclass) and keeps its existing public API (`generate_night_script`, `preview_role_script`) so `routers/games.py` and `routers/roles.py` need at most import-path changes.
- **AC4**: Generated scripts are byte-identical to before for all 30 seed roles, default and custom wake order, and preview scripts including the `perform_immediately`/`perform_as` section-header behavior — verified by the existing test suite passing unmodified in its assertions.
- **AC5**: `tests/test_script_service.py` (1,273 lines) splits along the same seams: instruction-template tests, script-builder/orchestration tests, preview/DB-facing tests. Assertion count equal or higher.
- **AC6**: Preview schemas (`NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` at `schemas/role.py` L219–L244) are relocated to sit with their siblings `NarratorAction`/`NightScript` in `schemas/game.py` (audit finding 1.3) OR explicitly left in place with the move recorded as rejected — implementer's call; if moved, importers update accordingly. Note: at audit time the preview schemas were imported directly, not via the barrel — but feature `01-backend-schema-surface` adds them to the barrel, so if that feature has landed, keep the barrel in sync with the move.

Non-goals: no wording changes to any narrator string (English copy is frozen — localization is a future concern); no behavior changes to wake-order sequencing; no changes to `game_service.py` (feature 09's file).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1–AC2 | narration modules | Code-review evidence: no `sqlalchemy`/model imports in narration package; existing template tests |
| AC3 | `script_service.py`, routers | Existing router tests unchanged |
| AC4 | full generation paths | Existing tests (the 1,273-line suite is the parity oracle — audit rates coverage strong) |
| AC5 | split test files | Existing tests to split; assertion-count comparison |
| AC6 | schemas + barrel | tsc-equivalent: import graph compiles; suite green |

## B. Correctness & Edge Cases

Preserve exactly (these are Phase 04's documented edge cases too):
- Roles with no ability steps still produce wake + close-eyes actions.
- `wake_order == null`/`0` roles excluded; empty night script still gets opening/closing actions.
- Unknown ability types: instruction generator returns None → step silently skipped.
- `StepModifier.OR`: "OR " prefix AND `requires_player_action = true`.
- Preview with `wake_order` null/0 → empty actions.
- Duplicate role instances de-duplicated via role-ID set.
- Custom sequence with missing role IDs ignored via fallback index.

## C. Consistency & Architecture Fit

- Mirrors feature 09's seam (thin service + pure modules). The input-dataclass shape should be designed as the reference contract for Phase 04's TypeScript `RoleInput`/`AbilityStepInput` types — name fields identically where possible.
- Narration package location `app/services/narration/` per audit recommendation.

## D. Clean Design & Maintainability

The decomposition target is: templates (pure) / builder (pure) / service (I/O + adaptation). No inheritance, no plugin registry — a dict dispatch as today.

## E. Observability, Security, Operability

No new logs (pure hot path). Rollback: revert; public API unchanged.

## F. Test Plan

Environment note (expander-verified): pytest is not installed in the local venv — run the dev-dependency install (`requirements-dev.txt`) and capture the AC4 parity baseline BEFORE making changes.

- Existing tests to split per AC5; assertions must not weaken — they are the parity proof for AC4.
- Must-have new tests: direct unit tests of the input-dataclass adapters (ORM→input, preview→input) — scenarios; names [PROPOSED - name TBD].
- Manual QA: generate a night script for a seeded game in the running app and spot-check against pre-refactor output for the same role set.

## Stage 1: Input dataclasses + templates module
**Goal**: AC1, AC2
**Success Criteria**: Pure templates module; stand-ins deleted; template tests pass against new module
**Status**: Not Started

## Stage 2: Script builder + thin service
**Goal**: AC3, AC4, AC6
**Success Criteria**: Routers untouched beyond imports; full parity suite green
**Status**: Not Started

## Stage 3: Test suite split
**Goal**: AC5
**Success Criteria**: Three focused test files; assertion count ≥ baseline
**Status**: Not Started
