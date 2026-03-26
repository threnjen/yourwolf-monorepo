# Role Builder Wizard

> **Goal**: Build a 4-step wizard UI for creating custom roles by composing abilities, with real-time validation against the backend, and a review/submit flow.

---

## Requirements & Acceptance Criteria

| ID | Acceptance Criteria |
|----|---------------------|
| AC1 | New route `/roles/new` renders the Role Builder page |
| AC2 | Wizard has 4 steps: Basic Info → Abilities → Win Conditions → Review |
| AC3 | Step indicator shows progress and allows clicking back to completed steps |
| AC4 | Basic Info step: name input with live duplicate-name check (debounced 500ms) |
| AC5 | Basic Info step: team selector with all 5 team options |
| AC6 | Basic Info step: description textarea, wake_order input, votes input |
| AC7 | Abilities step: abilities listed by category |
| AC8 | Abilities step: clicking an ability adds it as a step (auto-incrementing order) |
| AC9 | Abilities step: added steps can be reordered (up/down), removed, and have modifiers set |
| AC10 | Win Conditions step: can add/remove win conditions with type and params |
| AC11 | Review step: shows full role summary with all configured data |
| AC12 | Review step: displays validation errors and warnings from backend |
| AC13 | "Create Role" button on review step calls `POST /api/roles/` and navigates to the new role |
| AC14 | "Back" and "Next" navigation between steps |
| AC15 | "Next" is disabled when current step has insufficient data (name required for step 1) |

### Non-Goals

- Drag-and-drop reordering (up/down buttons are sufficient for MVP)
- Role preview card (deferred — review step serves this purpose)
- Editing existing roles (future — reuses the wizard with pre-populated data)
- Parameter-level configuration per ability type (simplified for MVP — use defaults)

### Traceability

| AC | Components | Planned Tests |
|----|-----------|---------------|
| AC1 | `routes.tsx`, `pages/RoleBuilder.tsx` | `test_role_builder_route` |
| AC2–AC3 | `components/RoleBuilder/Wizard.tsx` | `test_wizard_step_navigation` |
| AC4 | `components/RoleBuilder/steps/BasicInfoStep.tsx`, `api/roles.ts` | `test_name_duplicate_check` |
| AC5–AC6 | `components/RoleBuilder/steps/BasicInfoStep.tsx` | `test_basic_info_fields` |
| AC7–AC9 | `components/RoleBuilder/steps/AbilitiesStep.tsx` | `test_add_ability`, `test_remove_step`, `test_reorder_steps` |
| AC10 | `components/RoleBuilder/steps/WinConditionsStep.tsx` | `test_add_win_condition`, `test_remove_win_condition` |
| AC11–AC12 | `components/RoleBuilder/steps/ReviewStep.tsx` | `test_review_shows_summary`, `test_review_shows_errors` |
| AC13 | `pages/RoleBuilder.tsx` | `test_create_role_submit` |
| AC14–AC15 | `components/RoleBuilder/Wizard.tsx` | `test_next_disabled_no_name`, `test_back_navigation` |

---

## Stage 0: Test Prerequisites

**Goal**: Confirm frontend test infrastructure is ready.

**Success Criteria**: Vitest runs, React Testing Library available, mock patterns established.

**Status**: Not Started

**Assessment**: Frontend has comprehensive tests in `src/test/`. Test setup in `src/test/setup.ts` mocks axios. Mock factories in `src/test/mocks.ts`. Coverage is healthy — no blocker.

---

## Stage 1: Types & API Client

**Goal**: Add TypeScript types for draft/validation and API functions for the new backend endpoints.

**Success Criteria**: Types compile; API functions exist for validate, check-name, and create.

**Status**: Not Started

### Changes

1. **`src/types/role.ts`** — Add:
   - `RoleDraft` interface (local draft shape for the wizard state)
   - `ValidationResult` interface: `{ is_valid: boolean, errors: string[], warnings: string[] }`
   - `NameCheckResult` interface: `{ name: string, is_available: boolean, message: string }`
   - `AbilityStepDraft` interface (client-side step without server ID)
   - `WinConditionDraft` interface (client-side WC without server ID)
   - `Ability` interface: `{ id: string, type: string, name: string, description: string, parameters_schema: Record<string, unknown>, is_active: boolean }`

2. **`src/api/roles.ts`** — Add functions to `rolesApi`:
   - `validate(data: RoleDraft): Promise<ValidationResult>` — `POST /roles/validate`
   - `checkName(name: string): Promise<NameCheckResult>` — `GET /roles/check-name?name=...`
   - `create(data: RoleDraft): Promise<Role>` — `POST /roles/` (maps `RoleDraft` → `RoleCreate` shape)

3. **`src/api/abilities.ts`** — New file:
   - `abilitiesApi.list(): Promise<Ability[]>` — `GET /abilities/`

### Design Notes

- `RoleDraft` is the client-side working shape; it gets mapped to `RoleCreate` (matching the backend schema) on submission
- `validate()` transforms `RoleDraft` into a `RoleCreate`-shaped body before POSTing
- `Ability` type mirrors `AbilityRead` from the backend

---

## Stage 2: useAbilities Hook

**Goal**: Fetch and cache the list of available abilities.

**Success Criteria**: Hook returns abilities array, loading state, and error state.

**Status**: Not Started

### Changes

1. **`src/hooks/useAbilities.ts`** — New hook following `useRoles` pattern:
   - Calls `abilitiesApi.list()` on mount
   - Returns `{ abilities, loading, error }`

2. **`src/test/useAbilities.test.ts`** — Tests:
   - Starts with loading=true
   - Returns abilities after fetch
   - Handles error

### Design Notes

- Follows exact same pattern as `useRoles.ts` — `useState` + `useEffect` + `useCallback`
- Abilities are system-defined and rarely change; no refetch needed

---

## Stage 3: Wizard Shell & Navigation

**Goal**: Build the wizard component with step indicator and navigation.

**Success Criteria**: Can navigate forward/back through all 4 steps; step indicator highlights current step.

**Status**: Not Started

### Changes

1. **`src/components/RoleBuilder/Wizard.tsx`** — Main wizard component:
   - Props: `draft`, `validation`, `onChange`, `onSave`, `saving`
   - State: `currentStep` (one of `basic`, `abilities`, `win`, `review`)
   - Renders step indicator bar + current step content + navigation buttons
   - "Next" disabled logic: step 1 requires name.length >= 2; other steps always allow

2. **`src/test/Wizard.test.tsx`** — Tests:
   - Shows basic info step first
   - Next disabled without name
   - Next enabled with valid name
   - Can navigate forward through all steps
   - Can navigate backward
   - Shows "Create Role" on review step

### Design Notes

- Inline `React.CSSProperties` per project convention
- `theme` imports for all colors/spacing
- Step components are rendered conditionally (not routed)

---

## Stage 4: Basic Info Step

**Goal**: Name, description, team, wake_order, votes inputs with live name check.

**Success Criteria**: All fields update the draft; name availability shown after debounce.

**Status**: Not Started

### Changes

1. **`src/components/RoleBuilder/steps/BasicInfoStep.tsx`**:
   - Name input with status indicator (checking/available/taken)
   - Team selector (5 buttons styled with team colors from `theme`)
   - Description textarea
   - Wake order number input (0–20)
   - Votes number input (0–10)
   - Name check: `useEffect` with 500ms `setTimeout` calling `rolesApi.checkName()`

2. **`src/test/BasicInfoStep.test.tsx`** — Tests:
   - Renders all fields
   - Name change calls onChange with updated draft
   - Team selection calls onChange
   - Name check debounce triggers after 500ms

---

## Stage 5: Abilities Step

**Goal**: Browse abilities by category, add/remove/reorder steps, set modifiers.

**Success Criteria**: Can compose a list of ability steps with correct order and modifiers.

**Status**: Not Started

### Changes

1. **`src/components/RoleBuilder/steps/AbilitiesStep.tsx`**:
   - Category tabs: Card Actions, Information, Physical, State Changes, Other
   - Ability palette: list of abilities in current category (from `useAbilities`)
   - Click ability → appends new step to draft
   - Current steps list: shows added steps in order
   - Each step: reorder buttons (up/down), remove button, modifier dropdown (AND/OR/IF — first step locked to NONE)
   - Auto-assigns sequential order numbers

2. **`src/test/AbilitiesStep.test.tsx`** — Tests:
   - Renders category tabs
   - Clicking ability adds step
   - Remove button removes step and re-numbers orders
   - Reorder updates order correctly
   - First step modifier locked to none

### Design Notes

- Ability categories are hardcoded on the frontend (same as Phase 3 spec) — they map ability `type` strings to groupings
- `ABILITY_CATEGORIES` constant defines the mapping

---

## Stage 6: Win Conditions Step

**Goal**: Add/remove win conditions with type selection and primary flag.

**Success Criteria**: Can configure at least one primary win condition.

**Status**: Not Started

### Changes

1. **`src/components/RoleBuilder/steps/WinConditionsStep.tsx`**:
   - List of current win conditions
   - "Add Condition" button
   - Each condition: type dropdown (`team_wins`, `special_win_dead`, etc.), `is_primary` toggle, `overrides_team` toggle, remove button
   - Exactly one primary enforced (selecting primary on one deselects others)

2. **`src/test/WinConditionsStep.test.tsx`** — Tests:
   - Can add a win condition
   - Can remove a win condition
   - Primary toggle works
   - Only one primary allowed

---

## Stage 7: Review Step & Submit

**Goal**: Show role summary, display validation results, enable submission.

**Success Criteria**: Review shows all data; validation errors prevent submission; successful create navigates away.

**Status**: Not Started

### Changes

1. **`src/components/RoleBuilder/steps/ReviewStep.tsx`**:
   - Displays role name, team, description, wake_order, votes
   - Lists ability steps with order, ability name, modifier
   - Lists win conditions
   - Shows validation errors (red) and warnings (yellow) from `validation` prop
   - "Create Role" button disabled if `!validation?.is_valid`

2. **`src/pages/RoleBuilder.tsx`** — Page component:
   - Manages `RoleDraft` state
   - Calls `rolesApi.validate()` on draft changes (debounced)
   - Passes validation results to wizard
   - On save: calls `rolesApi.create()`, navigates to `/roles/{id}` on success

3. **`src/routes.tsx`** — Add `/roles/new` route pointing to `RoleBuilderPage`

4. **`src/test/RoleBuilder.test.tsx`** — Tests:
   - Page renders wizard
   - Validation called on changes
   - Create button triggers API call
   - Navigation after success

---

## API Contracts (Backend ↔ Frontend)

These contracts are shared with the backend `role-validation-service` and `role-crud-ownership` features.

### `POST /api/roles/validate`

**Request body** (maps from `RoleDraft`):
```
{
  "name": string,
  "description": string,
  "team": "village" | "werewolf" | "vampire" | "alien" | "neutral",
  "wake_order": number | null,
  "wake_target": string | null,
  "votes": number,
  "ability_steps": [
    {
      "ability_type": string,
      "order": number,
      "modifier": "none" | "and" | "or" | "if",
      "is_required": boolean,
      "parameters": object
    }
  ],
  "win_conditions": [
    {
      "condition_type": string,
      "condition_params": object | null,
      "is_primary": boolean,
      "overrides_team": boolean
    }
  ]
}
```

**Response** (200):
```
{
  "is_valid": boolean,
  "errors": string[],
  "warnings": string[]
}
```

### `GET /api/roles/check-name?name=string`

**Response** (200):
```
{
  "name": string,
  "is_available": boolean,
  "message": string
}
```

### `POST /api/roles/`

**Request body**: Same shape as validate request, plus optional `"visibility": string`, `"creator_id": string | null`

**Response** (201): Full `Role` object (see existing `RoleRead` schema)

### `GET /api/abilities/`

**Response** (200): Array of `Ability` objects
```
[
  {
    "id": string,
    "type": string,
    "name": string,
    "description": string,
    "parameters_schema": object,
    "is_active": boolean,
    "created_at": string
  }
]
```

---

## Correctness & Edge Cases

- Name with only spaces → `strip()` before checking length; should show "too short"
- Rapid name typing → debounce (500ms) prevents excessive API calls; only last value checked
- Adding then immediately removing a step → order numbers recalculated
- Empty abilities list from backend → show "No abilities available" message
- Validation API failure → show error message; don't block navigation
- Create API failure → show error; don't navigate

## Clean Design Checklist

- [ ] Each wizard step is its own component file
- [ ] Wizard state managed in parent `RoleBuilder` page, passed down as props
- [ ] No lifting state beyond the page component
- [ ] API transformation (draft → request body) happens in `api/roles.ts`, not in components
- [ ] Theme tokens used for all styling — no hardcoded colors/spacing
- [ ] Tests mock API calls, not internal component state

---

*Last updated: March 26, 2026*
