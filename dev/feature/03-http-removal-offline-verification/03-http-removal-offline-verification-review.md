# Review: 03 HTTP Removal and Offline Verification

## Verdict

**PASS.** The implementation conforms to the selected plan after one bounded plan-conformance review and repair round. The review found two defects. Both were repaired within the feature write set. No unfixed findings remain.

The review covered implementation commit `379f510` against the plan, selection delta, execution manifest, phase baseline, and authoritative test evidence. The phase baseline is `b2874a68ca2ea4c73dfb218f121091e35cd2e87d`, resolved by `git merge-base HEAD main`.

## Acceptance criteria evidence

| AC | Status | Exact evidence |
|---|---|---|
| AC1 | Complete | The implementation record lists deletion of the four HTTP modules at `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-implementation.md:49-52` and the three API suites at `:65-67`. The final source check confirms both directories, API importers, and deleted paths are absent. Retained route imports are visible at `yourwolf-frontend/src/test/routes.test.tsx:1-14`. |
| AC2 | Complete | Axios is absent from npm dependencies at `yourwolf-frontend/package.json:16-44` and from the lockfile by the final absence check. `npm ci --dry-run --ignore-scripts` exited 0. `npm ls axios --depth=0` exited 1 with `└── (empty)`, the expected absence result. |
| AC3 | Complete | Test setup contains only setup imports at `yourwolf-frontend/src/test/setup.ts:1-2`. The retained route suite contains route rendering assertions only at `yourwolf-frontend/src/test/routes.test.tsx:42-104`. The affected-retained artifact reports 122/122/0. The two removed route tests are exactly the Axios-only catalog-read and games-request guard tests listed below. |
| AC4 | Complete | `.env.example` contains current local guidance at `yourwolf-frontend/.env.example:1`. The frontend README contains no API, Axios, or `VITE_API_URL` material at `yourwolf-frontend/README.md:1-71`, and `src/vite-env.d.ts:1` retains only the Vite reference. The root README diff against `413adb2915070b09dea06d5326271338c5cf3113` is clean. |
| AC5 | Complete | Retained transport contracts remain at `yourwolf-frontend/src/types/transport.ts:18-113`. Its header is at `:1-13` and contains no `NameCheckResult`. The local editing model comments at `yourwolf-frontend/src/domain/roleDraft.ts:1-69` do not point to `src/api/roles.ts`. Source checks and the TypeScript build found no stale symbol or relocation. |
| AC6 | Complete | `installNoNetworkGuard` installs fetch and XMLHttpRequest spies at `yourwolf-frontend/src/test/test_utils.tsx:18-34`, increments at browser request boundaries, throws on every attempt, and restores both spies at `:44-47`. The builder guard precedes render at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:107-112`. That test proves local name status, preview, invalid validation, local save, and navigation before both zero counters at `:114-141`. The direct boundary test proves failures, counters, assertion failure, and global restoration at `:144-165`. Final focused evidence is 20/20/0. |
| AC7 | Complete | The Phase 05a smoke test installs the shared guard before render at `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx:43-56`, executes setup and every game phase through Game Over at `:58-86`, asserts both counters at `:87-89`, and restores in `finally` at `:90-92`. Final focused evidence is 20/20/0. |
| AC8 | Complete as handoff; manual execution unverified by design | Required browser rows are at `docs/phases/PHASE_05B/PHASE_05B_QA.md:8-37`. Every row remains `Pending` with `—` evidence, and completion remains pending at `:53-61`. The automated-only matrix is at `:39-51`. Row 3.2 names the shipped `Card Actions` and `State Changes` tabs at `:27-28`. Manual execution was not authorized because the manifest records `qa: no` at `dev/feature/PHASE_05B-execution-manifest.md:12-14`. |
| AC9 | Complete by automated evidence; manual browser execution unverified by design | The builder computes local preview and validation at `yourwolf-frontend/src/pages/RoleBuilder.tsx:41-75`, local name status at `:29-39`, and repository save/navigation at `:100-125`. The test exercises these paths at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:107-141`. Build exited 0. Preview started with `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` and curl exited 0. |
| AC10 | Complete | Final full evidence is total 713, passed 713, failed 0 at `dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml:2`. Coverage evidence is 713/713/0 at `dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml:2` with 92.98% lines/statements, 92.82% branches, and 94.27% functions. Lint, build, dependency, source, scope, and launch checks exited successfully. The unchanged backend suite is 503/503/0 at `dev/feature/test-results/PHASE_05B-03-review-backend-unchanged.xml:1`. |
| AC11 | Complete | `git diff --exit-code b2874a68ca2ea4c73dfb218f121091e35cd2e87d -- yourwolf-frontend/src/engine yourwolf-frontend/src/data/seed yourwolf-backend` exited 0. The protected-path check is defined at `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-delta.md:78-86`. |

Missing criteria: none.

Partial criteria: none in shipped deliverables. AC8 and AC9 separate automated completion from manual browser execution.

Unverified criteria: only manual browser observations in AC8 and the manual portion of AC9. They remain unverified intentionally under `qa: no`, with all checklist rows pending.

## Findings and repairs

### F-01 — Network guard did not fail attempted requests

- `severity: medium`
- `lane: plan-conformance`
- `reviewer: 03c-reviewer-plan-conformance`
- `evidence`: The implementation at commit `379f510`, `yourwolf-frontend/src/test/test_utils.tsx:21-34` in that snapshot, returned a synthetic 204 from fetch and let XHR send complete. The zero-network tests could therefore pass without proving that an unexpected request would fail. The plan requires both spies to fail or record every attempted request at plan lines `39-47`.
- `repair`: Fetch now increments and throws at `yourwolf-frontend/src/test/test_utils.tsx:21-25`. XHR send now increments and throws at `:27-34`. The boundary test at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:144-165` proves both failure paths, counters, `assertNoRequests()` failure, and restoration in `finally`.
- `proof`: The red-first probe has status `executed-failing`. Command `npm test -- --run src/test/pages/RoleBuilder.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-guard-frontend.xml` produced artifact `dev/feature/test-results/PHASE_05B-03-review-red-guard-frontend.xml:2-3` with total 18, passed 17, failed 1. The fetch mutation has status `executed-failing`. Command `npm test -- --run src/test/pages/RoleBuilder.test.tsx -t 'fails at the browser request boundary' --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-fetch-guard-frontend.xml` produced artifact `dev/feature/test-results/PHASE_05B-03-review-red-fetch-guard-frontend.xml:2-3` with total 18, passed 0, failed 1, skipped 17. The XHR mutation has status `executed-failing`. Command `npm test -- --run src/test/pages/RoleBuilder.test.tsx -t 'fails at the browser request boundary' --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-red-xhr-guard-frontend.xml` produced artifact `dev/feature/test-results/PHASE_05B-03-review-red-xhr-guard-frontend.xml:2-3` with total 18, passed 0, failed 1, skipped 17. The repaired builder probe has status `executed-green`. Command `npm test -- --run src/test/pages/RoleBuilder.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-review-builder-frontend.xml` produced artifact `dev/feature/test-results/PHASE_05B-03-review-builder-frontend.xml:2` with total 18, passed 18, failed 0.

### F-02 — Warning checklist row omitted shipped ability tabs

- `severity: low`
- `lane: plan-conformance`
- `reviewer: 03c-reviewer-plan-conformance`
- `evidence`: The original row at `379f510:docs/phases/PHASE_05B/PHASE_05B_QA.md:28` said only to add two named abilities. The shipped palette separates those controls into `Card Actions` and `State Changes` at `yourwolf-frontend/src/components/RoleBuilder/steps/AbilityPalette.tsx:68-99`, with category definitions at `yourwolf-frontend/src/domain/constants.ts:16-22`. The original instruction was underspecified for a manual operator.
- `repair`: The row now names both tabs and preserves the expected warning at `docs/phases/PHASE_05B/PHASE_05B_QA.md:27-28`. Its status remains `Pending` and evidence remains `—`.

## Test-count reconciliation

The baseline artifact contains 741 tests at `dev/feature/test-results/PHASE_05B-03-baseline-frontend.xml:2`. A testcase-name multiset comparison against the final artifact contains 713 tests at `dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml:2` and produced `baseline=741 final=713 retained=711 removed=30 added=2`.

| Test group | Baseline | Final | Delta | Reconciliation |
|---|---:|---:|---:|---|
| Deleted abilities API suite | 2 | 0 | -2 | Exactly `src/test/api/abilities.api.test.ts`. |
| Deleted API errors suite | 15 | 0 | -15 | Exactly `src/test/api/errors.api.test.ts`. |
| Deleted roles API suite | 11 | 0 | -11 | Exactly `src/test/api/roles.api.test.ts`. |
| Retained route suite | 7 | 5 | -2 | Exactly the catalog-read and games-request Axios guard tests. Five route render tests remain. |
| RoleBuilder suite | 16 | 18 | +2 | One implementation offline-flow test and one review boundary-failure/restore test. |
| All other suites | 690 | 690 | 0 | No unrelated test instance was removed. |
| **Total** | **741** | **713** | **-28** | `741 - 28` deleted API tests and route guards `+ 2` builder tests = `713`. |

The retained count is `690 + 5 + 16 = 711`. The removed multiset is exactly 30 named instances. The added multiset is exactly:

- `RoleBuilderPage > proves draft validation, name status, and preview stay offline`
- `RoleBuilderPage > fails at the browser request boundary and restores globals after assertion failure`

## Authoritative test evidence

| Suite | Status | Exact command | Results artifact | Total / passed / failed |
|---|---|---|---|---:|
| Focused zero-network | `executed-green` | `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml` | `dev/feature/test-results/PHASE_05B-03-final-focused-zero-network-frontend.xml` | 20 / 20 / 0 |
| Affected retained | `executed-green` | `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx src/test/routes.test.tsx src/test/domain/roleValidation.test.ts src/test/integration/phase_05a_smoke.test.tsx --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-affected-retained-frontend.xml` | `dev/feature/test-results/PHASE_05B-03-final-affected-retained-frontend.xml` | 122 / 122 / 0 |
| Full frontend | `executed-green` | `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml` | `dev/feature/test-results/PHASE_05B-03-final-full-frontend.xml` | 713 / 713 / 0 |
| Frontend coverage | `executed-green` | `npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml` | `dev/feature/test-results/PHASE_05B-03-final-coverage-frontend.xml` | 713 / 713 / 0 |
| Unchanged backend | `executed-green` | `uv run pytest --junitxml=../dev/feature/test-results/PHASE_05B-03-review-backend-unchanged.xml` | `dev/feature/test-results/PHASE_05B-03-review-backend-unchanged.xml` | 503 / 503 / 0 |

The final source and scope command was:

~~~bash
set -e
test ! -d yourwolf-frontend/src/api
test ! -d yourwolf-frontend/src/test/api
! rg -n --hidden --glob '!node_modules/**' --glob '!dist/**' --glob '!coverage/**' "from ['\"][^'\"]*api/|import\\(['\"][^'\"]*api/" yourwolf-frontend/src
! rg -n '"axios"|node_modules/axios' yourwolf-frontend/package.json yourwolf-frontend/package-lock.json
! rg -n 'VITE_API_URL' yourwolf-frontend
! rg -n '\bNameCheckResult\b' yourwolf-frontend/src
git diff --exit-code b2874a68ca2ea4c73dfb218f121091e35cd2e87d -- yourwolf-frontend/src/engine yourwolf-frontend/src/data/seed yourwolf-backend
git diff --exit-code 413adb2915070b09dea06d5326271338c5cf3113 -- README.md
git diff --check
~~~

It exited 0. `npm run lint` and `npm run build` also exited 0. Preview launch and curl both completed successfully.

## Unfixed findings

None.

## Phase document sync

The phase-doc-sync baseline-truth check found no summary or roadmap repair. `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md:8-18` and `docs/phases/PROJECT_ROADMAP.md:18-21` already state local role-authoring and zero-HTTP behavior. The repair hardens test evidence and clarifies the QA handoff only. It does not change user-facing phase behavior or protected scope. The only phase document change is the executable tab clarification at `docs/phases/PHASE_05B/PHASE_05B_QA.md:28`.
