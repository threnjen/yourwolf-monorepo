# Implementation Record: 01 Domain Role Validation

## Summary

Added a pure frontend domain validator, warning evaluator, and reusable local name-collision helper. The validator mirrors backend rule order and literal messages, adds the planned trimmed 50-character frontend bound, and returns a transport-compatible result without importing transport types.

## Sibling Features

Feature 02 rewires `RoleBuilderPage`, `useNameCheck`, and builder inputs to consume this module. Feature 03 removes HTTP transport and proves offline behavior. This feature intentionally leaves existing page-local collision logic and all callers unchanged. Shared modules for the follow-up are `validateRoleDraft`, `getRoleWarnings`, `hasRoleNameCollision`, and `RoleValidationResult` in `yourwolf-frontend/src/domain/roleValidation.ts`.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | `valid draft returns transport-compatible result` | Structural result with validity, errors, warnings | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | `yourwolf-frontend/src/test/domain/roleValidation.test.ts`; focused JUnit | PENDING | PENDING |
| AC2 | AC2 | `preserves backend error ordering`; rule-specific tests | Literal ordered errors for name, first modifier, abilities, orders, and wins | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Backend oracle `yourwolf-backend/app/services/role_validation.py`; frontend focused JUnit | PENDING | PENDING |
| AC3 | AC3 | `frontend-only trimmed upper-bound error` | 51-character trimmed name | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Frontend focused JUnit | PENDING | PENDING |
| AC4 | AC4 | `returns backend warnings in declared order`; `warnings non-blocking` | Three literal warnings and validity unaffected | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Backend oracle `yourwolf-backend/app/services/role_validation.py`; frontend focused JUnit | PENDING | PENDING |
| AC5 | AC5 | `module input and result contract` | Local catalog shape and no transport import | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Source imports; `npm run lint` | PENDING | PENDING |
| AC6 | AC6 | `trims and compares case-insensitively`; `empty or unmatched name` | Private and official-shaped local roles, normalized names | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Frontend focused JUnit | PENDING | PENDING |
| AC7 | AC7 | `shared exported contract` | Exported validator, warnings, collision helper, and result/input types | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Implementation notes and source | PENDING | PENDING |
| AC8 | AC8 | Oracle header and literal assertions | Included backend classes, exclusions, messages, and divergences documented in test header | Complete | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Test header; focused JUnit | PENDING | PENDING |
| AC9 | AC9 | Oracle header handoff | `TestRoleRulePrecedence` recorded as Feature 2 caller-composition coverage | Complete | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Test header; Feature 2 handoff note | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Pure draft and catalog validation returns a compatible result | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Result has `is_valid`, `errors`, and `warnings`. |
| AC2 | Backend validation order and literal messages remain stable | Complete | `yourwolf-frontend/src/domain/roleValidation.ts`, `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Includes duplicate-before-gap precedence and draft-order ability errors. |
| AC3 | Frontend-only trimmed 50-character upper bound | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Message is `Role name must be at most 50 characters.` |
| AC4 | Backend warning messages and order | Complete | `yourwolf-frontend/src/domain/roleValidation.ts`, `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Warnings do not affect `is_valid`. |
| AC5 | Minimal local input/output shapes and pure imports | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Imports only `RoleDraft` from the domain layer. |
| AC6 | Reusable local collision behavior | Complete | `yourwolf-frontend/src/domain/roleValidation.ts`, `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Includes private roles and preserves the local message as an oracle contract. |
| AC7 | Shared contract for Feature 2 | Complete | `yourwolf-frontend/src/domain/roleValidation.ts` | Proposed exports: `validateRoleDraft`, `getRoleWarnings`, `RoleValidationResult`, `AbilityValidationInput`, and existing `hasRoleNameCollision`. |
| AC8 | Literal oracle with exclusions and divergences | Complete | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Header lists HTTP/database exclusions and both deliberate frontend divergences. |
| AC9 | Feature 2 owns combined precedence | Complete | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | No combined validation/collision API was added. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/domain/roleValidation.ts` | Added | Pure validation, warnings, local collision helper, and local input/result types | Implements AC1-AC7 without transport, React, API, repository, or logging dependencies. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/test/domain/roleValidation.test.ts` | Added | 22 literal oracle and edge-case tests with backend exclusions and divergence header | AC1-AC6, AC8, and AC9. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm test -- --run src/test/domain/roleValidation.test.ts --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-focused-frontend.xml`
- **Results artifact**: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-focused-frontend.xml`
- **Baseline**: 715 passed, 0 failed (before implementation; total 715)
- **Final**: 737 passed, 0 failed (after implementation; total 737)
- **New tests added**: 22
- **Affected suites run**: focused domain suite (22), full frontend suite (737), coverage suite (737) | None
- **Regressions**: None

Additional gate evidence:

- Baseline command: `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-baseline-frontend.xml`
- Baseline artifact: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-baseline-frontend.xml` — 715 total, 715 passed, 0 failed.
- Full command: `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-final-frontend.xml`
- Full artifact: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-final-frontend.xml` — 737 total, 737 passed, 0 failed.
- Coverage command: `npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-coverage-frontend.xml` — exited 0, 737 total, 737 passed, 0 failed. Artifact: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-coverage-frontend.xml`. Coverage: 92.38% lines/statements, 92.57% branches, 94.18% functions.
- Lint command: `npm run lint` — exited 0.
- Build command: `npm run build` — exited 0.

## Review and Fix Loop

- **Resolved review agents**: 03c-reviewer-plan-conformance.
- **Review findings**: Four plan-conformance findings were identified and repaired in the feature-owned oracle test file.
- **Fix rounds**: 1 bounded review-and-repair pass.
- **Carry-forward findings**: None
- **Fallback**: None

## Deviations from Plan

- None. The two planned divergences are implemented and documented: trimmed names over 50 characters produce the frontend-only upper-bound error, and local collision behavior retains `Name is already taken`.

## Gaps

- None for this feature. Runtime caller rewiring remains intentionally unfinished and belongs to Feature 2.

## Unfixed findings

None. Review findings were repaired in the feature-owned oracle test file.

## Reviewer Focus Areas

- `validateRoleDraft` rule ordering and exact messages in `yourwolf-frontend/src/domain/roleValidation.ts`.
- Active-ability set handling for absent and inactive catalog entries.
- Duplicate-order precedence over sequential-gap reporting.
- `hasRoleNameCollision` normalization and structural compatibility with future `RoleListItem` callers.
