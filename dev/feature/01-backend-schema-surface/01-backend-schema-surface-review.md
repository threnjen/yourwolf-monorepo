# Review Record: Backend Schema Surface Cleanup

## Summary

Reviewed commit `e0b7d43` against the plan's four ACs. All four are implemented and the change set is small, well-targeted, and free of dead code — the implementation genuinely does what it claims at the code level. All three items the implementer flagged for attention were checked; two hold up exactly as described, and one rests on a false premise.

The substantive finding is that the **documented rationale for AC3 is factually wrong** across the plan, the commit message, the implementation record, and a test docstring: the pre-change behavior for an invalid `modifier` was **HTTP 400, not 500**. `app/routers/roles.py:207-211` catches the `ValueError` that `StepModifier("bogus")` raises and re-raises it as a 400. The code change is still correct and still an improvement, and I verified that nothing depended on the old behavior — but the framing mattered, because "500 → 422" implies no client could have depended on it, whereas "400 → 422" is a real contract change with a changed response body shape. Corrected in the record and the docstring.

Two test-quality gaps were also fixed: the 422 test could pass vacuously, and AC4's serialization claim was verified only at the schema layer.

Verdict is Approved with Reservations rather than Approved solely because the reservations are documentation- and test-strength-level, not code-level. No production code needed changes.

## Verdict

**Approved with Reservations**

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met (verified) | `app/schemas/__init__.py:17-19, 43-44, 47` | All 3 narrator-preview schemas exist in `app/schemas/role.py:221, 229, 235` and are in both the import block and `__all__`. I independently enumerated every `BaseModel` subclass across all four schema modules against `__all__`: the only names absent are `RoleBase` / `WinConditionBase` / `AbilityBase` (internal bases) and `PaginatedResponse[...]` parametrizations (the generic itself is exported). Barrel is accurate for the public surface. |
| AC2 | Met (verified) | `app/schemas/ability.py` (36 lines removed), `app/schemas/__init__.py:3, 32-36` | Independent grep across `app/` and `tests/` confirms zero remaining references to `AbilityStepBase` / `AbilityStepCreate` / `AbilityStepRead` other than the string literals in the new regression guards. Remaining imports in `ability.py` (`Any`, `UUID`, `datetime`, `BaseModel`, `ConfigDict`, `Field`) are all still used by `AbilityBase` / `AbilityCreate` / `AbilityRead`. `black`/`isort` clean. |
| AC3 | Met (verified), rationale corrected | `app/schemas/role.py:51, 111` | Retype is correct and validation fires at the boundary. **Scope reduction verified as sound**: the `ability.py` `modifier` field lived on `AbilityStepBase` (confirmed at `e0b7d43^:app/schemas/ability.py:40`), which AC2 deleted — the retype there is genuinely moot, not skipped work. **However the stated benefit was wrong** (Issue #1): old behavior was 400, not 500. |
| AC4 | Met (verified) | n/a (verification) | Full suite: 282 passed, 89.83% coverage (gate 80%). Wire format confirmed unchanged through a real HTTP response after adding the missing API-level test (Issue #3). |

### Implementer's flagged items — findings

1. **"Invalid modifier now 422 instead of 500"** — **Premise refuted, conclusion safe.** Old behavior was **400**, not 500 (`roles.py:207-211` create, `:241-245` update both catch `ValueError` → 400; `StepModifier("bogus")` raises `ValueError`, confirmed empirically). The improvement is still genuine (boundary validation, OpenAPI enum contract, structured errors). Nothing depended on the old behavior: no test asserts 400 for an invalid modifier, and no code under `yourwolf-frontend/src` reads the `detail` field of an error response. See Issue #1.
2. **AC3 scope reduction** — **Reasoning holds.** Verified against the parent commit that `modifier` was a field of the deleted `AbilityStepBase`. No orphaned work.
3. **`role_service.py:335` left unchanged** — **Verified still correct.** `steps_data` originates from `s.model_dump()` (`role_service.py:229-230` create, `:274` update) in Python mode, so `modifier` arrives as a `StepModifier` instance; `StepModifier(<member>)` returns the member (enum call is identity on members). The `.get("modifier", "none")` fallback still yields a valid value. No change needed.

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Behavior-change rationale factually wrong: prior behavior was HTTP 400, not 500. `roles.py:207-211` catches the `ValueError` and re-raises as 400. Real change is 400 → 422, with the response body shifting from `{"detail": "<string>"}` to `{"detail": [{...}]}`. Misstates client-contract risk. | High | `01-...-implementation.md:14`; `01-...-plan.md:19`; `tests/test_schemas.py:236`; commit message | AC3 | Fixed |
| 2 | 422 API test could pass vacuously — asserted only `status_code == 422`, which any unrelated invalid field in the payload would also satisfy. Currently attributable to `modifier` (verified `loc == ('ability_steps', 0, 'modifier')`, `type == 'enum'`), but nothing pinned it. | Medium | `tests/test_schemas.py:252` | AC3 | Fixed |
| 3 | AC4's "serialization unchanged" claim verified only via `model_dump(mode="json")` at the schema layer. No test asserted the bare string in an actual HTTP response body — the exact thing AC4 promises clients. | Medium | `tests/test_schemas.py` (`TestAbilityStepModifierTyping`) | AC4 | Fixed |
| 4 | Implicit str-enum dependency: `first_step.modifier != "none"` compares a `StepModifier` against a bare str literal. Works only because `StepModifier` subclasses `str`. If the mixin is ever dropped, this silently inverts — every role create would be rejected with "The first ability step must have modifier 'none'." | Medium | `app/services/role_service.py:440` | AC3 | Open (out of scope) |
| 5 | `modifier=step.modifier.value` — the `.value` unwrap is now redundant since the field accepts the enum directly. Harmless; Pydantic re-coerces the string back. | Low | `app/services/role_service.py:160` | — | Open (out of scope) |
| 6 | `StepModifier` is not re-exported from the barrel, so a client validating `modifier` must import from `app.models.ability_step`. Consistent with the existing `Team`/`Visibility` precedent; noting only for completeness. | Low | `app/schemas/__init__.py` | AC1 | Wont-Fix (consistent with existing pattern; plan scoped this to "barrel accuracy, not barrel enforcement") |

Issues #4 and #5 are in `app/services/role_service.py`, which is outside this feature's declared file set; the plan's non-goals explicitly bar service changes, and the orchestrator constrained this review to the feature's files during a concurrent multi-agent run. Both are one-line fixes and are logged to `cross-phase-decisions.md` rather than applied here.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/tests/test_schemas.py` | Corrected `test_invalid_modifier_returns_422_at_api_boundary` docstring to describe the real 400 → 422 change with the router line reference; added assertions pinning the error to `loc == ["ability_steps", 0, "modifier"]` and `type == "enum"` so the test cannot pass on an unrelated validation failure. | 1, 2 |
| `yourwolf-backend/tests/test_schemas.py` | Added `test_modifier_serializes_to_bare_string_in_api_response` — posts a role and asserts `response.json()["ability_steps"][0]["modifier"] == "none"`, closing AC4's wire-format gap end-to-end. | 3 |
| `dev/feature/01-backend-schema-surface/01-backend-schema-surface-implementation.md` | Rewrote the "Intended behavior change" section to state 400 → 422, document the response-body shape change, and record the evidence that no test and no frontend consumer depended on the old behavior. Updated the AC4 traceability row to cite the new API-level test. | 1, 3 |

Production code required no changes — the implementation itself was correct.

## Remaining Concerns

- **Issue #4 (`role_service.py:440`)** — Medium, deliberately deferred as out of scope. `first_step.modifier != "none"` should become `!= StepModifier.NONE`. It is correct today and covered by tests; the risk is latent, not active. Recommend folding into whichever feature next touches `role_service.py`.
- **Issue #5 (`role_service.py:160`)** — Low, cosmetic `.value` redundancy. Same deferral.
- **Plan document still carries the incorrect "500" claim** at `01-backend-schema-surface-plan.md:19`. I corrected the implementation record and the test docstring but left the plan as a historical input artifact. If plans are treated as living docs, that line needs the same correction. The original commit message is immutable and remains wrong.
- **Concurrent sibling churn** — feature 02 modified `app/models/ability_step.py`, the source of `StepModifier`. I re-verified at review time that the enum is still `class StepModifier(str, enum.Enum)` with values `{none, and, or, if}`. The `str` mixin is load-bearing for `role_service.py:440` and for AC4's bare-string serialization; if feature 02's final merge alters it, both break. Worth one confirmation at merge.

## Test Coverage Assessment

- **Covered**: AC1 (barrel exports + `__all__`), AC2 (dead classes absent from module and barrel, with regression guards), AC3 (schema-level `ValidationError` on create and update, read-side rejection, all four valid values parametrized, default, OpenAPI enum set, API-level 422 now pinned to the right field), AC4 (schema-level serialization both directions, plus API-level wire format added during review).
- **Missing / accepted**:
  - No test asserts the *error body shape* clients now receive (the 400 → 422 contract change). Low value given no frontend consumer reads `detail`; skipped deliberately.
  - No regression test guards the `str` mixin on `StepModifier` itself, which two behaviors silently depend on (`role_service.py:440`, bare-string serialization). Belongs with the model, not this feature — logged as a cross-phase item.
- **Suite result after fixes**: 282 passed, 0 failed, coverage 89.83% (gate 80%). Baseline was 281 passed; the delta is the one test added during this review. No regressions.

## Risk Summary

- `app/schemas/role.py:51,111` — the retype is correct and the read path is safe: `role_service.py:160` feeds `step.modifier.value` (a bare string) into `AbilityStepInRole`, which Pydantic coerces back to the enum. Verified by execution, not just reading.
- **Contract change is real but inert**: 400 → 422 with a changed body shape. Verified inert because no frontend code reads `detail`. Features 08 and 11 touch role/ability-step types — if either adds error-detail rendering, it must handle the list-shaped 422 body.
- **Undocumented `str`-enum coupling**: `role_service.py:440` and AC4's serialization both silently depend on `StepModifier` subclassing `str`. Two independent breakages from one model-layer edit, with no test guarding the mixin.
- **Verification boundary**: AC1/AC2/AC4 and the 422 behavior were confirmed by executing the suite and targeted probes. Issue #4's latent-breakage claim is reasoned from static reading of the enum contract, not observed — confidence High, but it describes a hypothetical future edit.
