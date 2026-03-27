# Role Builder Wizard — Task Checklist

> Work items ordered by stage. Each item should be completed and tested before moving on.

---

## Stage 0: Test Prerequisites

- [ ] **0.1** Confirm vitest runs: `npm test`
- [ ] **0.2** Confirm test setup in `src/test/setup.ts` mocks axios
- [ ] **0.3** Confirm `src/test/mocks.ts` pattern — will extend with new factories

---

## Stage 1: Types & API Client

- [ ] **1.1** In `src/types/role.ts`, add `Ability` interface:
  - `id: string`, `type: string`, `name: string`, `description: string`
  - `parameters_schema: Record<string, unknown>`, `is_active: boolean`
- [ ] **1.2** In `src/types/role.ts`, add `AbilityStepDraft` interface:
  - `ability_type: string`, `ability_name: string`, `order: number`
  - `modifier: StepModifier`, `is_required: boolean`
  - `parameters: Record<string, unknown>`
  - `condition_type?: string`, `condition_params?: Record<string, unknown>`
- [ ] **1.3** In `src/types/role.ts`, add `WinConditionDraft` interface:
  - `condition_type: string`, `condition_params?: Record<string, unknown>`
  - `is_primary: boolean`, `overrides_team: boolean`
- [ ] **1.4** In `src/types/role.ts`, add `RoleDraft` interface:
  - `id: string` (local UUID), `name: string`, `description: string`
  - `team: Team`, `wake_order: number | null`, `wake_target: string | null`
  - `votes: number`, `ability_steps: AbilityStepDraft[]`
  - `win_conditions: WinConditionDraft[]`
  - `created_at: string`, `updated_at: string`
- [ ] **1.5** In `src/types/role.ts`, add `ValidationResult` interface:
  - `is_valid: boolean`, `errors: string[]`, `warnings: string[]`
- [ ] **1.6** In `src/types/role.ts`, add `NameCheckResult` interface:
  - `name: string`, `is_available: boolean`, `message: string`
- [ ] **1.7** Create `src/api/abilities.ts`:
  - Import `apiClient` and `Ability` type
  - Export `abilitiesApi.list()` — `GET /abilities/`, returns `Promise<Ability[]>`
- [ ] **1.8** In `src/api/roles.ts`, add to `rolesApi`:
  - `validate(draft: RoleDraft): Promise<ValidationResult>` — POST `/roles/validate` with draft mapped to `RoleCreate` shape
  - `checkName(name: string): Promise<NameCheckResult>` — GET `/roles/check-name?name=...`
  - `create(draft: RoleDraft): Promise<Role>` — POST `/roles/` with draft mapped to `RoleCreate` shape
- [ ] **1.9** In `src/test/mocks.ts`, add `createMockAbility()` factory
- [ ] **1.10** In `src/test/mocks.ts`, add `createMockDraft()` factory
- [ ] **1.11** Write `src/test/abilities.api.test.ts` following `roles.api.test.ts` pattern
- [ ] **1.12** Run tests — all compile, no regressions

---

## Stage 2: useAbilities Hook

- [ ] **2.1** Create `src/hooks/useAbilities.ts` following `useRoles.ts` pattern:
  - `useState` for `abilities`, `loading`, `error`
  - `useCallback` for `fetchAbilities`
  - `useEffect` to fetch on mount
  - Returns `{ abilities, loading, error }`
- [ ] **2.2** Write `src/test/useAbilities.test.ts`:
  - Starts loading
  - Returns abilities after fetch
  - Handles fetch error
- [ ] **2.3** Run tests — pass

---

## Stage 3: Wizard Shell & Routing

- [ ] **3.1** Create `src/components/RoleBuilder/Wizard.tsx`:
  - Props: `draft: RoleDraft`, `validation: ValidationResult | null`, `onChange: (draft: RoleDraft) => void`, `onSave: () => void`, `saving: boolean`
  - State: `currentStep` — `'basic' | 'abilities' | 'win' | 'review'`
  - Step indicator bar showing all 4 step labels with active highlighting
  - Navigation buttons: "Back" (disabled on step 1), "Next" (disabled when step invalid), "Create Role" (on review step only)
  - `canProceed()` logic: step `basic` requires `draft.name.length >= 2`; others always true
  - Conditionally renders the step component for `currentStep`
- [ ] **3.2** Create `src/pages/RoleBuilder.tsx`:
  - State: `currentDraft: RoleDraft`, `validation: ValidationResult | null`, `saving: boolean`
  - On mount: initialize empty draft (helper `createEmptyDraft()`)
  - On draft change: debounce 1000ms, call `rolesApi.validate(draft)`, set validation
  - `handleSave()`: call `rolesApi.create(draft)`, navigate to `/roles/${role.id}` on success
  - Render `Wizard` with state/handlers
- [ ] **3.3** In `src/routes.tsx`, add route: `/roles/new` → `RoleBuilderPage`
  - Import `RoleBuilderPage` from `../pages/RoleBuilder`
  - Place BEFORE any future `/roles/:id` route
- [ ] **3.4** Write `src/test/Wizard.test.tsx`:
  - Shows basic info step first
  - Next disabled without name
  - Next enabled with name >= 2 chars
  - Advances through all 4 steps
  - Back navigation works
  - Create Role button on review step
- [ ] **3.5** Write `src/test/routes.test.tsx` update (or new test):
  - `/roles/new` renders RoleBuilder page
- [ ] **3.6** Run tests — pass

---

## Stage 4: Basic Info Step

- [ ] **4.1** Create `src/components/RoleBuilder/steps/BasicInfoStep.tsx`:
  - Props: `draft: RoleDraft`, `onChange: (draft: RoleDraft) => void`
  - Name input: text field, calls onChange on change
  - Name status: `useEffect` with 500ms debounce calling `rolesApi.checkName()`
  - Status indicator: "Checking..." / "Available ✓" / "Taken ✗"
  - Team selector: 5 buttons with team colors from `theme.colors`
  - Description: textarea
  - Wake order: number input, 0–20
  - Votes: number input, 0–10
- [ ] **4.2** Write `src/test/BasicInfoStep.test.tsx`:
  - Renders all input fields
  - Name change triggers onChange
  - Team button click triggers onChange with correct team
  - Name check shows status after debounce
- [ ] **4.3** Run tests — pass

---

## Stage 5: Abilities Step

- [ ] **5.1** Create `src/components/RoleBuilder/steps/AbilitiesStep.tsx`:
  - Props: `draft: RoleDraft`, `onChange: (draft: RoleDraft) => void`
  - Uses `useAbilities()` hook
  - Category tabs: hardcoded `ABILITY_CATEGORIES` array
  - Filtered ability list for current category
  - Click ability: append new `AbilityStepDraft` with auto-incremented order
  - Current steps list: each shows order, ability name, modifier dropdown, remove button, up/down buttons
  - First step modifier locked to `none`
  - Reorder: swap steps in array, recalculate all order numbers
  - Remove: filter out step, recalculate order numbers
- [ ] **5.2** Write `src/test/AbilitiesStep.test.tsx`:
  - Renders category tabs
  - Clicking ability adds step to draft
  - Remove button removes step
  - Reorder buttons swap steps correctly
  - First step modifier is always `none`
  - Loading state while abilities fetch
- [ ] **5.3** Run tests — pass

---

## Stage 6: Win Conditions Step

- [ ] **6.1** Create `src/components/RoleBuilder/steps/WinConditionsStep.tsx`:
  - Props: `draft: RoleDraft`, `onChange: (draft: RoleDraft) => void`
  - List of current win conditions
  - "Add Condition" button: adds default `{ condition_type: 'team_wins', is_primary: false, overrides_team: false }`
  - Each condition: type dropdown, is_primary checkbox, overrides_team checkbox, remove button
  - Primary toggle: setting one as primary unsets others
  - Condition types: `team_wins`, `special_win_dead`, `most_votes`, `no_votes` (displayed as human-readable labels)
- [ ] **6.2** Write `src/test/WinConditionsStep.test.tsx`:
  - Add condition increases list
  - Remove condition decreases list
  - Primary toggle sets one, unsets others
  - Condition type dropdown changes type
- [ ] **6.3** Run tests — pass

---

## Stage 7: Review Step & Submit

- [ ] **7.1** Create `src/components/RoleBuilder/steps/ReviewStep.tsx`:
  - Props: `draft: RoleDraft`, `validation: ValidationResult | null`
  - Displays all draft fields: name, team (with color), description, wake_order, votes
  - Lists ability steps: order, name, modifier
  - Lists win conditions: type, primary flag
  - Validation errors: red list items
  - Validation warnings: yellow list items
  - If `validation` is null: show "Validating..."
- [ ] **7.2** Write `src/test/ReviewStep.test.tsx`:
  - Shows role name and team
  - Shows ability steps
  - Shows win conditions
  - Shows validation errors in red
  - Shows warnings in yellow
  - Shows "Validating..." when validation is null
- [ ] **7.3** Run tests — pass

---

## Stage 8: Integration & Polish

- [ ] **8.1** Verify full wizard flow end-to-end: create draft → fill all steps → review → submit
- [ ] **8.2** Add navigation link to Role Builder from the sidebar or header (if applicable)
- [ ] **8.3** Run full test suite — all tests pass
- [ ] **8.4** Verify no TypeScript errors across the project

---

## Final Verification

- [ ] All acceptance criteria AC1–AC15 have at least one test
- [ ] No existing tests broken
- [ ] `/roles/new` accessible in browser
- [ ] Wizard navigates through all 4 steps
- [ ] Validation errors appear on review step
- [ ] Create Role submits to API

---

*Last updated: March 26, 2026*
