# Implementation Record: Backend Lazy Configuration & Database Wiring

## Summary

Removed all import-time side effects from the backend configuration and database layers. The declarative `Base` now lives in `app/models/base.py` (SQLAlchemy-only import), so importing a model no longer transitively constructs `Settings` or a database engine. `Settings` is now obtained through a `functools.cache`-backed `get_settings()`, and the engine/session factory through `get_engine()` / `get_session_factory()`, each created exactly once on first use. The `os.environ` mutation hack in `tests/conftest.py` is gone, replaced by a `pytest_configure` hook that supplies the test database URL before collection.

All six ACs are complete. Suite: 250 → 281 passed, coverage 89.49% → 89.83%.

## Sibling Features

Scanned all 12 sibling feature directories (first 5 lines of each plan only).

- **01-backend-schema-surface** (Wave 1, parallel): owns `app/schemas/*` + `tests/test_schemas.py`. During my run, 2 transient failures appeared in `tests/test_schemas.py` from its in-progress work; they cleared before my final run. Not touched by me.
- **04, 05, 07, 09, 10** (backend, later waves): will touch `app/services/*`, `app/routers/*`, `app/seed/*`. **Shared-module note for them:** `from app.config import settings` no longer exists — use `get_settings()`. `app.database.SessionLocal` / `app.database.engine` no longer exist — use `get_session_factory()` / `get_engine()`. `from app.database import Base` still works (compat re-export).
- **05-backend-seed-data** specifically will modify `app/seed/` — I changed `app/seed/__init__.py` L5/L22 to the lazy accessor.
- **03, 06, 08, 11, 12** (frontend): no overlap.

Only files in this feature's declared scope were modified.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | Full suite (exercises all models) | Base relocated to `app/models/base.py`; `app.database` re-exports it; 8 models import from new location; no engine side effects | Complete | `app/models/base.py`, `app/database.py`, 8 model files | `yourwolf-backend/app/models/base.py`; `yourwolf-backend/tests/test_database.py::test_base_lives_in_models_base_module`, `::test_database_reexports_same_base_object`, `::test_all_models_register_against_relocated_base` | PENDING | PENDING |
| AC2 | AC2 | Settings cached and lazy | `get_settings()` cached via `functools.cache`; no import-time `Settings()` | Complete | `app/config.py`, `app/main.py`, `alembic/env.py` | `yourwolf-backend/app/config.py:27-37`; `yourwolf-backend/tests/test_config.py` (6 tests, incl. `::test_get_settings_is_cached`, `::test_config_module_has_no_import_time_settings_instance`) | PENDING | PENDING |
| AC3 | AC3 | Existing tests + smoke boot | No import-time `engine`/`SessionLocal`; idempotent lazy creation | Complete | `app/database.py`, `app/seed/__init__.py`, `alembic/env.py` | `yourwolf-backend/app/database.py:15-37`; `yourwolf-backend/tests/test_database.py::TestLazyEngine` (6 tests); smoke boot below | PENDING | PENDING |
| AC4 | AC4 | conftest rewrite; suite green | `os.environ` hack deleted; settings configured via lazy mechanism, no import-order sensitivity | Complete | `tests/conftest.py` | `yourwolf-backend/tests/conftest.py:32-41` (`pytest_configure`); full suite 281 passed | PENDING | PENDING |
| AC5 | AC5 | Import without env | `python -c "import app.models.role"` succeeds with no `DATABASE_URL` | Complete | `app/models/base.py`, 8 model files | `yourwolf-backend/tests/test_database.py::test_models_import_without_database_url_set` (subprocess, `env={"PATH": ...}`); manual `env -i` run below | PENDING | PENDING |
| AC6 | AC6 | Manual QA: boot, hit one endpoint | Full suite passes; app boots and serves requests | Complete | whole app | Full suite 281 passed / 89.83%; uvicorn smoke evidence below | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `Base` moves to `app/models/base.py`; `app.database` re-exports; 8 models updated; model import triggers no engine creation | Complete | `app/models/base.py` (new), `app/database.py`, `app/models/{ability,ability_step,game_role,game_session,role,role_dependency,user,win_condition}.py` | Compat re-export is actively exercised — `alembic/env.py:9` and `tests/conftest.py:10` still import `Base` from `app.database`. Verified `import app.models.role` loads neither `app.database` nor `app.config`. |
| AC2 | `app/config.py` no longer runs `settings = Settings()` at import; cached `get_settings()` | Complete | `app/config.py` | Module-level `settings` object **removed entirely** rather than kept as a lazy accessor (plan permitted it only optionally — "may remain"). All 3 call sites migrated. |
| AC3 | No import-time `engine`/`SessionLocal`; created lazily, exactly once | Complete | `app/database.py`, `app/seed/__init__.py`, `alembic/env.py` | `get_engine()` / `get_session_factory()` both `@cache`. `get_db` public signature unchanged. |
| AC4 | conftest `os.environ` hack deleted; no import-order sensitivity | Complete | `tests/conftest.py` | Replaced by `pytest_configure` hook + lazy `app.main` import inside the `client` fixture. `test_engine` / `get_db` override architecture preserved. |
| AC5 | `import app.models.role` succeeds with no `DATABASE_URL` | Complete | `app/models/base.py`, 8 model files | Automated subprocess test + manual `env -i` verification. |
| AC6 | Full suite passes; app boots and serves | Complete | whole app | 281 passed, 89.83%. Smoke boot verified `/`, `/health`, `/api/v1/roles/`, `/api/v1/abilities/`, CORS preflight, seed, and alembic. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/models/base.py` | Create | New `Base(DeclarativeBase)`; imports only `sqlalchemy.orm` | AC1 — model imports must not pull in config/engine |
| `yourwolf-backend/app/database.py` | Modify | Removed import-time `engine`/`SessionLocal` and the `Base` class body; added `@cache get_engine()`, `@cache get_session_factory()`, `__all__`; `get_db` now resolves the factory lazily; re-exports `Base` | AC1, AC3 |
| `yourwolf-backend/app/config.py` | Modify | Removed `settings = Settings()` (L26); added `@cache get_settings()` | AC2 |
| `yourwolf-backend/app/main.py` | Modify | `from app.config import get_settings`; CORS uses `get_settings().cors_origins_list` | AC2 |
| `yourwolf-backend/app/models/ability.py`, `ability_step.py`, `game_role.py`, `game_session.py`, `role.py`, `role_dependency.py`, `user.py`, `win_condition.py` | Modify | One-line import change: `from app.database import Base` → `from app.models.base import Base` | AC1 |
| `yourwolf-backend/app/seed/__init__.py` | Modify | `SessionLocal` → `get_session_factory()`; `db = get_session_factory()()` | AC3 |
| `yourwolf-backend/alembic/env.py` | Modify | `from app.config import settings` → `get_settings`; `config.set_main_option(..., get_settings().DATABASE_URL)` | AC3 (would otherwise break — `settings` no longer exists) |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_config.py` | Create | 6 tests: instance construction, caching identity, cache ignores later env changes, `cache_clear` re-reads, no import-time `settings` attribute, `cors_origins_list` parsing | AC2 |
| `yourwolf-backend/tests/test_database.py` | Create | 10 tests: Base module location, re-export identity, all-8-models metadata identity, `TestLazyEngine` (no import-time engine, engine/factory idempotency, factory↔engine binding, URL from lazy settings, `get_db` generator contract), subprocess import without `DATABASE_URL` | AC1, AC3, AC5 |
| `yourwolf-backend/tests/conftest.py` | Modify | Deleted `os.environ` hack (old L8–14); added `pytest_configure` hook; moved `from app.main import app` into the `client` fixture | AC4 |

## Test Results

- **Baseline**: 250 passed, 0 failed, 89.49% coverage (recorded in `-context.md`, re-confirmed at start)
- **Final**: 281 passed, 0 failed, 89.83% coverage
- **New tests added**: 16 (6 in `test_config.py`, 10 in `test_database.py`)
- **Regressions**: None. New modules at 100% coverage (`app/config.py` 13/13, `app/database.py` 20/20, `app/models/base.py` 3/3).

### Manual / smoke evidence (AC5, AC6)

- **AC5**: `env -i PATH=/usr/bin:/bin ./.venv/bin/python -c "import app.models.role"` → success. Follow-up probe confirmed `app.database` and `app.config` are both absent from `sys.modules` after the import. Negative control confirmed a bare `Settings()` still raises `ValidationError` without `DATABASE_URL`, proving the test is meaningful.
- **AC6 boot**: `uvicorn app.main:app` with `DATABASE_URL=sqlite:////tmp/smoke.db` → `GET /` 200, `GET /health` 200 `{"status":"healthy"}` (exercises `get_db` → lazy engine → real DB), `GET /api/v1/roles/` 200 `{"items":[],"total":0,...}`, `GET /api/v1/abilities/` 200. Clean log, no errors.
- **AC6 CORS**: preflight with `Origin: http://smoke.test` and `CORS_ORIGINS=http://smoke.test` returned `access-control-allow-origin: http://smoke.test`, proving lazy settings reach the middleware.
- **Seed**: `python -m app.seed` against SQLite seeded 30 roles + 9 dependencies successfully (exercises the changed `get_session_factory()` line, which is not unit-tested — `app/seed/__init__.py` is 38% covered at baseline and unchanged).
- **Alembic**: `alembic upgrade head --sql` with a Postgres URL generated full DDL cleanly, exercising `get_settings()` and the `Base` compat re-export. (Against SQLite it fails on `JSONB` — a pre-existing Postgres-only dialect constraint in the migration, unrelated to this change.)

## Deviations from Plan

1. **Module-level `settings` compat accessor removed rather than retained.** AC2 permits a lazy accessor ("may remain only if it is lazy") but does not require one. Only 3 call sites existed (`database.py`, `main.py`, `alembic/env.py`), all migrated. Removing it is simpler and makes any missed call site fail loudly at import rather than silently. Sibling features must use `get_settings()`.
2. **`SessionLocal` / `engine` module-level names removed, not kept as lazy aliases.** Same reasoning; the only consumer (`app/seed/__init__.py`) was migrated. `Base` re-export is retained as the plan requires.
3. **conftest uses a `pytest_configure` hook (env var) rather than overriding `get_settings`.** `tests/test_health.py:8` imports `app.main` at module scope, and `app/main.py` reads settings at module scope during app construction (which the plan's Discovery Delta explicitly accepts). A fixture-based `get_settings` override therefore cannot run early enough for collection. `pytest_configure` is a pytest lifecycle hook guaranteed to run before test-module import, so it removes the import-order sensitivity AC4 targets — the old hack depended on statement position within the file (hence its 5-line warning comment). AC4 explicitly sanctions "passing a test database URL". Uses `setdefault`, so a real `DATABASE_URL` in the environment is not clobbered.
4. **Engine created purely lazily on first use; no lifespan startup hook added.** AC3 allows either. Pure lazy is the smaller diff and avoids introducing a lifespan handler where none exists. **Tradeoff worth reviewer attention:** an invalid `DATABASE_URL` now surfaces at first request rather than at import. (Note `create_engine` never opened connections, so neither version validated connectivity at boot — only URL parseability.)
5. **Manual QA used uvicorn + SQLite instead of `docker compose up`.** Equivalent evidence for the boot/endpoint criterion without contending with other agents running in parallel; all four endpoints plus CORS were exercised against a real server and real DB.

## Gaps

1. **Thread-safety nuance of `functools.cache`:** under concurrent first-use, two threads could each execute `get_engine()`'s body; one result wins the cache and the other is discarded. This is benign — SQLAlchemy's `create_engine` opens no connections, so the discarded `Engine` is inert garbage, and every subsequent caller gets the single cached instance. "Exactly one engine is ever used" holds. Flagging because AC3/Constraints say "created exactly once"; add a lifespan warm-up or lock if strict single-construction is required.
2. **`app/seed/__init__.py` `run_seed()` remains untested** (38% coverage, lines 20–42) — pre-existing at baseline, unchanged by this feature. My one-line change there is covered by the manual seed run documented above.
3. **`app/main.py` still resolves settings at module scope**, so `import app.main` requires `DATABASE_URL`. Explicitly accepted by the plan's Discovery Delta; AC5 only requires model imports to be env-free.

## Reviewer Focus Areas

- **`tests/conftest.py:32-41`** — the `pytest_configure` approach (Deviation 3). This is the least mechanical part of the change and the main judgment call; it substitutes a pytest lifecycle hook for the old positional env hack. Confirm this satisfies AC4's "without import-order sensitivity" intent.
- **`app/database.py:15-37`** — `@cache` on `get_engine()` / `get_session_factory()` (Gap 1). Decide whether the benign construction race matters, and whether the deferred fail-fast on bad `DATABASE_URL` (Deviation 4) warrants a lifespan warm-up.
- **Removal of the `settings` / `SessionLocal` / `engine` module-level names** (Deviations 1–2) — this is the blast-radius decision. Verified zero remaining references repo-wide, but later-wave backend features (04, 05, 07, 09, 10) must use the accessors.
- **`alembic/env.py`** — not in the plan's original "key files" list but required (the context Discovery Delta caught this); verified via offline migration against Postgres.
- **Pre-existing lint state, deliberately not "fixed":** `isort` wants `app.*` in a separate first-party section, but every existing file uses the flat mixed style (`test_health.py`, `test_models.py`, `test_abilities.py`, `alembic/env.py` all fail isort on `main` untouched). I matched codebase convention over the isort config. Likewise `mypy`'s `Settings()` `call-arg` error in `app/config.py:37` is byte-for-byte pre-existing (baseline `config.py:26`); no `pydantic.mypy` plugin is configured. Both out of scope.
