# Role Builder Wizard — Context

> Key files, decisions, constraints, and patterns for implementation.

---

## Key Files

### New Files

| File | Role |
|------|------|
| `src/pages/RoleBuilder.tsx` | Page component — manages wizard state, validation, submission |
| `src/components/RoleBuilder/Wizard.tsx` | Wizard shell — step indicator, navigation, renders current step |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Step 1 — name, team, description, wake_order, votes |
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Step 2 — ability palette + step list |
| `src/components/RoleBuilder/steps/WinConditionsStep.tsx` | Step 3 — win condition list |
| `src/components/RoleBuilder/steps/ReviewStep.tsx` | Step 4 — summary + validation + submit |
| `src/hooks/useAbilities.ts` | Hook — fetches abilities list |
| `src/api/abilities.ts` | API client — abilities endpoint |
| `src/test/Wizard.test.tsx` | Tests for Wizard component |
| `src/test/BasicInfoStep.test.tsx` | Tests for BasicInfoStep |
| `src/test/AbilitiesStep.test.tsx` | Tests for AbilitiesStep |
| `src/test/WinConditionsStep.test.tsx` | Tests for WinConditionsStep |
| `src/test/ReviewStep.test.tsx` | Tests for ReviewStep |
| `src/test/RoleBuilder.test.tsx` | Tests for RoleBuilder page |
| `src/test/useAbilities.test.ts` | Tests for useAbilities hook |

### Modified Files

| File | Role | What Changes |
|------|------|-------------|
| `src/types/role.ts` | TypeScript types | Add `RoleDraft`, `ValidationResult`, `NameCheckResult`, `AbilityStepDraft`, `WinConditionDraft`, `Ability` |
| `src/api/roles.ts` | API client | Add `validate()`, `checkName()`, `create()` to `rolesApi` |
| `src/routes.tsx` | Router | Add `/roles/new` → `RoleBuilderPage` |
| `src/test/mocks.ts` | Mock factories | Add `createMockAbility()`, `createMockDraft()` |

---

## Existing Patterns to Follow

### Page Pattern (`src/pages/Roles.tsx`)

- Top-level component fetches data via custom hook
- Loading/error/empty states handled with conditional rendering
- Style objects defined as `const xxxStyles: React.CSSProperties` outside the component
- Uses `theme` from `../styles/theme` for all values

### Component Pattern (`src/components/RoleCard.tsx`)

- Props interface defined above component
- Inline styles using `theme` tokens
- No state management libraries — `useState` only
- Event handlers defined inside component or passed as props

### Hook Pattern (`src/hooks/useRoles.ts`)

- `useState` for data, loading, error
- `useCallback` for fetch function
- `useEffect` to trigger fetch on mount
- Returns object with named properties

### API Pattern (`src/api/roles.ts`)

- `apiClient` from `./client` (axios instance)
- Functions return typed data (unwrapped from `response.data`)
- Object methods on `rolesApi` constant

### Test Pattern (`src/test/`)

- Vitest + React Testing Library
- `vi.mock()` for module mocking
- `render()`, `screen`, `fireEvent` from `@testing-library/react`
- Mock factories from `src/test/mocks.ts`
- Tests grouped by `describe()` blocks

---

## Key Decisions

### D1: Wizard State Managed in Page

**Decision**: `RoleDraft` state lives in `RoleBuilder.tsx` (page), passed to `Wizard` and step components as props.

**Rationale**: Single source of truth. The page orchestrates validation API calls and submission. Step components are pure presentational components that call `onChange` to update the draft.

### D2: Flat Draft Shape (Not Nested)

**Decision**: `RoleDraft` is a flat object matching the `RoleCreate` backend schema closely.

**Rationale**: Minimizes transformation when sending to the API. The `validate()` and `create()` functions can pass the draft almost directly, with minor field renames if needed.

### D3: Abilities Fetched Once, Not Per-Category

**Decision**: `useAbilities` fetches all abilities in one call. Category filtering done client-side.

**Rationale**: There are ~15 ability types. A single `GET /api/abilities/` call returns all of them. Filtering by category is a client-side operation on the array. No need for category-specific endpoints.

### D4: Validation Debounced, Not On-Step-Change

**Decision**: Validation API is called with a debounce when the draft changes, not on each step navigation.

**Rationale**: Continuous validation gives immediate feedback. Debouncing (e.g., 1 second) prevents excessive API calls. The validation result is always available on the review step.

### D5: No Ability Parameter Configuration (MVP)

**Decision**: AbilitiesStep does not include per-ability parameter editors for MVP.

**Rationale**: The Phase 3 spec includes detailed `ParameterEditor` components, but this adds significant complexity. For MVP, abilities are added with default empty parameters. A follow-up feature can add the parameter editors. Steps are added with `parameters: {}`.

### D6: Route Before `/roles` Detail Route

**Decision**: `/roles/new` is added before any future `/roles/:id` route.

**Rationale**: React Router matches routes in order. `/roles/new` must not be caught by a parameterized `/roles/:id` route. Currently there is no `/roles/:id` route, but placing `/roles/new` first prevents future conflicts.

---

## Constraints

1. **No new dependencies** — No form libraries (React Hook Form, Formik), no state management libraries
2. **Inline styles** — `React.CSSProperties` with `theme` tokens, per project convention
3. **Vitest** — All tests use vitest, not jest (project is configured for vitest)
4. **Mocked API in tests** — Axios is mocked at module level in `src/test/setup.ts`
5. **Backend must be running** — Live name check and validation require the backend; tests mock these

---

## Ability Categories (Frontend-Side Constant)

| Category ID | Label | Ability Types |
|-------------|-------|---------------|
| `card` | Card Actions | `view_card`, `swap_card`, `take_card`, `flip_card`, `copy_role` |
| `info` | Information | `view_awake`, `thumbs_up`, `explicit_no_view` |
| `physical` | Physical | `rotate_all`, `touch` |
| `state` | State Changes | `change_to_team`, `perform_as`, `perform_immediately`, `stop` |
| `other` | Other | `random_num_players` |

---

## Relationship to Other Features

- **role-validation-service** (backend): Provides `POST /api/roles/validate` and `GET /api/roles/check-name` consumed by this feature
- **role-crud-ownership** (backend): Provides `POST /api/roles/` with `creator_id` support consumed by this feature
- **local-draft-storage** (frontend): Provides `useDrafts` hook that this feature integrates with for auto-saving and draft restoration. The `RoleDraft` type is shared between both features.

---

*Last updated: March 26, 2026*
