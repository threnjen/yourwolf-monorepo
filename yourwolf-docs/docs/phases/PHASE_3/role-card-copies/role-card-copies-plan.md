# Role Card Copies & Dependency Auto-Selection

> **Goal**: Enable multi-copy role selection with +/– quantity controls and automatic dependency management in the GameSetup UI, with copy-count display on RoleCard everywhere.

---

## Stage 1: Backend — Add Dependencies to RoleListItem

**Goal**: Expose dependency data on the list endpoint so the frontend can do client-side auto-selection without N+1 detail fetches.

**Success Criteria**:
- `GET /api/roles/official` returns a `dependencies` array per role item
- Each dependency includes `required_role_id`, `required_role_name`, and `dependency_type`
- Existing tests still pass; new test covers the field

**Status**: Not Started

### Changes

1. **`yourwolf-backend/app/schemas/role.py`** — Add `dependencies: list[RoleDependencyResponse]` to `RoleListItem`
2. **`yourwolf-backend/app/services/role_service.py`** — In `list_roles()`, add `joinedload(Role.dependencies).joinedload(RoleDependency.required_role)` to the query; map dependencies into each `RoleListItem`
3. **`yourwolf-backend/tests/test_roles.py`** — Add test asserting list endpoint returns `dependencies` with correct shape

### Design Notes

- The `RoleDependencyResponse` schema already exists and is used by `RoleRead`; reuse it for `RoleListItem`
- The `list_roles()` method currently does a plain `db.query(Role)` — need to add eager loading
- The `RoleListItem.model_validate(r)` call will need adjustment since dependencies require manual mapping (same pattern as `get_role()` uses)

---

## Stage 2: Frontend Types & Mocks

**Goal**: TypeScript types match the updated API response; all mocks compile and include new fields.

**Success Criteria**:
- `RoleListItem` type includes `default_count`, `min_count`, `max_count`, `dependencies`
- `createMockRole`, `createMockOfficialRole`, `createMockRoles` include count fields and empty dependencies by default
- No TS errors; existing tests still pass

**Status**: Not Started

### Changes

1. **`yourwolf-frontend/src/types/role.ts`**
   - Add to `RoleListItem`: `default_count: number`, `min_count: number`, `max_count: number`
   - Add `RoleDependency` interface: `{ required_role_id: string; required_role_name: string; dependency_type: 'requires' | 'recommends' }`
   - Add to `RoleListItem`: `dependencies: RoleDependency[]`

2. **`yourwolf-frontend/src/test/mocks.ts`**
   - Update `createMockRole` defaults: `default_count: 1, min_count: 1, max_count: 1, dependencies: []`
   - Update `createMockOfficialRole` similarly
   - Update `createMockRoles` similarly

---

## Stage 3: RoleCard — Copy Count Display

**Goal**: Multi-copy roles show count info on the card wherever `RoleCard` is rendered (Roles page and GameSetup).

**Success Criteria**:
- Roles with `max_count > 1` display a badge (e.g., "×1–3" or "×2")
- Roles with `max_count === 1` show no badge (no visual change)
- Badge renders in the card footer area

**Status**: Not Started

### Changes

1. **`yourwolf-frontend/src/components/RoleCard.tsx`**
   - Accept `default_count`, `min_count`, `max_count` from the `RoleListItem` prop (already passed as `role`)
   - Render a copy-count badge in the footer when `max_count > 1`
   - Format: "×{min}–{max}" when min !== max (e.g., "×1–3"); "×{count}" when min === max (e.g., "×2")

2. **`yourwolf-frontend/src/test/RoleCard.test.tsx`**
   - Test: renders badge for multi-copy role
   - Test: no badge for single-copy role
   - Test: "×2" format when min === max

---

## Stage 4: GameSetup — Quantity Selection & Dependency Management

**Goal**: Replace binary toggle with count-based selection; add +/– buttons; implement auto-dependency management.

**Success Criteria**:
- AC3: Clicking a role adds `default_count` copies; counter increments correctly
- AC4: +/– buttons adjust count between `min_count` and `max_count`; + disabled at max; – at min removes entirely
- AC5: Mason (min=max=2) adds/removes atomically; no +/– shown
- AC8: Selecting "Apprentice Tanner" auto-selects "Tanner"
- AC9: Removing "Tanner" auto-removes "Apprentice Tanner"
- AC10: Removing "Apprentice Tanner" does NOT remove "Tanner"

**Status**: Not Started

### Changes

1. **`yourwolf-frontend/src/pages/GameSetup.tsx`**

   **State model change**:
   - Replace `selectedRoleIds: string[]` with `selectedRoleCounts: Record<string, number>`
   - Derive `selectedRoleIds` (flat array with duplicated IDs) from the counts map for the API call
   - Derive `totalSelectedCards` by summing all counts

   **Selection logic — `selectRole(roleId)`**:
   - If role is not selected: add at `default_count`
   - If role is already selected: deselect (set to 0 / remove from map)
   - After adding: check role's dependencies; for each REQUIRES dependency, if the required role is not already selected, auto-select it at its `default_count`
   - After removing: check all other selected roles; if any REQUIRES this role as a dependency, auto-remove them too (cascade)
   - Dependency resolution is one level deep only (no recursion needed for current data)

   **Quantity adjustment — `adjustCount(roleId, delta)`**:
   - New count = current count + delta
   - If new count > `max_count`: no-op (button should be disabled)
   - If new count < `min_count`: remove role entirely (and cascade-remove dependents)
   - Otherwise: update count

   **Rendering changes**:
   - Selected roles show a quantity badge (e.g., "×2")
   - If `min_count !== max_count` for a selected role: show +/– buttons
   - If `min_count === max_count`: no +/– buttons (fixed count)
   - + button disabled when count === max_count
   - – button: when count === min_count, acts as "remove" (removes entirely)

2. **`yourwolf-frontend/src/test/GameSetup.test.tsx`**
   - Test: clicking multi-copy role adds `default_count` copies
   - Test: +/– buttons adjust count within bounds
   - Test: Mason adds/removes atomically
   - Test: dependency auto-select on add
   - Test: dependency cascade remove
   - Test: one-way dependency (removing dependent keeps required)

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Click Mason (min=max=2) | Adds 2 copies; click again removes both |
| Villager at max_count=3, click + | + disabled; no change |
| Villager at count=1, click – | Removes entirely (below min → deselect) |
| Select Apprentice Tanner | Tanner auto-added at default_count=1 |
| Tanner already selected, add Apprentice Tanner | Tanner unchanged |
| Remove Tanner while Apprentice Tanner selected | Both removed |
| Remove Apprentice Tanner while Tanner selected | Only Apprentice Tanner removed |
| Required role not in fetched role list | Dependency ignored silently |
| Auto-selected role is itself multi-copy | Added at its own default_count |

---

## Stage 5: QA Plan Update

**Goal**: Manual QA test plan covers all multi-copy and dependency behaviors.

**Success Criteria**:
- New section 1.6 "Multi-Copy Role Selection" in PHASE_2_QA.md
- New section 1.7 "Role Dependency Auto-Selection" in PHASE_2_QA.md
- All test steps map to acceptance criteria

**Status**: Not Started

### Changes

1. **`yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md`** — Add sections 1.6 and 1.7 after section 1.5

---

## Acceptance Criteria Summary

| AC | Description | Stage |
|----|-------------|-------|
| AC1 | `RoleListItem` TS type includes `default_count`, `min_count`, `max_count` | 2 |
| AC2 | `RoleCard` displays copy count badge when `max_count > 1` | 3 |
| AC3 | Clicking a role adds `default_count` copies | 4 |
| AC4 | +/– buttons adjust count between `min_count` and `max_count` | 4 |
| AC5 | Mason (min=max=2) adds/removes atomically; no +/– buttons | 4 |
| AC6 | Backend `RoleListItem` includes `dependencies` field | 1 |
| AC7 | Frontend `RoleListItem` includes `dependencies` field | 2 |
| AC8 | Selecting a role auto-selects its REQUIRES dependencies | 4 |
| AC9 | Removing a required role cascade-removes dependents | 4 |
| AC10 | Removing a dependent does NOT remove the required role (one-way) | 4 |
| AC11 | QA test plan updated with multi-copy and dependency sections | 5 |

## Non-Goals

- No changes to RECOMMENDS dependency behavior in the UI (soft warnings remain backend-only via API response `warnings` field)
- No drag-and-drop reordering of role copies
- No new backend validation logic for min/max/dependencies (already complete in `GameService.create_game()`)
- No changes to GameFacilitator, phase transitions, or night script generation
- No pagination changes for the roles list endpoint (Issue #7 from QA review — separate concern)

## Security & Observability

- No new auth, secrets, or sensitive data handling
- Frontend-only quantity logic is advisory; backend enforcement (already in place) remains the source of truth
- No new logging needed; backend already logs game creation with role counts

## Rollback

- Backend schema change is additive (new field); safe to deploy independently
- Frontend changes are self-contained in GameSetup and RoleCard
- Revert = revert the commits; no data migration involved
