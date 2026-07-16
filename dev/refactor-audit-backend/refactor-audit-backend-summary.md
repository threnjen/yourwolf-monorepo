# Refactor Audit — yourwolf-backend — Executive Summary

**Date:** 2026-07-16 · **Scope:** `yourwolf-backend/app/` + `tests/` · **Full report:** `refactor-audit-backend-report.md`

## Overall Assessment

The backend is a small, cleanly layered FastAPI service (routers → services → schemas/models) with no circular imports and no hard layer violations. The structural debt is concentrated in three places: import-time infrastructure side effects, three >500-line multi-responsibility services, and validation/error-handling logic scattered across layers.

## Findings by Severity

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 9 |
| Low | 7 |

## Architectural Health Scores (1–5)

Organization 4.5 · Dependencies 3.5 · Decomposition 3 · Coupling 3 · Separation of concerns 3 · Encapsulation 3.5

## Priority Action Items

1. **(High)** Remove import-time side effects in `app/config.py` (`settings = Settings()`) and `app/database.py` (engine/session created on import). This is the highest fan-in hub (~15 importers) and forces the `os.environ` ordering hack at `tests/conftest.py:8-14`. Quick partial fix: move `Base` to `app/models/base.py`.
2. **(High)** Decompose `app/services/script_service.py` (541 lines): extract the 15-method narration template engine + `STEP_DURATIONS` into a pure `narration` module; the `_StandIn*` shim dataclasses disappear once generation consumes a plain domain input instead of ORM shapes.
3. **(Medium)** Replace exception-message string matching (`"not found" in str(e)`, `app/routers/games.py:130`) with typed domain exceptions and a central FastAPI handler.
4. **(Medium)** Consolidate validation: card-total rule sits in the games router while all other game rules sit in `GameService`; role name bounds contradict between `RoleBase` schema (1–100) and `RoleService.validate_role` (2–50), and `create_role` never runs `validate_role`.
5. **(Medium)** Fix the stale `app/schemas/__init__.py` barrel (missing 3 live preview schemas; exports 2 dead ability-step schemas) and delete the unused `AbilityStepBase/Create/Read` classes.
6. **(Medium)** Extract validator blocks from `GameService`/`RoleService` (both >500 lines) into dedicated validation modules; split `tests/test_script_service.py` (1,273 lines) along the same seams.

## Quick Wins

- Sync/clean the schemas barrel (0 importers affected)
- `Base` → `app/models/base.py` with compat re-export (8 one-line import changes)
- Shared `paginate()` helper for the duplicated pagination math in role/game services
- Type `modifier` as `StepModifier` in schemas instead of raw `str`
