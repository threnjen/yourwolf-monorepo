# Review Record: Code Audit

## Summary
All 20 acceptance criteria were verified against the implementation. The changes are well-scoped, faithful to the audit findings, and cleanly implemented. Three issues were found — one Medium (silent skip on unknown ability types) and two Low (documentation overclaim, misplaced test). All three were fixed during review. High confidence in correctness.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `app/services/role_service.py:109,181,219` | Wired in list_roles, get_role, create_role |
| AC2 | Verified | `app/routers/health.py:36-42` | 503 + no error leak |
| AC3 | Verified | `app/routers/games.py:54-56,126-128,160-162` | All re-raises use `from e` |
| AC4 | Verified | `app/seed/__init__.py:26-32`, `app/seed/abilities.py:256`, `app/seed/roles.py:948` | All f-strings → %s |
| AC5 | Verified | `app/config.py:11` | No default; `tests/conftest.py:13` sets env var |
| AC6 | Verified | `app/services/game_service.py:184,237` | ValueError; routers translate |
| AC7 | Verified | `app/services/role_service.py:223-232,311-321` | Batch query in create & update |
| AC8 | Verified | `app/services/game_service.py:190-192` | Uses eager-loaded relationship |
| AC9 | Verified | `app/models/types.py:19-63` | Full signatures with Dialect, Any |
| AC10 | Verified | `app/models/ability.py:50`, `app/models/ability_step.py:73`, `app/services/script_service.py:255+` | `dict` → `dict[str, Any]` |
| AC11 | Verified | `app/config.py:12` | Literal with 4 values including `staging` |
| AC12 | Verified | `app/services/ability_service.py` (new), `app/routers/abilities.py:24-25` | Clean extraction |
| AC13 | Verified | `app/services/role_service.py:35-45` | Static method used in both list/get |
| AC14 | Verified | via AC5 + AC11 | pydantic-settings validates at import |
| AC15 | Verified | `app/main.py:21-22` | Explicit method/header lists |
| AC16 | Verified | `app/schemas/__init__.py:35-59` | 6 missing exports added |
| AC17 | Verified | `app/seed/__init__.py:36` | `SQLAlchemyError` + dead code removed |
| AC18 | Verified | `app/routers/games.py:23-24` | Status constants + `/` prefix |
| AC19 | Verified | `app/models/game_session.py:101-106` | `__repr__` already existed; correctly no-oped |
| AC20 | Verified | `app/schemas/base.py` (new), `app/schemas/role.py:197`, `app/schemas/game.py:63` | Generic base in use |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Unknown ability_type silently skipped in create_role / update_role | Medium | `app/services/role_service.py:234,326` | — | Fixed |
| 2 | Implementation record claims "all 33 findings" implemented | Low | `dev/active/code-audit/code-audit-implementation.md:3` | — | Fixed |
| 3 | Health endpoint uses literal `503` instead of `status.HTTP_503_SERVICE_UNAVAILABLE` | Low | `app/routers/health.py:40` | AC18 | Open |
| 4 | `test_list_roles_returns_is_primary_team_role` placed in wrong test class | Low | `tests/test_role_service.py:252` | AC1 | Fixed |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `app/services/role_service.py` | Unknown ability_type now raises `ValueError` instead of silently skipping, in both `create_role` and `update_role` | 1 |
| `dev/active/code-audit/code-audit-implementation.md` | Summary corrected to "20 prioritized acceptance criteria derived from the 33 findings" | 2 |
| `tests/test_role_service.py` | Moved `test_list_roles_returns_is_primary_team_role` from `TestRoleServiceCreateRole` to `TestRoleServiceListRoles` | 4 |

## Remaining Concerns
- Issue #3: Health endpoint uses literal `503` inside `JSONResponse()` — low severity, cosmetic only, defer to next cleanup pass.
- No unit test for the new `ValueError` on unknown ability_type (Issue #1 fix). Existing integration tests cover valid paths but not this new error path.

## Test Coverage Assessment
- Covered: AC1, AC2, AC6 (unit + integration), AC7 (indirectly via create_role tests), AC8 (indirectly via start_game tests), AC12 (indirectly via abilities router tests), AC20 (indirectly via pagination tests)
- Missing: No test for unknown ability_type rejection (new ValueError). No isolated unit test for `AbilityService`.

## Risk Summary
- `app/services/role_service.py:234,326` — new ValueError on unknown ability_type is a behavior change; seed data uses a similar pattern with `logger.warning` + continue. Verify seed flow is unaffected (it uses its own code path, not `RoleService`, so it is).
- `app/config.py` — DATABASE_URL now required at import time. Any environment (CI, Docker, dev) that doesn't set it will fail immediately. `tests/conftest.py` sets it correctly.
- CORS restriction to explicit methods/headers — frontend should be verified to only need GET/POST/PUT/DELETE and Content-Type/Authorization headers.
