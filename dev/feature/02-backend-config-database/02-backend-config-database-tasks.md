# Tasks: Backend Lazy Configuration & Database Wiring

## Stage 1: Base relocation

- [ ] Create `app/models/base.py` [PROPOSED - name TBD] containing the `DeclarativeBase` subclass `Base` moved from `app/database.py` (L21–L24) (AC1)
- [ ] Update the 8 model files that import `Base` from `app.database` (`ability.py`, `ability_step.py`, `game_role.py`, `game_session.py`, `role.py`, `role_dependency.py`, `user.py`, `win_condition.py`) to import from the new module (AC1)
- [ ] Add backward-compatible re-export of `Base` from `app.database` (AC1)
- [ ] Run full suite — all 250 tests still pass with no engine side effects from model imports (AC1)

## Stage 2: Lazy settings and engine

- [ ] Replace `settings = Settings()` in `app/config.py` (L26) with a cached `get_settings()` (`functools.cache` or equivalent); any module-level compatibility accessor must be lazy (AC2)
- [ ] Remove import-time `engine` / `SessionLocal` creation in `app/database.py` (L11–L18); provide idempotent lazy accessors created exactly once, or lifespan-startup creation in `app/main.py` (AC3)
- [ ] Update `app/main.py` CORS wiring (L19 `settings.cors_origins_list`) to use the lazy settings accessor (AC2/AC3)
- [ ] Update `app/seed/__init__.py` (L5, L22) to use the lazy session/engine accessors instead of module-level `SessionLocal` (AC3)
- [ ] Update `alembic/env.py` (L8, L18) to obtain settings via `get_settings()`; verify `Base` import still resolves via compat re-export (AC3)
- [ ] Grep for remaining `from app.config import settings` call sites and migrate them to the accessor (AC2)
- [ ] Add must-have automated test: `get_settings()` caching behavior — scenario-based, method name [PROPOSED - name TBD] (AC2)
- [ ] Add must-have automated test or CI check: importing `app.models.role` succeeds with no `DATABASE_URL` set, e.g. subprocess `python -c "import app.models.role"` with a clean env (AC5)

## Stage 3: Test bootstrap cleanup

- [ ] Delete the `os.environ` mutation hack in `tests/conftest.py` (L8–L14); configure test settings via the lazy mechanism (override `get_settings` or pass a test database URL) with no import-order sensitivity (AC4)
- [ ] Preserve the existing `test_engine` / `get_db` dependency-override architecture in conftest (AC4)
- [ ] Update any tests importing `settings` directly to use the accessor (AC4)
- [ ] Run full backend suite: all tests pass, coverage ≥ 80% gate holds (AC6)
- [ ] Manual QA smoke: `docker compose up`, app boots, one roles endpoint responds (AC6)
