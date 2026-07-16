# Plan: Backend Schema Surface Cleanup

## Execution Metadata

- **Wave:** 1
- **Parallel safe:** yes
- **Depends on:** none
- **Key files modified:** `yourwolf-backend/app/schemas/__init__.py`, `yourwolf-backend/app/schemas/ability.py`, `yourwolf-backend/app/schemas/role.py`, `yourwolf-backend/tests/test_schemas.py` (verify)
- **Sequential reason:** n/a

Source: refactor audit findings 2.3, 6.1, 6.3 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: `app/schemas/__init__.py` exports `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` (currently missing from the barrel).
- **AC2**: Dead schema classes `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` in `app/schemas/ability.py` (L38–L71) are deleted, along with their barrel exports, after confirming zero importers outside the barrel.
- **AC3**: The `modifier` field in step schemas (`app/schemas/role.py` L49, L109 and `app/schemas/ability.py` L42 if the class survives AC2) is typed as `StepModifier` (from `app/models/ability_step.py`) instead of plain `str`, so the valid value set appears in the OpenAPI contract and bad values fail validation at the boundary instead of raising an unwrapped `ValueError` at `role_service.py:335`.
- **AC4**: Full backend test suite passes; no serialized values change (enum serializes to the same strings).

Non-goals: no changes to services, routers, or models beyond what AC3's typing requires; no schema relocation (finding 1.3 is intentionally deferred to `10-backend-narration-package`).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | `app/schemas/__init__.py` | Existing test to update (`tests/test_schemas.py`) or code-review evidence |
| AC2 | `app/schemas/ability.py`, `app/schemas/__init__.py` | Code-review evidence (grep for importers) + full suite |
| AC3 | `app/schemas/role.py`, `app/schemas/ability.py` | Must-have automated test: invalid modifier rejected with 422; existing tests in `tests/test_schemas.py`, `tests/test_roles.py` |
| AC4 | full suite | Existing tests |

## B. Correctness & Edge Cases

- Enum typing must not change JSON serialization: `StepModifier` is a `str`-based enum in the model layer; confirm responses still serialize `"none"/"and"/"or"/"if"` as bare strings.
- `StepModifier(step_data["modifier"])` conversion at `app/services/role_service.py:335` becomes redundant once schemas carry the enum — keep it working (it accepts enum instances) or simplify; do not break it.
- A previously-accepted invalid modifier now returns 422 instead of 500 — this is the intended behavior change; note it in the implementation record.

## C. Consistency & Architecture Fit

- Follow the existing pattern in `app/schemas/` where model enums (`Team`, `Visibility`) are already imported and used in schema fields.
- Barrel policy: this feature makes the barrel accurate; it does not force internal imports through it (finding 6.2 is accepted as-is).

## D. Clean Design & Maintainability

Simplest change set: delete dead code, add missing exports, retype one field. No new abstractions.

## E. Observability, Security, Operability

- No new logging (no diagnosable failure mode introduced).
- Security: stricter input validation at the API boundary is a small hardening win.
- Rollback: single revert; no data or migration impact.

## F. Test Plan

- Must-have: a test that a role create/update payload with an invalid `modifier` value is rejected with 422 — scenario description; method name [PROPOSED - name TBD].
- Existing tests to update: any `tests/test_schemas.py` assertions referencing the deleted `AbilityStep*` classes.
- Evidence: grep output showing zero non-barrel importers of the deleted classes.

## Stage 1: Barrel sync and dead-class removal
**Goal**: AC1, AC2 complete
**Success Criteria**: Barrel matches live schema surface; suite passes
**Status**: Not Started

## Stage 2: Enum typing for modifier
**Goal**: AC3, AC4 complete
**Success Criteria**: OpenAPI shows enum values; invalid modifier → 422; suite passes
**Status**: Not Started
