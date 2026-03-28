# Test Audit — Staged Reduction Plan

> **Scope:** Full monorepo (yourwolf-backend + yourwolf-frontend)
> **Goal:** Remove low-value tests to reduce maintenance burden while preserving all meaningful behavioral coverage.
> **Estimated reduction:** ~80 tests across both projects.

---

## Phase 1: Safe Removals (~50 tests, zero risk)

Tests that can be deleted with no loss of behavioral coverage. These test static values, framework behavior, duplicate other tests, or assert implementation details.

### Backend (~25 tests)

#### test_health.py — Remove 4 tests

| Test | Reason |
|------|--------|
| `test_health_endpoint_accepts_get_method` | Exact duplicate of `test_health_check_returns_healthy` |
| `test_health_db_endpoint_accepts_get_method` | Exact duplicate of `test_database_health_check_returns_connected` |
| `test_health_returns_json_content_type` | Framework behavior — FastAPI always returns JSON for dict |
| `test_health_db_returns_json_content_type` | Framework behavior |

#### test_models.py — Remove 10 tests

| Test | Reason |
|------|--------|
| `TestTeamEnum.test_team_values` | Asserts enum string literals — constants, not logic |
| `TestTeamEnum.test_team_is_string_enum` | Asserts isinstance on enum — language behavior |
| `TestVisibilityEnum.test_visibility_values` | Enum literal assertions |
| `TestStepModifierEnum.test_step_modifier_values` | Enum literal assertions |
| `TestDependencyTypeEnum.test_dependency_type_values` | Enum literal assertions |
| `TestDependencyTypeEnum.test_dependency_type_is_string_enum` | Language behavior |
| `TestRoleModel.test_role_all_teams` | Tests ORM can write each enum — framework behavior |
| `TestRoleModel.test_role_visibility_values` | Tests ORM can write each visibility — framework behavior |
| `TestAbilityStepModel.test_step_modifiers` | Tests ORM can write each modifier — framework behavior |
| (total: 9–10 enum/ORM tests) | |

#### test_schemas.py — Remove ~11 tests

| Test | Reason |
|------|--------|
| `TestRoleReadSchema.test_from_dict` | Tests Pydantic can deserialize a dict |
| `TestRoleListItemSchema.test_from_dict` | Tests Pydantic can deserialize a dict |
| `TestAbilityReadSchema.test_from_dict` | Tests Pydantic can deserialize a dict |
| `TestRoleDependencyResponseSchema.test_from_dict` | Tests Pydantic can deserialize a dict |
| `TestRoleDependencyResponseSchema.test_recommends_type` | Same as above with different enum value |
| `TestRoleListResponseSchema.test_pagination_fields` | Tests field existence — constructor verifies |
| `TestWinConditionCreateSchema.test_minimal` | "Can I construct this?" — no validation logic |
| `TestWinConditionCreateSchema.test_full` | Same |
| `TestAbilityStepCreateInRoleSchema.test_minimal` | Same |
| `TestAbilityStepCreateInRoleSchema.test_full` | Same |
| `TestRoleCreateCardCounts.test_werewolf_card_counts` | Identical pattern as `test_valid_custom_card_counts` |

### Frontend (~25 tests)

#### Delete entire files (3 files, ~35 tests)

| File | Reason |
|------|--------|
| `theme.test.ts` | Asserts static hex color values and spacing strings. Zero logic. |
| `types.test.ts` | Tests TypeScript interfaces at runtime. Compiler already validates these. |
| `client.test.ts` | Heavily mocked — tests mock wiring, not behavior. |

#### Remove individual tests

| Test | File | Reason |
|------|------|--------|
| `renders as header element` (duplicate of `renders header element`) | `Header.test.tsx` | Exact duplicate |
| `renders container div`, `wraps children in page-content div`, `applies background color style` | `Layout.test.tsx` | Tests CSS class names / inline styles |
| `displays feature icons`, `renders main container`, `has heading with proper level`, 2 hover tests | `Home.test.tsx` | Tests emoji content, DOM types, heading levels, inline CSS hover |
| `renders as a div element`, 4 hover/focus interaction tests | `RoleCard.test.tsx` | Tests container element type and inline style transforms |
| `renders Layout wrapper` | `App.test.tsx` | Tests CSS class name `.app-container` |
| `returns array of RoleListItem`, `returns array of official roles` | `roles.api.test.ts` | Tautological — checks `Array.isArray()` after mock returns array |
| `returns roles array`, `returns loading boolean`, `returns error as null or string`, `provides refetch function that can be called` | `useRoles.test.ts` | Tests return type/shape — already covered by functional tests above them |

---

## Phase 2: Consolidation of Redundant Layers (~30 tests)

### Backend: Remove redundant role service tests

The router tests in `test_roles.py` exercise the service layer through real DB calls. Remove 18 basic CRUD tests from `test_role_service.py` that are redundant with router tests:

**Remove these classes/tests from `test_role_service.py`:**
- `TestRoleServiceListRoles` — Remove 6 basic tests: `test_list_roles_empty`, `test_list_roles_with_data`, `test_list_roles_filter_team`, `test_list_roles_filter_visibility`, `test_list_roles_pagination_first_page`, `test_list_roles_pagination_second_page`
- `TestRoleServiceGetRole` — Remove all 4: `test_get_role_found`, `test_get_role_not_found`, `test_get_role_includes_ability_steps`, `test_get_role_includes_win_conditions`
- `TestRoleServiceCreateRole` — Remove 5: `test_create_role_minimal`, `test_create_role_with_optional_fields`, `test_create_role_with_ability_steps`, `test_create_role_with_win_conditions`, `test_create_role_generates_uuid`
- `TestRoleServiceUpdateRole` (basic CRUD) — Remove all 4: `test_update_role_success`, `test_update_role_locked_raises_permission_error`, `test_update_role_not_found`, `test_update_role_partial`

**Keep in `test_role_service.py`:**
- `TestRoleServiceUpdateRoleStepsAndConditions` (7 unique tests)
- `test_list_roles_pagination_beyond_data`, `test_list_roles_calculates_pages`, `test_list_roles_returns_is_primary_team_role` (unique edge cases)
- `TestRoleServiceCreateRoleCreatorId` (2 unique tests)
- `TestRoleServiceCreateRole.test_create_role_persists_is_primary_team_role` (unique field test)
- `TestRoleServiceDeleteRole` — Remove all 4 (redundant with `test_roles.py` delete tests)

### Backend: Slim down games router tests

Keep `test_game_service.py` as the thorough service layer. Remove these from `test_games_router.py`:

- `TestListGamesEndpoint.test_lists_games`
- `TestGetGameEndpoint` (both tests)
- `TestStartGameEndpoint` (all 3 tests)
- `TestAdvancePhaseEndpoint` (both tests)
- `TestDeleteGameEndpoint` (both tests)

**Keep in `test_games_router.py`:**
- `TestCreateGameEndpoint` (both tests — tests HTTP 201 and 400 status)
- `TestFullGameLifecycle` (unique E2E test)
- `TestGetNightScriptEndpoint` (both tests — tests script endpoint wiring)
- `TestCardCountValidationEndpoint` (both tests — tests HTTP 400 from validation)
- `TestDependencyValidationEndpoint` (all 3 tests — tests HTTP 400/201 + warnings)

### Backend: Minor redundancies in test_roles.py and test_schemas.py

| Remove | File | Reason |
|--------|------|--------|
| `test_list_roles_filter_by_team_and_visibility` | `test_roles.py` | Combined filter adds no new logic |
| `test_list_official_roles_pagination` | `test_roles.py` | Pagination already tested on `/api/roles` |
| `test_create_role_missing_description` | `test_roles.py` | Schema tests verify; router just delegates to Pydantic |
| `test_create_role_missing_team` | `test_roles.py` | Same |
| `test_create_role_invalid_team` | `test_roles.py` | Same |
| `test_create_role_name_too_long` | `test_roles.py` | Same |
| `test_get_role_includes_win_conditions` | `test_roles.py` | Merge into ability_steps test (same fixture/endpoint) |
| `test_get_ability_returns_correct_schema` | `test_abilities.py` | Overlaps with `test_get_ability_by_type_success` |

---

## Phase 3: No Structural Refactors Needed

The remaining test suite is well-organized. No rewrites or parameterization needed.

---

## Guiding Principles for Future Tests

### When to add a test
- New business rule or validation constraint
- New error handling path (especially user-facing errors)
- Complex logic with multiple branches (script generation, dependency resolution)
- Edge cases that caused or could cause bugs in production

### When NOT to add a test
- Static configuration values (theme colors, enum string literals)
- TypeScript types (the compiler verifies these)
- Framework behavior (FastAPI returns JSON, Pydantic validates fields, SQLAlchemy writes enums)
- "Can I construct this object?" — unless there's validation logic in the constructor
- Duplicate coverage at a different layer with no unique assertions

### Preferred patterns
- Test at one layer: prefer **router tests** for CRUD operations (they exercise the full stack). Add **service tests** only for logic not reachable through the router.
- Use parameterized tests for multiple similar inputs instead of separate test functions.
- Assert **behavior**, not **implementation** (don't test CSS class names, DOM element types, or inline style values).

### Anti-patterns to avoid
- Testing enum literal string values
- Testing that Pydantic/SQLAlchemy/FastAPI works correctly
- Duplicate coverage across service + router for simple CRUD
- Frontend tests for static constants or TypeScript compile-time guarantees
- Tests that verify mocks return what you told them to return
