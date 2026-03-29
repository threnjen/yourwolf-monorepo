# Phase 3: Role Builder MVP — Summary

> **Create custom roles by selecting from predefined abilities**

## Overview

Phase 3 delivers the Role Builder MVP — a 4-step wizard for creating custom roles by composing abilities and win conditions, backed by a validation service, CRUD ownership enhancements, multi-copy role selection with dependency management, client-side draft persistence, and full-stack code quality audits.

**Prerequisites**: Phase 2 (Game Facilitation) complete

---

## Features Delivered

| # | Feature | Area | ACs | Tests Added |
|---|---------|------|-----|-------------|
| 1 | [Role Builder Wizard](#1-role-builder-wizard) | Frontend | 13 | 50+ |
| 2 | [Role Validation Service](#2-role-validation-service) | Backend | 12 | 28 |
| 3 | [Role CRUD Ownership](#3-role-crud-ownership) | Backend | 10 | 13 |
| 4 | [Role Card Copies & Dependency Auto-Selection](#4-role-card-copies--dependency-auto-selection) | Full-stack | 11 | 14 |
| 5 | [Role Cards Sort by Team](#5-role-cards-sort-by-team) | Frontend | 3 | 15 |
| 6 | [Local Draft Storage](#6-local-draft-storage) | Frontend | 10 | 11 |
| 7 | [Primary Team Role Toggle](#7-primary-team-role-toggle) | Frontend | 7 | 5 |
| 8 | [Ability Step Parameters](#8-ability-step-parameters) | Frontend | 8 | 8 |
| 9 | [Modifier Dropdown Labels](#9-modifier-dropdown-labels) | Frontend | 5 | 4 |
| 10 | [Win Condition Labels](#10-win-condition-labels) | Frontend | 5 | 4 |
| 11 | [Backend Code Audit](#11-backend-code-audit) | Backend | 20 | — |
| 12 | [Frontend Code Audit](#12-frontend-code-audit) | Frontend | 18 | — |
| 13 | [Test Audit](#13-test-audit) | Full-stack | 8 | −126 |

---

## Acceptance Criteria by Feature

### 1. Role Builder Wizard

4-step wizard (Basic Info → Abilities → Win Conditions → Review) for creating custom roles.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Types for `RoleDraft`, `ValidationResult`, `NameCheckResult`, `Ability` | Done |
| AC2 | API methods: `validate`, `checkName`, `create` + `draftToPayload` helper | Done |
| AC3 | Abilities API client (`GET /abilities/`) | Done |
| AC4 | `useAbilities` hook | Done |
| AC5 | `/roles/new` route (before `/roles` to avoid conflicts) | Done |
| AC6 | `RoleBuilderPage` with draft state, validation debounce, and save handler | Done |
| AC7 | Wizard shell (4 steps, step indicator, nav buttons; `canProceed`: name ≥ 2 chars for step 1) | Done |
| AC8 | `BasicInfoStep` — name with debounced duplicate check, team, description, wake_order, votes | Done |
| AC9 | `AbilitiesStep` — category palette, add/remove/reorder/modifier | Done |
| AC10 | `WinConditionsStep` — add/remove/primary toggle/type change | Done |
| AC11 | `ReviewStep` — summary + validation display (null→validating, errors red, warnings yellow, valid green) | Done |
| AC12 | Mock factories for testing (`createMockAbility`, `createMockDraft`) | Done |
| AC13 | Sidebar navigation link (`✏️ New Role` → `/roles/new`) | Done |

**Key files**: `src/pages/RoleBuilder.tsx`, `src/components/RoleBuilder/Wizard.tsx`, `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `AbilitiesStep.tsx`, `WinConditionsStep.tsx`, `ReviewStep.tsx`, `src/api/roles.ts`, `src/api/abilities.ts`, `src/hooks/useAbilities.ts`, `src/routes.tsx`, `src/components/Sidebar.tsx`, `src/types/role.ts`

---

### 2. Role Validation Service

Two new API endpoints — `POST /api/roles/validate` (dry-run) and `GET /api/roles/check-name` (duplicate detection).

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `POST /api/roles/validate` accepts `RoleCreate`, returns `{ is_valid, errors, warnings }` without persisting | Done |
| AC2 | `GET /api/roles/check-name?name=X` returns `{ name, is_available, message }` | Done |
| AC3 | Name validation: minimum 2 chars, maximum 50 chars (after strip) | Done |
| AC4 | Duplicate name check: case-insensitive against public + official roles | Done |
| AC5 | Ability step validation: `ability_type` must reference an active `Ability` | Done |
| AC6 | First step must have modifier `none` | Done |
| AC7 | Step orders must be sequential starting at 1, no gaps/duplicates | Done |
| AC8 | Win condition: at least one required | Done |
| AC9 | Win condition: exactly one primary | Done |
| AC10 | Wake order: 0–20 if present (Pydantic schema-level) | Done |
| AC11 | Warnings: >5 steps, steps without wake_order, conflicting abilities | Done |
| AC12 | Validation errors returned as list of human-readable strings | Done |

**Key files**: `app/services/role_service.py` (`validate_role`, `check_duplicate_name`, `get_warnings`), `app/routers/roles.py`, `app/schemas/role.py` (`RoleValidationResponse`, `RoleNameCheckResponse`)

---

### 3. Role CRUD Ownership

Full ability step and win condition replacement on update, official role deletion guard, and `creator_id` on role creation.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `PUT /api/roles/{id}` accepts optional `ability_steps` list — replaces all existing steps | Done |
| AC2 | `PUT /api/roles/{id}` accepts optional `win_conditions` list — replaces all existing conditions | Done |
| AC3 | `PUT /api/roles/{id}` on a locked role returns 403 | Done |
| AC4 | `DELETE /api/roles/{id}` on an official role returns 403 | Done |
| AC5 | `DELETE /api/roles/{id}` on a locked role returns 403 | Done |
| AC6 | `RoleUpdate` schema extended with optional `ability_steps` and `win_conditions` | Done |
| AC7 | When `ability_steps` provided on update, old steps deleted and new ones created | Done |
| AC8 | When `win_conditions` provided on update, old conditions deleted and new ones created | Done |
| AC9 | `creator_id` accepted on `POST /api/roles/` and stored | Done |
| AC10 | Fields not provided in `RoleUpdate` left unchanged (`exclude_unset=True`) | Done |

**Key files**: `app/schemas/role.py` (`RoleUpdate`), `app/services/role_service.py` (`update_role`, `delete_role`, `create_role`)

---

### 4. Role Card Copies & Dependency Auto-Selection

Multi-copy role selection with +/– quantity controls, copy-count badges, and automatic REQUIRES dependency management.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `RoleListItem` TS type includes `default_count`, `min_count`, `max_count` | Done |
| AC2 | `RoleCard` displays copy count badge when `max_count > 1` | Done |
| AC3 | Clicking a role adds `default_count` copies | Done |
| AC4 | +/– buttons adjust count between `min_count` and `max_count` | Done |
| AC5 | Mason (`min=max=2`) adds/removes atomically; no +/– buttons | Done |
| AC6 | Backend `RoleListItem` includes `dependencies` field (eager-loaded) | Done |
| AC7 | Frontend `RoleListItem` includes `dependencies` field | Done |
| AC8 | Selecting a role auto-selects its REQUIRES dependencies | Done |
| AC9 | Removing a required role cascade-removes dependents | Done |
| AC10 | Removing a dependent does NOT remove the required role (one-way) | Done |
| AC11 | QA test plan updated with multi-copy and dependency sections | Done |

**Key files**: `src/pages/GameSetup.tsx`, `src/components/RoleCard.tsx`, `src/types/role.ts`, `app/schemas/role.py`, `app/services/role_service.py`

---

### 5. Role Cards Sort by Team

Team-based sorting and grouping on the Roles page and GameSetup page with colored section headers.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Shared utility with canonical team ordering (Village → Werewolf → Vampire → Alien → Neutral) and sort/group functions | Done |
| AC2 | `Roles.tsx` groups roles by team with section headers | Done |
| AC3 | `GameSetup.tsx` groups roles by team with section headers | Done |

**Key files**: `src/utils/roleSort.ts` (`TEAM_ORDER`, `sortRolesByTeam`, `groupRolesByTeam`), `src/pages/Roles.tsx`, `src/pages/GameSetup.tsx`

---

### 6. Local Draft Storage

Client-side draft persistence using localStorage so work-in-progress role configurations survive page refreshes.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `useDrafts` hook provides CRUD operations for drafts in localStorage | Done |
| AC2 | Saving a new draft persists it; saving an existing draft (same ID) updates it | Done |
| AC3 | Deleting a draft removes it from storage | Done |
| AC4 | Drafts survive page refresh (loaded from localStorage on mount) | Done |
| AC5 | `getDraft(id)` returns a specific draft or `null` | Done |
| AC6 | `clearAllDrafts()` removes all drafts | Done |
| AC7 | Corrupted/invalid localStorage data handled gracefully (fallback to empty array) | Done |
| AC8 | `RoleDraft` type from role-builder-wizard is the shape stored | Done |
| AC9 | Draft list can be displayed to the user (drafts array exposed by hook) | Done |
| AC10 | Auto-save: wizard draft changes saved automatically (integration with role-builder-wizard) | Done |

**Key files**: `src/hooks/useDrafts.ts`, `src/types/role.ts`

**Review note**: A high-severity race condition (sync effect clobbering localStorage on mount) was found during review and fixed by switching to a lazy `useState` initializer.

---

### 7. Primary Team Role Toggle

Conditional checkbox in `BasicInfoStep` for werewolf/vampire/alien teams with auto-clear on team switch.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `RoleDraft` type includes `is_primary_team_role: boolean` | Done |
| AC2 | `RoleListItem` type includes `is_primary_team_role: boolean` | Done |
| AC3 | `createEmptyDraft()` initializes `is_primary_team_role` to `false` | Done |
| AC4 | Checkbox appears when team is werewolf, vampire, or alien | Done |
| AC5 | Checkbox hidden when team is village or neutral | Done |
| AC6 | Changing team to village/neutral auto-clears to `false` | Done |
| AC7 | `draftToPayload()` includes `is_primary_team_role` in API payload | Done |

**Key files**: `src/types/role.ts`, `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, `src/pages/RoleBuilder.tsx`, `src/api/roles.ts`

---

### 8. Ability Step Parameters

Inline parameter inputs on ability step rows based on `parameters_schema`.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Renders inline parameter inputs when `properties` is non-empty | Done |
| AC2 | `string` + `enum` → `<select>` with enum values | Done |
| AC3 | `string` without `enum` → `<select>` with `STRING_TARGET_OPTIONS` (12 predefined options) | Done |
| AC4 | `integer` → `<input type="number">` initialized to `default ?? 1` | Done |
| AC5 | `array`-of-integer → comma-separated `<input type="text">` | Done |
| AC6 | Param values stored in `step.parameters`, propagated via `onChange` | Done |
| AC7 | Empty `properties` renders no inputs (early-return guard) | Done |
| AC8 | Required params labelled `*`; optional labelled `(optional)` | Done |

**Key files**: `src/components/RoleBuilder/steps/AbilitiesStep.tsx` (`StepParameterInputs` sub-component, `handleParameterChange`, `STRING_TARGET_OPTIONS`)

---

### 9. Modifier Dropdown Labels

Hide modifier dropdown for step 1; show "Then:" label with descriptive option text for subsequent steps.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | First step (index 0) does NOT render a modifier dropdown | Done |
| AC2 | Steps at index > 0 show "Then:" label before dropdown | Done |
| AC3 | Dropdown options show descriptive text ("And then" / "Or instead" / "Only if"), values stay raw | Done |
| AC4 | `StepModifier` type and data model unchanged | Done |
| AC5 | `ReviewStep` shows descriptive modifier labels | Done |

**Key files**: `src/components/RoleBuilder/steps/AbilitiesStep.tsx` (`MODIFIER_LABELS`), `src/components/RoleBuilder/steps/ReviewStep.tsx`

---

### 10. Win Condition Labels

Renamed checkbox labels with descriptive subtext for clarity.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | "Primary" checkbox label renamed to "Primary win condition" | Done |
| AC2 | Subtext "(Only one allowed per role)" appears near Primary checkbox | Done |
| AC3 | "Overrides team" checkbox label renamed to "Independent win" | Done |
| AC4 | Subtext "(Wins regardless of team outcome)" appears near Independent win checkbox | Done |
| AC5 | Existing checkbox behavior unchanged | Done |

**Key files**: `src/components/RoleBuilder/steps/WinConditionsStep.tsx`

---

### 11. Backend Code Audit

20 acceptance criteria covering security, bugs, performance, architecture, and code quality across the backend.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Wire `is_primary_team_role` through service layer | Done |
| AC2 | Fix DB health endpoint (503 + no error leak) | Done |
| AC3 | Add `from e` to exception re-raises | Done |
| AC4 | Convert f-string logging to lazy `%s`-style | Done |
| AC5 | Remove hardcoded `DATABASE_URL` default | Done |
| AC6 | Domain exceptions in GameService (replaced HTTPException with ValueError) | Done |
| AC7 | Batch ability-type queries (N+1 fix) | Done |
| AC8 | Use eager-loaded `role.team` in `start_game` | Done |
| AC9 | Type hints on `types.py` override methods | Done |
| AC10 | Parameterize dict type hints (`dict` → `dict[str, Any]`) | Done |
| AC11 | Constrain ENVIRONMENT config to `Literal` | Done |
| AC12 | Extract `AbilityService` from router | Done |
| AC13 | Extract `_build_dependency_response` helper | Done |
| AC14 | Startup config validation (via pydantic-settings) | Done |
| AC15 | Restrict CORS methods/headers (no wildcards) | Done |
| AC16 | Clean up schemas `__all__` | Done |
| AC17 | Remove dead code in seed + narrow exception to `SQLAlchemyError` | Done |
| AC18 | Standardize games router style (status constants + consistent route prefix) | Done |
| AC19 | GameSession `__repr__` verification (already exists — finding was incorrect) | Done |
| AC20 | Generic `PaginatedResponse[T]` base schema | Done |

**Key files**: `app/config.py`, `app/main.py`, `app/models/types.py`, `app/models/ability.py`, `app/models/ability_step.py`, `app/routers/health.py`, `app/routers/games.py`, `app/routers/abilities.py`, `app/services/ability_service.py` (new), `app/services/game_service.py`, `app/services/role_service.py`, `app/services/script_service.py`, `app/schemas/base.py` (new), `app/schemas/__init__.py`, `app/seed/__init__.py`, `app/seed/abilities.py`, `app/seed/roles.py`

---

### 12. Frontend Code Audit

18 acceptance criteria covering type safety, DRY refactoring, security, decomposition, and code removal.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Unify `AbilityStep`/`AbilityStepDraft` types (type alias) | Done |
| AC2 | Merge identical `stepItemStyles`/`wcItemStyles` in ReviewStep | Done |
| AC3 | Remove orphaned `dashboard/` directory | Done |
| AC4 | Guard `gameId` in GameFacilitator (split into Page + Content) | Done |
| AC5 | Fix no-op `useCallback` in Timer (replaced with `useRef` latest-value pattern) | Done |
| AC6 | Add `draftToPayload` return type (`RoleCreatePayload` interface) | Done |
| AC7 | Decompose `GameSetup.tsx` (extracted `useGameSetup` hook; page reduced ~407 → 273 lines) | Done |
| AC8 | Replace magic numbers (circle geometry, warning threshold, input bounds) | Done |
| AC9 | Validate API_URL fallback (scoped localhost to DEV mode) | Done |
| AC10 | Sanitize error logging (structured log object instead of raw `error.response.data`) | Done |
| AC11 | Standardize component return types (removed explicit `React.ReactElement`) | Done |
| AC12 | Fix inconsistent destructuring in `games.ts` | Done |
| AC13 | Create shared `ErrorBanner` component (`role="alert"`, optional dismiss) | Done |
| AC14 | Extract `capitalize` utility | Done |
| AC15 | Extract shared `TEAM_COLORS` (central record replaces 3 local copies) | Done |
| AC16 | Extract shared page styles (`loadingStyles`, `errorStyles`, `pageContainerStyles`) | Done |
| AC17 | Extract shared `selectStyles` | Done |
| AC18 | Create generic `useFetch` hook (reduces boilerplate in `useRoles`, `useAbilities`, `useGame`) | Done |

**Key files**: `src/types/role.ts`, `src/pages/GameFacilitator.tsx`, `src/pages/GameSetup.tsx`, `src/components/Timer.tsx`, `src/api/client.ts`, `src/api/games.ts`, `src/api/roles.ts`, `src/styles/theme.ts`, `src/styles/shared.ts` (new), `src/components/ErrorBanner.tsx` (new), `src/components/RoleCard.tsx`, `src/hooks/useGameSetup.ts` (new), `src/hooks/useFetch.ts` (new)

---

### 13. Test Audit

Removed ~126 low-value tests to reduce maintenance burden while keeping coverage above 80%.

| AC | Description | Status |
|----|-------------|--------|
| AC1 | Remove 4 duplicate/framework tests from `test_health.py` | Done |
| AC2 | Remove ~10 enum/ORM framework tests from `test_models.py` | Done |
| AC3 | Remove ~11 `from_dict`/construction tests from `test_schemas.py` | Done |
| AC4 | Delete `theme.test.ts`, `types.test.ts`, `client.test.ts` (~35 tests) | Done |
| AC5 | Remove individual frontend tests (implementation details) | Done |
| AC6 | Slim `test_role_service.py` (remove redundant CRUD) | Done |
| AC7 | Slim `test_games_router.py` (remove redundant wrappers) | Done |
| AC8 | Minor redundancies in `test_roles.py` and `test_abilities.py` | Done |

**Result**: 248 → 184 backend tests, 305 → 243 frontend tests (427 total remaining). Backend coverage: 85.64%.

---

## Files Changed — All Features

### New Files Created

| File | Feature |
|------|---------|
| `yourwolf-frontend/src/api/abilities.ts` | Role Builder Wizard |
| `yourwolf-frontend/src/hooks/useAbilities.ts` | Role Builder Wizard |
| `yourwolf-frontend/src/hooks/useDrafts.ts` | Local Draft Storage |
| `yourwolf-frontend/src/hooks/useFetch.ts` | Frontend Audit |
| `yourwolf-frontend/src/hooks/useGameSetup.ts` | Frontend Audit |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/RoleBuilder/steps/WinConditionsStep.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx` | Role Builder Wizard |
| `yourwolf-frontend/src/components/ErrorBanner.tsx` | Frontend Audit |
| `yourwolf-frontend/src/styles/shared.ts` | Frontend Audit |
| `yourwolf-frontend/src/utils/roleSort.ts` | Role Cards Sort by Team |
| `yourwolf-backend/app/services/ability_service.py` | Backend Audit |
| `yourwolf-backend/app/schemas/base.py` | Backend Audit |

### Files Deleted

| File | Feature |
|------|---------|
| `yourwolf-frontend/src/dashboard/` (entire directory) | Frontend Audit |
| `yourwolf-frontend/src/test/theme.test.ts` | Test Audit |
| `yourwolf-frontend/src/test/types.test.ts` | Test Audit |
| `yourwolf-frontend/src/test/client.test.ts` | Test Audit |

### Key Modified Files

| File | Features |
|------|----------|
| `yourwolf-frontend/src/types/role.ts` | Wizard, Primary Toggle, Copies, Drafts, Frontend Audit |
| `yourwolf-frontend/src/api/roles.ts` | Wizard, Primary Toggle, Frontend Audit |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Copies, Sort by Team, Frontend Audit |
| `yourwolf-frontend/src/components/RoleCard.tsx` | Copies, Frontend Audit |
| `yourwolf-frontend/src/routes.tsx` | Wizard |
| `yourwolf-frontend/src/components/Sidebar.tsx` | Wizard |
| `yourwolf-frontend/src/api/client.ts` | Frontend Audit |
| `yourwolf-frontend/src/styles/theme.ts` | Frontend Audit |
| `yourwolf-backend/app/services/role_service.py` | Validation, CRUD Ownership, Copies, Backend Audit |
| `yourwolf-backend/app/schemas/role.py` | Validation, CRUD Ownership, Copies, Backend Audit |
| `yourwolf-backend/app/routers/roles.py` | Validation, CRUD Ownership |
| `yourwolf-backend/app/routers/games.py` | Backend Audit |
| `yourwolf-backend/app/routers/health.py` | Backend Audit |
| `yourwolf-backend/app/config.py` | Backend Audit |
| `yourwolf-backend/app/main.py` | Backend Audit |

---

## Test Results Summary

| Feature | Before | After | Delta |
|---------|--------|-------|-------|
| Role Builder Wizard | — | 50+ new tests | +50 |
| Role Validation Service | 212 passed | 240 passed | +28 |
| Role CRUD Ownership | 209 passed | 209 passed | +13 (offset by pre-existing) |
| Role Card Copies | 186 BE / 180 FE | 187 BE / 193 FE | +14 |
| Role Cards Sort by Team | 243 FE | 258 FE | +15 |
| Local Draft Storage | — | 11 new tests | +11 |
| Primary Team Role Toggle | 258 FE | 263 FE | +5 |
| Ability Step Parameters | 266 FE | 274 FE | +8 |
| Modifier Dropdown Labels | 275 FE | 279 FE | +4 |
| Win Condition Labels | 279 FE | 283 FE | +4 |
| Test Audit | 553 total | 427 total | −126 |

---

## Architecture Decisions

1. **Frontend-only role sorting** — Canonical team ordering implemented in a shared utility rather than a backend `sort` parameter, since the full role list is already fetched client-side.
2. **Full replacement for steps/conditions on update** — `PUT` replaces all ability steps and win conditions rather than diffing, using delete + re-create within a single transaction. Simpler to reason about and test.
3. **Lazy `useState` initializer for drafts** — Replaced mount `useEffect` + `useState([])` with a synchronous lazy initializer to eliminate a race condition that could wipe drafts.
4. **`MODIFIER_LABELS` duplicated in two files** — A simple 4-entry map is duplicated in `AbilitiesStep.tsx` and `ReviewStep.tsx` rather than extracted to a shared utility. Pragmatic choice for a small constant.
5. **Generic `useFetch` hook** — Reduces boilerplate in data-fetching hooks; `useRoles`, `useAbilities`, and `useGame` all delegate to it.
6. **`PaginatedResponse[T]` generic base** — Avoids repeated pagination field definitions across response schemas.
7. **Domain exceptions in services** — `GameService` raises `ValueError` instead of `HTTPException`; routers translate to HTTP responses. Keeps service layer framework-agnostic.
8. **No wildcard CORS** — Explicit method and header lists replace `*` for both `allow_methods` and `allow_headers`.

---

## Related Documents

- Planning: [PHASE_3_ROLE_BUILDER_MVP.md](PHASE_3_ROLE_BUILDER_MVP.md)
- QA: [PHASE_3_QA.md](PHASE_3_QA.md)
- Per-feature implementation records, plans, reviews, and task checklists are in their respective subdirectories under `docs/phases/PHASE_3/`.
