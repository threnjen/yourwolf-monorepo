# Implementation Record: 05 Local Role Save and QA

## Summary

RoleBuilder now performs a local case-insensitive collision preflight before either retained server check, then saves validated drafts through `createCustomRole` and `RoleRepository.put`. Failed writes preserve the draft and wizard state. The Axios guard rejects `POST /roles`, a provider-backed smoke test completes a game without HTTP, and the Phase 05A manual checklist remains pending.

## Sibling Features

- `02-indexeddb-repositories` supplies `createCustomRole`, local role records, and `RoleRepository`.
- `03-catalog-bootstrap` supplies `RepositoryProvider`, `useRepositories`, repository-backed catalog consumers, and the isolated test helper.
- `04-game-snapshot-repository` supplies durable game snapshots and facilitator phase persistence.
- Shared modules changed here: `RoleBuilderPage`, `Wizard`, `BasicInfoStep`, `useNameCheck`, the Axios test guard, and the wake-order UUID callback boundary. The combined smoke consumes all preceding features through one provider.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | local collision page test | Official/custom names differing only by case suppress server calls and writes | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/hooks/useNameCheck.ts`, `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `dev/feature/05-local-role-save-and-qa/focused-final.xml` | PENDING | PENDING |
| AC2 | AC2 | retained server check tests | Non-colliding drafts continue to use validation and name-check endpoints | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/hooks/useNameCheck.ts` | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`, `dev/feature/05-local-role-save-and-qa/frontend-final.xml` | PENDING | PENDING |
| AC3 | AC3 | local save page test and conversion contract | Successful checks map through `createCustomRole` and await `roles.put` | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/data/conversion.test.ts`, `dev/feature/05-local-role-save-and-qa/focused-final.xml` | PENDING | PENDING |
| AC4 | AC4 | rejected local put page test | Put rejection renders the existing error surface, retains draft state, and never calls create | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `dev/feature/05-local-role-save-and-qa/focused-final.xml` | PENDING | PENDING |
| AC5 | AC5 | repository-backed consumer contracts and guard test | Local role record is available to roles/setup consumers and `POST /roles` is forbidden | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/test/setup.ts`, `yourwolf-frontend/src/test/routes.test.tsx` | `dev/feature/05-local-role-save-and-qa/frontend-final.xml`, `dev/feature/05-local-role-save-and-qa/focused-final.xml` | PENDING | PENDING |
| AC6 | AC6 | combined provider smoke test | Seeded app, local catalogs, repository snapshots, and role-free game flow operate together | Complete | `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`, `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | `dev/feature/05-local-role-save-and-qa/focused-final.xml`, `dev/feature/05-local-role-save-and-qa/frontend-final.xml` | PENDING | PENDING |
| AC7 | AC7 | combined provider smoke test and full coverage | Full game reaches Game Over with no Axios calls, and global coverage exceeds 80% | Complete | `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` | `dev/feature/05-local-role-save-and-qa/frontend-final.xml` | PENDING | PENDING |
| AC8 | AC8 | manual checklist review | Manual QA routes, controls, defaults, reseed, and origin note are documented with pending rows | Complete | `docs/phases/PHASE_05A/PHASE_05A_QA.md` | `docs/phases/PHASE_05A/PHASE_05A_QA.md` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Local role names are compared case-insensitively before retained server checks or persistence | Complete | `src/pages/RoleBuilder.tsx`, `src/hooks/useNameCheck.ts`, `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Collision sets the existing `Taken ✗` state and suppresses both debounced calls. |
| AC2 | Server validation and name check remain for non-colliding drafts | Complete | `src/pages/RoleBuilder.tsx`, `src/hooks/useNameCheck.ts` | Phase 05B still owns removing these calls. |
| AC3 | Valid drafts become private UUID-backed records and are awaited in `RoleRepository.put` | Complete | `src/pages/RoleBuilder.tsx` | Uses Feature 02 conversion with a fresh `updated_at`. |
| AC4 | Local write failure preserves the draft and reports the error | Complete | `src/pages/RoleBuilder.tsx` | No server create path is invoked. |
| AC5 | Local roles remain visible through repository-backed list/setup consumers and `POST /roles` is guarded | Complete | `src/test/setup.ts`, `src/test/routes.test.tsx` | Consumer reads mount fresh repository-backed hooks after navigation. |
| AC6 | All phase features operate through one repository provider | Complete | `src/test/integration/phase_05a_smoke.test.tsx` | Smoke uses a real bootstrapped fake IndexedDB provider. |
| AC7 | Full game smoke is offline and full frontend coverage stays above 80 percent | Complete | `src/test/integration/phase_05a_smoke.test.tsx` | Smoke reaches Game Over with all Axios methods untouched. |
| AC8 | Manual QA document exists with pending-only rows | Complete | `docs/phases/PHASE_05A/PHASE_05A_QA.md` | No manual execution was performed. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Modified | Added repository-backed local role loading, one collision helper, local-first debounce gating, current name status gating, pre-write collision recheck, conversion, and awaited put. | Satisfy AC1–AC4 without adding a parallel conversion or store. |
| `yourwolf-frontend/src/hooks/useNameCheck.ts` | Modified | Added an `enabled` seam so local collisions and unready catalogs issue no server name-check request. | Preserve the existing debounce and stale-response behavior while enforcing local-first ordering. |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Modified | Accepts the lifted name status and disables save unless the current name check is available. | Keep server name-check eligibility valid after Basic Info unmounts. |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modified | Displays the parent status and retains a direct-test fallback hook when no status is supplied. | Show the existing name status while coordinating it at page scope. |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Modified | Wraps `crypto.randomUUID()` when passing it as the engine id callback. | Browser runtime smoke exposed the required `Crypto` receiver binding. |
| `docs/ARCHITECTURE.md` | Modified | Describes local catalog/game storage and local role save with retained validation/name checks. | Keep behavior documentation current. |
| `docs/CODEBASE_CONTEXT.md` | Modified | Updates Phase 05A state, data boundaries, route dependencies, and remaining API calls. | Keep repository context current. |
| `docs/phases/PHASE_05A/PHASE_05A_QA.md` | Added | Documents executable pending manual checks for launch, offline flow, role save, reopen, reseed, and origins. | AC8. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Modified | Replaced server-create expectations with local put, failure retention, and case-insensitive collision ordering assertions. | AC1–AC4. |
| `yourwolf-frontend/src/test/setup.ts` | Modified | Rejects exact `POST /roles` while preserving existing game, preview, catalog, validation, and name-check guards. | AC5. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Modified | Adds an exact create-path guard assertion. | AC5. |
| `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` | Added | Mounts one real repository provider, completes a seeded game, and asserts no Axios method runs. | AC6–AC7. |
| `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` | Modified during review | Adds the omitted-name-status save-gate regression test. | Current name-check eligibility. |
| `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | Modified during review | Adds short-name and disabled-state stale-response tests. | Current name-check invalidation. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/frontend-final.xml` from `yourwolf-frontend`
- **Results artifact**: `dev/feature/05-local-role-save-and-qa/frontend-final.xml`
- **Baseline**: 709 passed, 0 failed. Artifact: `dev/feature/PHASE_05A-baseline/frontend-vitest.xml`
- **Final**: 715 total, 715 passed, 0 failed. Coverage: 92.27% lines, 92.36% branches, 94.11% functions
- **Feature tests added**: 3; **review tests added**: 3
- **Affected suites run**: focused 164/164; full frontend 715/715; backend focused 100/100 and full 503/503; `npm run lint`; `npm run build`; exact source and endpoint searches
- **Focused command**: `npm exec vitest -- run src/test/data src/test/context src/test/hooks/useNameCheck.test.ts src/test/pages/RoleBuilder.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx src/test/integration/phase_05a_smoke.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/focused-final.xml`
- **Focused results artifact**: `dev/feature/05-local-role-save-and-qa/focused-final.xml` — 164 total, 164 passed, 0 failed
- **Focused backend command**: `uv run pytest --no-cov tests/test_roles.py tests/test_role_service.py tests/test_role_validation.py --junitxml=../dev/feature/05-local-role-save-and-qa/backend-focused.xml`
- **Focused backend results artifact**: `dev/feature/05-local-role-save-and-qa/backend-focused.xml` — 100 total, 100 passed, 0 failed
- **Backend command**: `uv run pytest --junitxml=../dev/feature/05-local-role-save-and-qa/backend-final.xml` from `yourwolf-backend`
- **Backend results artifact**: `dev/feature/05-local-role-save-and-qa/backend-final.xml` — 503 total, 503 passed, 0 failed
- **Lint/build**: `npm run lint` and `npm run build` from `yourwolf-frontend` — both passed. Backend `uv run mypy app`, `uv run black --check app tests`, and `uv run isort --check-only app tests` were also run, but report pre-existing failures in untouched backend files.
- **Regressions**: None

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`
- **Review findings**: F-01 through F-05 were recorded before repair and all five were repaired in one pass.
- **Fix rounds**: 1
- **Review artifact**: `dev/feature/05-local-role-save-and-qa/05-local-role-save-and-qa-review.md`
- **Review tests**: The omitted-name-status wizard test and short-name stale-response test failed before repair, then passed after repair. The disabled-name-check stale-response test also passes.
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Deviations from Plan

- The combined smoke uses three default Villager cards to keep the automated game path deterministic and avoid unnecessary fixture setup. The required six-card Werewolf + Minion + Villager scenario is documented for manual QA.
- The wake-order id generator now wraps `crypto.randomUUID()` because the browser throws when the method is passed unbound. This is a required AC6 runtime correction, not a new library or pattern.
- Direct `BasicInfoStep` tests retain a fallback `useNameCheck` invocation when the lifted `nameStatus` prop is omitted. The page passes the coordinated status, so production uses one active name-check request.

## Gaps

- Manual browser QA was not executed by contract. Every checklist row remains `Pending`.
- No live cross-tab synchronization was added. Refresh-based visibility is documented as the supported behavior.

## Reviewer Focus Areas

- `src/pages/RoleBuilder.tsx` local-first ordering, latest repository collision recheck, validation/name status gating, and awaited put failure behavior.
- `src/hooks/useNameCheck.ts` disabled state invalidation of in-flight requests and preservation of stale-response protection.
- `src/test/integration/phase_05a_smoke.test.tsx` one-provider route flow and Axios no-call assertions.
- `docs/phases/PHASE_05A/PHASE_05A_QA.md` pending-only statuses, exact routes, shipped defaults, and origin caveat.
