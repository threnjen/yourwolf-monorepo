# 02 Builder and Name Check Rewiring

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** `RoleBuilderPage` uses Feature 1's pure validator instead of `rolesApi.validate` while preserving the current 1000 ms draft-validation debounce and local preview behavior.
- **AC2:** Builder validation waits until both `useRoles` and `useAbilities` have loaded successfully. An early edit never reports all steps as invalid because the catalog is unavailable.
- **AC3:** The builder combines domain errors with `hasRoleNameCollision` results into the existing `ValidationResult`-compatible state. A trimmed name shorter than two characters suppresses `Name is already taken`.
- **AC4:** The builder shows the exact domain errors and warnings, including the visible trimmed 51-character error, and never uses the `Validation service unavailable` fallback.
- **AC5:** `useNameCheck` derives its existing `NameStatus` contract—`idle`, `checking`, `available`, `taken`—from the loaded local role list. Comparison remains trimmed and case-insensitive across official and private local roles.
- **AC6:** `useNameCheck` preserves debounce behavior and stale-update protection needed for rapid input changes without issuing a server request.
- **AC7:** `BasicInfoStep` stops calling `useNameCheck` as a fallback. Its production caller supplies `nameStatus`, and its tests pass explicit status values.
- **AC8:** Save remains gated on `validation.is_valid === true` and `nameStatus === 'available'`, and the pre-write repository collision recheck remains intact.
- **AC9:** Existing builder, hook, step, Wizard, review-step, and save-path tests are updated or extended to pin the local behavior. No test hides a missing catalog-ready gate or changes the name indicator contract.

### Non-Goals

- Do not delete `src/api/`, Axios, API tests, request guards, environment references, or transport types in this feature.
- Do not change backend code, `src/engine/`, ability records, repositories, seed data, or role persistence.
- Do not add role editing, deletion UI, or exclude-own-id behavior.
- Do not change debounce durations solely for test convenience.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC4, AC8 | `yourwolf-frontend/src/pages/RoleBuilder.tsx`, `yourwolf-frontend/src/hooks/useRoles.ts`, `yourwolf-frontend/src/hooks/useAbilities.ts`, `yourwolf-frontend/src/domain/roleValidation.ts` (`validateRoleDraft`, `hasRoleNameCollision`, `RoleValidationResult`, `AbilityValidationInput`) | Existing test to update; must-have automated test |
| AC5-AC6 | `yourwolf-frontend/src/hooks/useNameCheck.ts`, `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | Existing test to update; must-have automated test |
| AC7 | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | Existing test to update |
| AC8-AC9 | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` | Existing test to update; must-have automated test |

## B. Correctness & Edge Cases

- Do not validate against an empty catalog while abilities are loading or failed.
- Do not report a name as available before local roles are ready.
- Preserve `idle` for blank, whitespace-only, one-character, disabled, or not-ready inputs.
- Preserve `checking` during the debounce and settle to the newest name only after rapid changes.
- A private custom role collision is `taken`, even though the retained backend endpoint checks only public and official roles.
- A length error wins over collision reporting. Other domain errors and warnings remain visible in their specified order.
- Keep preview generation independent of validation readiness so local narration continues to update.
- Keep the final repository collision check before `put` to defend against state changes between display validation and save.
- Cancel pending timers on unmount. Ignore stale debounced work after a newer draft or name arrives.

## C. Consistency & Architecture Fit

- Consume Feature 1's pure exports. Do not recreate validation or normalization inside the page or hook.
- Use the existing `useRoles`, `useAbilities`, `useRepositories`, `ValidationResult`, and `NameStatus` contracts.
- Preserve the current dependency direction: pages and hooks may consume domain and repository-backed hooks; domain never imports UI or transport layers.
- Keep `Wizard` and `BasicInfoStep` presentational. The page owns loaded data and name status.
- No architectural deviation is planned. The two documented frontend/backend divergences remain deliberate.

## D. Clean Design & Maintainability

- Remove server-validation state and error handling only where the local path replaces it. Feature 3 owns transport deletion.
- Keep one source for collision normalization and one source for validation messages.
- Avoid introducing a second role-list read inside `BasicInfoStep`.
- Keep it clean: existing hooks, existing debounce responsibilities, and no new state library or adapter.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. UI status, validation results, and existing error rendering provide the relevant operator signal.
- **Security:** Treat repository data as local input and recheck collisions immediately before persistence. Do not weaken the save gate.
- **Runbook:** Run focused page, hook, and step suites, then frontend lint, build, and full coverage. Roll back the caller rewiring as one unit while leaving Feature 1 inert and reusable.

## F. Test Plan

- AC1-AC4: update `RoleBuilder.test.tsx` to use repository-backed roles and abilities, fake timers, literal validation outputs, and readiness transitions.
- AC5-AC6: replace server-mock cases in `useNameCheck.test.ts` with local list cases for blank, short, available, official collision, private collision, trim/case handling, debounce, stale changes, disabled state, and unmount cleanup.
- AC7: remove API mocks from `BasicInfoStep.test.tsx` and pass each relevant `NameStatus` explicitly.
- AC8-AC9: retain and strengthen save-gate, collision recheck, Wizard rendering, and review-step behavior.
- Test impact note: `RoleBuilder.test.tsx`, `useNameCheck.test.ts`, and `BasicInfoStep.test.tsx` require behavior-aware rewrites. `Wizard.test.tsx` and `ReviewStep.test.tsx` remain regression anchors and must change only when the supplied status/result contract requires it. Feature 3 later removes remaining transport mocks and adds the no-network integration proof.
- High-value checks:
  1. Given roles ready but abilities still loading, when the draft changes, then no invalid-ability result appears.
  2. Given a 51-character trimmed name, when the debounce settles, then the upper-bound error is visible.
  3. Given a one-character name matching a local role after normalization, when validation settles, then only the length error appears.
  4. Given a case-variant private-role name, when the name debounce settles, then the indicator becomes `Taken ✗`.
  5. Given rapid name and draft changes, when timers settle, then only the newest validation and name status update the UI.
- Reuse repository test helpers where a provider is required. Use fake timers for both documented debounce intervals.
- Stage 0 is not required. The baseline frontend suite has 715 passing tests, and existing focused suites cover all changed consumers.

## Stage 1: Local Validation Rewire
**Goal**: Replace server validation with the Feature 1 domain result while preserving preview, readiness, precedence, and save behavior.
**Success Criteria**: AC1-AC4 and AC8 pass.
**Status**: Not Started

## Stage 2: Local Name Status Ownership
**Goal**: Derive name status from local roles and make the page the single production owner of that status.
**Success Criteria**: AC5-AC7 pass.
**Status**: Not Started

## Stage 3: Consumer Regression Gate
**Goal**: Update affected tests without weakening debounce, stale-result, readiness, or save-path assertions.
**Success Criteria**: AC9 passes, followed by frontend lint, build, and full coverage.
**Status**: Not Started
