# PHASE_05B Execution Manifest

## Phase Source

- Phase document: `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md`
- Run mode: `revalidate`
- Project discovery context: `docs/phases/DISCOVERY_CONTEXT.md`
- Phase discovery context: `docs/phases/PHASE_05B/PHASE_05B_DISCOVERY_CONTEXT.md` is not provided. The user explicitly authorized `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md` as its substitute for this run.
- Last validation revision: `a2ddaf897908ddb0d5097acfe0faaa8fd2f07c3e`
- Manifest status: `complete`
- Phase feature loop: `complete`
- Aggregate feature approval: `3/3 complete`; Feature 1 is `APPROVED`, Features 2 and 3 are `PASS`, and no unfixed findings remain.
- Last revalidation: `03-http-removal-offline-verification` completed at review commit `a2ddaf897908ddb0d5097acfe0faaa8fd2f07c3e`. Round 1 of 5 confirmed that no future features or downstream dependents remain. The existing prerequisite graph and execution order therefore remain valid, the stale set is empty, and the phase feature loop is complete.
- Branch: `phase/phase-05b-local-role-authoring`
- QA choice: `qa: skipped (user choice)`. Phase-required automated checks passed, and the required manual QA document exists with every row pending.
- Scheduling rule: Features execute one at a time. Read and write sets support revalidation and never authorize concurrent builds.

## Model Route Preflight

| Tier | Requested Model | User Override | Resolved Route | Resolution Status |
|---|---|---|---|---|
| low | `gpt-5.6-luna` | none | `gpt-5.6-luna` | `unverified` |
| medium | `gpt-5.6-sol` | none | `gpt-5.6-sol` | `unverified` |
| high | `gpt-5.6-luna` | none | `gpt-5.6-luna` | `unverified` |

Codex cannot report the effective child runtime route, so each initial feature record uses `resolved_model_status: unverified`.

## Environment State

| Property | Value |
|---|---|
| Tech stack | Backend: Python 3.14, FastAPI, SQLAlchemy, Pydantic v2, pytest under `uv`. Frontend: React 18, TypeScript 5.3, Vite 5.4, Vitest 2.1 with jsdom, V8 coverage, IndexedDB through `idb`, and npm. |
| Working tree at discovery | HEAD `e4dba344e1790d990f88ab27d50a1a3ae25814a6`. The baseline result directory `dev/feature/test-results/` was untracked input supplied by Phase - Execute. Preserve it. |
| Backend test runner | From `yourwolf-backend`: `uv run pytest --junitxml=../dev/feature/test-results/PHASE_05B-baseline-backend.xml` |
| Backend test baseline | `executed-green`: 503 total, 503 passed, 0 failed. Artifact: `dev/feature/test-results/PHASE_05B-baseline-backend.xml`. |
| Frontend test runner | From `yourwolf-frontend`: `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-baseline-frontend.xml` |
| Frontend test baseline | `executed-green`: 715 total, 715 passed, 0 failed. Artifact: `dev/feature/test-results/PHASE_05B-baseline-frontend.xml`. |
| Backend lint | From `yourwolf-backend`: `uv run mypy app` |
| Backend format | From `yourwolf-backend`: `uv run black --check app tests` and `uv run isort --check-only app tests` |
| Frontend lint | From `yourwolf-frontend`: `npm run lint` |
| Frontend format | No format script is configured in `yourwolf-frontend/package.json`; match existing formatting. |
| Frontend build | From `yourwolf-frontend`: `npm run build` |
| Frontend coverage | From `yourwolf-frontend`: `npm run test:coverage`. Vite requires at least 80 percent for lines, branches, functions, and statements. |
| Phase-scoped test pattern | `yourwolf-frontend/src/test/{domain,hooks,pages,components/RoleBuilder,integration}/**/*.{test.ts,test.tsx}`, plus `yourwolf-frontend/src/test/routes.test.tsx` and `yourwolf-frontend/src/test/setup.ts`. The final phase anchors are `src/test/domain/roleValidation.test.ts`, `src/test/pages/RoleBuilder.test.tsx`, and `src/test/integration/phase_05a_smoke.test.tsx`. |

## Phase-to-Feature Fidelity

| Phase Deliverable | Feature | Departure |
|---|---|---|
| Domain validation, warnings, shared collision behavior, and transcribed oracle | `01-domain-role-validation` | None |
| Builder, step, and local name-check rewiring | `02-builder-name-check-rewiring` | None |
| HTTP deletion, dependency and environment cleanup, zero-network proof, manual QA document, and combined launch verification | `03-http-removal-offline-verification` | None; this final feature also satisfies the Integration Feature Rule. |

No requirement was moved, deferred, renamed, reordered, split, merged, or delayed. The phase's two stated validation divergences are requirements, not planning departures: the frontend-only 50-character error and the local collision message `Name is already taken`.

## Ordered Feature List

| Order | Feature | Status | Prerequisites | Model Tier | Sequential Reason |
|---|---|---|---|---|---|
| 1 | `01-domain-role-validation` | complete | None | medium | Establishes the pure validation, warning, collision, and oracle contracts consumed by the UI rewire. |
| 2 | `02-builder-name-check-rewiring` | complete | `01-domain-role-validation` | high | Consumes the new domain contracts and removes every production caller of the frontend HTTP layer. |
| 3 | `03-http-removal-offline-verification` | complete | `01-domain-role-validation`, `02-builder-name-check-rewiring` | medium | Deletes transport only after callers move, then proves all phase behavior together through build, smoke, no-network, and manual-QA handoff. |

## Prerequisite Graph

```text
01-domain-role-validation ──> 02-builder-name-check-rewiring
01-domain-role-validation ──> 03-http-removal-offline-verification
02-builder-name-check-rewiring ──> 03-http-removal-offline-verification
```

The graph orders eligibility only. Phase - Execute builds one feature at a time.

## Feature Records

### 01-domain-role-validation

- `status`: `complete`
- `execution_order`: `1`
- `prerequisites`: `[]`
- `expected_read_set`:
  - `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md`
  - `docs/phases/DISCOVERY_CONTEXT.md`
  - `docs/learnings/cross-phase-decisions.md`
  - `yourwolf-backend/app/services/role_validation.py`
  - `yourwolf-backend/tests/test_role_validation.py`
  - `yourwolf-backend/tests/test_role_validation_module.py`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/eslint.config.js`
- `expected_write_set`:
  - `yourwolf-frontend/src/domain/roleValidation.ts`
  - `yourwolf-frontend/src/test/domain/roleValidation.test.ts`
- `plan_revision`: `2`
- `last_validation_commit`: `8bbe2b5c00b2e7d3c99051f7e8d681c204ecee50`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `verification_assets`:
  - Plan: `dev/feature/01-domain-role-validation/01-domain-role-validation-plan.md`
  - Selection delta: `dev/feature/01-domain-role-validation/01-domain-role-validation-delta.md`
  - Implementation record: `dev/feature/01-domain-role-validation/01-domain-role-validation-implementation.md`
  - Approved review record: `dev/feature/01-domain-role-validation/01-domain-role-validation-review.md`
  - Backend rule source: `yourwolf-backend/app/services/role_validation.py`
  - Backend literal-oracle sources: `yourwolf-backend/tests/test_role_validation.py` and `yourwolf-backend/tests/test_role_validation_module.py`
  - Focused test path: `yourwolf-frontend/src/test/domain/roleValidation.test.ts`
  - Focused command from `yourwolf-frontend`: `npm test -- --run src/test/domain/roleValidation.test.ts`
  - Root gate focused JUnit: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-focused-frontend.xml` — 23 passed, 0 failed
  - Root gate full JUnit: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-full-frontend.xml` — 738 passed, 0 failed
  - Root gate coverage JUnit: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-coverage-frontend.xml` — 738 passed, 0 failed; 92.38 percent lines/statements, 92.58 percent branches, 94.18 percent functions
  - Root static gates: `npm run lint` and `npm run build` exited 0
  - Frontend full-suite, coverage, lint, and build commands from `## Environment State`

### 02-builder-name-check-rewiring

- `status`: `complete`
- `execution_order`: `2`
- `prerequisites`: `[01-domain-role-validation]`
- `expected_read_set`:
  - `dev/feature/01-domain-role-validation/01-domain-role-validation-plan.md`
  - `dev/feature/01-domain-role-validation/01-domain-role-validation-implementation.md`
  - `dev/feature/01-domain-role-validation/01-domain-role-validation-review.md`
  - `yourwolf-frontend/src/domain/roleValidation.ts`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/hooks/useNameCheck.ts`
  - `yourwolf-frontend/src/hooks/useRoles.ts`
  - `yourwolf-frontend/src/hooks/useAbilities.ts`
  - `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx`
  - `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx`
- `expected_write_set`:
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/hooks/useNameCheck.ts`
  - `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`
  - `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`
  - `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` when the supplied status/result assertions require maintenance
  - `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` when validation-result assertions require maintenance
- `plan_revision`: `2`
- `last_validation_commit`: `413adb2915070b09dea06d5326271338c5cf3113`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `9c82097`
- `review_commit`: `413adb2`
- `review_verdict`: `PASS`
- `unfixed_findings`: `none`
- `revalidation_evidence`: `Round 1 confirmed the approved local caller contracts at review commit 413adb2. RoleBuilderPage owns the role and ability catalogs, calls validateRoleDraft locally, and supplies the debounced local NameStatus. BasicInfoStep has no HTTP or repository fallback. The code graph and exact source search found no production importer of src/api/. The remaining importers are src/api/abilities.ts, src/api/roles.ts, their three API suites, src/test/routes.test.tsx, and src/test/integration/phase_05a_smoke.test.tsx. Feature 3 already owns every deletion or rewrite, so no prerequisite, order, split, merge, or delay changed.`
- `verification_assets`:
  - Plan: `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-plan.md`
  - Selection delta: `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-delta.md`
  - Implementation record: `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-implementation.md`
  - Approved review record: `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-review.md`
  - Verified Feature 1 contract: `validateRoleDraft`, `hasRoleNameCollision`, `RoleValidationResult`, and `AbilityValidationInput` in `yourwolf-frontend/src/domain/roleValidation.ts`
  - Verified data-loading contract: `RoleBuilderPage` owns the existing `useRoles()` result and passes its loaded role array into `useNameCheck`; `BasicInfoStep` performs no repository read
  - Verified readiness contract: local validation runs only when both `useRoles()` and `useAbilities()` report `loading: false` and `error: null`
  - Existing focused suites: `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`, and `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`
  - Existing consumer regressions: `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` and `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx`
  - Root gate focused JUnit: `dev/feature/test-results/PHASE_05B-02-builder-gate-focused-frontend.xml` — 56 passed, 0 failed
  - Root gate consumer JUnit: `dev/feature/test-results/PHASE_05B-02-builder-gate-consumer-frontend.xml` — 34 passed, 0 failed
  - Root gate oracle JUnit: `dev/feature/test-results/PHASE_05B-02-builder-gate-oracle-frontend.xml` — 23 passed, 0 failed
  - Root gate full JUnit: `dev/feature/test-results/PHASE_05B-02-builder-gate-full-frontend.xml` — 741 passed, 0 failed
  - Root gate coverage JUnit: `dev/feature/test-results/PHASE_05B-02-builder-gate-coverage-frontend.xml` — 741 passed, 0 failed; 92.69 percent lines/statements, 92.79 percent branches, 94.16 percent functions
  - Root static gates: `npm run lint` and `npm run build` exited 0
  - Frontend full-suite, coverage, lint, and build commands from `## Environment State`

### 03-http-removal-offline-verification

- `status`: `complete`
- `execution_order`: `3`
- `prerequisites`: `[01-domain-role-validation, 02-builder-name-check-rewiring]`
- `expected_read_set`:
  - `dev/feature/01-domain-role-validation/01-domain-role-validation-implementation.md`
  - `dev/feature/01-domain-role-validation/01-domain-role-validation-review.md`
  - `yourwolf-frontend/src/domain/roleValidation.ts`
  - `yourwolf-frontend/src/test/domain/roleValidation.test.ts`
  - `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-implementation.md`
  - `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-review.md`
  - `yourwolf-frontend/src/pages/RoleBuilder.tsx`
  - `yourwolf-frontend/src/hooks/useNameCheck.ts`
  - `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`
  - `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`
  - `yourwolf-frontend/src/api/`
  - `yourwolf-frontend/src/test/api/`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx`
  - `yourwolf-frontend/package.json`
  - `yourwolf-frontend/package-lock.json`
  - `yourwolf-frontend/.env.example`
  - `yourwolf-frontend/README.md`
  - `yourwolf-frontend/src/vite-env.d.ts`
  - `yourwolf-frontend/src/types/transport.ts`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
- `expected_write_set`:
  - Delete `yourwolf-frontend/src/api/client.ts`
  - Delete `yourwolf-frontend/src/api/roles.ts`
  - Delete `yourwolf-frontend/src/api/abilities.ts`
  - Delete `yourwolf-frontend/src/api/errors.ts`
  - Delete `yourwolf-frontend/src/test/api/abilities.api.test.ts`
  - Delete `yourwolf-frontend/src/test/api/errors.api.test.ts`
  - Delete `yourwolf-frontend/src/test/api/roles.api.test.ts`
  - `yourwolf-frontend/package.json`
  - `yourwolf-frontend/package-lock.json`
  - `yourwolf-frontend/src/test/setup.ts`
  - `yourwolf-frontend/src/test/routes.test.tsx`
  - `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`
  - `yourwolf-frontend/src/test/test_utils.tsx` with helper symbol `installNoNetworkGuard`
  - `yourwolf-frontend/.env.example`
  - `yourwolf-frontend/README.md`
  - `yourwolf-frontend/src/vite-env.d.ts`
  - `yourwolf-frontend/src/types/transport.ts`
  - `yourwolf-frontend/src/domain/roleDraft.ts`
  - `docs/phases/PHASE_05B/PHASE_05B_QA.md`
- `plan_revision`: `2`
- `last_validation_commit`: `a2ddaf897908ddb0d5097acfe0faaa8fd2f07c3e`
- `stale_reason`: `none`
- `resolved_model_status`: `unverified`
- `implementation_result`: `complete`
- `implementation_commit`: `379f510`
- `review_commit`: `a2ddaf8`
- `review_verdict`: `PASS`
- `unfixed_findings`: `none`
- `revalidation_evidence`: `Round 1 of 5 confirmed the approved final feature at review commit a2ddaf8. No future features or downstream dependents remain, so no manifest entry became stale and no prerequisite edge, execution-order position, split, merge, or delay changed. The graph settled in round 1 with an empty stale set. All three features are complete, the aggregate review state is APPROVED/PASS with no unfixed findings, and the phase feature loop is complete.`
- `verification_assets`:
  - Plan: `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-plan.md`
  - Selection delta: `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-delta.md`
  - Existing builder zero-network host suite: `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
  - Existing integration suite: `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`
  - Shared test utility location for the fetch/XMLHttpRequest guard: `yourwolf-frontend/src/test/test_utils.tsx`; helper symbol `installNoNetworkGuard`
  - Required manual checklist: `docs/phases/PHASE_05B/PHASE_05B_QA.md`
  - Focused zero-network command from `yourwolf-frontend`: `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/integration/phase_05a_smoke.test.tsx`
  - Lockfile cleanup command from `yourwolf-frontend`: `npm uninstall axios`
  - Source absence and unchanged-scope commands recorded in the selection delta
  - Root gate focused zero-network JUnit: `dev/feature/test-results/PHASE_05B-03-gate-focused-zero-network-frontend.xml` — 20 passed, 0 failed
  - Root gate affected-retained JUnit: `dev/feature/test-results/PHASE_05B-03-gate-affected-retained-frontend.xml` — 122 passed, 0 failed
  - Root gate full frontend JUnit: `dev/feature/test-results/PHASE_05B-final-frontend.xml` — 713 passed, 0 failed
  - Root gate frontend coverage JUnit: `dev/feature/test-results/PHASE_05B-final-coverage-frontend.xml` — 713 passed, 0 failed; 92.98 percent lines/statements, 92.82 percent branches, and 94.27 percent functions
  - Root gate full backend JUnit: `dev/feature/test-results/PHASE_05B-final-backend.xml` — 503 passed, 0 failed; 96.04 percent coverage
  - Root static gates: `npm run lint`, `npm run build`, dependency dry-run and absence, source absence, phase-baseline protected scope, root README preservation, and `git diff --check` exited 0
  - Root launch gate: Vite preview reported ready at `127.0.0.1:4173`, curl exited 0, and the preview was intentionally stopped
  - Manual QA: `qa: skipped (user choice)`; `docs/phases/PHASE_05B/PHASE_05B_QA.md` exists with all manual rows pending
  - Frontend full-suite, coverage, lint, and build commands from `## Environment State`
  - Backend baseline artifact proves the unchanged backend starts this phase green

## Expected Artifacts

| Feature | Plan | Selection Delta | Implementation Record | Review Record |
|---|---|---|---|---|
| `01-domain-role-validation` | `dev/feature/01-domain-role-validation/01-domain-role-validation-plan.md` | `dev/feature/01-domain-role-validation/01-domain-role-validation-delta.md` | `dev/feature/01-domain-role-validation/01-domain-role-validation-implementation.md` | `dev/feature/01-domain-role-validation/01-domain-role-validation-review.md` |
| `02-builder-name-check-rewiring` | `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-plan.md` | `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-delta.md` | `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-implementation.md` | `dev/feature/02-builder-name-check-rewiring/02-builder-name-check-rewiring-review.md` |
| `03-http-removal-offline-verification` | `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-plan.md` | `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-delta.md` | `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-implementation.md` | `dev/feature/03-http-removal-offline-verification/03-http-removal-offline-verification-review.md` |

Initial mode creates only the three plan files and this manifest. Deltas, implementation records, and review records are future pipeline outputs.

## Durable Checkpoints

1. Select and validate one eligible feature against its `last_validation_commit`.
2. Complete its implementation and approved review before marking it complete.
3. Revalidate every affected future feature and downstream prerequisite edge.
4. Update this manifest after selection, completion, model-route resolution, and graph stabilization.
5. After Feature 3, require the combined offline proof, all automated gates, and the pending manual QA document before phase handoff.

## Verification Assets

- Baseline backend JUnit: `dev/feature/test-results/PHASE_05B-baseline-backend.xml` — 503 passed, 0 failed.
- Baseline frontend JUnit: `dev/feature/test-results/PHASE_05B-baseline-frontend.xml` — 715 passed, 0 failed.
- Feature 1 completion gates: `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-focused-frontend.xml` — 23 passed; `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-full-frontend.xml` — 738 passed; `dev/feature/test-results/PHASE_05B-01-domain-role-validation-gate-coverage-frontend.xml` — 738 passed with 92.38 percent lines/statements, 92.58 percent branches, and 94.18 percent functions. Lint and build exited 0.
- Feature 2 completion gates: `dev/feature/test-results/PHASE_05B-02-builder-gate-focused-frontend.xml` — 56 passed; `dev/feature/test-results/PHASE_05B-02-builder-gate-consumer-frontend.xml` — 34 passed; `dev/feature/test-results/PHASE_05B-02-builder-gate-oracle-frontend.xml` — 23 passed; `dev/feature/test-results/PHASE_05B-02-builder-gate-full-frontend.xml` — 741 passed; `dev/feature/test-results/PHASE_05B-02-builder-gate-coverage-frontend.xml` — 741 passed with 92.69 percent lines/statements, 92.79 percent branches, and 94.16 percent functions. Lint and build exited 0.
- Feature 3 completion gates: `dev/feature/test-results/PHASE_05B-03-gate-focused-zero-network-frontend.xml` — 20 passed; `dev/feature/test-results/PHASE_05B-03-gate-affected-retained-frontend.xml` — 122 passed; `dev/feature/test-results/PHASE_05B-final-frontend.xml` — 713 passed; `dev/feature/test-results/PHASE_05B-final-coverage-frontend.xml` — 713 passed with 92.98 percent lines/statements, 92.82 percent branches, and 94.27 percent functions; `dev/feature/test-results/PHASE_05B-final-backend.xml` — 503 passed with 96.04 percent coverage. Lint, build, dependency, source-absence, protected-scope, root-README, diff, and preview launch gates passed.
- Backend rule sources: `yourwolf-backend/app/services/role_validation.py`, `yourwolf-backend/tests/test_role_validation.py`, and `yourwolf-backend/tests/test_role_validation_module.py`.
- Existing frontend focused suites: `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx`, `yourwolf-frontend/src/test/routes.test.tsx`, and `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`.
- Phase oracle suite: `yourwolf-frontend/src/test/domain/roleValidation.test.ts`.
- Phase integration suites: `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` and `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`, both using `installNoNetworkGuard`.
- Manual acceptance asset: `docs/phases/PHASE_05B/PHASE_05B_QA.md`, created by Feature 3 with all rows pending. `qa: skipped (user choice)`.
- Global gates: frontend full tests, coverage, lint, and build; backend baseline retained; source absence and unchanged-scope checks from Feature 3.
