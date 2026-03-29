# Phase 3: AC Coverage Map

**Date:** March 28, 2026

This map classifies every Phase 3 acceptance criterion by automated coverage and manual QA need.

---

## Feature 1: Role Builder Wizard (13 ACs)

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | Types for RoleDraft, ValidationResult, etc. | TypeScript compilation | No | Type correctness is compile-time verified |
| AC2 | API methods: validate, checkName, create + draftToPayload | roles.api.test.ts | No | Request/response shapes unit tested |
| AC3 | Abilities API client | abilities.api.test.ts | No | Request/response shapes unit tested |
| AC4 | useAbilities hook | useAbilities.test.ts | No | Hook behavior unit tested |
| AC5 | /roles/new route | routes.test.tsx | No | Route presence unit tested |
| AC6 | RoleBuilderPage with draft state, validation debounce, save | RoleBuilder.test.tsx | Partial | Debounce timing and save UX (spinner, redirect) need visual confirmation |
| AC7 | Wizard shell (4 steps, indicator, nav, canProceed) | Wizard.test.tsx | Yes | Visual step indicator, disabled states, navigation UX |
| AC8 | BasicInfoStep — name check, team, fields | BasicInfoStep.test.tsx (6 tests) | Yes | Live debounced name check against real API, visual team color highlights |
| AC9 | AbilitiesStep — palette, add/remove/reorder | AbilitiesStep.test.tsx (12+ tests) | Yes | Visual palette layout, drag/reorder UX, loading state |
| AC10 | WinConditionsStep — add/remove/primary/type | WinConditionsStep.test.tsx (8+ tests) | Yes | Visual condition list UX, checkbox behavior |
| AC11 | ReviewStep — summary + validation display | ReviewStep.test.tsx (8+ tests) | Yes | Visual validation indicators (colors), summary layout |
| AC12 | Mock factories | Test infrastructure | No | Internal test tooling |
| AC13 | Sidebar "New Role" link | Sidebar.test.tsx | No | Link presence unit tested |

---

## Feature 2: Role Validation Service (12 ACs)

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | POST /api/roles/validate returns {is_valid, errors, warnings} | test_role_validation.py (28 tests) | No | Response shape and all validation rules extensively unit tested |
| AC2 | GET /api/roles/check-name returns availability | test_role_validation.py | No | Endpoint behavior unit tested |
| AC3 | Name validation: 2–50 chars | test_role_validation.py | No | Boundary values unit tested |
| AC4 | Duplicate name check (case-insensitive) | test_role_validation.py | No | Case-insensitive logic unit tested |
| AC5 | ability_type must reference active Ability | test_role_validation.py | No | Foreign key validation unit tested |
| AC6 | First step modifier must be "none" | test_role_validation.py | No | Pure logic, assertable |
| AC7 | Step orders sequential, no gaps/duplicates | test_role_validation.py | No | Pure logic, assertable |
| AC8 | At least one win condition | test_role_validation.py | No | Pure logic, assertable |
| AC9 | Exactly one primary win condition | test_role_validation.py | No | Pure logic, assertable |
| AC10 | Wake order 0–40 (Pydantic constraint) | test_schemas.py | No | Schema validation unit tested |
| AC11 | Warnings: >5 steps, no wake_order, conflicts | test_role_validation.py | No | Warning logic unit tested |
| AC12 | Errors as human-readable strings | test_role_validation.py | No | String content unit tested |

---

## Feature 3: Role CRUD Ownership (10 ACs)

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | PUT replaces ability_steps | test_role_service.py, test_roles.py | No | Replacement logic unit tested |
| AC2 | PUT replaces win_conditions | test_role_service.py, test_roles.py | No | Replacement logic unit tested |
| AC3 | PUT on locked role → 403 | test_roles.py | No | Guard logic unit tested |
| AC4 | DELETE official role → 403 | test_roles.py | No | Guard logic unit tested |
| AC5 | DELETE locked role → 403 | test_roles.py | No | Guard logic unit tested |
| AC6 | RoleUpdate schema extended | test_schemas.py | No | Schema shape unit tested |
| AC7 | Old steps deleted, new created on update | test_role_service.py | No | Transactional logic unit tested |
| AC8 | Old conditions deleted, new created | test_role_service.py | No | Transactional logic unit tested |
| AC9 | creator_id stored on POST | test_roles.py | No | Field persistence unit tested |
| AC10 | exclude_unset=True on PUT | test_role_service.py | No | Partial update logic unit tested |

---

## Feature 4: Role Card Copies & Dependencies (11 ACs)

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | RoleListItem includes count fields | TypeScript compilation | No | Type shape |
| AC2 | RoleCard displays copy count badge | RoleCard.test.tsx | Yes | Visual badge rendering (position, styling) |
| AC3 | Clicking role adds default_count copies | GameSetup.test.tsx | No | Click behavior unit tested |
| AC4 | +/– adjusts count within bounds | GameSetup.test.tsx | Yes | Visual +/– button UX, counter display |
| AC5 | Mason atomic add/remove, no +/– | GameSetup.test.tsx | No | Logic unit tested |
| AC6 | Backend includes dependencies (eager loaded) | test_roles.py | No | Query/response unit tested |
| AC7 | Frontend RoleListItem includes dependencies | TypeScript compilation | No | Type shape |
| AC8 | Selecting role auto-selects dependencies | GameSetup.test.tsx | Yes | Visual cascade UX — cards highlight together |
| AC9 | Removing required role cascades | GameSetup.test.tsx | Yes | Visual cascade UX — cards deselect together |
| AC10 | Removing dependent doesn't remove required | GameSetup.test.tsx | No | One-way logic unit tested |
| AC11 | QA plan updated | Documentation | No | N/A |

---

## Feature 5: Role Cards Sort by Team (3 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | Shared utility with canonical ordering | roleSort.test.ts (11 tests) | No | Sort/group functions unit tested |
| AC2 | Roles.tsx groups by team with section headers | Roles.test.tsx ("team sorting and grouping") | Yes | Visual colored section headers, proper grouping layout |
| AC3 | GameSetup.tsx groups by team with section headers | GameSetup.test.tsx ("team sorting and grouping") | Yes | Visual colored section headers in game setup context |

---

## Feature 6: Local Draft Storage (10 ACs)

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | useDrafts provides CRUD | useDrafts.test.ts (11 tests) | No | Hook behavior unit tested |
| AC2 | Save new / update existing | useDrafts.test.ts | No | Persistence logic unit tested |
| AC3 | Delete removes from storage | useDrafts.test.ts | No | Delete logic unit tested |
| AC4 | Drafts survive page refresh | useDrafts.test.ts (mocked) | Yes | Real browser localStorage + real page refresh needed |
| AC5 | getDraft(id) returns specific draft | useDrafts.test.ts | No | Getter logic unit tested |
| AC6 | clearAllDrafts() | useDrafts.test.ts | No | Clear logic unit tested |
| AC7 | Corrupted data handled gracefully | useDrafts.test.ts | Yes | Real browser behavior with corrupted localStorage |
| AC8 | RoleDraft type stored | TypeScript compilation | No | Type shape |
| AC9 | Drafts array exposed | useDrafts.test.ts | No | Hook return value unit tested |
| AC10 | Auto-save integration | N/A | Yes | Integration between wizard and useDrafts in real browser |

---

## Feature 7: Primary Team Role Toggle (7 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | RoleDraft includes is_primary_team_role | TypeScript compilation | No | Type shape |
| AC2 | RoleListItem includes is_primary_team_role | TypeScript compilation | No | Type shape |
| AC3 | createEmptyDraft initializes to false | Unit tested | No | Default value assertable |
| AC4 | Checkbox appears for werewolf/vampire/alien | BasicInfoStep.test.tsx | Yes | Visual checkbox appearance, conditional rendering UX |
| AC5 | Hidden for village/neutral | BasicInfoStep.test.tsx | No | DOM presence unit tested |
| AC6 | Team switch auto-clears to false | BasicInfoStep.test.tsx | No | State transition unit tested |
| AC7 | draftToPayload includes field | roles.api.test.ts | No | Payload shape unit tested |

---

## Feature 8: Ability Step Parameters (8 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | Renders inline inputs when properties non-empty | AbilitiesStep.test.tsx | Yes | Visual inline parameter rendering alongside ability steps |
| AC2 | string+enum → select with enum values | AbilitiesStep.test.tsx | Yes | Visual select dropdown rendering |
| AC3 | string without enum → select with target options | AbilitiesStep.test.tsx | Yes | Visual select with 12 predefined options |
| AC4 | integer → number input with default | AbilitiesStep.test.tsx | Yes | Visual number input rendering |
| AC5 | array-of-integer → comma-separated text input | AbilitiesStep.test.tsx | Yes | Visual text input, comma formatting UX |
| AC6 | Values stored in step.parameters | AbilitiesStep.test.tsx | No | State update unit tested |
| AC7 | Empty properties → no inputs | AbilitiesStep.test.tsx | No | Guard logic unit tested |
| AC8 | Required/optional labels | AbilitiesStep.test.tsx | Yes | Visual label clarity (* vs optional) |

---

## Feature 9: Modifier Dropdown Labels (5 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | First step no modifier dropdown | AbilitiesStep.test.tsx | No | DOM presence unit tested |
| AC2 | "Then:" label for subsequent steps | AbilitiesStep.test.tsx | Yes | Visual label placement and clarity |
| AC3 | Descriptive option text | AbilitiesStep.test.tsx | Yes | Visual dropdown option text UX |
| AC4 | StepModifier type unchanged | TypeScript compilation | No | Type shape |
| AC5 | ReviewStep shows descriptive labels | ReviewStep.test.tsx | Yes | Visual modifier labels in review summary |

---

## Feature 10: Win Condition Labels (5 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | "Primary win condition" label | WinConditionsStep.test.tsx | Yes | Visual label clarity |
| AC2 | "(Only one allowed per role)" subtext | WinConditionsStep.test.tsx | Yes | Visual subtext positioning |
| AC3 | "Independent win" label | WinConditionsStep.test.tsx | Yes | Visual label clarity |
| AC4 | "(Wins regardless of team outcome)" subtext | WinConditionsStep.test.tsx | Yes | Visual subtext positioning |
| AC5 | Existing checkbox behavior unchanged | WinConditionsStep.test.tsx | No | Behavior unit tested |

---

## Feature 11: Backend Code Audit (20 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | is_primary_team_role wired through service | test_role_service.py | No | Field propagation unit tested |
| AC2 | DB health endpoint: 503 + no error leak | test_health.py (3 tests) | Yes | Real DB failure scenario; verify no sensitive data leaks |
| AC3 | Exception re-raises with `from e` | Code quality | No | Static analysis, not runtime behavior |
| AC4 | Lazy %s logging | Code quality | No | Logging format, no user-facing impact |
| AC5 | No hardcoded DATABASE_URL | Config | No | Startup behavior, covered by config validation |
| AC6 | GameService domain exceptions | test_game_service.py | No | Exception types unit tested |
| AC7 | Batch ability-type queries | test_role_validation.py | No | Query optimization; correctness unit tested |
| AC8 | Eager-loaded role.team | test_game_service.py | No | Query behavior unit tested |
| AC9 | Type hints on types.py | Static analysis | No | Code quality |
| AC10 | Parameterized dict hints | Static analysis | No | Code quality |
| AC11 | ENVIRONMENT Literal constraint | Config | No | Startup validation |
| AC12 | AbilityService extraction | test_abilities.py | No | Refactoring; behavior unchanged |
| AC13 | _build_dependency_response helper | test_roles.py | No | Refactoring; behavior unchanged |
| AC14 | Startup config validation | N/A | Yes | Misconfigured environment variables should fail fast with clear error |
| AC15 | CORS restriction (no wildcards) | N/A | Yes | Security: verify cross-origin requests are properly restricted |
| AC16 | Schemas __all__ cleanup | Static analysis | No | Code quality |
| AC17 | Seed cleanup | Seed scripts | No | Not runtime behavior |
| AC18 | Games router style | test_games_router.py | No | Refactoring; behavior unchanged |
| AC19 | GameSession __repr__ | test_models.py | No | Unit tested |
| AC20 | PaginatedResponse[T] | test_schemas.py | No | Schema shape unit tested |

---

## Feature 12: Frontend Code Audit (18 ACs) — NOT IN CURRENT QA DOC

| AC | Description | Automated Coverage | Manual QA? | Reason |
|----|-------------|-------------------|------------|--------|
| AC1 | Unify AbilityStep types | TypeScript compilation | No | Type alias |
| AC2 | Merge identical styles in ReviewStep | Code quality | No | Visual unchanged |
| AC3 | Remove orphaned dashboard/ | File deletion | No | No user-facing impact |
| AC4 | Guard gameId in GameFacilitator | GameFacilitator.test.tsx | No | Error guard unit tested |
| AC5 | Fix Timer useCallback | Timer.test.tsx | No | Behavior unit tested |
| AC6 | draftToPayload return type | TypeScript compilation | No | Type safety |
| AC7 | Decompose GameSetup.tsx | GameSetup.test.tsx | No | Refactoring; behavior unchanged |
| AC8 | Replace magic numbers | Code quality | No | No behavior change |
| AC9 | API_URL fallback scoped to DEV | N/A | Yes | Environment-specific: verify prod build doesn't fall back to localhost |
| AC10 | Sanitize error logging | Code quality | No | Internal logging |
| AC11 | Standardize component return types | TypeScript compilation | No | Type consistency |
| AC12 | Fix destructuring in games.ts | Code quality | No | No behavior change |
| AC13 | ErrorBanner component | ErrorBanner.test.tsx (5 tests) | Yes | Visual alert rendering, dismiss UX |
| AC14 | capitalize utility | Unit tested | No | Pure function |
| AC15 | Shared TEAM_COLORS | Code quality | No | Refactoring; visual unchanged |
| AC16 | Shared page styles | Code quality | No | Visual unchanged |
| AC17 | Shared selectStyles | Code quality | No | Visual unchanged |
| AC18 | (Listed in summary only up to 17) | — | — | — |

---

## Feature 13: Test Audit (8 ACs) — NOT IN CURRENT QA DOC

All ACs relate to test infrastructure quality. **No manual QA needed.**

---

## Items to REMOVE from Current QA Doc

The following items in the current QA doc test pure validation/business logic already covered by automated tests:

### Section 2.1 — POST /api/roles/validate (14 items)
All 14 items test validation rules (name length, step ordering, win condition counts, ability type checks, warnings, wake_order constraints). These are extensively covered by 28+ dedicated validation tests in `test_role_validation.py`. **Remove all — replace with single smoke-test item.**

### Section 2.2 — GET /api/roles/check-name (5 items)
All 5 items test name checking logic (availability, case sensitivity, empty string, whitespace). Covered by unit tests. **Remove all — replace with single smoke-test item.**

### Section 3.1 — Update with Step/Condition Replacement (6 items)
All 6 items test CRUD replacement logic. Covered by `test_role_service.py` and `test_roles.py`. **Remove all.**

### Section 3.2 — Locked & Official Role Guards (4 items)
All 4 items test guard logic (403 responses). Covered by unit tests. **Remove all.**

### Section 3.3 — Creator ID (3 items)
All 3 items test simple field persistence. Covered by unit tests. **Remove all.**

### Section 4.1 — Backend Dependencies on List Endpoint (4 items)
All 4 items test response shapes and eager loading. Covered by unit tests. **Remove all — fold into E2E flow verification.**

---

## Summary

| Category | Current QA Items | Should Remove | Should Add | Net Change |
|----------|-----------------|---------------|------------|------------|
| Section 2 (Validation API) | 19 | 19 | 1 (smoke test) | -18 |
| Section 3 (CRUD) | 13 | 13 | 0 | -13 |
| Section 4.1 (Dependencies API) | 4 | 4 | 0 | -4 |
| Feature 5 (Team Sort) | 0 | 0 | 2 | +2 |
| Feature 7 (Primary Toggle) | 0 | 0 | 1 | +1 |
| Feature 8 (Step Parameters) | 0 | 0 | 4 | +4 |
| Feature 9 (Modifier Labels) | 0 | 0 | 2 | +2 |
| Feature 10 (WinCon Labels) | 0 | 0 | 2 | +2 |
| Feature 11 (Backend Audit) | 0 | 0 | 3 | +3 |
| Feature 12 (Frontend Audit) | 0 | 0 | 2 | +2 |

**Net result:** Remove ~36 items that duplicate automated tests; add ~19 items for missing features. QA plan becomes more focused and actionable.
