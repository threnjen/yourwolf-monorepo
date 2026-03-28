# Phase 3: Manual QA Test Plan

**Date:** March 27, 2026
**Mode:** Release QA Plan
**Scope:** Role Builder Wizard, Role Validation Service, Role CRUD Ownership, Role Card Copies & Dependencies, Local Draft Storage
**Environment:** Local dev (Docker Compose — backend + frontend + PostgreSQL); seed data loaded
**Prerequisites:**
- Backend running at `localhost:8000` with seed data (`python -m app.seed`)
- Frontend running at `localhost:5173`
- Browser DevTools available for localStorage inspection
- A tool for making API calls (curl, Postman, or browser DevTools console)

## References

- Plans: `role-builder-wizard-plan.md`, `role-validation-service-plan.md`, `role-crud-ownership-plan.md`, `role-card-copies-plan.md`, `local-draft-storage-plan.md`
- Implementations: `role-builder-wizard-implementation.md`, `role-validation-service-implementation.md`, `role-crud-ownership-implementation.md`, `role-card-copies-implementation.md`
- Reviews: `role-builder-wizard-review.md`, `role-validation-service-review.md`, `role-crud-ownership-review.md`, `role-card-copies-review.md`, `local-draft-storage-review.md`

---

## Summary of Changes

Phase 3 delivers the Role Builder MVP — a 4-step wizard for creating custom roles by composing abilities and win conditions, backed by a validation service, CRUD ownership enhancements, multi-copy role selection with dependency management, and client-side draft persistence.

## Automated Test Coverage

The following areas are already covered by unit/integration tests and do **not** need manual verification:

- **Backend**: 240+ tests covering role CRUD, validation logic (name length, step ordering, win condition counts, duplicate names, ability type checks, warnings), check-name endpoint, validate endpoint, official role deletion guard, locked role guards, step/condition replacement, creator_id persistence, dependency eager loading
- **Frontend**: 290+ tests covering all wizard step components (BasicInfoStep, AbilitiesStep, WinConditionsStep, ReviewStep), Wizard navigation/state, RoleBuilder page create flow, useAbilities hook, useDrafts hook (CRUD, corruption recovery, quota exceeded), RoleCard badge rendering, GameSetup multi-copy selection/dependency cascade, API client methods, routing

---

## Manual QA Checklist

### 1. Role Builder Wizard — Route & Page Load

**Acceptance Criteria:** Wizard AC1, AC2, AC3

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles/new` | Page loads with "Create New Role" heading and subtitle |
| [ ] | Observe step indicator | 4 steps visible: "Basic Info", "Abilities", "Win Conditions", "Review" |
| [ ] | Observe initial step | "Basic Info" step is active (highlighted); other steps are dimmed and not clickable |
| [ ] | Click the sidebar | "✏️ New Role" link is present and navigates to `/roles/new` |

### 1.1 Basic Info Step

**Acceptance Criteria:** Wizard AC4, AC5, AC6, AC15

| | Step | Expected |
|---|------|----------|
| [ ] | Observe empty form | Name field is empty; Team defaults to "Village"; Description empty; Wake Order empty; Votes defaults to 1 |
| [ ] | Type "Se" in the Name field, wait 500ms | "Checking..." appears below the field, then "Taken ✗" (Seer exists as official role) |
| [ ] | Clear name, type "My Custom Role", wait 500ms | "Checking..." appears, then "Available ✓" |
| [ ] | Type a single character "X" in the Name field | No name check fires (below 2-char minimum); name status stays idle |
| [ ] | Observe "Next" button with empty name | "Next" button is disabled (grayed out, not-allowed cursor) |
| [ ] | Enter a name with 2+ characters | "Next" button becomes enabled |
| [ ] | Click each of the 5 team buttons: Village, Werewolf, Vampire, Alien, Neutral | Each highlights with its team color; only one is active at a time |
| [ ] | Enter a description in the textarea | Text is accepted; textarea is resizable vertically |
| [ ] | Set Wake Order to 15 | Value accepted; field shows 15 |
| [ ] | Set Wake Order to 25 | Value accepted (valid within new 0–40 range) |
| [ ] | Set Wake Order to 45 | Input clamps or rejects — above max of 40 |
| [ ] | Clear Wake Order field | Field shows empty placeholder "0–40"; this represents null (no wake order) |
| [ ] | Set Votes to 3 | Value accepted |
| [ ] | Set Votes to 0 | Value accepted (zero-vote role) |

### 1.2 Abilities Step

**Acceptance Criteria:** Wizard AC7, AC8, AC9

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Next" from Basic Info (with valid name) | Navigates to Abilities step; step indicator updates |
| [ ] | Observe category tabs | 5 tabs visible: "Card Actions", "Information", "Physical", "State Changes", "Other" |
| [ ] | "Card Actions" tab is active by default | Abilities like "View Card", "Swap Card", etc. are shown as clickable buttons |
| [ ] | Click "Information" tab | Tab highlights; palette updates to show information-type abilities |
| [ ] | Click an ability button (e.g., "View Card") | New step appears in the "Ability Steps" list with order #1 and modifier "none" |
| [ ] | Click another ability (e.g., "Swap Card") | Step #2 appears with modifier "and" (auto-assigned); total shows "(2)" |
| [ ] | Observe first step's modifier dropdown | Dropdown is disabled (first step must be "none") |
| [ ] | Change second step's modifier to "or" | Dropdown updates to "or" |
| [ ] | Click ↓ (Move Down) on step #1 | Steps swap; the former step #1 is now step #2; orders renumber correctly |
| [ ] | Click ↑ (Move Up) on the now-step-#2 | Steps swap back; the modifier on new step #1 is forced to "none" |
| [ ] | Click the remove button (×) on a step | Step is removed; remaining steps renumber sequentially |
| [ ] | Remove all steps | Empty state message appears: "Click an ability above to add it as a step" |
| [ ] | While abilities are loading | "Loading abilities..." message appears briefly |

### 1.3 Win Conditions Step

**Acceptance Criteria:** Wizard AC10

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Next" from Abilities step | Navigates to Win Conditions step |
| [ ] | Observe empty state | Empty win conditions list with an "Add Win Condition" button |
| [ ] | Click "Add Win Condition" | New condition appears with type dropdown and "Primary" checkbox |
| [ ] | Check the "Primary" checkbox | Condition marked as primary |
| [ ] | Add a second win condition and mark it as primary | The first condition's primary flag is cleared; only one primary at a time |
| [ ] | Uncheck primary on the second condition | Primary flag is cleared; no conditions are primary |
| [ ] | Change win condition type via dropdown | Type updates (options: survive, eliminate, etc.) |
| [ ] | Click remove on a win condition | Condition removed from list |

### 1.4 Review Step & Submission

**Acceptance Criteria:** Wizard AC11, AC12, AC13, AC14, AC15

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Next" from Win Conditions step | Navigates to Review step; step indicator shows all 4 steps as reachable |
| [ ] | Observe summary | All configured fields displayed: Name, Team, Description, Wake Order, Votes, Ability Steps with order/name/modifier, Win Conditions with type/primary flag |
| [ ] | Observe validation section (valid role) | After ~1 second debounce, green "Valid" indicator appears; no errors |
| [ ] | Observe "Create Role" button with valid validation | Button is enabled (not grayed out) |
| [ ] | Click "Create Role" | Button text changes to "Saving..."; API call fires; on success, navigates to `/roles/{new-role-id}` |
| [ ] | Verify created role page | New role's detail page shows all the data entered in the wizard |
| [ ] | Click a completed step in the step indicator (e.g., "Basic Info") | Navigates back to that step with all data preserved |
| [ ] | Click "Back" button on any non-first step | Returns to previous step with data preserved |

### 1.5 Review Step — Validation Feedback

**Acceptance Criteria:** Wizard AC12; Validation AC1, AC11, AC12

| | Step | Expected |
|---|------|----------|
| [ ] | Create a role with no win conditions, navigate to Review | After validation debounce, red error(s) appear: "At least one win condition is required" |
| [ ] | Observe "Create Role" button when errors exist | Button is disabled (grayed out, not-allowed cursor) |
| [ ] | Create a role with 6+ ability steps and navigate to Review | After validation, yellow warning appears: role has many ability steps |
| [ ] | Create a role with ability steps but no wake_order | After validation, warning about wake_order appears |
| [ ] | Create a role with two primary win conditions | After validation, error about multiple primary win conditions |
| [ ] | Clear the name to 1 character, navigate back to Review | After validation, error about name length |

### 1.6 Review Step — Duplicate Name via Validation

**Acceptance Criteria:** Validation AC4

| | Step | Expected |
|---|------|----------|
| [ ] | Enter "Seer" as the role name (exists as official); fill all required fields; navigate to Review | Validation returns error: duplicate name detected |
| [ ] | Enter "seer" (lowercase) | Same duplicate error (case-insensitive) |
| [ ] | Enter "SEER" (uppercase) | Same duplicate error |
| [ ] | Change name to something unique | Duplicate error clears on next validation cycle |

---

### 2. Role Validation Service — Direct API

**Acceptance Criteria:** Validation AC1–AC12

#### 2.1 POST /api/roles/validate

| | Step | Expected |
|---|------|----------|
| [ ] | POST `/api/roles/validate` with a complete, valid `RoleCreate` body | 200; `{ is_valid: true, errors: [], warnings: [] }` |
| [ ] | POST with `name: "A"` (1 char) | 200; `is_valid: false`; errors include "Name must be between 2 and 50 characters" |
| [ ] | POST with name = 51 characters | 200; `is_valid: false`; errors include name length error |
| [ ] | POST with `ability_steps` referencing a non-existent `ability_type` | 200; `is_valid: false`; errors include unknown ability type |
| [ ] | POST with first step modifier = "and" (not "none") | 200; `is_valid: false`; errors include first-step modifier error |
| [ ] | POST with duplicate step orders `[1, 1, 2]` | 200; `is_valid: false`; errors include duplicate order |
| [ ] | POST with gap in step orders `[1, 3]` | 200; `is_valid: false`; errors include gap in orders |
| [ ] | POST with empty `win_conditions: []` | 200; `is_valid: false`; errors include "at least one" |
| [ ] | POST with two primary win conditions | 200; `is_valid: false`; errors include multiple primary error |
| [ ] | POST with zero primary win conditions | 200; `is_valid: false`; errors include no primary error |
| [ ] | POST with 6 ability steps (triggers warning) | 200; `is_valid: true`; `warnings` is non-empty |
| [ ] | POST with `wake_order: 25` | 200; `is_valid: true` (valid within new 0–40 range) |
| [ ] | POST with `wake_order: 45` | 422 Pydantic validation error (before service; field constraint ge=0, le=40) |
| [ ] | POST with `exclude_role_id` query param matching an existing role's ID, and that role's name | 200; `is_valid: true` (own name excluded from duplicate check) |

#### 2.2 GET /api/roles/check-name

| | Step | Expected |
|---|------|----------|
| [ ] | GET `/api/roles/check-name?name=UniqueTestName` | 200; `{ name: "UniqueTestName", is_available: true, message: "..." }` |
| [ ] | GET `/api/roles/check-name?name=Seer` (official role) | 200; `is_available: false` |
| [ ] | GET `/api/roles/check-name?name=seer` (case variant) | 200; `is_available: false` (case-insensitive) |
| [ ] | GET `/api/roles/check-name?name=` (empty string) | 422 or error response (min_length=1 enforced) |
| [ ] | GET `/api/roles/check-name?name=%20Seer%20` (whitespace padded) | 200; `is_available: false` (name is stripped before check) |

---

### 3. Role CRUD Ownership — Update & Delete Guards

**Acceptance Criteria:** CRUD AC1–AC10

#### 3.1 Update with Step/Condition Replacement

| | Step | Expected |
|---|------|----------|
| [ ] | Create a custom role via `POST /api/roles/` with 2 ability steps and 1 win condition | 201; role has 2 steps and 1 condition |
| [ ] | `PUT /api/roles/{id}` with `ability_steps` containing 1 new step | 200; response shows 1 step (old 2 are gone) |
| [ ] | `PUT /api/roles/{id}` with `win_conditions` containing 2 new conditions | 200; response shows 2 conditions (old 1 is gone) |
| [ ] | `PUT /api/roles/{id}` with only `name` changed (no `ability_steps`/`win_conditions`) | 200; ability steps and win conditions unchanged; name updated |
| [ ] | `PUT /api/roles/{id}` with both `ability_steps` and `win_conditions` in one request | 200; both replaced in a single transaction |
| [ ] | `GET /api/roles/{id}` after updates | Verify persisted data matches the last PUT response |

#### 3.2 Locked & Official Role Guards

| | Step | Expected |
|---|------|----------|
| [ ] | `PUT /api/roles/{id}` on a locked role (e.g., official Seer) | 403 with lock-related error message |
| [ ] | `DELETE /api/roles/{id}` on a locked role | 403 with lock-related error message |
| [ ] | `DELETE /api/roles/{id}` on an official (unlocked) role | 403 with "Cannot delete official roles" message |
| [ ] | `DELETE /api/roles/{id}` on a custom (non-official, unlocked) role | 200; role deleted |

#### 3.3 Creator ID

| | Step | Expected |
|---|------|----------|
| [ ] | `POST /api/roles/` with `creator_id` set to a UUID | 201; response includes the `creator_id` |
| [ ] | `POST /api/roles/` without `creator_id` | 201; `creator_id` is null |
| [ ] | `GET /api/roles/{id}` for a role with `creator_id` | `creator_id` present in response |

---

### 4. Role Card Copies & Dependency Auto-Selection

**Acceptance Criteria:** Copies AC1–AC11

> Note: Sections 1.6–1.10 of the Phase 2 QA plan already cover GameSetup multi-copy and dependency behaviors. The items below focus on areas not covered there.

#### 4.1 Backend — Dependencies on List Endpoint

| | Step | Expected |
|---|------|----------|
| [ ] | `GET /api/roles/official` with seed data | Every role item includes a `dependencies` array |
| [ ] | Inspect Apprentice Tanner's response | `dependencies` contains `{ required_role_name: "Tanner", dependency_type: "requires" }` |
| [ ] | Inspect Villager's response | `dependencies` is `[]` |
| [ ] | `GET /api/roles/official?limit=2` on a dataset with dependencies | Returns exactly 2 unique roles (not fewer due to joins); each has correct dependencies |

#### 4.2 RoleCard Copy Count Badge

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles` page; observe Werewolf card (min=1, max=2) | Badge displays "×1–2" in the card footer |
| [ ] | Observe Mason card (min=2, max=2) | Badge displays "×2" |
| [ ] | Observe Villager card (min=1, max=3) | Badge displays "×1–3" |
| [ ] | Observe Seer card (max=1) | No copy-count badge visible |
| [ ] | Navigate to `/games/new`; observe same cards | Same badges appear on cards in the game setup grid |

---

### 5. Local Draft Storage

**Acceptance Criteria:** Drafts AC1–AC10

#### 5.1 Persistence Across Page Refresh

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles/new`; enter a role name "Refresh Test" and select team "Werewolf" | Form shows the entered data |
| [ ] | Open DevTools → Application → Local Storage → `localhost:5173` | Entry `yourwolf_drafts` exists with JSON data containing the draft |
| [ ] | Hard-refresh the page (Cmd+Shift+R / Ctrl+Shift+R) | Page reloads; wizard starts fresh (note: auto-save integration depends on wizard calling `saveDraft`) |

#### 5.2 Corrupted Storage Recovery

| | Step | Expected |
|---|------|----------|
| [ ] | In DevTools, manually set `yourwolf_drafts` to `"not-valid-json{{{"` | Storage contains invalid data |
| [ ] | Navigate to `/roles/new` or refresh | Page loads normally; no crash; if drafts are displayed anywhere, list shows empty |
| [ ] | In DevTools, set `yourwolf_drafts` to `"just a string"` (valid JSON but not an array) | Page loads normally; drafts fall back to empty array |

#### 5.3 Storage Quota

| | Step | Expected |
|---|------|----------|
| [ ] | Use a role builder to save multiple drafts (if draft list UI exists) | Drafts are persisted and survive refresh |
| [ ] | If localStorage is nearly full (simulate by filling with large dummy data) | Hook does not crash; draft operations degrade gracefully (write may silently fail) |

---

### 6. End-to-End: Full Role Creation Flow

**Acceptance Criteria:** Cross-feature integration

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles/new` via sidebar "✏️ New Role" link | Wizard loads |
| [ ] | **Basic Info**: Enter name "Night Stalker", select "Werewolf" team, add description, set wake_order to 5, votes to 1 | All fields populated; name check shows "Available ✓" |
| [ ] | Click "Next" | Abilities step loads; abilities palette populates from backend |
| [ ] | **Abilities**: Select "Card Actions" tab → click "View Card" → click "Swap Card" | Two steps listed: #1 View Card (none), #2 Swap Card (and) |
| [ ] | Click "Next" | Win Conditions step loads |
| [ ] | **Win Conditions**: Add a win condition, set type, check "Primary" | One primary win condition configured |
| [ ] | Click "Next" | Review step loads; all data displayed correctly |
| [ ] | Wait ~1 second for validation | Green "Valid" indicator appears; "Create Role" button is enabled |
| [ ] | Click "Create Role" | Button shows "Saving..."; navigates to `/roles/{id}` on success |
| [ ] | Verify the new role's detail page | Name, team, description, wake_order, votes, ability steps, and win conditions all match what was entered |
| [ ] | Navigate to `/roles` page | New role appears in the list (if it's public/official visibility — note: wizard creates private roles by default) |

---

## Cross-Cutting Concerns

### Performance
- [ ] **Abilities list load time** — On the Abilities step, abilities should load within 1–2 seconds on first visit. **Expected:** No noticeable delay; "Loading abilities..." message appears briefly if any lag
- [ ] **Validation debounce** — Rapidly changing wizard fields should not flood the backend with validation requests. **Expected:** Only one validation call fires after ~1 second of inactivity (check DevTools Network tab)
- [ ] **Name check debounce** — Rapidly typing in the name field should not flood the backend. **Expected:** Only one check-name call fires after ~500ms of inactivity
- [ ] **Role list with dependencies** — `/api/roles/official` response time should not degrade noticeably with dependencies included. **Expected:** Response within 200ms for ≤30 roles

### Accessibility
- [ ] **Wizard keyboard navigation** — Tab through all wizard fields, buttons, and step indicators. **Expected:** All interactive elements are reachable via keyboard; focus order is logical
- [ ] **Step indicator keyboard access** — Tab to a completed step indicator button and press Enter. **Expected:** Navigates back to that step
- [ ] **Ability step buttons** — Tab to an ability in the palette and press Enter. **Expected:** Adds the ability as a step
- [ ] **Form labels** — All input fields have associated `<label>` elements with `htmlFor` matching input `id`. **Expected:** Clicking a label focuses the corresponding input
- [ ] **GameSetup +/– buttons** — Verify +/– buttons are keyboard-navigable. **Expected:** Buttons can be focused and activated via Enter/Space

### Responsive Layout
- [ ] **Wizard on narrow viewport** — Resize browser to ~375px width. **Expected:** Step indicator wraps or scrolls; form fields stack vertically; buttons remain accessible
- [ ] **RoleCard badges on narrow viewport** — Resize browser to ~375px width on Roles page. **Expected:** Badges don't overlap card content; cards stack in single column

---

## Notes

- The wizard creates roles with `visibility: 'private'` and `creator_id: null` by default (no auth yet). Created roles may not appear on the official roles list — check the role detail page directly via the redirect URL.
- The pre-existing test failure in `test_game_service.py::TestPrimaryTeamRoleValidation::test_rejects_multiple_teams_each_missing_primary` (`NameError: Team`) is a known issue unrelated to Phase 3.
- Local draft storage auto-save (AC10) is an integration contract between `useDrafts` and the wizard's `RoleBuilder.tsx`. The wizard currently calls `rolesApi.validate()` on draft changes but does not explicitly call `saveDraft()` — auto-save integration may be deferred or partial. Verify by inspecting `yourwolf_drafts` in localStorage during wizard use.
- The `exclude_role_id` param on `POST /api/roles/validate` is for future edit-mode flows. For new role creation, it can be omitted.
