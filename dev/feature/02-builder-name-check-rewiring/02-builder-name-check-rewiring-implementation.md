# Implementation Record: 02 Builder Name Check Rewiring

## Summary

Rewired the role builder to validate drafts locally with Feature 1's domain validator and to derive name availability from the page-owned local role list. Preserved the 1000 ms validation debounce, 500 ms name debounce, preview independence, readiness gate, collision precedence, and save defenses. Removed the BasicInfoStep hook fallback while leaving the HTTP layer for Feature 3.

## Sibling Features

Feature 01 established `validateRoleDraft`, `hasRoleNameCollision`, `RoleValidationResult`, and `AbilityValidationInput` in `yourwolf-frontend/src/domain/roleValidation.ts`. Feature 03 will remove the remaining HTTP layer and prove zero-network behavior. Shared consumers in this feature are the page-owned `useRoles` result, `useAbilities` catalog, and Wizard's existing `ValidationResult`/`NameStatus` contracts. Wizard and ReviewStep remained read-only regression anchors.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | local validation and preview debounce | Domain validator runs after 1000 ms while preview renders locally | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml` | PENDING | PENDING |
| AC2 | AC2 | readiness gate | Validation remains null while roles or abilities are loading, then validates latest draft after both are ready | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml` | PENDING | PENDING |
| AC3 | AC3 | collision precedence | Collision is composed with domain errors, while short and overlong names suppress collision | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml`, `dev/feature/test-results/PHASE_05B-02-builder-oracle-frontend.xml` | PENDING | PENDING |
| AC4 | AC4 | literal local validation output | Domain errors and warnings render without the server-unavailable fallback | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml`, `dev/feature/test-results/PHASE_05B-02-builder-oracle-frontend.xml` | PENDING | PENDING |
| AC5 | AC5 | local name status | Official and private role collisions use trimmed, case-insensitive comparison | Complete | `yourwolf-frontend/src/hooks/useNameCheck.ts`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml` | PENDING | PENDING |
| AC6 | AC6 | name debounce and newest input | 500 ms debounce, disabled/not-ready idle, timer cleanup, and latest-input behavior remain intact without requests | Complete | `yourwolf-frontend/src/hooks/useNameCheck.ts`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml` | PENDING | PENDING |
| AC7 | AC7 | supplied step status | BasicInfoStep renders the supplied status and performs no name or repository read | Complete | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml` | PENDING | PENDING |
| AC8 | AC8 | save gates and recheck | Wizard gate, repeated save gate, and immediate repository collision recheck block writes | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml`, `dev/feature/test-results/PHASE_05B-02-builder-consumer-frontend.xml` | PENDING | PENDING |
| AC9 | AC9 | consumer regression suites | Focused behavior tests plus Wizard and ReviewStep regression anchors pass | Complete | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml`, `dev/feature/test-results/PHASE_05B-02-builder-consumer-frontend.xml` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Local domain validation replaces server validation while preserving debounce and preview | Complete | `RoleBuilder.tsx` | Uses Feature 1 exports and retains 1000 ms timer. |
| AC2 | Validation waits for both local catalogs | Complete | `RoleBuilder.tsx` | Readiness requires both hooks to report `loading: false` and `error: null`. |
| AC3 | Collision composition and length precedence | Complete | `RoleBuilder.tsx` | Collision is inserted first only for names trimmed to 2–50 characters. |
| AC4 | Exact local errors and warnings with no unavailable fallback | Complete | `RoleBuilder.tsx` | Validation service error path was removed from this caller. |
| AC5 | Local, trimmed, case-insensitive name status | Complete | `useNameCheck.ts` | The page passes one loaded role list, including private roles. |
| AC6 | Debounce and newest-input protection | Complete | `useNameCheck.ts` | Pending timers are invalidated by request ids and cleanup. |
| AC7 | Page-owned status supplied to presentational step | Complete | `BasicInfoStep.tsx` | Hook fallback and API/repository dependency were removed. |
| AC8 | All save defenses remain | Complete | `RoleBuilder.tsx` | Wizard, handler, and pre-write repository checks remain. |
| AC9 | Behavior-aware focused and consumer coverage | Complete | Assigned test files | All required focused, consumer, oracle, and full suites passed. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Modified | Added local ability-catalog readiness, domain validation, shared collision helper, and page-owned name status. | Move builder validation and name availability off the server while preserving existing UI and save contracts. |
| `yourwolf-frontend/src/hooks/useNameCheck.ts` | Modified | Replaced API request with debounced local collision evaluation over supplied roles. | Derive the existing `NameStatus` contract without network access. |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modified | Made `nameStatus` required and removed the fallback hook call. | Keep the step presentational and avoid a second role-list read. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Rewritten | Replaced API validation fixtures with local catalog/readiness, collision, preview, and save-path cases. | AC1–AC4, AC8, AC9. |
| `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | Rewritten | Replaced server mocks with local official/private collision, debounce, readiness, and cleanup cases. | AC5–AC6. |
| `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | Rewritten | Passed explicit statuses and retained field/team interaction coverage. | AC7. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`
- **Results artifact**: `dev/feature/test-results/PHASE_05B-02-builder-focused-frontend.xml`
- **Baseline**: 738 passed, 0 failed (`npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-baseline-frontend.xml`)
- **Final**: 27 total, 27 passed, 0 failed
- **New tests added**: 27 behavior-aware tests across the three assigned suites
- **Affected suites run**: focused feature suites, Wizard and ReviewStep consumer regression suites, Feature 1 oracle, full frontend suite, coverage, lint, and build
- **Regressions**: None

Additional executed-green evidence:

| Command | Artifact | Total | Passed | Failed |
|---------|----------|-------|--------|--------|
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-consumer-frontend.xml src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-consumer-frontend.xml` | 34 | 34 | 0 |
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-oracle-frontend.xml src/test/domain/roleValidation.test.ts` | `dev/feature/test-results/PHASE_05B-02-builder-oracle-frontend.xml` | 23 | 23 | 0 |
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-full-frontend.xml` | `dev/feature/test-results/PHASE_05B-02-builder-full-frontend.xml` | 712 | 712 | 0 |

Coverage executed green with `npm run test:coverage`: 92.47% lines/statements, 92.57% branches, and 93.43% functions. `npm run lint` and `npm run build` exited 0. The full count is lower than the 738-test baseline because the three assigned suites were rewritten to local behavior and removed obsolete server-request cases.

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`
- **Review findings**: Four plan-conformance findings were fixed. Each finding is recorded in the review record with `reviewer: 03c-reviewer-plan-conformance`.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Review Evidence

All authoritative frontend suites were rerun after the review repairs. The integrated suite remained green.

| Command | Results artifact | Total | Passed | Failed |
|---------|------------------|-------|--------|--------|
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-focused-review-frontend.xml src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-review-frontend.xml` | 56 | 56 | 0 |
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-consumer-review-frontend.xml src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-consumer-review-frontend.xml` | 34 | 34 | 0 |
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-oracle-review-frontend.xml src/test/domain/roleValidation.test.ts` | `dev/feature/test-results/PHASE_05B-02-builder-oracle-review-frontend.xml` | 23 | 23 | 0 |
| `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-full-review-frontend.xml` | `dev/feature/test-results/PHASE_05B-02-builder-full-review-frontend.xml` | 741 | 741 | 0 |
| `npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-coverage-review-frontend.xml` | `dev/feature/test-results/PHASE_05B-02-builder-coverage-review-frontend.xml` | 741 | 741 | 0 |

Coverage totals were 92.69% statements and lines, 92.79% branches, and 94.16% functions. `npm run lint` exited 0. `npm run build` exited 0.

The implementation full suite was 712 tests. The review suite is 741 tests because the review restored retained behavior checks and added guards. The baseline at commit `8bbe2b5` was 738 tests.

## Deviations from Plan

None. The API layer and Axios remain intentionally because Feature 3 owns their deletion.

## Gaps

None for the selected acceptance criteria. Optional browser QA was disabled by the caller and remains a Feature 3 deliverable.

## Reviewer Focus Areas

- `RoleBuilder.tsx` readiness transition and collision-error composition around the debounced callback.
- `useNameCheck.ts` roles-key dependency and request-id cleanup for changing catalogs.
- Save-path ordering, especially the final repository list collision check before `put`.
- Confirm Feature 3 can remove the remaining API imports and tests without changing this local contract.
