# Implementation Record: 03 HTTP Removal and Offline Verification

## Summary

Removed the unused frontend HTTP transport and Axios dependency after Features 1 and 2 moved authoring and game flows local. Added `installNoNetworkGuard` to the shared test utility and reused it in the builder and Phase 05a smoke tests. Created the pending Phase 05b browser QA checklist. The phase summary already describes this current behavior and required no edit.

## Sibling Features

Features `01-domain-role-validation` and `02-builder-name-check-rewiring` are complete prerequisites. This feature consumes their local validation, name-status, repository, and preview paths. The shared modules touched by this feature are `src/test/test_utils.tsx`, the builder page test, and the Phase 05a smoke test. No sibling feature files were modified.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | SOURCE-01 | Deleted paths and importer absence | Complete | `yourwolf-frontend/src/api/`, `yourwolf-frontend/src/test/api/`, retained source tests | `dev/feature/test-results/` source-check command record | PENDING | PENDING |
| AC2 | AC2 | SOURCE-02 | npm manifest and lockfile absence | Complete | `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json` | npm uninstall command and source-check record | PENDING | PENDING |
| AC3 | AC3 | TEST-ROUTES-01 | Retained route suite without Axios guard | Complete | `yourwolf-frontend/src/test/setup.ts`, `yourwolf-frontend/src/test/routes.test.tsx` | `dev/feature/test-results/PHASE_05B-03-final-affected-retained-frontend.xml` | PENDING | PENDING |
| AC4 | AC4 | SOURCE-03 | Frontend environment and README absence checks | Complete | `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md`, `yourwolf-frontend/src/vite-env.d.ts` | Source-check command record | PENDING | PENDING |
| AC5 | AC5 | SOURCE-04 | Stale type/reference absence checks | Complete | `yourwolf-frontend/src/types/transport.ts`, `yourwolf-frontend/src/domain/roleDraft.ts` | Source-check command record | PENDING | PENDING |
| AC6 | AC6 | TEST-OFFLINE-BUILDER-01 | Browser-level builder flow with fetch/XHR guard | Complete | `yourwolf-frontend/src/test/test_utils.tsx`, `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml` | PENDING | PENDING |
| AC7 | AC7 | TEST-OFFLINE-SMOKE-01 | Local smoke flow with fetch/XHR guard | Complete | `yourwolf-frontend/src/test/test_utils.tsx`, `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` | `dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml` | PENDING | PENDING |
| AC8 | AC8 | QA-05B-01 | Reachable manual rows plus automated-only matrix | Complete | `docs/phases/PHASE_05B/PHASE_05B_QA.md` | `docs/phases/PHASE_05B/PHASE_05B_QA.md` | PENDING | PENDING |
| AC9 | AC9 | GATE-BUILD-01, LAUNCH-01 | Build and preview launch checks | Complete | Retained Feature 1 and 2 production paths, no production HTTP additions | Build and launch command records below | PENDING | PENDING |
| AC10 | AC10 | GATE-FULL-01, GATE-COVERAGE-01, GATE-LINT-01, SOURCE-05 | Full tests, coverage, lint, dependency, zero-network, and unchanged-scope gates | Complete | Feature write set | `dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml`, `dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml`, and command records below | PENDING | PENDING |
| AC11 | AC11 | SCOPE-01 | Protected-path diff checks | Complete | No changes under `src/engine/` or `src/data/seed/` | Protected-scope command record below | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|---|---|---|---|---|
| AC1 | HTTP source and API test paths are deleted with no remaining frontend importers. | Complete | Deleted `yourwolf-frontend/src/api/*`, deleted `yourwolf-frontend/src/test/api/*`, updated route and smoke tests | Source absence checks passed. |
| AC2 | Axios is removed through npm and absent from both npm authority files. | Complete | `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json` | `npm uninstall axios` exited 0. |
| AC3 | Axios test setup and obsolete route guard assertions are removed. | Complete | `yourwolf-frontend/src/test/setup.ts`, `yourwolf-frontend/src/test/routes.test.tsx` | Retained route coverage passes. |
| AC4 | Frontend API environment and Axios documentation is removed while root README backend documentation stays unchanged. | Complete | `.env.example`, frontend `README.md`, `src/vite-env.d.ts` | Root README unchanged from `413adb2915070b09dea06d5326271338c5cf3113`. |
| AC5 | `NameCheckResult` and stale API-role comments are removed without relocating other types. | Complete | `src/types/transport.ts`, `src/domain/roleDraft.ts` | Source absence check passed. |
| AC6 | The builder test drives local validation, name status, and preview with zero fetch/XHR requests. | Complete | `src/test/test_utils.tsx`, `src/test/pages/RoleBuilder.test.tsx` | The test reaches visible validation, name status, preview, and local save/navigation before asserting both counters are zero. A separate test proves attempted fetch/XHR calls fail at the boundary and globals restore in `finally`. |
| AC7 | The Phase 05a smoke test uses the same zero-network guard. | Complete | `src/test/test_utils.tsx`, `src/test/integration/phase_05a_smoke.test.tsx` | Both counters are asserted as zero and globals restore in `finally`. |
| AC8 | Pending manual QA rows and an automated-evidence matrix document current behavior. | Complete | `docs/phases/PHASE_05B/PHASE_05B_QA.md` | Manual QA intentionally not executed because `qa: no`; the ability-category tabs in warning row 3.2 are named explicitly. |
| AC9 | The integrated frontend builds and launches with local Feature 1 and 2 paths. | Complete | Existing production paths unchanged by this deletion feature | Build and curl exited 0. |
| AC10 | Automated frontend gates and source/scope checks pass. | Complete | Feature write set | Review revalidation passed full tests 713/713, coverage thresholds, lint, build, dependency, source-absence, and scope checks. |
| AC11 | Engine and seed directories remain unchanged. | Complete | None | Baseline protected-scope diff exited 0. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/api/client.ts` | Deleted | Removed Axios client | No callers remain after local rewiring. |
| `yourwolf-frontend/src/api/roles.ts` | Deleted | Removed roles transport and payload adapter | No callers remain. |
| `yourwolf-frontend/src/api/abilities.ts` | Deleted | Removed abilities transport | No callers remain. |
| `yourwolf-frontend/src/api/errors.ts` | Deleted | Removed Axios error parser | No callers remain. |
| `yourwolf-frontend/package.json` | Modified | Removed Axios dependency | Complete HTTP removal. |
| `yourwolf-frontend/package-lock.json` | Modified | Synchronized npm lockfile through `npm uninstall axios` | Keep npm authority files consistent. |
| `yourwolf-frontend/.env.example` | Modified | Removed API variable and documented local operation | No frontend server configuration remains. |
| `yourwolf-frontend/README.md` | Modified | Removed API setup, `src/api/`, and Axios documentation | Keep package documentation current. |
| `yourwolf-frontend/src/vite-env.d.ts` | Modified | Removed `VITE_API_URL` declaration | Remove unused environment contract. |
| `yourwolf-frontend/src/types/transport.ts` | Modified | Removed `NameCheckResult` and stale transport wording | Remove dead type and HTTP-specific reference. |
| `yourwolf-frontend/src/domain/roleDraft.ts` | Modified | Reworded comments for local repository boundary | Remove stale API adapter references. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/test/api/abilities.api.test.ts` | Deleted | Removed dead API suite | Deleted abilities transport. |
| `yourwolf-frontend/src/test/api/errors.api.test.ts` | Deleted | Removed dead API error suite | Deleted Axios error parser. |
| `yourwolf-frontend/src/test/api/roles.api.test.ts` | Deleted | Removed dead roles API suite | Deleted roles transport. |
| `yourwolf-frontend/src/test/setup.ts` | Modified | Removed global Axios mock and forbidden-request setup | No Axios test layer remains. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Modified | Removed API mocks and obsolete Axios guard assertions | Retains route rendering coverage. |
| `yourwolf-frontend/src/test/test_utils.tsx` | Modified | Added `installNoNetworkGuard` with failing fetch/XHR boundaries, attempt counters, and restore | Shared zero-network proof. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Modified | Added local validation/name/preview/save no-network coverage and a boundary-failure/restore test | AC6. |
| `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` | Modified | Replaced Axios method assertions with shared guard | AC7. |

### Documentation Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `docs/phases/PHASE_05B/PHASE_05B_QA.md` | Created | Added executable pending manual checklist and automated-evidence matrix | Required Phase 05b QA handoff. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-focused-zero-network-frontend.xml`
- **Results artifact**: `dev/feature/test-results/PHASE_05B-03-focused-zero-network-frontend.xml`
- **Baseline**: 741 passed, 0 failed (`npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-baseline-frontend.xml`, artifact: `dev/feature/test-results/PHASE_05B-03-baseline-frontend.xml`)
- **Final**: 712 passed, 0 failed (`npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-full-frontend.xml`, artifact: `dev/feature/test-results/PHASE_05B-03-full-frontend.xml`)
- **New tests added**: 1
- **Affected suites run**: 121 passed, 0 failed (`npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx src/test/routes.test.tsx src/test/domain/roleValidation.test.ts src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-affected-retained-frontend.xml`, artifact: `dev/feature/test-results/PHASE_05B-03-affected-retained-frontend.xml`)
- **Coverage**: 712 passed, 0 failed, with 92.98% lines/statements, 92.80% branches, and 94.27% functions (`npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-coverage-frontend.xml`, artifact: `dev/feature/test-results/PHASE_05B-03-coverage-frontend.xml`)
- **Regressions**: None

### TDD Evidence

- **Red**: Before adding `installNoNetworkGuard`, the new builder test failed with `installNoNetworkGuard is not a function`, while the existing 16 page tests passed.
- **Green**: After adding the helper, the focused builder and smoke suites passed 19/19.
- **Refactor**: Full affected suites and the complete frontend suite remained green after cleanup.

### Build, lint, launch, and source evidence

- **Build**: `npm run build` exited 0.
- **Lint**: `npm run lint` exited 0.
- **Launch**: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` started Vite on `http://127.0.0.1:4173/`. `curl --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null` exited 0.
- **Source absence**: the selection-delta absence command exited 0. `src/api/` and `src/test/api/` are absent, API imports are absent, Axios is absent from both npm files, `VITE_API_URL` is absent from the frontend package, and `NameCheckResult` is absent from frontend source.
- **Protected scope**: `git diff --exit-code b2874a68ca2ea4c73dfb218f121091e35cd2e87d -- yourwolf-frontend/src/engine yourwolf-frontend/src/data/seed yourwolf-backend` exited 0.
- **Root README**: `git diff --exit-code 413adb2915070b09dea06d5326271338c5cf3113 -- README.md` exited 0.

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`.
- **Review findings**: F-01 (`severity: medium`, `lane: plan-conformance`, `reviewer: 03c-reviewer-plan-conformance`) found that the original network guard returned a synthetic 204 instead of failing attempted requests and had no direct boundary proof. F-02 (`severity: low`, `lane: plan-conformance`, `reviewer: 03c-reviewer-plan-conformance`) found that QA row 3.2 did not identify the separate shipped ability-category tabs. Both findings were fixed.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Review Evidence

- **Focused zero-network**: `executed-green`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml`; total 20, passed 20, failed 0.
- **Affected retained suites**: `executed-green`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx src/test/routes.test.tsx src/test/domain/roleValidation.test.ts src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-affected-retained-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-final-affected-retained-frontend.xml`; total 122, passed 122, failed 0.
- **Full frontend**: `executed-green`; command `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml`; total 713, passed 713, failed 0.
- **Coverage**: `executed-green`; command `npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml`; total 713, passed 713, failed 0; lines/statements 92.98%, branches 92.82%, functions 94.27%.
- **Backend unchanged suite**: `executed-green`; command `uv run pytest --junitxml=../dev/feature/test-results/PHASE_05B-03-review-backend-unchanged.xml`; artifact `dev/feature/test-results/PHASE_05B-03-review-backend-unchanged.xml`; total 503, passed 503, failed 0.
- **Static and launch checks**: `npm run lint` and `npm run build` exited 0. `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` started Vite, and `curl --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null` exited 0. The final source/scope command exited 0, including absence of both API directories, API importers, Axios in both npm authority files, `VITE_API_URL`, and `NameCheckResult`, plus protected-path and root-README diffs.
- **Guard mutation evidence**: status `executed-failing`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-guard-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-review-red-guard-frontend.xml`; total 18, passed 17, failed 1. Fetch mutation status `executed-failing`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx -t 'fails at the browser request boundary' --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-fetch-guard-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-review-red-fetch-guard-frontend.xml`; total 18, passed 0, failed 1, skipped 17. XHR mutation status `executed-failing`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx -t 'fails at the browser request boundary' --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-xhr-guard-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-review-red-xhr-guard-frontend.xml`; total 18, passed 0, failed 1, skipped 17. Repaired builder status `executed-green`; command `npm test -- --run src/test/pages/RoleBuilder.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-builder-frontend.xml`; artifact `dev/feature/test-results/PHASE_05B-03-review-builder-frontend.xml`; total 18, passed 18, failed 0.
- **Phase document sync**: `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md:8-18` and `docs/phases/PROJECT_ROADMAP.md:18-21` already describe the current local/no-HTTP behavior. No summary or roadmap repair was needed. QA row 3.2 was clarified in `docs/phases/PHASE_05B/PHASE_05B_QA.md:28` without changing phase behavior.

## Deviations from Plan

None. The final shared helper name is `installNoNetworkGuard`. The phase-specific discovery context was unavailable, so the supplied Phase 05b summary was used as directed. The Phase 05b summary and roadmap needed no edit because they already describe the current intended behavior.

## Gaps

Manual browser QA is intentionally pending because `qa: no`. The backend baseline remains the supplied green artifact because this feature changes no backend path. No new production logs were added because this change removes transport and adds test-only observability.

## Reviewer Focus Areas

- `yourwolf-frontend/src/test/test_utils.tsx` — verify both browser-boundary spies restore their original globals and count actual request attempts.
- `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` — verify the scenario proves local validation, name status, and preview paths execute before the zero-request assertions.
- `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` — verify the retained full local game flow remains covered by the shared guard.
- `yourwolf-frontend/package-lock.json` — verify npm removed Axios and synchronized transitive dependency metadata.
