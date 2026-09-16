# Plan-Conformance Review: 05 Local Role Save and QA

## Scope

This review covers the ten files committed at `090b6988a82dc812145a656bd87037737520213a`, the Phase 05A plan, selection delta, execution manifest, and the uncommitted Phase 05A documentation updates. The review is limited to the `plan-conformance` lane.

## Findings recorded before repair

### F-01 — Wizard permitted save without a current name-check result

- severity: high
- lane: plan-conformance
- evidence: Before repair, `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx:29` made `nameStatus` optional and `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx:103` defaulted an omitted value to `available`. The save guard at the former `Wizard.tsx:180-183` therefore permitted valid validation without a current successful name check. The failing case is recorded in `dev/feature/05-local-role-save-and-qa/review-red.xml`.
- reviewer: 03c-reviewer-plan-conformance
- repair: Set the safe default to `idle` at `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx:103`. The save guard at `Wizard.tsx:180-183` now requires `available`. Added the regression test at `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx:202-219`.
- resolution: fixed

### F-02 — Short-name transition did not invalidate an in-flight name-check response

- severity: high
- lane: plan-conformance
- evidence: Before repair, `yourwolf-frontend/src/hooks/useNameCheck.ts:34-36` set `idle` for a short name without advancing `requestIdRef`, while the response guard at the former `useNameCheck.ts:47-52` could still accept the prior request. The failing case is recorded in `dev/feature/05-local-role-save-and-qa/review-red.xml`.
- reviewer: 03c-reviewer-plan-conformance
- repair: Advance `requestIdRef` before setting `idle` at `yourwolf-frontend/src/hooks/useNameCheck.ts:34-37`. Added short-name and disabled-state regression tests at `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts:204-255`.
- resolution: fixed

### F-03 — Phase documentation said local role save remained server-backed

- severity: medium
- lane: plan-conformance
- evidence: Before repair, the uncommitted updates stated that the frontend used the backend for role persistence at the former `docs/ARCHITECTURE.md:5`, labelled the runtime edge as role-save APIs at the former `docs/ARCHITECTURE.md:14`, and called role-save server-backed at the former `docs/ARCHITECTURE.md:199`. The same inaccurate claim appeared at the former `docs/CODEBASE_CONTEXT.md:225` and `docs/CODEBASE_CONTEXT.md:265`.
- reviewer: 03c-reviewer-plan-conformance
- repair: Documented local role persistence and retained server validation/name checks at `docs/ARCHITECTURE.md:5,14,199` and `docs/CODEBASE_CONTEXT.md:225,265`.
- resolution: fixed

### F-04 — Manual QA steps did not fully specify executable controls and state transitions

- severity: medium
- lane: plan-conformance
- evidence: Before repair, `docs/phases/PHASE_05A/PHASE_05A_QA.md:14` left the ability-count check unspecified, rows `52-55` omitted the night-reader transition before later controls, and row `68` provided no reproducible metadata edit.
- reviewer: 03c-reviewer-plan-conformance
- repair: Specified the `/roles/new` ability inspection at `docs/phases/PHASE_05A/PHASE_05A_QA.md:12-14`, explicit night completion and same-URL reopen actions at `QA.md:49-55`, and a DevTools IndexedDB metadata edit plus reload at `QA.md:66-95`. All 32 numbered manual rows remain `Pending`.
- resolution: fixed

### F-05 — Phase summary named a deleted snapshot storage path as current

- severity: low
- lane: plan-conformance
- evidence: The uncommitted phase summary at the former `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md:65` said snapshot callers still used `src/storage/game_session_storage.ts`, although Feature 04 moved that responsibility to the repository and deleted the module.
- reviewer: 03c-reviewer-plan-conformance
- repair: Updated `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md:65` to identify the current `GameRepository` in `src/data/indexeddb.ts`.
- resolution: fixed

## Reviewed files

- `docs/phases/PHASE_05A/PHASE_05A_QA.md` — reviewed and repaired for exact controls, routes, defaults, reseed procedure, origin note, and pending-only status.
- `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` — reviewed and repaired save gating.
- `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` — verified lifted status display and direct-test fallback at `BasicInfoStep.tsx:76-79`.
- `yourwolf-frontend/src/hooks/useNameCheck.ts` — reviewed and repaired disabled and short-name invalidation.
- `yourwolf-frontend/src/pages/RoleBuilder.tsx` — verified local-first collision gating at `RoleBuilder.tsx:17-22,37-40,54-72`, current save gates and recheck at `RoleBuilder.tsx:111-136`, and error retention at `RoleBuilder.tsx:132-135`.
- `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` — verified the minimal bound UUID callback at `WakeOrderResolution.tsx:139-150`.
- `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` — verified one real repository provider, complete route flow, and zero Axios calls at `phase_05a_smoke.test.tsx:44-90`.
- `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` — verified successful local put, failure retention, and collision suppression at `RoleBuilder.test.tsx:116-165`.
- `yourwolf-frontend/src/test/routes.test.tsx` — verified exact create guard and retained validation/name-check exceptions at `routes.test.tsx:64-80`.
- `yourwolf-frontend/src/test/setup.ts` — verified named validation/name-check exceptions remain ahead of the generic catalog guard and exact `POST /roles` rejection at `setup.ts:15-34`.

## Acceptance-criteria mapping

| Criterion | Result | Exact evidence |
|---|---|---|
| AC1: local case-insensitive collision check precedes server calls and writes | verified | `RoleBuilder.tsx:17-22` normalizes both names, `RoleBuilder.tsx:37-40` derives collision/name status, `RoleBuilder.tsx:64-72` returns before `rolesApi.validate`, and `RoleBuilder.tsx:122-129` rechecks before `roles.put`. `RoleBuilder.test.tsx:147-165` proves official/custom-style collision suppression. `focused-final.xml` reports 164/164. |
| AC2: retained validation and name-check calls remain required, and save needs current success | verified | `RoleBuilder.tsx:72-90` retains validation for non-collisions, `RoleBuilder.tsx:39-40` coordinates name status, and `useNameCheck.ts:45-56` calls the retained endpoint. `Wizard.tsx:180-183` requires `available`. `useNameCheck.test.ts:204-255` covers disabled/short stale responses and `RoleBuilder.test.tsx:224-246` covers retained validation. |
| AC3: successful save creates the complete private local record and awaits put | verified | `RoleBuilder.tsx:128-131` calls `createCustomRole`, awaits `repositories.roles.put`, then navigates. `conversion.ts:262-285` supplies UUID, private/unlocked flags, zero counters, empty dependencies, count defaults, and timestamps. `conversion.test.ts:135-160` and `RoleBuilder.test.tsx:117-132` cover the conversion/write contract. |
| AC4: put failure retains draft/wizard state and avoids server create | verified | `RoleBuilder.tsx:132-135` renders the caught error while leaving state and route unchanged. `RoleBuilder.test.tsx:134-145` proves the error and draft remain visible and `rolesApi.create` is untouched. |
| AC5: saved roles are immediately visible and exact POST guard preserves retained endpoints | verified | `phase_05a_smoke.test.tsx:15-42` reads one saved local record through roles and setup consumers without reload. `useRoles.ts:20-37` reads the repository. `setup.ts:15-34` rejects catalog/create paths while allowing validation/name-check, and `routes.test.tsx:64-80` exercises those guards. |
| AC6: complete phase stack operates through one provider and browser UUID binding is safe | verified | `App.tsx:6-14` wires the provider and catalog gate. `phase_05a_smoke.test.tsx:44-57` mounts one real provider for the complete route flow. `WakeOrderResolution.tsx:139-150` uses the minimal `() => crypto.randomUUID()` callback and awaits the game snapshot write. |
| AC7: full game completes with zero `/api/v1` traffic and coverage remains above 80% | verified | `phase_05a_smoke.test.tsx:59-90` drives setup, wake order, all facilitator phases, completion, and asserts every Axios method was not called. The endpoint search found no application-flow `/api/v1` calls. Full frontend XML reports 715/715 and coverage 92.27% lines, 92.36% branches, 94.11% functions. |
| AC8: manual checklist covers required scenarios and every row remains pending | verified | `PHASE_05A_QA.md:12-30` covers first launch and backend-stopped six-card defaults, `QA.md:36-41` covers custom-role save/collisions, `QA.md:49-62` covers every phase and two-tab refresh, `QA.md:66-95` covers reproducible reseed and counts, and `QA.md:99-102` covers origins. The 32 numbered rows and completion fields remain `Pending` at `QA.md:10-112`. |

## Test and verification evidence

- `executed-failing`: command `npm exec vitest -- run src/test/components/RoleBuilder/Wizard.test.tsx src/test/hooks/useNameCheck.test.ts --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/review-red.xml` from `yourwolf-frontend`; artifact `dev/feature/05-local-role-save-and-qa/review-red.xml`; 32 total, 30 passed, 2 failed. This is the pre-repair Red evidence for F-01 and F-02.
- `executed-green`: command `npm exec vitest -- run src/test/components/RoleBuilder/Wizard.test.tsx src/test/hooks/useNameCheck.test.ts --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/repair-focused.xml` from `yourwolf-frontend`; artifact `dev/feature/05-local-role-save-and-qa/repair-focused.xml`; 32 total, 32 passed, 0 failed.
- `executed-green`: command `npm exec vitest -- run src/test/data src/test/context src/test/hooks/useNameCheck.test.ts src/test/pages/RoleBuilder.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx src/test/integration/phase_05a_smoke.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/focused-final.xml` from `yourwolf-frontend`; artifact `dev/feature/05-local-role-save-and-qa/focused-final.xml`; 164 total, 164 passed, 0 failed.
- `executed-green`: command `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/05-local-role-save-and-qa/frontend-final.xml` from `yourwolf-frontend`; artifact `dev/feature/05-local-role-save-and-qa/frontend-final.xml`; 715 total, 715 passed, 0 failed. Coverage is 92.27% lines, 92.36% branches, 94.11% functions.
- `executed-green`: command `uv run pytest --no-cov tests/test_roles.py tests/test_role_service.py tests/test_role_validation.py --junitxml=../dev/feature/05-local-role-save-and-qa/backend-focused.xml` from `yourwolf-backend`; artifact `dev/feature/05-local-role-save-and-qa/backend-focused.xml`; 100 total, 100 passed, 0 failed.
- `executed-green`: command `uv run pytest --junitxml=../dev/feature/05-local-role-save-and-qa/backend-final.xml` from `yourwolf-backend`; artifact `dev/feature/05-local-role-save-and-qa/backend-final.xml`; 503 total, 503 passed, 0 failed. Coverage is 96.04%.

The frontend `npm run lint` and `npm run build` commands both exited successfully. `git diff --check` exited successfully. `rg -n "rolesApi\.create|/api/v1|apiClient\.(get|post|put|patch|delete)" src` found only retained API client definitions and tests, and `rg -n "/api/v1/(games|roles|abilities)|rolesApi\.create" src/pages src/hooks src/components` found no application-flow matches. Backend `uv run mypy app`, `uv run black --check app tests`, and `uv run isort --check-only app tests` were executed but fail on pre-existing untouched backend files. `git diff --name-only 090b698^..090b698 -- yourwolf-backend` is empty.

## Verdict

APPROVE. All plan-conformance findings were repaired in one pass. The authoritative frontend and backend suites are green, the manual QA artifact remains pending-only, and no plan-conformance findings remain unresolved.

## Unfixed findings

None.
