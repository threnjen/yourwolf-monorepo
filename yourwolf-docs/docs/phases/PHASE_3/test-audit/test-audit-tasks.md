# Test Audit — Task Checklist

> Each task corresponds to a specific file edit. Check off as completed.

---

## Phase 1: Safe Removals

### Backend

- [ ] **test_health.py** — Remove 4 tests:
  - `test_health_endpoint_accepts_get_method`
  - `test_health_db_endpoint_accepts_get_method`
  - `test_health_returns_json_content_type`
  - `test_health_db_returns_json_content_type`

- [ ] **test_models.py** — Remove `TestTeamEnum` class (2 tests)
- [ ] **test_models.py** — Remove `TestVisibilityEnum` class (1 test)
- [ ] **test_models.py** — Remove `TestStepModifierEnum` class (1 test)
- [ ] **test_models.py** — Remove `TestDependencyTypeEnum` class (2 tests)
- [ ] **test_models.py** — Remove `TestRoleModel.test_role_all_teams`
- [ ] **test_models.py** — Remove `TestRoleModel.test_role_visibility_values`
- [ ] **test_models.py** — Remove `TestAbilityStepModel.test_step_modifiers`

- [ ] **test_schemas.py** — Remove `TestRoleReadSchema.test_from_dict`
- [ ] **test_schemas.py** — Remove `TestRoleListItemSchema.test_from_dict`
- [ ] **test_schemas.py** — Remove `TestAbilityReadSchema.test_from_dict`
- [ ] **test_schemas.py** — Remove `TestRoleDependencyResponseSchema.test_from_dict`
- [ ] **test_schemas.py** — Remove `TestRoleDependencyResponseSchema.test_recommends_type`
- [ ] **test_schemas.py** — Remove `TestRoleListResponseSchema.test_pagination_fields`
- [ ] **test_schemas.py** — Remove `TestWinConditionCreateSchema` class (2 tests)
- [ ] **test_schemas.py** — Remove `TestAbilityStepCreateInRoleSchema` class (2 tests)
- [ ] **test_schemas.py** — Remove `TestRoleCreateCardCounts.test_werewolf_card_counts`

### Frontend

- [ ] **Delete** `src/test/theme.test.ts` entirely
- [ ] **Delete** `src/test/types.test.ts` entirely
- [ ] **Delete** `src/test/client.test.ts` entirely

- [ ] **Header.test.tsx** — Remove `renders as header element` from `styling` describe block
- [ ] **Layout.test.tsx** — Remove `renders container div`, `wraps children in page-content div`, `applies background color style`
- [ ] **Home.test.tsx** — Remove from `features section`: `displays feature icons`
- [ ] **Home.test.tsx** — Remove from `styling`: `renders main container`, `has heading with proper level`
- [ ] **Home.test.tsx** — Remove from `interactions`: `applies hover styles on CTA button mouse enter`, `removes hover styles on CTA button mouse leave`
- [ ] **RoleCard.test.tsx** — Remove from `accessibility`: `renders as a div element`
- [ ] **RoleCard.test.tsx** — Remove from `interactions`: all 4 tests (hover enter/leave, focus/blur)
- [ ] **App.test.tsx** — Remove `renders Layout wrapper`
- [ ] **roles.api.test.ts** — Remove `returns array of RoleListItem` from `list` describe
- [ ] **roles.api.test.ts** — Remove `returns array of official roles` from `listOfficial` describe
- [ ] **useRoles.test.ts** — Remove entire `returned values` describe block (3 tests)
- [ ] **useRoles.test.ts** — Remove `provides refetch function that can be called` from `refetch behavior`

### Phase 1 Verification

- [ ] Run backend tests: `cd yourwolf-backend && python -m pytest tests/ -v`
- [ ] Run frontend tests: `cd yourwolf-frontend && npx vitest run`
- [ ] Confirm no test failures introduced

---

## Phase 2: Redundancy Consolidation

### Backend: Slim test_role_service.py

- [ ] Remove `TestRoleServiceListRoles` — Remove 6 tests: `test_list_roles_empty`, `test_list_roles_with_data`, `test_list_roles_filter_team`, `test_list_roles_filter_visibility`, `test_list_roles_pagination_first_page`, `test_list_roles_pagination_second_page`
- [ ] Remove `TestRoleServiceGetRole` — Remove all 4 tests
- [ ] Remove `TestRoleServiceCreateRole` — Remove 5 tests: `test_create_role_minimal`, `test_create_role_with_optional_fields`, `test_create_role_with_ability_steps`, `test_create_role_with_win_conditions`, `test_create_role_generates_uuid`
- [ ] Remove `TestRoleServiceUpdateRole` — Remove all 4 basic CRUD tests
- [ ] Remove `TestRoleServiceDeleteRole` — Remove all 4 tests

**Keep intact in test_role_service.py:**
- `TestRoleServiceListRoles.test_list_roles_pagination_beyond_data`
- `TestRoleServiceListRoles.test_list_roles_calculates_pages`
- `TestRoleServiceListRoles.test_list_roles_returns_is_primary_team_role`
- `TestRoleServiceCreateRole.test_create_role_persists_is_primary_team_role`
- `TestRoleServiceCreateRoleCreatorId` (2 tests)
- `TestRoleServiceUpdateRoleStepsAndConditions` (all 7 tests)

### Backend: Slim test_games_router.py

- [ ] Remove `TestListGamesEndpoint` class (1 test)
- [ ] Remove `TestGetGameEndpoint` class (2 tests)
- [ ] Remove `TestStartGameEndpoint` class (3 tests)
- [ ] Remove `TestAdvancePhaseEndpoint` class (2 tests)
- [ ] Remove `TestDeleteGameEndpoint` class (2 tests)

**Keep intact in test_games_router.py:**
- `TestCreateGameEndpoint` (2 tests)
- `TestFullGameLifecycle` (1 test)
- `TestGetNightScriptEndpoint` (2 tests)
- `TestCardCountValidationEndpoint` (2 tests)
- `TestDependencyValidationEndpoint` (3 tests)

### Backend: Minor redundancies

- [ ] **test_roles.py** — Remove `test_list_roles_filter_by_team_and_visibility`
- [ ] **test_roles.py** — Remove `test_list_official_roles_pagination`
- [ ] **test_roles.py** — Remove `test_create_role_missing_description`
- [ ] **test_roles.py** — Remove `test_create_role_missing_team`
- [ ] **test_roles.py** — Remove `test_create_role_invalid_team`
- [ ] **test_roles.py** — Remove `test_create_role_name_too_long`
- [ ] **test_roles.py** — Merge `test_get_role_includes_win_conditions` into `test_get_role_includes_ability_steps` (assert both in one test)
- [ ] **test_abilities.py** — Remove `test_get_ability_returns_correct_schema`

### Phase 2 Verification

- [ ] Run backend tests: `cd yourwolf-backend && python -m pytest tests/ -v`
- [ ] Run frontend tests: `cd yourwolf-frontend && npx vitest run`
- [ ] Confirm no test failures introduced
- [ ] Verify coverage has not decreased on critical paths (role validation, game lifecycle, script generation)

---

## Final Tally

| Phase | Backend Removed | Frontend Removed | Total |
|-------|----------------|-----------------|-------|
| Phase 1 | ~25 | ~25 | ~50 |
| Phase 2 | ~30 | 0 | ~30 |
| **Total** | **~55** | **~25** | **~80** |
