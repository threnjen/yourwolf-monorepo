# 03 Catalog Bootstrap Review

## Verdict

Approved after one review-and-repair pass. The review covered the implementation checkpoint `a6c22c8`, all 17 changed files, the Feature 03 plan, selection delta, execution manifest, Feature 02 contracts, and the authoritative test evidence. Seven review tests were added, five plan-conformance findings were repaired, and the final frontend and backend suites are green.

## Review scope

- Pipeline: `phase`
- Lane: `plan-conformance`
- Implementation checkpoint: `a6c22c8`
- Reviewer: `03c-reviewer-plan-conformance`
- Review rounds: one. The repair run and test reruns are part of this round. No second review cycle was opened.
- Changed files reviewed: 17 files in the checkpoint diff from `7c03fda..a6c22c8`.
- Feature 02 contract evidence: `src/data/indexeddb.ts`, `src/data/repositories.ts`, `src/data/records.ts`, `src/data/index.ts`, and the approved Feature 02 implementation and review records.

## Findings and repairs

### F-01 Catalog guard blocked the retained name-check call

- severity: medium
- lane: plan-conformance
- evidence: At the implementation checkpoint, `yourwolf-frontend/src/test/setup.ts:15-18` rejected every path matching `/roles/{id}`, including the retained `GET /roles/check-name` call at `yourwolf-frontend/src/api/roles.ts:43-45`. This contradicted the plan non-goal at `03-catalog-bootstrap-plan.md:18-20`.
- repair: `yourwolf-frontend/src/test/setup.ts:15-20` now compares the query-stripped path and exempts `/roles/check-name` while retaining exact catalog guards. `yourwolf-frontend/src/test/routes.test.tsx:73-79` proves catalog reads fail while validation and name-check calls remain available.
- verification: Review focused and full frontend artifacts are green. Existing `/games` and `/roles/preview-script` assertions remain at `yourwolf-frontend/src/test/routes.test.tsx:64-71`.
- reviewer: 03c-reviewer-plan-conformance

### F-02 Test helper leaked its database when repository opening failed

- severity: medium
- lane: plan-conformance
- evidence: At the implementation checkpoint, `yourwolf-frontend/src/test/test_utils.tsx:16-24` awaited `createIndexedDbRepositories` before entering the cleanup `try`, so an open rejection skipped `deleteDatabase`.
- repair: `yourwolf-frontend/src/test/test_utils.tsx:16-25` now covers both opening and bootstrap in the `try`, closes an opened repository when present, and deletes the UUID database before rethrowing. Normal cleanup remains idempotent at `yourwolf-frontend/src/test/test_utils.tsx:32-41`.
- verification: `yourwolf-frontend/src/test/context/repository_context.test.tsx:140-145` injects an opening failure and proves the isolated database is deleted.
- reviewer: 03c-reviewer-plan-conformance

### F-03 Provider could close an owned repository twice

- severity: medium
- lane: plan-conformance
- evidence: At the implementation checkpoint, the bootstrap failure path closed `activeRepositories` at `repository_context.tsx:52-55`, while both the cleanup path at `:69-72` and the post-unmount bootstrap path at `:45-48` could close the same owned connection again.
- repair: `yourwolf-frontend/src/context/repository_context.tsx:32-43` adds one guarded close operation. Bootstrap failure, post-unmount completion, and effect cleanup use it at `:54-62` and `:75-78`.
- verification: `yourwolf-frontend/src/test/context/repository_context.test.tsx:87-137` proves exactly one close after bootstrap failure plus unmount and after unmount during pending bootstrap. The provider still surfaces the original error at `:60-69`.
- reviewer: 03c-reviewer-plan-conformance

### F-04 Wake-order test seam masked missing repository records

- severity: medium
- lane: plan-conformance
- evidence: At the implementation checkpoint, `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx:33-46` converted both configured `null` and `undefined` values into a local fallback role. That made the required `RoleRepository.get` missing-record behavior untestable even though the page guard existed at `WakeOrderResolution.tsx:129-135`.
- repair: `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx:33-49` treats explicit `null` as missing and only uses the local fixture for an unconfigured mock. `mockReset` at `:86-92` prevents implementations from chaining between tests. The missing-record test at `:474-485` asserts the visible error, no navigation, and no snapshot.
- verification: The review focused and full artifacts contain 29 green wake-order tests. Distinct concurrent reads remain exercised at `:331-357` and the production `Promise.all` remains at `yourwolf-frontend/src/pages/WakeOrderResolution.tsx:122-139`.
- reviewer: 03c-reviewer-plan-conformance

### F-05 Hook conversion weakened behavior assertions and obscured the test-count delta

- severity: medium
- lane: plan-conformance
- evidence: The baseline artifact records 9 role tests and 5 ability tests at `frontend-baseline.xml:848-858` and `:914-932`. The implementation artifact records 5 role tests and 3 ability tests at `frontend-final.xml:564` and `:626`, and changed the two files from `.test.ts` to `.test.tsx`. The converted role tests no longer directly asserted refetch loading, error clearing, or empty results after failure. The converted ability tests no longer directly asserted empty results after failure.
- repair: `yourwolf-frontend/src/test/hooks/useRoles.test.tsx:45-57` asserts one unfiltered repository read and no refetch after an unchanged rerender. `:85-107` restores pending-refetch loading, error clearing, successful data, and the filtered result. `:110-123` restores empty results for both failure types. `yourwolf-frontend/src/test/hooks/useAbilities.test.tsx:47-61` restores empty results for both failure types. The provider identity assertion is at `yourwolf-frontend/src/test/context/repository_context.test.tsx:66-84`.
- verification: The current hook implementations preserve `useFetch` and memoized fetchers at `yourwolf-frontend/src/hooks/useRoles.ts:13-37` and `yourwolf-frontend/src/hooks/useAbilities.ts:12-25`. The current hook suites are green with 6 role tests and 3 ability tests in `frontend-review-focused.xml` and `frontend-review-final.xml`.
- reviewer: 03c-reviewer-plan-conformance

## Acceptance-criteria evidence

| AC | Result | Exact evidence |
|---|---|---|
| AC1 | complete | `repository_context.tsx:13-17` defines the context value, `:81-86` memoizes the provider value, and `:89-95` exposes the hook. Provider bootstrap coverage is in `repository_context.test.tsx:30-42`. |
| AC2 | complete | `App.tsx:6-15` nests the provider, `Layout`, and gate, while `:22-37` keeps the shell visible during loading and renders the original failure message. `App.test.tsx:47-63` proves loading and failure gating. |
| AC3 | complete | `test_utils.tsx:16-41` creates a UUID database, bootstraps it, closes and deletes it idempotently, and `:45-63` mounts the provider and waits for metadata. The helper open-failure proof is `repository_context.test.tsx:140-145`. |
| AC4 | complete | `useRoles.ts:13-37` uses `useFetch` with a memoized repository fetcher, filters multiple visibility values after one complete read, and leaves undefined or empty visibility unfiltered. Tests at `useRoles.test.tsx:45-83` cover visibility, unfiltered reads, changed visibility, and explicit refetch. `RolesPage.tsx:61-64` and `GameSetup.tsx` use the preserved caller contracts. |
| AC5 | complete | `useAbilities.ts:12-25` uses a memoized repository fetcher and `AbilitiesStep.tsx:39-55` consumes its offline state. The hook evidence is `useAbilities.test.tsx:28-61`; the direct component suite is included in the focused artifact. |
| AC6 | complete | `WakeOrderResolution.tsx:122-150` deduplicates ids, reads each distinct id concurrently, rejects `null` before adaptation, passes the full local record to both adapter inputs, and derives dependencies from full records. Concurrency is tested at `WakeOrderResolution.test.tsx:331-357`, duplicate reads and engine output at `:360-381`, and missing records at `:474-485`. Adapter contracts remain tested in `src/test/adapters/role_adapters.test.ts`. |
| AC7 | complete | `test/setup.ts:15-20` rejects exact `/roles` and `/abilities` paths and role-detail paths except `/roles/check-name`. `routes.test.tsx:64-79` proves the catalog and retained game/preview guards while allowing validation and name-check calls. |
| AC8 | complete | The review focused artifact covers app, routes, data, adapters, hooks, pages, and ability-step consumers. The integrated frontend artifact is green at 707/707, and the integrated backend artifact is green at 503/503. No catalog HTTP call remains in the migrated call sites at `useRoles.ts:20-30`, `useAbilities.ts:14-19`, and `WakeOrderResolution.tsx:129-139`. |

## Test count reconciliation

The count change is reconciled from collector-visible files and JUnit names, not from an inferred total.

| Evidence | Result |
|---|---|
| Implementation baseline `frontend-baseline.xml:2` | executed-green — 701 total, 701 passed, 0 failed. Command: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-baseline.xml`. |
| Implementation checkpoint `frontend-final.xml:2` | executed-green — 700 total, 700 passed, 0 failed. The two hook suites moved from `.test.ts` to `.test.tsx`, and the new context suite was collected. |
| Current collector | `npm exec vitest -- list --filesOnly` reported 52 files. The current disk contains the same 52 test files. The only source-set delta from the Feature 02 baseline is the new `context/repository_context.test.tsx` plus the two `.ts` to `.tsx` hook renames. No collector-visible file was lost. |
| Hook behavior mapping | Baseline names at `frontend-baseline.xml:848-858` and `:914-932` cover loading, mount success, data updates, unfiltered reads, visibility refetch, Error and non-Error failures, pending refetch loading, and error clearing. Current tests at `useRoles.test.tsx:38-123` and `useAbilities.test.tsx:28-61` retain each behavior. Some old cases are intentionally combined because repository filtering replaces the former HTTP parameter assertion. |
| Review additions | Seven tests were added during repair: five provider/helper lifecycle and identity tests, one refetch-state test, and one missing-record wake test. `frontend-review-final.xml:2` is therefore executed-green at 707 total, 707 passed, 0 failed. |

The net implementation delta is `-1`: App added 2 tests, the context suite added 2, routes added 1, and the hook conversion removed 6 named cases while retaining their behavior. The review added 7 tests, bringing the final total to 707. The final collector set proves the `.ts` to `.tsx` moves did not make a suite invisible.

## Test execution evidence

- Frontend affected suites: `executed-green`. Command: `npm exec vitest -- run src/test/data src/test/adapters/role_adapters.test.ts src/test/hooks/useRoles.test.tsx src/test/hooks/useAbilities.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx src/test/App.test.tsx src/test/routes.test.tsx src/test/context/repository_context.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-review-focused.xml`. Artifact: `dev/feature/03-catalog-bootstrap/frontend-review-focused.xml`. Counts: 147 total, 147 passed, 0 failed.
- Frontend integrated suite: `executed-green`. Command: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-review-final.xml`. Artifact: `dev/feature/03-catalog-bootstrap/frontend-review-final.xml`. Counts: 707 total, 707 passed, 0 failed. Coverage: 93.27% lines/statements, 92.23% branches, 94.26% functions.
- Backend integrated suite: `executed-green`. Command: `uv run pytest --junitxml=../dev/feature/03-catalog-bootstrap/backend-review-final.xml` from `yourwolf-backend`. Artifact: `dev/feature/03-catalog-bootstrap/backend-review-final.xml`. Counts: 503 total, 503 passed, 0 failed.
- Frontend lint: `npm run lint` from `yourwolf-frontend` — passed with zero warnings.
- Frontend build: `npm run build` from `yourwolf-frontend` — passed TypeScript compilation and Vite production build.
- `git diff --check` — passed.

## Unfixed findings

None.

## Phase document synchronization

No phase-document content was affected. The repairs enforce the existing Feature 03 acceptance criteria and preserve the phase's documented scope, call-site behavior, adapter contracts, and remaining server validation/name-check calls. No `docs/phases/` edit was required.
