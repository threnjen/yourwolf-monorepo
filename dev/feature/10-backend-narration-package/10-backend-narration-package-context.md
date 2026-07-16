# Context: Backend Narration Package (ScriptService Decomposition)

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/services/narration/__init__.py` [PROPOSED - name TBD] | New narration package | Create |
| `yourwolf-backend/app/services/narration/templates.py` [PROPOSED - name TBD] | Pure instruction templates: 15 `_*_instruction` generators, `_get_wake_instruction`, `STEP_DURATIONS`, dispatch dict | Create |
| `yourwolf-backend/app/services/narration/script_builder.py` [PROPOSED - name TBD] | Pure ordering/assembly (from `generate_night_script` orchestration, L100–L211) | Create |
| `yourwolf-backend/app/services/script_service.py` (541 lines) | Shrinks to DB access + ORM/preview → input-dataclass adaptation; public API preserved | Modify |
| `yourwolf-backend/app/routers/games.py` | Import-path changes at most (uses `ScriptService` at L14, L196–197) | Modify (minimal) |
| `yourwolf-backend/app/routers/roles.py` | Import-path changes at most (uses `ScriptService` at L18, L124) | Modify (minimal) |
| `yourwolf-backend/app/schemas/role.py` | Preview schemas L219–L244 relocated to `game.py` OR move explicitly rejected (AC6, implementer's call) | Modify (conditional) |
| `yourwolf-backend/app/schemas/game.py` | Receives preview schemas if AC6 move happens (`NarratorAction` L71, `NightScript` L81) | Modify (conditional) |
| `yourwolf-backend/app/schemas/__init__.py` | Barrel update if AC6 move happens — see Discovery Delta | Modify (conditional) |
| `yourwolf-backend/tests/test_script_service.py` (1,273 lines) | Split into ~3 files: templates, builder, preview/DB-facing [PROPOSED - names TBD] | Modify/Split |

### Read-only reference files

| File | Role |
|------|------|
| `yourwolf-backend/app/models/ability_step.py` | `StepModifier` enum used by templates — an enum import is not an ORM import; confirm the pure package may keep it or lift the enum |
| `dev/refactor-audit-backend/refactor-audit-backend-report.md` | Source audit findings 3.1, 4.2, 5.4, 3.4, 1.3, item 8 |
| `dev/feature/09-backend-service-validators/` | Sibling seam pattern to mirror (thin service + pure modules) |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| All plan line references verified: `STEP_DURATIONS` L74–90, `_get_wake_instruction` L339, dispatch L364–406, `_*_instruction` L408+, stand-ins/Protocols L23–67, preview schemas `role.py` L219–244 | Plan is accurate | None |
| Preview schemas (`NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest`) are **not exported from the `app/schemas/__init__.py` barrel** — importers (`routers/roles.py`, `script_service.py`) import directly from `app.schemas.role` | AC6's "barrel and importers update accordingly" over-states: only direct importers need updating; decide whether to add barrel exports when moving (barrel does export `NarratorAction`/`NightScript`) | Implementer note; no plan change needed |
| `StepModifier` is imported from `app.models.ability_step` and used in stand-ins and OR-prefix logic | AC1 says "no DB or ORM imports" in narration package — `StepModifier` is a model-module enum. Implementer must either accept the enum import as non-ORM or move/mirror the enum into the input-dataclass module | Implementer decision; record in implementation notes |
| `pytest` is not installed in the local dev environment (`.venv` lacks it; `uv run pytest` fails) | Test baseline could not be captured; suite must be runnable before Stage 1 (parity oracle for AC4) | Install dev deps (`requirements-dev.txt`) before starting; warning to Decomposer |
| pytest config enforces `--cov=app --cov-fail-under=80` | Splitting code across new modules must not drop coverage below 80% | Accepted constraint |
| Proposed module names `templates.py`, `script_builder.py`, input dataclass `RoleScriptInput`, and split test file names do not exist yet | Correctly labeled `[PROPOSED - name TBD]` in plan | Implementer chooses final names |
| No `.github/learnings/` directory exists | No learnings to apply | None |
| No contradictions found in plan stages, ACs, or edge-case list | — | — |

## Architectural Decisions

- **Three-layer decomposition**: templates (pure) / builder (pure) / service (I/O + adaptation). No inheritance, no plugin registry — keep the existing dict dispatch.
- **Input dataclasses replace stand-ins/Protocols**: `_StandInRole`/`_StandInStep`/`_StandInAbility` and `_RoleLike`/`_StepLike` (L23–67) are deleted; pure functions take plain input dataclasses (e.g., `RoleScriptInput` [PROPOSED - name TBD]) built by the service from ORM objects or preview payloads.
- **TypeScript port template**: the input-dataclass shape is the reference contract for Phase 04's TS `RoleInput`/`AbilityStepInput` types — name fields identically where possible. This is why a clean pure-function decomposition matters here.
- **Public API frozen**: `ScriptService.generate_night_script` and `preview_role_script` signatures unchanged so routers need at most import-path edits.
- **AC6 is implementer's call**: move preview schemas to `schemas/game.py` beside `NarratorAction`/`NightScript`, or record the move as rejected.

## Constraints

- Narrator English copy is **frozen** — byte-identical output for all 30 seed roles, default and custom wake order, and previews (AC4). Existing test assertions must pass unmodified.
- No new logs in the narration package (pure hot path).
- Coverage gate: `--cov-fail-under=80` in `pyproject.toml`.
- AGENTS.md conventions: update/delete affected tests first, then change code; delete stale tests rather than skip.
- Assertion count in the split test suite must be equal or higher (AC5).

## Scope Boundaries

- Do NOT change `app/services/game_service.py` — feature 09's file.
- Do NOT change any narrator string wording or wake-order sequencing behavior.
- Do NOT weaken or rewrite existing assertions — they are the parity proof for AC4.
- Preserve documented edge cases: no-step roles still get wake + close-eyes; `wake_order` null/0 excluded (preview → empty actions); unknown ability type → None → step skipped; `StepModifier.OR` → "OR " prefix + `requires_player_action = true`; duplicate role instances de-duplicated by role-ID set; custom sequence missing role IDs → fallback index.

## Relationships to Sibling Plans

- **Depends on**: `04-backend-domain-exceptions` (shares `routers/games.py`; also touched by 07 in Wave 3).
- **Parallel-safe within Wave 4**: disjoint from 09's service files and 11 (frontend).
- **Mirrors**: feature 09's thin-service + pure-modules seam.
- **Feeds forward**: Phase 04 TypeScript engine port — this package is the port template.

## Suggested Implementation Order

Wave 4, after 04 (and 07 in Wave 3) complete. Internally: Stage 1 (dataclasses + templates) → Stage 2 (builder + thin service + AC6 decision) → Stage 3 (test split).

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python 3.12 (`.venv` on 3.12.6; mypy targets 3.14) + FastAPI + SQLAlchemy + Pydantic; pip/`requirements-dev.txt` |
| Test Runner | `python -m pytest` (config in `pyproject.toml`; `testpaths=["tests"]`, `addopts="--cov=app --cov-report=term-missing --cov-fail-under=80"`) |
| Test Baseline | Not capturable — pytest not installed in local `.venv` (captured 2026-07-16). Install `requirements-dev.txt` and capture baseline before Stage 1. |
| Lint | mypy (strict-ish: `disallow_untyped_defs=true`); flake8/ruff not detected |
| Format | `black` (line-length 88) + `isort` (black profile) |

## Relevant Learnings

None applicable — no `.github/learnings/` directory exists in this repository.
