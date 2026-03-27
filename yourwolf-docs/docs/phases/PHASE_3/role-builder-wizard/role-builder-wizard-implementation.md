# Implementation Record: Role Builder Wizard

## Summary
Implemented a full 4-step role creation wizard (Basic Info → Abilities → Win Conditions → Review) for the yourwolf-frontend application. The feature includes new TypeScript types, API client methods, a custom hook, a wizard shell, four step components, a page component, routing, and a sidebar navigation link — all with complete test coverage.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Types for RoleDraft, ValidationResult, NameCheckResult, Ability | Done | `src/types/role.ts` | Extended RoleDraft with created_at/updated_at |
| AC2 | API methods: validate, checkName, create | Done | `src/api/roles.ts` | + draftToPayload helper |
| AC3 | Abilities API client | Done | `src/api/abilities.ts` | GET /abilities/ |
| AC4 | useAbilities hook | Done | `src/hooks/useAbilities.ts` | Follows useRoles pattern |
| AC5 | /roles/new route | Done | `src/routes.tsx` | Before /roles to avoid conflicts |
| AC6 | RoleBuilderPage with draft state + validation debounce + save | Done | `src/pages/RoleBuilder.tsx` | 1000ms validation debounce via useRef |
| AC7 | Wizard shell (4 steps, step indicator, nav buttons) | Done | `src/components/RoleBuilder/Wizard.tsx` | canProceed: name ≥ 2 chars for step 1 |
| AC8 | BasicInfoStep (name + debounced check, team, description, wake_order, votes) | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Local name state for debounce correctness |
| AC9 | AbilitiesStep (category palette, add/remove/reorder/modifier) | Done | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | ABILITY_CATEGORIES hardcoded on frontend |
| AC10 | WinConditionsStep (add/remove/primary toggle/type change) | Done | `src/components/RoleBuilder/steps/WinConditionsStep.tsx` | |
| AC11 | ReviewStep (summary + validation display) | Done | `src/components/RoleBuilder/steps/ReviewStep.tsx` | null→validating, errors red, warnings yellow, valid green |
| AC12 | Mock factories for testing | Done | `src/test/mocks.ts` | createMockAbility, createMockDraft |
| AC13 | Sidebar navigation link to /roles/new | Done | `src/components/Sidebar.tsx` | ✏️ New Role link added |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/types/role.ts` | Modified | Added `created_at`, `updated_at` to `RoleDraft`; added `ValidationResult`, `NameCheckResult`, `Ability` interfaces | AC1: new types needed for wizard |
| `src/api/roles.ts` | Modified | Added `validate()`, `checkName()`, `create()` methods + `draftToPayload()` helper | AC2: API integration |
| `src/api/abilities.ts` | Created | `abilitiesApi.list()` — GET /abilities/ | AC3 |
| `src/hooks/useAbilities.ts` | Created | Hook returning `{abilities, loading, error}` | AC4 |
| `src/routes.tsx` | Modified | Added `/roles/new` route (before `/roles`) | AC5 |
| `src/pages/RoleBuilder.tsx` | Created | Page managing RoleDraft state, validation debounce, handleSave + navigate | AC6 |
| `src/components/RoleBuilder/Wizard.tsx` | Created | 4-step wizard shell with step indicator and navigation | AC7 |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Created | Name (local state debounce), team selector, description, wake_order, votes | AC8 |
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Created | Category tabs, ability palette, step list with reorder/remove/modifier | AC9 |
| `src/components/RoleBuilder/steps/WinConditionsStep.tsx` | Created | Add/remove/primary toggle/type dropdown | AC10 |
| `src/components/RoleBuilder/steps/ReviewStep.tsx` | Created | Summary + validation display | AC11 |
| `src/components/Sidebar.tsx` | Modified | Added `✏️ New Role` nav item linking to `/roles/new` | AC13 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/mocks.ts` | Modified | Added `createMockAbility()`, `createMockDraft()` factories | AC12 |
| `src/test/roles.api.test.ts` | Modified | Added tests for `validate`, `checkName`, `create` | AC2 |
| `src/test/routes.test.tsx` | Modified | Added `/roles/new` route test | AC5 |
| `src/test/useDrafts.test.ts` | Modified | Added `created_at`/`updated_at` to `makeDraft` (broke when RoleDraft extended) | AC1 regression fix |
| `src/test/useRoles.test.ts` | Modified | Changed cast to `as unknown as` (broke when rolesApi gained 3 new methods) | AC2 regression fix |
| `src/test/Sidebar.test.tsx` | Modified | Tightened Roles link matcher; added New Role link test | AC13 |
| `src/test/abilities.api.test.ts` | Created | 2 tests for abilitiesApi.list | AC3 |
| `src/test/useAbilities.test.ts` | Created | 5 tests for useAbilities hook | AC4 |
| `src/test/Wizard.test.tsx` | Created | 13 tests: initial render, navigation, step indicator, save, saving state | AC7 |
| `src/test/RoleBuilder.test.tsx` | Created | 5 tests: rendering, create flow, error state | AC6 |
| `src/test/BasicInfoStep.test.tsx` | Created | 14 tests: rendering, name debounce, name check status, team, other fields | AC8 |
| `src/test/AbilitiesStep.test.tsx` | Created | 11 tests: categories, add/remove/reorder, modifier lock | AC9 |
| `src/test/WinConditionsStep.test.tsx` | Created | 7 tests: add/remove/primary toggle/type change | AC10 |
| `src/test/ReviewStep.test.tsx` | Created | 14 tests: summary sections, ability steps, win conditions, validation display | AC11 |

## Test Results
- **Baseline**: 211 passed, 0 failed (before implementation)
- **Final**: 290 passed, 0 failed (after implementation)
- **New tests added**: 79
- **Regressions**: None

## Deviations from Plan
- **BasicInfoStep debounce**: Used `localName` local state (initialized from `draft.name`) rather than watching `draft.name` directly. This is necessary because mocked `onChange` in tests doesn't trigger a re-render with new props, so watching the prop directly breaks the debounce in tests. The behavior is identical from the user's perspective.
- **ABILITY_CATEGORIES**: Hardcoded on the frontend as a constant rather than derived from the API. The plan implied using the fetched abilities list but did not explicitly specify category grouping logic from the API. Hardcoded grouping matches the known ability types in the backend seed data.

## Gaps
None — all AC items implemented and tested.

## Reviewer Focus Areas
- **`BasicInfoStep.tsx:90–117`** — `useEffect` debounce uses `localName` (local state) instead of `draft.name` (prop); verify the two-state approach doesn't cause stale closure or sync issues in production
- **`Wizard.tsx` canProceed logic** — Only validates step `'basic'` (requires name ≥ 2 chars); abilities/win conditions/review always return `true`; confirm this matches intended UX
- **`draftToPayload` in `roles.ts`** — Maps `RoleDraft` → POST body; verify field mapping matches backend schema exactly
- **`/roles/new` route ordering in `routes.tsx`** — Must remain before any future `/roles/:id` dynamic route to avoid shadowing
- **`ReviewStep` validation display** — Check that `null` prop (validating) vs `ValidationResult` states render correctly at the boundary between steps
