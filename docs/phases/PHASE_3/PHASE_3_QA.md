# Phase 3: Manual QA Test Plan

**Date:** March 28, 2026
**Mode:** Release QA Plan
**Scope:** Role Builder Wizard (all 13 features delivered in Phase 3) + Roles Listing Filters
**Environment:** Local dev (Docker Compose — backend + frontend + PostgreSQL)
**Prerequisites:**
- From `yourwolf-backend/`, run `docker compose up` — this starts PostgreSQL, runs migrations, seeds data, and starts the backend at `localhost:8000` and frontend at `localhost:3000`
- Browser DevTools available for localStorage inspection
- Verify services are up: `curl http://localhost:8000/api/health` → `{"status": "healthy"}`

## References

- Phase summary: `PHASE_3_SUMMARY.md`
- Coverage map: `PHASE_3-coverage-map-qa.md`

---

## Summary of Changes

Phase 3 delivers the Role Builder MVP — a 4-step wizard for creating custom roles by composing abilities and win conditions, backed by a validation service, CRUD ownership enhancements, multi-copy role selection with dependency management, client-side draft persistence, team-based role sorting, primary team role toggle, ability step parameters, descriptive modifier/label UX improvements, and full-stack code quality audits.

## Automated Test Coverage

The following areas are already covered by 184 backend + 283 frontend passing tests and do **not** need manual verification:

- **Backend validation logic**: Name length (2–50), step ordering (sequential, no gaps/duplicates), first-step modifier = "none", win condition counts (≥1, exactly 1 primary), ability type existence checks, duplicate name detection (case-insensitive), warnings (>5 steps, missing wake_order, conflicting abilities), wake_order schema constraint (0–40)
- **Backend CRUD**: Step/condition replacement on PUT, locked role guards (403), official role deletion guard (403), creator_id persistence, exclude_unset partial update, dependency eager loading, check-name endpoint
- **Frontend components**: All wizard step components (BasicInfoStep, AbilitiesStep, WinConditionsStep, ReviewStep), Wizard navigation/state, RoleBuilder page create flow, parameter initialization, modifier label text, win condition label text, primary toggle visibility/auto-clear, team sort utility (sort + group functions), team section header rendering, useAbilities hook, useDrafts hook (CRUD, corruption recovery, quota), RoleCard badge rendering, GameSetup multi-copy selection/dependency cascade, ErrorBanner component, API client methods, routing
- **Roles Listing Filters**: Filter button rendering (3 buttons with correct text), default filter state (`aria-pressed` assertions), toggle refetch logic, prevent-all-off guard, page title/subtitle text, `useRoles` hook visibility-driven fetching, `rolesApi.list` array serialization, backend multi-visibility query (`GET /api/roles?visibility=official&visibility=private`), single visibility backward compat, no-param-returns-all
- **Wake Order Gating**: Default `wake_order: 0` in `createEmptyDraft()` and `createMockDraft()`, clearing input produces 0 not null, label text "Wake Order (0–40)", "Does not wake up" hint presence at 0 and null / absence at >0, AbilitiesStep gating banner at 0 and null, palette interactivity at >0, steps-exist warning at 0 with steps / no warning at >0, steps preserved (not deleted) when wake_order returns to 0

---

## Manual QA Checklist

### 1. Role Builder Wizard — UI & Navigation

**Covers:** Wizard AC5–AC13
**Why manual:** Visual rendering, step indicator UX, navigation flow, live API integration

#### 1.1 Route & Page Load

| | Step | Expected |
|---|------|----------|
| [x] | Navigate to `http://localhost:3000/roles/new` | Page loads with "Create New Role" heading and subtitle |
| [x] | Observe step indicator | 4 steps visible: "Basic Info", "Abilities", "Win Conditions", "Review"; "Basic Info" is active/highlighted; others are dimmed |
| [x] | Click "✏️ New Role" in the sidebar | Navigates to `/roles/new` |

#### 1.2 Basic Info Step

| | Step | Expected |
|---|------|----------|
| [x] | Observe empty form | Name empty; Team defaults to "Village"; Description empty; Wake Order defaults to **0** with **"Does not wake up"** hint visible below the input; Votes defaults to 1 |
| [x] | Type "Se" in the Name field, wait ~500ms | "Checking..." appears below the field briefly, then "Taken ✗" (Seer exists as official role) |
| [x] | Clear name, type "My Custom Role", wait ~500ms | "Checking..." appears, then "Available ✓" |
| [x] | Observe "Next" button with empty name | Button is disabled (grayed out, not-allowed cursor) |
| [x] | Enter a name with 2+ characters | "Next" button becomes enabled |
| [x] | Click each of the 5 team buttons: Village, Werewolf, Vampire, Alien, Neutral | Each highlights with its distinct team color; only one is active at a time |
| [x] | Select "Werewolf" team | "Primary team role" checkbox appears below the team buttons with subtext: "At least 1 primary team role is required when any role of this team is included in a game." |
| [x] | Select "Village" team | "Primary team role" checkbox disappears |
| [x] | Select "Neutral" team | "Primary team role" checkbox remains hidden |

#### 1.3 Abilities Step

| | Step | Expected |
|---|------|----------|
| [x] | Click "Next" from Basic Info (with valid name) | Navigates to Abilities step; step indicator updates; abilities load from backend |
| [x] | Observe category tabs | 5 tabs visible: "Card Actions", "Information", "Physical", "State Changes", "Other" |
| [x] | Click "Information" tab | Tab highlights; palette updates to show information-type abilities |
| [ ] | Click an ability button (e.g., "View Card") | New step appears in the "Ability Steps" list with order #1; **no modifier dropdown** shown for the first step |
| [ ] | Click another ability (e.g., "Swap Card") | Step #2 appears; **"Then:" label** appears before a modifier dropdown showing "And then" (default) |
| [ ] | Open the modifier dropdown on step #2 | Options show descriptive text: "And then", "Or instead", "Only if" |
| [ ] | Click ↓ (Move Down) on step #1 | Steps swap positions; orders renumber correctly |
| [ ] | Click the remove button (×) on a step | Step removed; remaining steps renumber |
| [ ] | Add an ability that has parameters (e.g., "View Card" which has a `count` parameter) | Inline parameter input appears on the step row: a number input initialized to 1 |
| [ ] | Add an ability with a string/enum parameter (e.g., "Change To Team") | Inline `<select>` dropdown appears with appropriate options |

#### 1.4 Win Conditions Step

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Next" from Abilities step | Navigates to Win Conditions step |
| [ ] | Click "Add Win Condition" | New condition appears with type dropdown, "Primary win condition" checkbox with subtext "(Only one allowed per role)", and "Independent win" checkbox with subtext "(Wins regardless of team outcome)" |
| [ ] | Check "Primary win condition" on a condition, then add a second and check its "Primary" | First condition's primary is auto-cleared; only one primary at a time |
| [ ] | Change win condition type via dropdown | Type updates |
| [ ] | Click remove on a condition | Condition removed from list |

#### 1.5 Review Step & Submission

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Next" from Win Conditions step | Review step loads; step indicator shows all 4 steps as reachable |
| [ ] | Observe summary | All fields displayed: Name, Team, Description, Wake Order, Votes, Ability Steps with order/name and **descriptive modifier labels** ("And then" not raw "and"), Win Conditions with type/primary flag |
| [ ] | Observe validation section (valid role) | After ~1 second debounce, green "Valid" indicator appears; no errors |
| [ ] | Click "Create Role" | Button text changes to "Saving..."; on success, navigates to `/roles` |
| [ ] | Verify listing page | Roles page loads; new role is visible (if "My Roles" filter is active — see Section 6) |
| [ ] | Click a completed step in the step indicator (e.g., "Basic Info") | Navigates back to that step with all data preserved |

#### 1.6 Review Step — Validation Feedback

| | Step | Expected |
|---|------|----------|
| [ ] | Create a role with no win conditions, navigate to Review | Red error(s) appear: "At least one win condition is required"; "Create Role" button is disabled |
| [ ] | Create a role with 6+ ability steps and navigate to Review | Yellow warning appears: role has many ability steps |
| [ ] | Create a role with ability steps and wake_order set to 0, navigate to Review | Warning about wake_order appears |
| [ ] | Enter "Seer" as the role name (exists as official); navigate to Review | Validation returns duplicate name error |

---

### 2. Role Card UI — Badges & Team Grouping

**Covers:** Copies AC2, AC4; Team Sort AC2, AC3
**Why manual:** Visual badge rendering, colored section headers, layout correctness

#### 2.1 Roles Page Team Grouping

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `http://localhost:3000/roles` | Roles are grouped under colored team section headers in order: Village, Werewolf, Vampire, Alien, Neutral |
| [ ] | Observe header colors | Each team header is rendered in its distinct team color |

#### 2.2 RoleCard Copy Count Badge

| | Step | Expected |
|---|------|----------|
| [ ] | Observe Werewolf card on `/roles` (min=1, max=2) | Badge displays "×1–2" in the card footer |
| [ ] | Observe Mason card (min=2, max=2) | Badge displays "×2" |
| [ ] | Observe Villager card (min=1, max=3) | Badge displays "×1–3" |
| [ ] | Observe Seer card (max=1) | No copy-count badge visible |

#### 2.3 GameSetup Team Grouping & Badges

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `http://localhost:3000/games/new` | Roles grouped under colored team section headers (same order as Roles page) |
| [ ] | Observe copy-count badges | Same badges appear on cards in the game setup grid |

#### 2.4 GameSetup Multi-Copy & Dependencies

| | Step | Expected |
|---|------|----------|
| [ ] | Click a role with max_count > 1 (e.g., Werewolf) | Role is selected with default_count copies; +/– buttons appear |
| [ ] | Click + to increase, – to decrease | Count adjusts within min/max bounds; visual counter updates |
| [ ] | Select a role with a dependency (e.g., Apprentice Tanner) | Required role (Tanner) is auto-selected |
| [ ] | Remove the required role (Tanner) | Dependent role (Apprentice Tanner) is cascade-removed |

---

### 3. Local Draft Storage

**Covers:** Drafts AC4, AC7, AC10
**Why manual:** Real browser localStorage persistence, corruption recovery

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles/new`; enter a role name "Refresh Test" and select team "Werewolf" | Form shows the entered data |
| [ ] | Open DevTools → Application → Local Storage → `localhost:3000` | Entry `yourwolf_drafts` exists with JSON data |
| [ ] | Hard-refresh the page (Cmd+Shift+R) | Page reloads; wizard state depends on auto-save integration — check if draft persists or resets |
| [ ] | In DevTools, manually set `yourwolf_drafts` to `"not-valid-json{{{"` then refresh | Page loads normally; no crash; drafts fall back to empty |
| [ ] | In DevTools, set `yourwolf_drafts` to `"just a string"` (valid JSON but not an array), then refresh | Page loads normally; drafts fall back to empty |

---

### 4. Backend Health & Config

**Covers:** Backend Audit AC2, AC14
**Why manual:** Real database connectivity, environment-specific startup behavior

| | Step | Expected |
|---|------|----------|
| [ ] | `curl http://localhost:8000/api/health` | `{"status": "healthy"}` |
| [ ] | `curl http://localhost:8000/api/health/db` | `{"status": "connected"}` |
| [ ] | Stop the PostgreSQL container: `docker compose stop db`, then `curl http://localhost:8000/api/health/db` | 503 response with `{"status": "disconnected"}` — no stack trace or internal error details leaked |
| [ ] | Restart DB: `docker compose start db`, then re-check | Returns `{"status": "connected"}` again |

---

### 5. End-to-End: Full Role Creation Flow

**Covers:** Cross-feature integration
**Why manual:** Multi-step flow spanning frontend wizard → backend API → database → redirect

| | Step | Expected |
|---|------|----------|
| [ ] | Click "✏️ New Role" in the sidebar | Wizard loads at `/roles/new` |
| [ ] | **Basic Info**: Enter name "Night Stalker", select "Werewolf" team, check "Primary team role", add description, set wake_order to 5, votes to 1 | All fields populated; name check shows "Available ✓"; primary team role checkbox is checked |
| [ ] | Click "Next" | Abilities step loads; abilities palette populates from backend |
| [ ] | **Abilities**: Click "View Card" → click "Swap Card" | Two steps: #1 View Card (no modifier), #2 Swap Card (shows "Then: And then"); parameter inputs visible if applicable |
| [ ] | Click "Next" | Win Conditions step loads |
| [ ] | **Win Conditions**: Add a condition, set type, check "Primary win condition" | One primary condition configured; subtext "(Only one allowed per role)" visible |
| [ ] | Click "Next" | Review step loads; summary shows all data including descriptive modifier labels |
| [ ] | Wait ~1 second for validation | Green "Valid" indicator appears; "Create Role" button is enabled |
| [ ] | Click "Create Role" | Button shows "Saving..."; navigates to `/roles` on success |
| [ ] | Verify the roles listing page | Roles page loads with filters visible; new role "Night Stalker" appears under the "Werewolf" team header ("My Roles" filter is active by default) |

---

### 6. Roles Listing Filters

**Covers:** Filters AC2, AC3, AC4, AC7
**Why manual:** Visual filter button styling, live API filtering, end-to-end create-to-listing flow

#### 6.1 Filter Button Appearance & Defaults

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `http://localhost:3000/roles` | Page title reads "Roles"; subtitle reads "Browse and manage your werewolf roles" |
| [ ] | Observe filter buttons below the header | 3 pill-style buttons visible: "Official", "My Roles", "Downloaded" |
| [ ] | Observe default active state | "Official" and "My Roles" buttons appear active (colored border + tinted background); "Downloaded" appears inactive (muted) |

#### 6.2 Filter Toggle Behavior

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Downloaded" button | Button becomes active; roles list refreshes to include public-visibility roles (may be empty if none exist) |
| [ ] | Click "My Roles" button to deactivate it | Button becomes inactive; any private-visibility roles disappear from the list |
| [ ] | Click "My Roles" again to reactivate | Button becomes active; private roles reappear |
| [ ] | Deactivate filters until only one remains active (e.g., only "Official") | One button remains active |
| [ ] | Click the last remaining active filter | Button stays active — click is a no-op; list does not change |

#### 6.3 New Role Appears in Filtered List

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `/roles/new` and create a minimal valid role (name: "Filter Test Role", team: Village, at least 1 win condition) | Role creation succeeds |
| [ ] | Observe redirect | Browser navigates to `/roles` |
| [ ] | Observe "My Roles" filter is active by default | "My Roles" button shows active styling |
| [ ] | Look for "Filter Test Role" in the roles list | Role appears under the "Village" team header |
| [ ] | Deactivate "My Roles" filter | "Filter Test Role" disappears from the list |
| [ ] | Reactivate "My Roles" filter | "Filter Test Role" reappears |

---

### 7. Wake Order Gating — Ability Step Editing

**Covers:** Wake Order Gating AC1 (visual), AC3 (visual), AC4, AC5, AC6
**Why manual:** Visual disabled/enabled state, opacity styling, multi-step wizard interaction flow

#### 7.1 Default Wake Order & Hint Display

| | Step | Expected |
|---|------|----------|
| [ ] | Navigate to `http://localhost:3000/roles/new` | Wake Order input displays **0**; below the input, muted hint text reads **"Does not wake up"** |
| [ ] | Change Wake Order to **5** | Hint text **"Does not wake up" disappears**; input shows 5 |
| [ ] | Clear the Wake Order input (select all, delete) | Input resets to **0**; hint text **"Does not wake up" reappears** |

#### 7.2 AbilitiesStep Gating — Disabled State

| | Step | Expected |
|---|------|----------|
| [ ] | With Wake Order at **0**, click "Next" to reach Abilities step | **Gating banner** visible: "This role does not wake up. Set a Wake Order ≥ 1 in Basic Info to add abilities." |
| [ ] | Observe the ability palette below the banner | Palette is **visually disabled** (reduced opacity ~0.5); ability buttons are **not clickable** (pointer-events disabled) |
| [ ] | Attempt to click an ability button (e.g., "View Card") | **Nothing happens** — no step is added to the list |

#### 7.3 AbilitiesStep Gating — Enabled State

| | Step | Expected |
|---|------|----------|
| [ ] | Click "Back" to return to Basic Info; set Wake Order to **5** | Wake Order updates; "Does not wake up" hint disappears |
| [ ] | Click "Next" to return to Abilities step | **Gating banner is gone**; palette is fully opaque and interactive |
| [ ] | Click an ability button (e.g., "View Card") | Step #1 appears in the ability steps list |

#### 7.4 Steps Preserved with Warning

| | Step | Expected |
|---|------|----------|
| [ ] | With Wake Order at **5** on the Abilities step, add 2 ability steps (e.g., "View Card" then "Swap Card") | Steps #1 and #2 appear in the list |
| [ ] | Click "Back" to Basic Info; change Wake Order to **0** | Wake Order shows 0; hint reappears |
| [ ] | Click "Next" to return to Abilities step | **Gating banner** visible; **additional warning** reads: "This role has ability steps but is set to not wake up. These steps won't execute unless you set a Wake Order ≥ 1." |
| [ ] | Observe the previously-added steps | Steps #1 (View Card) and #2 (Swap Card) are **still listed** (read-only, not deleted) |
| [ ] | Click "Back"; set Wake Order to **3**; click "Next" | Gating banner and warning are **gone**; steps are still present and palette is interactive again |

#### 7.5 Legacy Null Wake Order (localStorage)

| | Step | Expected |
|---|------|----------|
| [ ] | Open DevTools → Application → Local Storage → `localhost:3000`. Set `yourwolf_drafts` to `[{"id":"test","name":"Legacy Test","team":"village","description":"","wake_order":null,"votes":1,"is_primary_team_role":false,"ability_steps":[],"win_conditions":[]}]` | Entry saved |
| [ ] | Navigate to `/roles/new` (or refresh if already there) | Draft loads; Wake Order input shows **blank** (null renders as empty); **"Does not wake up" hint is visible** |
| [ ] | Click "Next" to Abilities step | **Gating banner** is shown — null is treated the same as 0 |

---

## Cross-Cutting Concerns

### Performance
- [ ] **Validation debounce** — Rapidly change wizard fields and check DevTools Network tab. **Expected:** Only one validation call fires after ~1 second of inactivity (not one per keystroke)
- [ ] **Name check debounce** — Rapidly type in the name field and check DevTools Network tab. **Expected:** Only one check-name call fires after ~500ms of inactivity

### Accessibility
- [ ] **Wizard keyboard navigation** — Tab through all wizard fields, buttons, and step indicators. **Expected:** All interactive elements reachable via keyboard; focus order is logical
- [ ] **Form labels** — Click on labels for Name, Description, Wake Order, Votes fields. **Expected:** Clicking a label focuses the corresponding input
- [ ] **GameSetup +/– buttons** — Tab to +/– buttons and press Enter/Space. **Expected:** Buttons activate via keyboard

### Responsive Layout
- [ ] **Wizard on narrow viewport** — Resize browser to ~375px width on `/roles/new`. **Expected:** Step indicator wraps or scrolls; form fields stack vertically; buttons remain accessible
- [ ] **RoleCard badges on narrow viewport** — Resize browser to ~375px on `/roles`. **Expected:** Badges don't overlap card content; cards stack in single column

---

## Notes

- The wizard creates roles with `visibility: 'private'` and `creator_id: null` by default (no auth yet). Created roles appear on the Roles page when the "My Roles" filter is active (it is active by default).
- Local draft storage auto-save (Drafts AC10) is an integration contract between `useDrafts` and the wizard's `RoleBuilder.tsx`. Verify by inspecting `yourwolf_drafts` in localStorage during wizard use.
- Docker Compose frontend runs on port **3000** (not 5173).
