# Plan: Backend Lazy Configuration & Database Wiring

## Execution Metadata

- **Wave:** 1
- **Parallel safe:** yes
- **Depends on:** none
- **Key files modified:** `yourwolf-backend/app/config.py`, `yourwolf-backend/app/database.py`, `yourwolf-backend/app/models/base.py` [PROPOSED - name TBD] (new), all 8 files in `yourwolf-backend/app/models/`, `yourwolf-backend/app/main.py` (modified — reads `settings.cors_origins_list` at module scope, expander-verified), `yourwolf-backend/app/seed/__init__.py` (verify), `yourwolf-backend/tests/conftest.py`
- **Sequential reason:** n/a

Source: refactor audit findings 2.1 (High), 4.1, 1.2 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: The declarative `Base` moves from `app/database.py` (L21–L24) to a new `app/models/base.py` [PROPOSED - name TBD]; `app.database` re-exports it for backward compatibility. All 8 model files import `Base` from the new location. Importing any model no longer triggers engine creation.
- **AC2**: `app/config.py` no longer executes `settings = Settings()` at import time (L26). Settings are obtained via a cached `get_settings()` function (`functools.cache` or equivalent). A module-level compatibility accessor may remain only if it is lazy.
- **AC3**: `app/database.py` no longer creates `engine`/`SessionLocal` at import time (L11–L18). They are created lazily on first use or during app lifespan startup in `app/main.py`.
- **AC4**: The `os.environ` mutation hack at `tests/conftest.py:8-14` is deleted; tests configure settings through the lazy mechanism (e.g., overriding `get_settings` or passing a test database URL) without import-order sensitivity.
- **AC5**: `python -c "import app.models.role"` succeeds with no `DATABASE_URL` set.
- **AC6**: Full backend test suite passes; the app boots and serves requests as before (manual or smoke evidence).

Non-goals: no ORM/session behavior changes; no change to `get_db` dependency signature for routers; no async migration.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | `app/models/base.py`, 8 model files, `app/database.py` | Full suite (exercises all models) |
| AC2 | `app/config.py` | Must-have automated test: settings cached and lazy — scenario, method name [PROPOSED - name TBD] |
| AC3 | `app/database.py`, `app/main.py` | Existing tests + smoke boot |
| AC4 | `tests/conftest.py` | conftest rewrite; suite green is the evidence |
| AC5 | import graph | Must-have automated test or CI check (import without env) |
| AC6 | whole app | Manual QA: boot via Docker Compose, hit one endpoint |

## B. Correctness & Edge Cases

- **Import-order hazards**: `alembic/env.py:10-11` imports `app.models` for metadata — expander-verified: it does NOT have its own DB URL handling; it reads `settings.DATABASE_URL` directly and must be migrated to `get_settings()` as part of this feature.
- `app/seed/__main__.py` / `seed/__init__.py` use the engine/session directly — update to the lazy accessors.
- Anything reading `settings.X` at module scope in other modules will now need the accessor; grep for `from app.config import settings` and update call sites.
- Engine must be created exactly once (idempotent lazy init); no per-request engine creation.

## C. Consistency & Architecture Fit

- `get_settings()` + dependency-injectable session is the canonical FastAPI pattern; `get_db` already exists — keep its public shape.
- Compatibility re-export of `Base` from `app.database` keeps external references working during transition.

## D. Clean Design & Maintainability

This is the audit's highest-blast-radius fix (≈15 transitive importers). Keep the diff mechanical: one new module, one lazy wrapper each for settings and engine, one-line import changes in models.

## E. Observability, Security, Operability

- No new normal-path logs; optionally log engine creation once at startup only if an existing startup-log pattern exists.
- Security: unchanged secret handling; `DATABASE_URL` read later, not at import.
- Rollback: revert commit; no migrations involved.

## F. Test Plan

- Must-have: model import without `DATABASE_URL` (AC5); `get_settings()` caching behavior.
- Existing tests to update: `tests/conftest.py` (rewrite of env bootstrapping); any test importing `settings` directly.
- This is a rewire — treat conftest as a first-class deliverable, not collateral.
- Manual QA: `docker compose up`, verify one roles endpoint responds.

## Stage 1: Base relocation
**Goal**: AC1 complete with compat re-export
**Success Criteria**: Models import without engine side effects; suite passes
**Status**: Not Started

## Stage 2: Lazy settings and engine
**Goal**: AC2, AC3, AC5 complete
**Success Criteria**: No import-time construction; app boots via lifespan/lazy init
**Status**: Not Started

## Stage 3: Test bootstrap cleanup
**Goal**: AC4, AC6 complete
**Success Criteria**: conftest env hack gone; full suite green; smoke boot verified
**Status**: Not Started
