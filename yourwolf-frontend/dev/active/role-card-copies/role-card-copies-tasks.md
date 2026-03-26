# Role Card Copies — Task Checklist

> Work items ordered by stage. Each item should be completed and tested before moving on.

---

## Stage 1: Backend — Add Dependencies to RoleListItem

- [ ] **1.1** In `yourwolf-backend/app/schemas/role.py`, add `dependencies: list[RoleDependencyResponse] = Field(default_factory=list)` to the `RoleListItem` class
- [ ] **1.2** In `yourwolf-backend/app/services/role_service.py`, update `list_roles()` to eagerly load dependencies:
  - Add `joinedload(Role.dependencies).joinedload(RoleDependency.required_role)` to the query
  - Replace `RoleListItem.model_validate(r)` with manual construction that maps `r.dependencies` to `RoleDependencyResponse` objects (follow the pattern in `get_role()`)
- [ ] **1.3** In `yourwolf-backend/tests/test_roles.py`, add a test that calls the list endpoint with `extended_role_set` fixture and asserts:
  - Response items include a `dependencies` key (list)
  - A role with a known dependency (e.g., Apprentice Tanner) has the correct `required_role_name` and `dependency_type` in its `dependencies` array
  - A role without dependencies has an empty `dependencies` list
- [ ] **1.4** Run backend tests — all pass

---

## Stage 2: Frontend Types & Mocks

- [ ] **2.1** In `yourwolf-frontend/src/types/role.ts`, add `RoleDependency` interface:
  ```
  required_role_id: string
  required_role_name: string
  dependency_type: 'requires' | 'recommends'
  ```
- [ ] **2.2** In `yourwolf-frontend/src/types/role.ts`, add to `RoleListItem`:
  - `default_count: number`
  - `min_count: number`
  - `max_count: number`
  - `dependencies: RoleDependency[]`
- [ ] **2.3** In `yourwolf-frontend/src/test/mocks.ts`, update `createMockRole` defaults:
  - `default_count: 1, min_count: 1, max_count: 1, dependencies: []`
- [ ] **2.4** In `yourwolf-frontend/src/test/mocks.ts`, update `createMockOfficialRole` defaults:
  - Same count + dependency defaults
- [ ] **2.5** In `yourwolf-frontend/src/test/mocks.ts`, update `createMockRoles` factory:
  - Same count + dependency defaults per generated role
- [ ] **2.6** Run frontend tests — all existing tests still pass (no TS errors)

---

## Stage 3: RoleCard — Copy Count Display

- [ ] **3.1** In `yourwolf-frontend/src/components/RoleCard.tsx`, add a copy-count badge in the footer area:
  - Only displayed when `role.max_count > 1`
  - Format: "×{min}–{max}" when `min_count !== max_count` (e.g., "×1–3")
  - Format: "×{count}" when `min_count === max_count` (e.g., "×2")
  - Style: small muted badge, similar to wake-order style
- [ ] **3.2** In `yourwolf-frontend/src/test/RoleCard.test.tsx`, add tests:
  - Renders "×1–3" badge for role with min=1, max=3
  - Renders "×2" badge for role with min=2, max=2
  - No badge rendered for role with max=1
- [ ] **3.3** Run frontend tests — all pass

---

## Stage 4: GameSetup — Quantity Selection & Dependency Management

### 4A: State Model Change

- [ ] **4A.1** Replace `selectedRoleIds: string[]` state with `selectedRoleCounts: Record<string, number>` state
- [ ] **4A.2** Add derived value `totalSelectedCards` = sum of all counts in the map
- [ ] **4A.3** Add derived value `selectedRoleIds` = flat array with each role ID repeated by its count (for the API call)
- [ ] **4A.4** Update `canStart` check to use `totalSelectedCards === totalCardsNeeded`

### 4B: Selection Logic

- [ ] **4B.1** Implement `selectRole(roleId: string)`:
  - If not selected: add at `role.default_count`
  - If already selected: remove (set count to 0 / delete from map)
  - Build a lookup map from `roles` array for O(1) access to role data
- [ ] **4B.2** Implement dependency auto-select on add:
  - When adding a role, iterate its `dependencies` where `dependency_type === 'requires'`
  - For each required role not already selected, auto-select it at its `default_count`
  - Required role must exist in the fetched `roles` array (silently skip if not found)
- [ ] **4B.3** Implement dependency cascade-remove on deselect:
  - When removing a role, check all currently selected roles
  - If any selected role has a REQUIRES dependency on the role being removed, auto-remove it too
  - This is one-way: removing a dependent does NOT remove the required role
- [ ] **4B.4** Implement `adjustCount(roleId: string, delta: number)`:
  - New count = current + delta
  - If new count > max_count: no-op
  - If new count < min_count: remove role entirely (trigger cascade-remove)
  - Otherwise: update count in map

### 4C: Rendering Changes

- [ ] **4C.1** Update role grid item rendering for selected roles:
  - Show quantity badge (e.g., "×2") on the card when selected
  - Show +/– buttons when `min_count !== max_count` for a selected role
  - No +/– buttons when `min_count === max_count` (e.g., Mason)
- [ ] **4C.2** + button: disabled when count === max_count
- [ ] **4C.3** – button: when count === min_count, clicking removes the role entirely
- [ ] **4C.4** Update the role count display to show total cards: "Select Roles ({totalSelectedCards} / {totalCardsNeeded})"
- [ ] **4C.5** Auto-selected roles (from dependencies) should visually appear selected the same as manually selected roles

### 4D: Tests

- [ ] **4D.1** Test: clicking a role with default_count=2 adds 2 to the total count
- [ ] **4D.2** Test: clicking an already-selected role removes it
- [ ] **4D.3** Test: + button increments count; – button decrements
- [ ] **4D.4** Test: + disabled at max_count
- [ ] **4D.5** Test: – at min_count removes role entirely
- [ ] **4D.6** Test: Mason (min=max=2) adds 2 and removes 2 atomically; no +/– buttons visible
- [ ] **4D.7** Test: selecting role with REQUIRES dependency auto-selects the required role
- [ ] **4D.8** Test: removing required role cascade-removes dependent
- [ ] **4D.9** Test: removing dependent does NOT remove required (one-way)
- [ ] **4D.10** Run all frontend tests — all pass

---

## Stage 5: QA Plan Update

- [ ] **5.1** In `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md`, add section 1.6 "Multi-Copy Role Selection" after section 1.5 with manual test steps:
  - Click Werewolf (default=2) → counter increments by 2
  - Use +/– to adjust Villager between 1–3
  - Click Mason → adds 2; click again → removes 2; no +/– visible
  - Role count badge visible on multi-copy roles
- [ ] **5.2** Add section 1.7 "Role Dependency Auto-Selection" with manual test steps:
  - Select Apprentice Tanner → Tanner auto-selected
  - Remove Apprentice Tanner → Tanner stays
  - Select Apprentice Tanner again → both selected
  - Remove Tanner → Apprentice Tanner also removed
- [ ] **5.3** Review: all QA steps map back to acceptance criteria AC1–AC11
