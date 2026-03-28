# Phase 3: Manual QA Test Plan

**Date:** March 28, 2026
**Mode:** Release QA Plan
**Scope:** Role Builder Wizard (all 13 features delivered in Phase 3)
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
| [x] | Observe empty form | Name empty; Team defaults to "Village"; Description empty; Wake Order empty; Votes defaults to 1 |
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
| [ ] | Click "Create Role" | Button text changes to "Saving..."; on success, navigates to `/roles/{new-role-id}` |
| [ ] | Verify created role page | Detail page shows all data entered in the wizard |
| [ ] | Click a completed step in the step indicator (e.g., "Basic Info") | Navigates back to that step with all data preserved |

#### 1.6 Review Step — Validation Feedback

| | Step | Expected |
|---|------|----------|
| [ ] | Create a role with no win conditions, navigate to Review | Red error(s) appear: "At least one win condition is required"; "Create Role" button is disabled |
| [ ] | Create a role with 6+ ability steps and navigate to Review | Yellow warning appears: role has many ability steps |
| [ ] | Create a role with ability steps but no wake_order, navigate to Review | Warning about wake_order appears |
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
| [ ] | Click "Create Role" | Button shows "Saving..."; navigates to `/roles/{id}` on success |
| [ ] | Verify the new role's detail page | Name, team, description, wake_order, votes, ability steps, and win conditions all match what was entered |

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

- The wizard creates roles with `visibility: 'private'` and `creator_id: null` by default (no auth yet). Created roles may not appear on the official roles list — check the role detail page directly via the redirect URL.
- Local draft storage auto-save (Drafts AC10) is an integration contract between `useDrafts` and the wizard's `RoleBuilder.tsx`. Verify by inspecting `yourwolf_drafts` in localStorage during wizard use.
- Docker Compose frontend runs on port **3000** (not 5173).
