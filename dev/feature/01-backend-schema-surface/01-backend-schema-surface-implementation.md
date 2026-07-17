# Implementation Record: Backend Schema Surface Cleanup

## Summary

Implements refactor-audit findings 2.3, 6.1, 6.3 across the backend schema surface:

1. **AC1** — Added `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` to the `app.schemas` barrel (imports + `__all__`).
2. **AC2** — Deleted dead classes `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` from `app/schemas/ability.py` and removed their barrel exports, after re-confirming zero non-barrel importers by grep.
3. **AC3** — Retyped `modifier` from `str` to `StepModifier` in `AbilityStepInRole` and `AbilityStepCreateInRole` (`app/schemas/role.py`), moving validation to the Pydantic/OpenAPI boundary.
4. **AC4** — Full suite passes; `modifier` still serializes to bare strings.

All work followed Red-Green-Refactor: barrel tests and enum-typing tests were written and confirmed failing before the corresponding source change.

**Intended behavior change (corrected during review — was 400, not 500):** a payload with an invalid `modifier` now returns **422** at the schema boundary. The plan's AC3 text, the original commit message, and this record previously described the prior behavior as "a 500 from an unwrapped `ValueError` at `role_service.py:335`". That is **incorrect**: `app/routers/roles.py:207-211` (create) and `:241-245` (update) both catch `ValueError` and re-raise it as **HTTP 400**. `StepModifier("bogus")` raises `ValueError` (verified), so the real change is **400 → 422**.

Consequences of the corrected framing:

- The response body shape changed for this case, from `{"detail": "'bogus' is not a valid StepModifier"}` (a string) to FastAPI's structured `{"detail": [{"loc": [...], "msg": ..., "type": "enum"}]}` (a list).
- **No test depended on the old behavior** — verified: no test in `tests/` asserts a 400 for an invalid modifier.
- **No client depended on the old behavior** — verified: no code under `yourwolf-frontend/src` reads the `detail` field of an error response. Actual client risk is therefore Low, but this is a genuine contract change rather than the "nobody depends on a 500" freebie the original framing implied. Logged to `.github/learnings/cross-phase-decisions.md` for features 08/11.

Verified end-to-end by `test_invalid_modifier_returns_422_at_api_boundary`, which now also pins the error to `loc == ["ability_steps", 0, "modifier"]` / `type == "enum"`.

## Sibling Features

Scanned all 12 sibling feature directories (plan titles only). Relevant notes:

- This feature is Wave 1, parallel-safe, no dependencies.
- **`10-backend-narration-package`** will later relocate the narration schemas. This feature only makes the barrel *accurate* and deliberately does **not** relocate `NarratorPreviewAction` / `NarratorPreviewResponse` / `PreviewScriptRequest`, so that move is not preempted.
- **Shared module read-only dependency:** `app/models/ability_step.py` (`StepModifier`) is consumed but not modified. Feature 02 concurrently modified this file; `StepModifier` was verified intact before and after the retype.
- **Observed sibling churn during this run:** features 02 (`app/config.py`, `app/database.py`) and 03/06/08/11 (frontend) were landing changes in the same working tree. Feature 02's in-flight edits transiently broke suite collection (`ImportError: settings`, then `SessionLocal`). These were **not** caused by this feature; no out-of-scope file was touched. The suite was re-run once feature 02 converged.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | [PROPOSED - name TBD] → `test_exports_narrator_preview_schemas` | Barrel exports the 3 narrator-preview schemas | Complete | `yourwolf-backend/app/schemas/__init__.py` | `yourwolf-backend/tests/test_schemas.py::TestSchemaBarrel::test_exports_narrator_preview_schemas` | PENDING | PENDING |
| AC2 | AC2 | [PROPOSED - name TBD] → `test_does_not_export_dead_ability_step_schemas`, `test_dead_classes_removed_from_ability_module` | Dead classes absent from module + barrel; grep shows zero importers | Complete | `yourwolf-backend/app/schemas/ability.py`, `yourwolf-backend/app/schemas/__init__.py` | `yourwolf-backend/tests/test_schemas.py::TestSchemaBarrel::test_does_not_export_dead_ability_step_schemas`, `::test_dead_classes_removed_from_ability_module`; grep evidence below | PENDING | PENDING |
| AC3 | AC3 | [PROPOSED - name TBD] → `test_invalid_modifier_rejected_on_role_create`, `test_invalid_modifier_returns_422_at_api_boundary`, `test_openapi_exposes_modifier_enum_values` | Invalid modifier rejected (ValidationError + 422); OpenAPI exposes enum set | Complete | `yourwolf-backend/app/schemas/role.py` | `yourwolf-backend/tests/test_schemas.py::TestAbilityStepModifierTyping` (9 tests) | PENDING | PENDING |
| AC4 | AC4 | existing suite + `test_modifier_serializes_to_bare_string` | Full suite passes; serialization unchanged | Complete | n/a (verification) | `yourwolf-backend/tests/test_schemas.py::TestAbilityStepModifierTyping::test_modifier_serializes_to_bare_string`, `::test_ability_step_in_role_serializes_to_bare_string`, `::test_modifier_serializes_to_bare_string_in_api_response` (added in review — asserts wire format through a real HTTP response, not just `model_dump`); full-suite run | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Barrel exports `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` | Complete | `app/schemas/__init__.py` | Added to both the `app.schemas.role` import block and `__all__`, alphabetically ordered per existing style. |
| AC2 | Dead `AbilityStep{Base,Create,Read}` deleted + barrel exports removed | Complete | `app/schemas/ability.py`, `app/schemas/__init__.py` | Grep re-confirmed zero non-barrel importers before deletion. `AbilityCreate`/`AbilityRead` untouched; all remaining imports in `ability.py` still used. |
| AC3 | `modifier` typed as `StepModifier` instead of `str` | Complete | `app/schemas/role.py` | Applied to `AbilityStepInRole` (L50) and `AbilityStepCreateInRole` (L110, `default=StepModifier.NONE`). Per context Discovery Delta, `ability.py` retype was a no-op since the owning class was deleted by AC2. |
| AC4 | Full suite passes; no serialized value changes | Complete | n/a | 281 passed, coverage 89.83% (gate 80%). `modifier` still serializes to `"none"/"and"/"or"/"if"`. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/schemas/__init__.py` | Modify | Added `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` to imports + `__all__`; removed `AbilityStepCreate`/`AbilityStepRead` from imports + `__all__`; collapsed the `app.schemas.ability` import to a single line | AC1 (barrel accuracy), AC2 (drop dead exports) |
| `yourwolf-backend/app/schemas/ability.py` | Modify | Deleted `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` (36 lines) | AC2 — dead code with zero importers |
| `yourwolf-backend/app/schemas/role.py` | Modify | Added `from app.models.ability_step import StepModifier`; retyped `modifier: str` → `StepModifier` in `AbilityStepInRole`; `modifier: str = Field(default="none")` → `StepModifier = Field(default=StepModifier.NONE)` in `AbilityStepCreateInRole` | AC3 — validation + OpenAPI contract at the schema boundary |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_schemas.py` | Modify (add tests) | Added `TestSchemaBarrel` (3 tests) and `TestAbilityStepModifierTyping` (9 tests, incl. a parametrized valid-values case); added imports for `Ability`, `StepModifier`, `TestClient`, `AbilityStepCreateInRole`, `AbilityStepInRole` | AC1, AC2, AC3, AC4 |

## Test Results

- **Baseline**: 250 passed, 0 failed — coverage 89.49% (recorded in `-context.md`, re-confirmed at start of this run)
- **Final**: 281 passed, 0 failed — coverage 89.83% (gate 80%)
- **New tests added**: 12 (this feature). The remaining delta (250 → 281) is from sibling features 02/03 landing `tests/test_config.py` and `tests/test_database.py` in the same working tree.
- **Regressions**: None

Test command used: `cd yourwolf-backend && uv run pytest -q` (the `uv pip install -r requirements-dev.txt` step from `-context.md` was unnecessary; the venv already had the dev deps).

### AC2 grep evidence (re-run at implementation time)

Before deletion — the only references were the definitions themselves plus the barrel:

```
=== AbilityStepBase ===
app/schemas/ability.py:38:class AbilityStepBase(BaseModel):
app/schemas/ability.py:58:class AbilityStepCreate(AbilityStepBase):
app/schemas/ability.py:64:class AbilityStepRead(AbilityStepBase):
=== AbilityStepCreate (whole word) ===
app/schemas/__init__.py:6,37 ; app/schemas/ability.py:58
=== AbilityStepRead (whole word) ===
app/schemas/__init__.py:7,40 ; app/schemas/ability.py:64
```

After deletion, the only remaining hits are the string literals inside the new regression guards in `tests/test_schemas.py` (lines 43, 51). Zero production references.

### AC3 OpenAPI evidence

```
OpenAPI StepModifier: {"type": "string", "enum": ["none", "and", "or", "if"],
                       "title": "StepModifier", "description": "..."}
AbilityStepCreateInRole.modifier -> {"$ref": "#/components/schemas/StepModifier", "default": "none"}
```

### AC3/AC4 service-compatibility evidence

`role_service.py:335` `StepModifier(step_data.get("modifier", "none"))` was left **unchanged** and still works — verified directly:

```
model_dump() modifier repr:      <StepModifier.AND: 'and'>
StepModifier(<enum instance>) -> <StepModifier.AND: 'and'>   # enum-of-enum is identity
model_dump(mode='json')       -> 'and'                        # AC4: bare string preserved
StepModifier.NONE != "none"   -> False                        # role_service.py:440 comparison still valid
```

## Deviations from Plan

- **`app/schemas/ability.py` `modifier` retype skipped (AC3).** The plan hedged this as "if the class survives AC2". It did not — the field belonged to `AbilityStepBase`, deleted by AC2. AC3 therefore reduced to `role.py` only. This matches the context Discovery Delta.
- **No test updates needed for AC2.** The plan's "existing tests to update" item was a no-op; `tests/test_schemas.py` never referenced the deleted classes. Confirmed by grep. New regression guards were added instead.
- **`role_service.py:335` left as-is, not simplified.** The plan permitted either. Left unchanged to honor the "no changes to services beyond what AC3 requires" constraint; verified still correct (evidence above).
- **Added an API-level 422 test.** The plan's must-have test allowed "ValidationError / 422 at the API boundary". Both are covered: schema-level `ValidationError` tests plus one `TestClient` test asserting a real 422 through `POST /api/v1/roles/`, since AC3's stated benefit is specifically the 400→422 boundary change.
- **`isort` reflow applied** to `app/schemas/role.py` and `tests/test_schemas.py` after adding imports, per the repo's configured `isort` (profile black).

## Gaps

- **`StepModifier` is not re-exported from the barrel.** It is a model enum, and the existing pattern (`Team`, `Visibility`) does not re-export model enums through `app.schemas` either. Consistent with the "barrel accuracy, not barrel enforcement" decision.
- **Pre-existing `mypy` errors remain** (16 errors across `app/models/*`, e.g. `game_role.py:63 Name "GameSession" is not defined`). These are outside this feature's scope and were not introduced here — `mypy app/schemas/` reports zero errors in the files this feature touched.

## Reviewer Focus Areas

- **`app/schemas/role.py:50` and `:110`** — the `str` → `StepModifier` retype. Confirm the `AbilityStepInRole` (read-side) change is safe given it is populated `from_attributes` off the ORM model, whose `modifier` column is already a `StepModifier`.
- **Intended 400 → 422 behavior change** — any client previously sending an out-of-enum `modifier` previously got a 400 (`ValueError` re-raised by `app/routers/roles.py`) and now gets a 422 with a structured `detail` list instead of a string. Verify this is acceptable to the frontend (note: feature 11 `frontend-type-split` and feature 08 `frontend-abilities-step` touch role/ability step types).
- **`role_service.py:440` `first_step.modifier != "none"`** — relies on `StepModifier` being a `str`-subclass enum for the comparison to keep working. Verified `False`, but it is now an implicit str-enum dependency worth a look.
- **`app/schemas/ability.py`** — confirm the remaining imports (`Any`, `UUID`, `datetime`, `ConfigDict`, `Field`, `BaseModel`) are all still used after the 36-line deletion (they are; `black`/`isort` clean).
- **Concurrent sibling edits** — feature 02 modified `app/models/ability_step.py` (the source of `StepModifier`) during this run. Worth a final confirmation that `StepModifier` values are unchanged at merge time.
