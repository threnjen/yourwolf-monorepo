# Tasks: Backend Schema Surface Cleanup

## Stage 1: Barrel sync and dead-class removal

- [ ] Re-run and capture grep evidence that `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` have zero importers outside `app/schemas/__init__.py` (AC2 evidence)
- [ ] Delete `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` from `yourwolf-backend/app/schemas/ability.py` (AC2)
- [ ] Remove `AbilityStepCreate` and `AbilityStepRead` from the imports and `__all__` in `yourwolf-backend/app/schemas/__init__.py` (AC2)
- [ ] Add `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` (from `app.schemas.role`) to the barrel imports and `__all__` in `yourwolf-backend/app/schemas/__init__.py` (AC1)
- [ ] Run the full backend suite and confirm all 250 baseline tests still pass (AC4 partial)

## Stage 2: Enum typing for modifier

- [ ] Retype `modifier` from `str` to `StepModifier` (import from `app.models.ability_step`) in `AbilityStepInRole` (`role.py` L49) and `AbilityStepCreateInRole` (`role.py` L109, keep `default=StepModifier.NONE`-equivalent behavior) (AC3)
- [ ] Verify `role_service.py:335` `StepModifier(step_data.get("modifier", "none"))` still works with enum-carrying payloads; simplify only if trivially safe (AC3)
- [ ] Add a test in `tests/test_schemas.py` that a role create/update payload with an invalid `modifier` value is rejected (ValidationError / 422 at the API boundary) — method name [PROPOSED - name TBD] (AC3)
- [ ] Confirm `modifier` still serializes to bare strings `"none"/"and"/"or"/"if"` in responses (str-enum), e.g. via existing `tests/test_roles.py` assertions (AC4)
- [ ] Spot-check OpenAPI schema shows the enum value set for `modifier` (code-review or manual evidence) (AC3)
- [ ] Run the full backend suite; confirm passes with coverage ≥ 80% and note the 500→422 behavior change in the implementation record (AC4)
