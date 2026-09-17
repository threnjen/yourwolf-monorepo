# 02 Builder and Name Check Rewiring Selection Delta

## Key Files

| File | Verified symbols or role | Selection effect |
|---|---|---|
| `yourwolf-frontend/src/domain/roleValidation.ts` | `validateRoleDraft`, `hasRoleNameCollision`, `RoleValidationResult`, `AbilityValidationInput` | Consume the completed Feature 1 contract. Do not recreate validation or name normalization in the page or hook. |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `RoleBuilderPage`; page-local `hasRoleNameCollision`; `useRoles`; `rolesApi.validate`; 1000 ms validation debounce; save gate and pre-write collision recheck | Replace server validation and the duplicate page helper with Feature 1 exports. Add `useAbilities` for the validation catalog. Keep preview and persistence behavior. |
| `yourwolf-frontend/src/hooks/useNameCheck.ts` | `useNameCheck`; `NameStatus`; 500 ms debounce; request-id invalidation | Replace `rolesApi.checkName` with `hasRoleNameCollision` over the role array already loaded by the page. Preserve status timing and cleanup. |
| `yourwolf-frontend/src/hooks/useRoles.ts` | `useRoles` returns `{roles, loading, error, refetch}` from one repository-backed list read | The page owns this result. Pass `roles` to `useNameCheck`; do not call `useRoles` again in the hook or step. |
| `yourwolf-frontend/src/hooks/useAbilities.ts` | `useAbilities` returns `{abilities, loading, error}` from the local repository | Supply the active ability catalog to `validateRoleDraft`. Treat success as `loading === false && error === null`. |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `BasicInfoStep`; optional `nameStatus`; fallback `useNameCheck` call | Remove the fallback hook call. Require the supplied status and keep the input-local display state. |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Supplies `nameStatus` to `BasicInfoStep`; disables save unless validation is valid and status is `available` | Read-only regression anchor. Its existing contract already supplies the page-owned status. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Server validation mocks, debounce cases, preview cases, save and collision cases | Rewrite for local validation, readiness transitions, collision precedence, and the existing save gates. |
| `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | Server request, debounce, result, and stale-response cases | Rewrite against supplied local roles. Keep timer, rapid-change, disable, and cleanup coverage without API mocks. |
| `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | Direct renders currently exercise the fallback server hook | Remove API mocks and pass explicit `NameStatus` values. Keep field interaction coverage. |
| `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` | Existing name-status and save-button assertions | Read-only regression anchor. No selected contract requires a source or test change. |
| `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` | Existing validation-result rendering assertions | Read-only regression anchor. Structural result compatibility requires no test change. |

## Current Constraints

- Keep the 1000 ms `RoleBuilderPage` validation debounce and the 500 ms `useNameCheck` debounce.
- Keep local preview generation independent of catalog readiness.
- Treat roles as ready only when `useRoles()` reports `loading: false` and `error: null`.
- Treat abilities as ready only when `useAbilities()` reports `loading: false` and `error: null`.
- Run draft validation only after both inputs are ready. When aggregate readiness first becomes true, validate the latest draft rather than an earlier captured edit.
- Keep short, whitespace-only, disabled, and not-ready names at `idle`. A checkable ready name enters `checking`, then settles after 500 ms.
- Use the one role array already owned by `RoleBuilderPage`. `useNameCheck` and `BasicInfoStep` must not call `useRoles`, `useRepositories`, or a repository directly.
- Compose the local collision into the domain result at the backend name-rule position: a lower- or upper-bound name error suppresses `Name is already taken`; otherwise collision is the first error, followed by the remaining domain errors. Preserve all domain warnings.
- Keep all three save defenses: the Wizard button gate, the repeated `handleSave` validity/status gate, and the repository list collision recheck immediately before `put`.
- Do not delete the API layer, Axios, transport types, request guards, or environment references. Feature 3 owns those changes.
- Do not change the backend, `src/engine/`, repositories, ability records, seed data, or role persistence.
- Add no normal-path logs. The hook and validator are synchronous local computation after their timers settle.
- Apply the Phase 05b learning: the page owns name status, and `BasicInfoStep` performs no second role-list read.

## Verification Assets

- Focused selected-feature command from `yourwolf-frontend`: `npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`.
- Consumer regression command from `yourwolf-frontend`: `npm test -- --run src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx`.
- Feature 1 oracle command from `yourwolf-frontend`: `npm test -- --run src/test/domain/roleValidation.test.ts`.
- Full gates from `yourwolf-frontend`: `npm test -- --run`, `npm run test:coverage`, `npm run lint`, and `npm run build`.
- Current baseline after Feature 1 review: 738 frontend tests passed. Coverage was 92.38 percent lines/statements, 92.58 percent branches, and 94.18 percent functions.
- Source inspection checks: no `rolesApi.validate` call remains in `RoleBuilder.tsx`; no `rolesApi` import remains in `useNameCheck.ts`; no `useNameCheck` import remains in `BasicInfoStep.tsx`; only `RoleBuilderPage` owns `useRoles()` for this flow.

## Discoveries

| Finding | Evidence | Impact | Action |
|---|---|---|---|
| Feature 1 resolved the proposed module and public contracts. | `roleValidation.ts` exports `validateRoleDraft`, `hasRoleNameCollision`, `RoleValidationResult`, and `AbilityValidationInput`; its approved review reports 23 focused tests. | The plan's `[PROPOSED - name TBD]` reference is stale. | Patch the selected plan to the verified path and exports. Increment the plan revision to 2. |
| `RoleBuilderPage` already owns the complete local role list and readiness state. | `RoleBuilder.tsx` calls `useRoles()` once and derives `localRolesReady` from `loading` and `error`. | The hook does not need a repository dependency. A second read would duplicate the same data and create readiness drift. | Pass the page-owned roles into `useNameCheck`. Keep `BasicInfoStep` presentational. |
| The ability hook exposes the exact readiness and catalog values needed by Feature 1. | `useAbilities()` returns `Ability[]`, `loading`, and `error`; `Ability` structurally contains `type` and `is_active`. | No adapter or new catalog shape is required. | Add one page-level `useAbilities()` call and pass the returned array to `validateRoleDraft` only after successful load. |
| The current page hides other domain errors when a collision exists. | `RoleBuilderPage` returns early on collision and sets only `Name is already taken`. | This contradicts the phase requirement to combine collision and domain results. | Build one result that preserves warnings and all non-name domain errors while inserting collision after the name-bound branch. |
| The page and hook have separate debounce responsibilities. | `RoleBuilderPage` uses 1000 ms for validation and preview. `useNameCheck` uses 500 ms for availability. | Merging the timers would change visible behavior and weaken focused tests. | Preserve both durations and latest-input cleanup independently. |
| `BasicInfoStep` is the only extra production caller of `useNameCheck`. | Code graph callers are `RoleBuilderPage`, `BasicInfoStep`, and tests. `Wizard` already supplies `nameStatus`. | Removing the fallback eliminates the duplicate data-loading path without changing the production render chain. | Make the supplied status mandatory at the step boundary and rewrite direct step tests with explicit statuses. |
| Wizard and review-step contracts already match the selected output. | `Wizard` accepts `ValidationResult` and `NameStatus`; `RoleValidationResult` is structurally compatible. `Wizard` always passes status to the step. | Their source and tests do not need maintenance for this feature. | Keep both suites as read-only regression gates. |

## Exact Expected Write Set

- `yourwolf-frontend/src/pages/RoleBuilder.tsx`
- `yourwolf-frontend/src/hooks/useNameCheck.ts`
- `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`
- `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`
- `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`
- `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`

`yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx`, `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx`, and `yourwolf-frontend/src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` are verification-only for this selection.

## Plan Patch

Plan revision 2 replaces the stale Feature 1 `[PROPOSED - name TBD]` reference with the verified `roleValidation.ts` path and exports. No acceptance criterion, stage, or scope boundary changed.

## Selection Result

- Validation commit: `8bbe2b5c00b2e7d3c99051f7e8d681c204ecee50`
- Status: Ready for implementation
- Prerequisite: `01-domain-role-validation` is complete and approved
- Readiness: Ready. The selected implementation can consume the page-owned local role list without a second repository read in `BasicInfoStep`.
