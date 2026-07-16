# Context: Backend Schema Surface Cleanup

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/schemas/__init__.py` | Schema barrel; missing `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest`; exports dead `AbilityStepCreate`/`AbilityStepRead` | Modify |
| `yourwolf-backend/app/schemas/ability.py` | Contains dead classes `AbilityStepBase` (L37), `AbilityStepCreate` (L56), `AbilityStepRead` (L62) | Modify (delete dead classes) |
| `yourwolf-backend/app/schemas/role.py` | `modifier: str` at L49 (`AbilityStepInRole`) and L109 (`AbilityStepCreateInRole`); retype to `StepModifier` | Modify |
| `yourwolf-backend/tests/test_schemas.py` | Schema validation tests; add invalid-modifier rejection test | Modify (add test) |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-backend/app/models/ability_step.py` | Defines `StepModifier(str, enum.Enum)` with values `none/and/or/if` (L13–19) |
| `yourwolf-backend/app/services/role_service.py` | `StepModifier(step_data.get("modifier", "none"))` conversion at L335; must keep working |
| `yourwolf-backend/app/routers/roles.py` | Imports `NarratorPreviewResponse`, `PreviewScriptRequest` directly from `app.schemas.role` (works today; barrel just out of sync) |
| `yourwolf-backend/app/services/script_service.py` | Imports the three narrator-preview schemas directly from `app.schemas.role` |
| `yourwolf-backend/tests/test_roles.py` | API-level role tests — confirm 422 behavior surfaces at router boundary |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| All plan file/symbol references verified: `AbilityStepBase/Create/Read` exist at `app/schemas/ability.py` L37–L70; `modifier: str` at `role.py` L49/L109; `StepModifier` at `models/ability_step.py` L13; role_service conversion at L335 | Plan is accurate | None |
| Zero non-barrel importers of `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` confirmed by grep (all other `AbilityStep*` hits are `AbilityStepCreateInRole`/`AbilityStepInRole` in `role.py`, `test_role_service.py`, `test_script_service.py` — different classes, unaffected) | AC2 deletion is safe; grep evidence already gathered | Re-run grep at implementation time as evidence |
| `tests/test_schemas.py` does NOT reference any deleted `AbilityStep*` classes (imports only `RoleCreate`, `RoleListItem`, `RoleUpdate`, game schemas) | The plan's "existing tests to update" item for AC2 is a no-op | No test updates needed for AC2; only the new AC3 test is required |
| AC3 mentions retyping `ability.py` L42 "if the class survives AC2" — the field belongs to `AbilityStepBase`, which is deleted by AC2 | AC3 reduces to `role.py` L49 and L109 only | Skip ability.py retype |
| AGENTS.md says use `uv sync` with pyproject as dependency source of truth, but pyproject has no `[project] dependencies`; deps live in `requirements.txt`/`requirements-dev.txt`. `uv sync` alone does not install pytest | Test command must use `uv pip install -r requirements-dev.txt` first | Environment State records working command |
| Existing enum-in-schema pattern confirmed: `role.py` uses `Team` and `Visibility` model enums directly in fields (L63, L98, L121, L125) | AC3 follows established pattern | None |
| `StepModifier` is a `str`-subclass enum, so JSON serialization stays `"none"/"and"/"or"/"if"` | AC4 no-serialization-change requirement is satisfiable | None |

No contradictions requiring plan revision; findings above only narrow scope.

## Architectural Decisions

- **Retype at the schema boundary, not the service**: typing `modifier` as `StepModifier` moves validation to Pydantic/OpenAPI; invalid values now fail with 422 instead of an unwrapped `ValueError` → 500 at `role_service.py:335`. This is an intended behavior change and must be noted in the implementation record.
- **Keep the service conversion working**: `StepModifier(step_data.get("modifier", "none"))` accepts enum instances (enum-of-enum is identity), so it may be left as-is or simplified — do not break it.
- **Barrel accuracy only, not barrel enforcement**: the barrel is made to match the live schema surface; internal imports that bypass the barrel (finding 6.2) stay untouched.
- **No new abstractions**: delete dead code, add missing exports, retype two fields.

## Constraints

- No changes to services, routers, or models beyond what AC3's typing requires.
- JSON serialization of `modifier` must remain the bare strings `"none"/"and"/"or"/"if"`.
- Pydantic v2 conventions per `yourwolf-backend/AGENTS.md`.
- Coverage gate: pytest enforces `--cov-fail-under=80` (baseline 89.49%).

## Scope Boundaries

- Do not relocate schemas (audit finding 1.3 is deferred to `10-backend-narration-package`).
- Do not force internal imports through the barrel (finding 6.2 accepted as-is).
- Do not touch `AbilityStepCreateInRole` / `AbilityStepInRole` semantics beyond the `modifier` field type.
- Do not modify `app/models/ability_step.py` (`StepModifier` is consumed, not changed).
- `AbilityCreate` / `AbilityRead` in `ability.py` remain untouched.

## Relationships to Sibling Plans

- Wave 1, parallel safe, no dependencies.
- `10-backend-narration-package` will later relocate narration schemas; this feature must not preempt that move.

## Suggested Implementation Order

- Stage 1 (barrel sync + dead-class removal) before Stage 2 (enum retype), per plan. No sibling ordering constraints.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python (venv 3.12.6; pyproject declares `requires-python >=3.14`) + FastAPI + Pydantic v2 + SQLAlchemy |
| Test Runner | `cd yourwolf-backend && uv pip install -r requirements-dev.txt && uv run --no-sync pytest -q` |
| Test Baseline | 250 passed, 0 failed, coverage 89.49% (gate 80%) — captured 2026-07-16 |
| Lint | mypy configured (`[tool.mypy]` in pyproject); no ruff/flake8 |
| Format | `black` (line-length 88) + `isort` (profile black) per pyproject; installed via requirements-dev.txt |

## Relevant Learnings

None applicable — no `.github/learnings/` directory exists in this repository.
