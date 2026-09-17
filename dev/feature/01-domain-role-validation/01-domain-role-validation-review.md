# Review Record: 01 Domain Role Validation

## Verdict

APPROVED after one bounded plan-conformance review and repair pass.

The review stayed within the feature-owned source, test, implementation record,
and review record. The validator source already matched the backend oracle. The
repairs strengthened the literal oracle header and assertions without changing
runtime validation behavior.

## Acceptance Criteria Evidence

| AC | Status | Exact evidence |
|---|---|---|
| AC1 | Met | yourwolf-frontend/src/domain/roleValidation.ts:20-24 accepts RoleDraft and a readonly active-ability input list. :72-73 returns is_valid, errors, and warnings. yourwolf-frontend/src/test/domain/roleValidation.test.ts:66-73 pins the complete valid result as literals. |
| AC2 | Met | roleValidation.ts:25-32 applies trimmed name bounds. :34-47 selects the lowest-order first step and reports invalid catalog entries in draft order. :49-58 gives duplicate orders precedence over gap reporting. :61-70 applies win-condition rules after step rules. The backend oracle has the corresponding rule order at yourwolf-backend/app/services/role_validation.py:72-128. Exact ordered output is pinned at roleValidation.test.ts:75-97, :128-160, :163-180, and :183-197. |
| AC3 | Met | roleValidation.ts:28-32 reports the trimmed frontend-only 50-character error after the lower-bound branch. roleValidation.test.ts:100-126 pins the literal error and the two-character and 50-character boundaries. |
| AC4 | Met | roleValidation.ts:76-95 emits the three warning rules in backend order and leaves them separate from errors. roleValidation.test.ts:219-247 pins combined ordering and non-blocking validity. :249-267 pins each warning independently. The backend warning source is role_validation.py:143-163. |
| AC5 | Met | roleValidation.ts:1 imports only the domain RoleDraft, and :3-18 declares the local ability and role-name shapes. The pure-layer boundary is configured at yourwolf-frontend/eslint.config.js:46-85. Lint and build both passed. |
| AC6 | Met | roleValidation.ts:98-104 preserves trimmed, case-insensitive comparison across every supplied local role. roleValidation.test.ts:270-291 covers private and official-shaped roles, empty names, unmatched names, and the private-role divergence. The unchanged page retains Name is already taken at yourwolf-frontend/src/pages/RoleBuilder.tsx:67 and :124. |
| AC7 | Met | roleValidation.ts:4, :10, :21, :77, and :99 expose the recorded shared contracts: AbilityValidationInput, RoleValidationResult, validateRoleDraft, getRoleWarnings, and hasRoleNameCollision. |
| AC8 | Met | The repaired oracle header at roleValidation.test.ts:9-18 names all mapped backend classes, lists HTTP/database exclusions, documents the excluded own-id cases, and records both deliberate divergences. Expected messages remain independent literals throughout :86-96, :101-105, :109-126, :133-196, :227-265, and :272-290. |
| AC9 | Met | roleValidation.test.ts:16 records TestRoleRulePrecedence as Feature 2 caller-composition coverage. Feature 1 exports separate validation and collision functions and adds no combined API. |

## Findings and Repairs

### F-01

- severity: medium
- lane: plan-conformance
- evidence: The implementation-commit oracle header named the validation and warning backend classes but omitted TestCheckDuplicateName and TestCheckDuplicateNameModule, even though the plan maps those classes to the local collision tests. The omission weakened the provenance map for AC8.
- reviewer: 03c-reviewer-plan-conformance
- repair: Added both collision class names to roleValidation.test.ts:9-11 and documented the intentionally excluded own-id scenarios at :14-15.

### F-02

- severity: low
- lane: plan-conformance
- evidence: The implementation-commit test titled “returns an independent error list” only checked array shape at its original roleValidation.test.ts:190-195. It did not prove that a caller mutation could not leak into a later validation result, despite the title and the deterministic pure-result contract.
- reviewer: 03c-reviewer-plan-conformance
- repair: Mutate the first result and assert a fresh validation still returns only the literal domain error at roleValidation.test.ts:203-211.

### F-03

- severity: low
- lane: plan-conformance
- evidence: The implementation-commit independent many-step warning test used toContain, so it did not assert that no additional warning was returned in that scenario.
- reviewer: 03c-reviewer-plan-conformance
- repair: Changed the case to an exact literal toEqual assertion at roleValidation.test.ts:249-259.

### F-04

- severity: low
- lane: plan-conformance
- evidence: The plan requires sorting only for rule evaluation without silently reordering the draft. The implementation used a copied array, but the oracle had no direct identity and order assertion for that contract.
- reviewer: 03c-reviewer-plan-conformance
- repair: Added the direct no-reordering assertion at roleValidation.test.ts:138-145.

No findings remain unresolved.

## Test Status

| Suite | Status | Command | Results artifact | Counts |
|---|---|---|---|---|
| Focused frontend oracle | executed-green | npm test -- --run src/test/domain/roleValidation.test.ts --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-focused-frontend.xml from yourwolf-frontend | dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-focused-frontend.xml | total=23, passed=23, failed=0 |
| Full frontend suite | executed-green | npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-final-frontend.xml from yourwolf-frontend | dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-final-frontend.xml | total=738, passed=738, failed=0 |
| Frontend coverage suite | executed-green | npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-coverage-frontend.xml from yourwolf-frontend | dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-coverage-frontend.xml | total=738, passed=738, failed=0. Coverage: 92.38% lines/statements, 92.58% branches, 94.18% functions. |
| Backend oracle sources | executed-green | uv run pytest tests/test_role_validation.py tests/test_role_validation_module.py --no-cov --junitxml=../dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-backend-oracle.xml from yourwolf-backend | dev/feature/test-results/PHASE_05B-01-domain-role-validation-review-backend-oracle.xml | total=56, passed=56, failed=0 |

Static gates also passed:

- npm run lint from yourwolf-frontend exited 0.
- npm run build from yourwolf-frontend exited 0.
- git diff --check exited 0.

The backend oracle run collected 56 cases because parametrized cases expand at
collection time. This does not change the class-level transcription map.

## Mutation Evidence

The focused suite killed the extra-error mutant with
/tmp/phase05b-role-validation-mutant-extra-error.xml at total=22,
passed=21, failed=1. It also killed the in-place-sort mutant with
/tmp/phase05b-role-validation-mutant-inplace-sort.xml at total=22,
passed=21, failed=1. These probes confirm the repaired and existing assertions
detect message pollution and draft-order mutation.

## Unfixed findings

None.
