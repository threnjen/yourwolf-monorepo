# YourWolf Backend — Full Code Audit Report

**Date:** 2026-03-27
**Scope:** Full codebase — `yourwolf-backend/`
**Auditor:** GitHub Copilot (Code Auditor mode)

---

## Audit Metadata

| Metric | Value |
|--------|-------|
| Total files audited | 46 |
| Application source files | 31 |
| Dependency manifests | 3 |
| Test files | 12 |
| Findings — Critical | 0 |
| Findings — High | 6 |
| Findings — Medium | 19 |
| Findings — Low | 8 |

### Files Audited

**Application source (31):**
- `app/__init__.py`, `app/config.py`, `app/database.py`, `app/main.py`
- `app/models/__init__.py`, `app/models/types.py`, `app/models/role.py`, `app/models/ability.py`, `app/models/ability_step.py`, `app/models/game_session.py`, `app/models/game_role.py`, `app/models/role_dependency.py`, `app/models/user.py`, `app/models/win_condition.py`
- `app/routers/__init__.py`, `app/routers/abilities.py`, `app/routers/games.py`, `app/routers/health.py`, `app/routers/roles.py`
- `app/schemas/__init__.py`, `app/schemas/ability.py`, `app/schemas/game.py`, `app/schemas/role.py`
- `app/seed/__init__.py`, `app/seed/__main__.py`, `app/seed/abilities.py`, `app/seed/roles.py`
- `app/services/__init__.py`, `app/services/game_service.py`, `app/services/role_service.py`, `app/services/script_service.py`

**Dependency manifests (3):**
- `requirements.txt`, `requirements-dev.txt`, `pyproject.toml`

**Test files (12):**
- `tests/__init__.py`, `tests/conftest.py`, `tests/test_abilities.py`, `tests/test_game_service.py`, `tests/test_games_router.py`, `tests/test_health.py`, `tests/test_models.py`, `tests/test_role_service.py`, `tests/test_role_validation.py`, `tests/test_roles.py`, `tests/test_schemas.py`, `tests/test_script_service.py`

---

## Findings by Category

### 1. Cleanup & Condensing

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/seed/__init__.py` | L43 | Low | Dead code | `if __name__ == "__main__": run_seed()` in `__init__.py` is unreachable — `__init__.py` is never executed as `__main__`. The `__main__.py` module already handles this entry point. |
| 2 | `app/schemas/__init__.py` | L1-46 | Low | Incomplete `__all__` | `__all__` is missing `RoleValidationResponse`, `RoleNameCheckResponse`, `RoleDependencyResponse`, `RoleListItem`, `AbilityStepInRole`, `AbilityStepCreateInRole`. Routers import directly from submodules so it doesn't break functionality, but the re-export package is incomplete. |

### 2. Errors & Defects

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/services/role_service.py` | L85-100 | **High** | Bug: `is_primary_team_role` missing from `list_roles` response | `RoleListItem` constructor in `list_roles` does not pass `r.is_primary_team_role`. The schema field defaults to `False`, so **all roles appear as non-primary in list responses**, regardless of their actual value. |
| 2 | `app/services/role_service.py` | L155-191 | **High** | Bug: `is_primary_team_role` missing from `get_role` response | `RoleRead` constructor in `get_role` does not pass `role.is_primary_team_role`. Same defaulting-to-`False` issue. |
| 3 | `app/services/role_service.py` | L198-213 | **High** | Bug: `is_primary_team_role` not persisted on create | `Role()` constructor in `create_role` never passes `role_data.is_primary_team_role`. The DB column defaults to `False`, so the user-provided value is silently dropped. |
| 4 | `app/services/role_service.py` | L214-222 | Medium | Silent failure: unknown ability_type skipped on create | During `create_role`, if an `ability_type` isn't found in the DB, the step is silently skipped with no error or warning. The user receives a role with fewer ability steps than they requested. |
| 5 | `app/routers/health.py` | L33-37 | **High** | DB health returns HTTP 200 on failure | `database_health_check` returns HTTP 200 with `{"status": "disconnected"}` when the database is unreachable. Health monitoring systems expecting non-200 for unhealthy will be misled. Should return 503 Service Unavailable. |
| 6 | `app/routers/health.py` | L37 | **High** | Error details leaked in response | `"error": str(e)` can expose database hostname, port, driver details, and potentially credentials from connection error messages. |
| 7 | `app/services/game_service.py` | L370-376 | Medium | Silent failure on null role | `_to_response` returns `"Unknown"` / `"unknown"` when `gr.role` is `None` instead of raising or logging an error. If a role is deleted after game creation, responses silently degrade with no visible indication of data integrity issues. |

### 3. Type Hints

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/models/types.py` | L17, L36, L44, L52 | Medium | Missing parameter/return type hints | `load_dialect_impl(self, dialect)`, `process_bind_param(self, value, dialect)`, `process_result_value(self, value, dialect)` — all missing type annotations on parameters and return types. pyproject.toml has `disallow_untyped_defs = true` for mypy, so these would fail type checking. |
| 2 | `app/models/ability.py` | L52 | Medium | Unparameterized `dict` type | `parameters_schema: Mapped[dict]` — should be `Mapped[dict[str, Any]]` for clarity and mypy compliance. |
| 3 | `app/models/ability_step.py` | L72, L77 | Medium | Unparameterized `dict` type | `parameters: Mapped[dict]` and `condition_params: Mapped[dict | None]` — should use `dict[str, Any]` and `dict[str, Any] | None`. |
| 4 | `app/services/script_service.py` | L247-305 | Medium | Loosely typed `params` parameter | All private template methods (`_view_card_instruction`, `_swap_card_instruction`, etc.) use `params: dict` — should be `dict[str, Any]`. |

### 4. Documentation

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/models/game_session.py` | — | Low | Missing `__repr__` | `GameSession` is the only model without a `__repr__` method, while all other models (`Role`, `Ability`, `AbilityStep`, `GameRole`, `RoleDependency`, `User`, `WinCondition`) define one. |

### 5. Readability, Brevity & Clarity

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/services/script_service.py` | L201-217 | Medium | if-elif chain as dispatch | `_get_wake_instruction` uses a 6-branch if-elif chain dispatching on `wake_target` string patterns. A dictionary mapping `wake_target` patterns to instruction templates would be more readable and extensible. |
| 2 | `app/seed/roles.py` | L14-870 | Low | 870-line data definition | `ROLES_DATA` is extremely long. Consider splitting into smaller grouped lists (e.g., by team) or loading from a structured data file (JSON/YAML). |

### 6. Security Posture

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/config.py` | L9 | **High** | Hardcoded default password | `DATABASE_URL` defaults to `"postgresql://yourwolf:CHANGE_ME@db:5432/yourwolf"`. If the environment variable is never set, production would run with a known credential. The default should be removed in favor of failing fast if the env var is missing. |
| 2 | `app/main.py` | L20-23 | Medium | Overly permissive CORS | `allow_methods=["*"]` and `allow_headers=["*"]` are blanket wildcards. While `allow_origins` is configurable via env vars, methods and headers should be restricted to what the API actually needs (e.g., `GET`, `POST`, `PUT`, `DELETE` and specific headers like `Content-Type`, `Authorization`). |
| 3 | `app/routers/` (all routers) | All | Medium | No authentication on any endpoint | Roles can be created, updated, and deleted by any unauthenticated caller. Games can be created, started, advanced, and deleted without auth. This is expected for early development but should be noted for when the API is exposed. |

### 7. Library & Dependency Simplicity

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `requirements.txt` | L8 | Low | Potentially redundant dependency | `python-dotenv` is listed, but `pydantic-settings` handles `.env` loading natively via `SettingsConfigDict(env_file=".env")`. `python-dotenv` may be unnecessary unless explicitly used elsewhere. |
| 2 | `requirements.txt` | L4 | Low | Binary wheel for production | `psycopg2-binary` is convenient for development but the upstream project recommends building `psycopg2` from source for production deployments for reliability and performance. |

### 8. Consistency

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/routers/abilities.py` | All | Medium | No service class for abilities | `abilities.py` router queries the DB directly (`db.query(Ability)...`), while `roles.py` and `games.py` both delegate to dedicated service classes (`RoleService`, `GameService`). Inconsistent architectural pattern. |
| 2 | `app/services/game_service.py` | L160, L208 | Medium | Service raises HTTP exceptions | `GameService.start_game` and `advance_phase` raise `HTTPException` (a FastAPI dependency), while `RoleService` raises `PermissionError` (a Python built-in). Services should raise domain exceptions only; routers should translate them to HTTP responses. |
| 3 | `app/routers/games.py` | L24, L40, L90, L113 | Low | HTTP status code literal vs constant | `games.py` uses integer literals (`status_code=201`, `400`, `404`) while `roles.py` uses `status.HTTP_201_CREATED`, `status.HTTP_404_NOT_FOUND`, etc. |
| 4 | `app/routers/games.py` | L24 | Low | Route prefix style difference | `games.py` uses `""` (empty string) for route paths while `roles.py` uses `"/"`. Both work but are subtly inconsistent. |

### 9. DRY & Deduplication

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/services/role_service.py` | L91-99, L150-158 | Medium | Duplicated dependency-response builder | `RoleDependencyResponse` construction is copy-pasted identically between `list_roles` and `get_role`. Should be extracted into a `_build_dependency_response(dep)` helper method. |
| 2 | `app/services/role_service.py` | L209-218, L260-267 | Medium | Duplicated ability-type lookup in loops | `self.db.query(Ability).filter(Ability.type == ...).first()` is repeated for each step in both `create_role` and `update_role`. Should batch-query all needed ability types up front once. |
| 3 | `app/schemas/role.py` L195-203, `app/schemas/game.py` L65-71 | — | Low | Duplicated pagination fields | `RoleListResponse` and `GameSessionPaginatedResponse` both independently define `items`, `total`, `page`, `limit`, `pages`. Could share a generic pagination base class. |

### 10. Error Handling Patterns

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/services/game_service.py` | L160, L208 | Medium | Wrong abstraction layer for HTTP exceptions | `GameService` raises `HTTPException` directly, coupling the service layer to FastAPI. This makes the service non-reusable outside of FastAPI and breaks the separation of concerns established by `RoleService`. |
| 2 | `app/seed/__init__.py` | L36 | Medium | Overly broad exception catch | `except Exception as e:` catches everything including `KeyboardInterrupt` and `SystemExit`. Should catch more specific exception types (e.g., `sqlalchemy.exc.SQLAlchemyError`). |
| 3 | `app/routers/games.py` | L49-51 | Low | Stack trace lost on re-raise | `except ValueError as e: raise HTTPException(...)` loses the original stack trace context. Use `raise HTTPException(...) from e` to preserve the exception chain for debugging. |

### 11. Configuration Hygiene

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/config.py` | L10 | Medium | No validation of `ENVIRONMENT` value | `ENVIRONMENT: str = "development"` accepts any arbitrary string. Should be constrained to known values (`Literal["development", "test", "production"]` or an enum) to prevent typos from silently misconfiguring behavior. |
| 2 | `app/config.py` | — | Medium | No startup-time config validation | Missing or malformed config values (like `DATABASE_URL`) fail lazily at first DB access rather than at startup. A startup validator or eager access in app lifespan would surface misconfigurations immediately. |

### 12. Logging Quality

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/seed/abilities.py` | L221, L228, L232 | Medium | f-string logging | Uses `logger.debug(f"Ability '{ability_data['type']}'...")`. Should use `%s` lazy formatting: `logger.debug("Ability '%s'...", ability_data['type'])`. The f-string is eagerly formatted even when the log level suppresses the message. |
| 2 | `app/seed/roles.py` | L965, L971, L1009, L1063, L1072 | Medium | f-string logging | Same issue across all `logger.info(f"...")` and `logger.debug(f"...")` calls in the roles seed module. |
| 3 | `app/seed/__init__.py` | L25-32, L38 | Medium | f-string logging | Same issue: `logger.info(f"Abilities seeding complete. Created: {abilities_created}")`. |

### 13. Performance Anti-Patterns

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/services/role_service.py` | L209-218 | **High** | N+1 query in `create_role` | For each ability step, a separate `SELECT` is issued to find the ability by type. For a role with 5 steps, that's 5 extra queries. Fix: batch-query `ability_map = {a.type: a for a in self.db.query(Ability).filter(Ability.type.in_(types)).all()}`. |
| 2 | `app/services/role_service.py` | L258-267 | **High** | N+1 query in `update_role` | Same N+1 pattern as `create_role` when replacing ability steps. |
| 3 | `app/services/game_service.py` | L163-175 | Medium | N+1 query in `start_game` | `start_game` issues a new `self.db.query(Role).filter(Role.id == ...)` for each game role to get the team, despite `get_game_with_roles` already eager-loading `GameRole.role`. The loaded relationship should be used directly: `game_roles[i].role.team`. |
| 4 | `app/routers/abilities.py` | L21 | Low | Missing pagination on abilities list | All active abilities are returned in a single response with no pagination or limit. Fine for the current ~15 abilities but won't scale if the system grows. |

### 14. API Contract Adherence

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `app/routers/health.py` | L33-37 | **High** | Wrong status code on DB failure | Returns HTTP 200 for a disconnected database; should return 503 Service Unavailable. |
| 2 | `app/schemas/game.py` | L28 | Low | `role_team` typed as `str` instead of enum | `GameRoleResponse.role_team` is `str` but other schemas use the `Team` enum directly. Inconsistent contract typing across the API surface. |

---

## Cross-Cutting Observations

### 1. `is_primary_team_role` is broken end-to-end via the API

The field is accepted in request schemas (`RoleCreate`, `RoleUpdate`), exists on the ORM model, and is used for game creation validation (primary team role checks). However, `RoleService` never wires it through in `create_role` (not persisted), `get_role` (not returned), or `list_roles` (not returned). Only the seed data and direct ORM usage correctly set it. **Any user-created role will have `is_primary_team_role=False` regardless of input.**

**Affected test files:** `tests/test_role_service.py`, `tests/test_roles.py` — neither test that `is_primary_team_role=True` roundtrips through the API (create → get).

### 2. Service layer / router boundary is inconsistent

`GameService` raises `HTTPException` (a router concern), while `RoleService` raises `PermissionError` (a domain concern). Both patterns coexist in the same codebase. This makes `GameService` non-reusable outside of FastAPI and breaks the encapsulation that `RoleService` correctly maintains.

### 3. Logging style is inconsistent

Services (`game_service.py`, `script_service.py`) correctly use `%s`-style lazy logging. Seed modules (`abilities.py`, `roles.py`, `__init__.py`) use eager f-string logging. All should use `%s` style per Python logging best practices.

### 4. Abilities router is the only one without a service class

`abilities.py` queries the database directly, while `roles.py` and `games.py` both delegate to dedicated service classes. When ability CRUD logic grows (e.g., admin operations), the lack of a service layer will force a refactor.

### 5. N+1 query pattern recurs

Ability-type lookups in loops appear in both `create_role` and `update_role`. Role lookups in `start_game` re-query data already eager-loaded. All three should use batch queries or access already-loaded relationships.

---

## Recommended Priority Order

### 1. Quick Wins — Low effort, high impact

1. Pass `is_primary_team_role` in `create_role`, `get_role`, and `list_roles` (3 one-line additions in `role_service.py`)
2. Fix DB health endpoint to return 503 on failure and remove `str(e)` from response body
3. Add `from e` to re-raised exceptions in `games.py` router
4. Switch seed modules from f-string to `%s`-style logging

### 2. Important Fixes — Security and correctness

5. Remove hardcoded default `DATABASE_URL` password; require explicit env var or fail at startup
6. Move `HTTPException` raises out of `GameService` into `games.py` router; use domain exceptions in service
7. Batch ability-type queries in `create_role` and `update_role` to fix N+1
8. Use already-loaded `game_roles[i].role.team` in `start_game` instead of issuing new queries

### 3. Improvement Pass — Type hints, docstrings, DRY

9. Add type hints to `types.py` override methods
10. Parameterize `dict` type hints on model JSONB columns (`dict[str, Any]`)
11. Constrain `ENVIRONMENT` setting to known values via `Literal` or enum
12. Extract `AbilityService` for the abilities router
13. Extract shared `_build_dependency_response` helper in `RoleService`
14. Add startup-time config validation
15. Restrict CORS `allow_methods` and `allow_headers` to actual usage

### 4. Polish — Style, minor cleanup

16. Clean up `__all__` in `schemas/__init__.py`
17. Remove dead `if __name__` block from `seed/__init__.py`
18. Standardize route prefix style and status code constants in games router
19. Add `__repr__` to `GameSession` model
20. Consider a generic pagination base schema for `RoleListResponse` / `GameSessionPaginatedResponse`
