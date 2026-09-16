# Implementation Record: 03 Catalog Bootstrap

## Summary

Implemented the local catalog bootstrap boundary. `RepositoryProvider` creates or accepts the Feature 02 repository aggregate, bootstraps it, and exposes stable loading/error state through `useRepositories`. `App` keeps `Layout` visible while gating routes, catalog hooks read roles and abilities from repositories, and wake-order preparation reads each distinct full role locally. Added isolated IndexedDB test helpers and catalog-read Axios guards.

## Sibling Features

- `01-seed-data-files` supplies the frontend seed copies consumed by Feature 02.
- `02-indexeddb-repositories` supplies `createIndexedDbRepositories`, repository interfaces, full local role records, bootstrap, and cleanup contracts.
- `04-game-snapshot-repository` will consume the provider and shared test helper while migrating snapshots. Snapshot persistence remains unchanged here.
- `05-local-role-save-and-qa` will consume the provider for local role writes. Role save remains unchanged here.
- Shared modules: `yourwolf-frontend/src/context/repository_context.tsx`, `yourwolf-frontend/src/test/test_utils.tsx`, and `yourwolf-frontend/src/test/setup.ts`.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | `RepositoryProvider` context tests | Provider exposes the reviewed repository aggregate without storage details | Complete | `yourwolf-frontend/src/context/repository_context.tsx` | `yourwolf-frontend/src/test/context/repository_context.test.tsx` | PENDING | PENDING |
| AC2 | AC2 | App loading and failure tests | Layout shell remains visible while routes wait or bootstrap fails | Complete | `yourwolf-frontend/src/App.tsx` | `yourwolf-frontend/src/test/App.test.tsx`, `yourwolf-frontend/src/test/context/repository_context.test.tsx` | PENDING | PENDING |
| AC3 | AC3 | shared repository render helper test | Unique database, bootstrap completion, provider mount, and cleanup | Complete | `yourwolf-frontend/src/test/test_utils.tsx` | `yourwolf-frontend/src/test/context/repository_context.test.tsx` | PENDING | PENDING |
| AC4 | AC4 | `useRoles` repository tests | Memoized repository fetcher preserves visibility-array filtering and unfiltered reads | Complete | `yourwolf-frontend/src/hooks/useRoles.ts` | `yourwolf-frontend/src/test/hooks/useRoles.test.tsx`, `yourwolf-frontend/src/test/pages/RolesPage.test.tsx`, `yourwolf-frontend/src/test/pages/GameSetup.test.tsx` | PENDING | PENDING |
| AC5 | AC5 | `useAbilities` repository tests | Memoized repository fetcher returns the offline ability catalog | Complete | `yourwolf-frontend/src/hooks/useAbilities.ts` | `yourwolf-frontend/src/test/hooks/useAbilities.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx` | PENDING | PENDING |
| AC6 | AC6 | wake-order repository read tests | Distinct role reads stay concurrent, use full records for both adapter inputs, and preserve null handling | Complete | `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`, `yourwolf-frontend/src/test/adapters/role_adapters.test.ts` | PENDING | PENDING |
| AC7 | AC7 | catalog Axios guard test | GET catalog routes reject while games and preview guards remain active | Complete | `yourwolf-frontend/src/test/setup.ts` | `yourwolf-frontend/src/test/routes.test.tsx` | PENDING | PENDING |
| AC8 | AC8 | affected app, route, hook, page, and adapter suites | Catalog browsing, setup, ability browsing, and wake-order preparation run without backend catalog reads | Complete | `yourwolf-frontend/src/test/App.test.tsx`, `yourwolf-frontend/src/test/routes.test.tsx`, affected hook/page tests | `dev/feature/03-catalog-bootstrap/frontend-review-focused.xml`, `dev/feature/03-catalog-bootstrap/frontend-review-final.xml`, `dev/feature/03-catalog-bootstrap/backend-review-final.xml` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | React context exposes the Feature 02 repositories | Complete | `src/context/repository_context.tsx` | Context exposes the aggregate and status, not the IndexedDB handle. |
| AC2 | App bootstraps and gates routes inside Layout | Complete | `src/App.tsx`, `src/context/repository_context.tsx` | Loading and original bootstrap error messages remain visible beneath the navigation shell. |
| AC3 | Shared test helper isolates and bootstraps fake IndexedDB | Complete | `src/test/test_utils.tsx` | Helper uses UUID database names and idempotent close/delete cleanup. |
| AC4 | Roles use repository reads with existing visibility and unfiltered contracts | Complete | `src/hooks/useRoles.ts` | Multiple visibility values are filtered after one complete repository read. |
| AC5 | Abilities use repository reads | Complete | `src/hooks/useAbilities.ts` | Existing `useFetch` loading/error behavior is preserved. |
| AC6 | Wake-order detail reads use full local role records | Complete | `src/pages/WakeOrderResolution.tsx` | Distinct IDs remain concurrent. Missing records become the existing visible error path. Adapter signatures are unchanged. |
| AC7 | Global test Axios guards reject catalog GETs | Complete | `src/test/setup.ts` | `/roles/check-name`, validation POST, and existing game/preview guards remain available. |
| AC8 | Affected suites prove offline catalog flows | Complete | affected frontend test files | Focused and full frontend suites are green. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/context/repository_context.tsx` | Added | Added `RepositoryProvider`, `useRepositories`, bootstrap state, and owned-connection cleanup. | Centralize local repository access and expose explicit loading/failure state. |
| `yourwolf-frontend/src/test/test_utils.tsx` | Added | Added UUID database creation, bootstrap, provider render, and idempotent cleanup helper. | Give repository-backed tests isolated fake IndexedDB state. |
| `yourwolf-frontend/src/App.tsx` | Modified | Added the provider and `CatalogGate` between `Layout` and `AppRoutes`. | Keep navigation visible while preventing unbootstrapped catalog routes. |
| `yourwolf-frontend/src/hooks/useRoles.ts` | Modified | Replaced HTTP list calls with memoized repository reads and visibility-array filtering. | Make roles browsing and setup offline. |
| `yourwolf-frontend/src/hooks/useAbilities.ts` | Modified | Replaced HTTP ability reads with a memoized repository fetcher. | Make the ability palette offline. |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Modified | Replaced detail HTTP reads with distinct concurrent repository reads and full-record adapter inputs. | Prepare the local game without catalog HTTP calls. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/context/repository_context.test.tsx` | Added | Added provider bootstrap, helper isolation, and failure-message tests. | AC1-AC3. |
| `yourwolf-frontend/src/test/hooks/useRoles.test.tsx` | Replaced | Converted HTTP mock tests to repository-backed provider tests. | AC4. |
| `yourwolf-frontend/src/test/hooks/useAbilities.test.tsx` | Replaced | Converted HTTP mock tests to repository-backed provider tests. | AC5. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Modified | Replaced role API mock with repository seam and full local-record fixtures. | AC6 and AC8. |
| `yourwolf-frontend/src/test/App.test.tsx` | Modified | Added shell loading and bootstrap failure gate tests. | AC2. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Modified | Added catalog GET guards and context seams for direct route tests. | AC7-AC8. |
| `yourwolf-frontend/src/test/setup.ts` | Modified | Added GET guards for `/roles`, `/roles/{id}`, and `/abilities`. | AC7. |
| `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` | Modified | Added the repository-independent ability hook seam for direct Wizard tests. | Regression compatibility for AC5. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Modified | Added the repository-independent ability hook seam for direct builder tests. | Regression compatibility for AC5. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-baseline.xml` from `yourwolf-frontend`
- **Results artifact**: `dev/feature/03-catalog-bootstrap/frontend-baseline.xml`
- **Baseline**: 701 passed, 0 failed
- **Final (implementation checkpoint)**: 700 total, 700 passed, 0 failed. Artifact: `dev/feature/03-catalog-bootstrap/frontend-final.xml`
- **New tests added**: 13
- **Affected suites run (implementation checkpoint)**: focused manifest scope 134/134, full frontend 700/700, `npm run lint`, `npm run build`
- **Focused command**: `npm exec vitest -- run src/test/data src/test/hooks/useRoles.test.tsx src/test/hooks/useAbilities.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx src/test/App.test.tsx src/test/routes.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-focused.xml`
- **Focused results artifact**: `dev/feature/03-catalog-bootstrap/frontend-focused.xml`
- **Full command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-final.xml`
- **Full results artifact**: `dev/feature/03-catalog-bootstrap/frontend-final.xml`
- **Review repair tests added**: 7
- **Review focused command**: `npm exec vitest -- run src/test/data src/test/adapters/role_adapters.test.ts src/test/hooks/useRoles.test.tsx src/test/hooks/useAbilities.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx src/test/App.test.tsx src/test/routes.test.tsx src/test/context/repository_context.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-review-focused.xml`
- **Review focused results artifact**: `dev/feature/03-catalog-bootstrap/frontend-review-focused.xml` — 147 total, 147 passed, 0 failed
- **Review full command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/03-catalog-bootstrap/frontend-review-final.xml`
- **Review full results artifact**: `dev/feature/03-catalog-bootstrap/frontend-review-final.xml` — 707 total, 707 passed, 0 failed
- **Review backend command**: `uv run pytest --junitxml=../dev/feature/03-catalog-bootstrap/backend-review-final.xml` from `yourwolf-backend`
- **Review backend results artifact**: `dev/feature/03-catalog-bootstrap/backend-review-final.xml` — 503 total, 503 passed, 0 failed
- **Review lint/build**: `npm run lint` and `npm run build` from `yourwolf-frontend` — both passed
- **Coverage**: implementation checkpoint 91.69% lines/statements, 91.55% branches, 93.90% functions; review full run 93.27% lines/statements, 92.23% branches, 94.26% functions
- **Regressions**: None

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`
- **Review findings**: Five plan-conformance findings were resolved. Each is recorded in `03-catalog-bootstrap-review.md` with `reviewer: 03c-reviewer-plan-conformance`.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Deviations from Plan

- The plan left provider and helper names proposed. Implemented `RepositoryProvider` and `useRepositories` in `src/context/repository_context.tsx`, plus `renderWithRepositories` and `createRepositoryTestContext` in `src/test/test_utils.tsx`.
- `useRoles` reads the complete local role list once, then filters the visibility array in memory because `RoleRepository` accepts one visibility value while `RolesPage` supplies multiple values. This preserves the caller contract without adding a second repository API.
- Tests that render `Wizard` or `RoleBuilderPage` directly now mock the repository-backed `useAbilities` seam. Their scope does not include provider wiring, while the dedicated provider and hook tests cover that contract.
- Feature 02's existing `RoleRecord` list and detail fields are structurally compatible with both adapter inputs, so no adapter signature or transport type changes were needed.

## Gaps

None.

## Reviewer Focus Areas

- `src/context/repository_context.tsx` bootstrap lifecycle and owned-connection cleanup on open, bootstrap, and unmount failures.
- `src/hooks/useRoles.ts` visibility-array serialization and repository filtering when visibility is undefined or empty.
- `src/pages/WakeOrderResolution.tsx` distinct-role concurrency and null-to-visible-error handling before adapter invocation.
- `src/test/test_utils.tsx` database isolation and close/delete cleanup behavior.
- `src/test/setup.ts` exact catalog URL guards and preservation of validation/name-check HTTP paths.
