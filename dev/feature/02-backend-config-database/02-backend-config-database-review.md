# Review Record: Backend Lazy Configuration & Database Wiring

## Summary

Reviewed commit `67cdb75` against the plan's six acceptance criteria. The change is mechanical, well-scoped, and does what it claims: `Base` is relocated to `app/models/base.py` with a compat re-export from `app.database`, `Settings` and the engine/session factory are built lazily via `functools.cache` accessors, and the positional `os.environ` hack in `tests/conftest.py` is replaced by a `pytest_configure` hook.

I independently verified the load-bearing claims rather than reading only:

- **Blast radius (reviewer focus 1):** grepped every `.py`, `.md`, `.ini`, and config file under `yourwolf-backend/` (excluding `.venv`) for `from app.config import settings`, `SessionLocal`, `database.engine`, and `config.settings`. **Zero remaining importers** of the removed module-level names. `alembic/env.py:8`, `app/seed/__init__.py:5`, and `app/main.py:3` are all migrated. The only `SessionLocal` hits are `tests/conftest.py`'s own `TestingSessionLocal` (unrelated) and a negative assertion in `tests/test_database.py:70`.
- **AC5 (executed):** `env -i PATH=/usr/bin:/bin ./.venv/bin/python -c "import app.models.role"` succeeds, and a `sys.modules` probe confirms neither `app.database` nor `app.config` is loaded afterward. Also confirmed for the `app.models` package import.
- **AC6 (executed):** booted the real app against a file-backed SQLite DB. `GET /` 200, `/health` 200, `/health/db` 200 `{"status":"connected"}` (real round-trip through the lazy engine), `/api/v1/roles/` 200, `/api/v1/abilities/` 200, CORS preflight returned `access-control-allow-origin: http://rev.test` from lazily resolved settings. Engine URL confirmed as the configured one.
- **Suite (executed):** `uv run pytest -q` → 281 passed, 89.83% coverage. Matches the implementation record.

One Medium issue found and fixed: the new `pytest_configure` hook used `os.environ.setdefault`, silently weakening test hermeticity relative to the hard assignment it replaced.

## Verdict

**Approved with Reservations**

The reservations are documentation drift outside this feature's file scope (Issue #2) and two accepted-by-design Low items. Nothing blocks the merge.

## Reviewer Focus Areas — Findings

**1. Removal of module-level `settings` / `SessionLocal` / `engine` (Deviations 1–2).** Verified sound. No remaining importer anywhere in the backend, including `alembic/env.py` and `app/seed/`. The failure mode the implementer optimized for is real and correct: a missed call site now raises `ImportError` at import rather than silently receiving a stale global. Feature 01's implementation record confirms this manifested loudly (and transiently) during parallel development — which is the desired behavior, not a defect. `Base` re-export is retained per AC1 and is actively exercised by `alembic/env.py:9` and `tests/conftest.py:10`.

**2. `pytest_configure` vs. a `get_settings` override (Deviation 3).** Sound, not a workaround. The reasoning holds: `tests/test_health.py:8` does `from app.main import app` at module scope, and `app/main.py:19` calls `get_settings().cors_origins_list` during app construction. Pytest imports the rootdir `conftest.py` and fires `pytest_configure` on it *before* collecting test modules, so the hook is guaranteed to run first — whereas a fixture cannot, because fixtures run after collection. This genuinely removes the import-order sensitivity AC4 targets: the old comment at the deleted `conftest.py:8-14` explicitly documented that the assignment had to precede the import statements below it in the same file, which is exactly the fragility being eliminated. AC4 sanctions "passing a test database URL". Satisfied.

The residual coupling (`app.main` needing `DATABASE_URL` at import) is real but is not this feature's AC — the plan's Discovery Delta explicitly accepts it and AC5 scopes the env-free requirement to model imports only. Worth revisiting if a later feature moves CORS config into a lifespan handler.

**3. `functools.cache` construction race (Gap 1 / AC3 "exactly once").** The gap does not matter. `create_engine` opens no connections and touches no shared state, so a losing racer produces an inert object that is garbage-collected; the cache guarantees every caller thereafter receives one identical engine. The property AC3 protects — "no per-request engine creation", one connection pool — holds. Adding a lock or lifespan warm-up would buy nothing at real cost. The implementer's analysis is accurate. Accepted as-is (Issue #4, Low, Wont-Fix).

**4. Bad `DATABASE_URL` failing at first request rather than import (Deviation 4).** Acceptable, and narrower than described. Because `app/main.py:19` resolves settings at module scope, a *missing* or schema-invalid `DATABASE_URL` still fails fast at import — pydantic validation is unchanged. Only a well-formed-but-unusable URL (e.g., bad dialect) defers to first engine construction. Neither the old nor the new code validated *connectivity* at boot, since `create_engine` is lazy in SQLAlchemy itself. So the regression is confined to URL *parseability* of an otherwise-present string. Recorded, low impact, no lifespan hook warranted (Issue #5, Low, Wont-Fix).

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | **Met (verified)** | `app/models/base.py:10-13`; `app/database.py:8,12`; 8 model files | Executed: `sys.modules` probe confirms importing `app.models.role` loads neither `app.database` nor `app.config`. Compat re-export identity asserted by `tests/test_database.py:22`. |
| AC2 | **Met (verified)** | `app/config.py:27-37`; `app/main.py:3,19`; `alembic/env.py:8,18` | No import-time `Settings()`. Asserted by `tests/test_config.py:56-59`. All 3 call sites migrated (grep-confirmed). |
| AC3 | **Met (verified)** | `app/database.py:15-37`; `app/seed/__init__.py:5,22` | Idempotent lazy creation confirmed by executed smoke boot + `TestLazyEngine` (6 tests). "Exactly once" holds in the sense that matters — see focus area 3. |
| AC4 | **Met (verified)** | `tests/conftest.py:32-46` (post-fix) | `os.environ` hack deleted; hook runs before collection. Suite green: 281 passed. |
| AC5 | **Met (verified)** | `app/models/base.py`, 8 model files | Executed `env -i PATH=/usr/bin:/bin ... -c "import app.models.role"` → exit 0. Automated equivalent at `tests/test_database.py:102-110`. |
| AC6 | **Met (verified)** | whole app | Executed by me: real app boot against file-backed SQLite, 5 endpoints 200, `/health/db` connected, CORS preflight correct. Not merely inferred from the implementation record. |

Note on AC6 method: the implementer used uvicorn + SQLite instead of the plan's `docker compose up` (Deviation 5). I re-verified independently with a live app instance and a real on-disk database, exercising the full `get_db` → `get_session_factory` → `get_engine` → DB path. The substitution is evidentially equivalent for this AC and justified given concurrent agents in the tree.

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `pytest_configure` used `os.environ.setdefault`, so an ambient `DATABASE_URL` in the developer's shell silently wins over the test URL. The replaced hack used hard assignment, so this is a hermeticity regression introduced by the rewrite. | Medium | `tests/conftest.py:38-39` | AC4 | **Fixed** |
| 2 | `docs/CODEBASE_CONTEXT.md:19` still documents `database.py` as "SQLAlchemy engine, SessionLocal, Base, get_db()" — two of those four names no longer exist. | Medium | `docs/CODEBASE_CONTEXT.md:19` | AC3 | **Open** (deferred — see rationale) |
| 3 | `get_settings.cache_clear()` does not invalidate `get_engine`'s cache; the two caches can diverge, leaving an engine bound to a superseded URL. Test-support surface only — no production path clears caches, and every test that clears settings also clears the engine cache. | Low | `app/config.py:27`, `app/database.py:15` | — | **Open** |
| 4 | `functools.cache` permits a benign engine-construction race under concurrent first use. | Low | `app/database.py:15` | AC3 | **Wont-Fix** — losing racer is an inert, connectionless object; the single-pool invariant holds. Fixing costs complexity for no behavior change. |
| 5 | A well-formed-but-unusable `DATABASE_URL` now surfaces at first engine construction rather than at import. | Low | `app/database.py:15-27` | AC3 | **Wont-Fix** — accepted tradeoff, recorded in Deviation 4. Missing/invalid values still fail at import via `app/main.py:19`; connectivity was never boot-validated in either version. |
| 6 | `tests/test_database.py:107` hardcodes `env={"PATH": "/usr/bin:/bin"}` — Unix-only, would fail on Windows. | Low | `tests/test_database.py:107` | AC5 | **Open** — no Windows support target exists today. |
| 7 | `db = get_session_factory()()` is a double-call that reads awkwardly. | Low | `app/seed/__init__.py:22` | AC3 | **Open** — cosmetic; matches the accessor pattern. |

**Issue #2 rationale for deferral:** `docs/CODEBASE_CONTEXT.md` is a shared file outside this feature's declared scope, and this review ran in parallel with two other feature reviews under explicit scope-discipline constraints. Editing it risks a conflicting concurrent write. The pipeline's docs-writer step owns this file. Flagged here so the drift is not lost.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/tests/conftest.py` | `pytest_configure` now assigns `DATABASE_URL` / `ENVIRONMENT` unconditionally instead of via `setdefault`, restoring the hermeticity of the hack it replaced. Docstring records why, and points future tests at `monkeypatch.setenv` + `get_settings.cache_clear()` for per-test overrides. | 1 |

Verification after fix: `uv run pytest -q` → **281 passed**, 89.83% coverage (unchanged). Also re-ran the suite with a hostile ambient `DATABASE_URL=postgresql://bogus@127.0.0.1:5599/nope` and `ENVIRONMENT=development` exported → **281 passed**, confirming the suite is now insulated from the developer's environment.

Note on why this was worth fixing despite being latent: today no test reaches the un-overridden `get_db`, so `setdefault` causes no failure — I confirmed the suite passes with a bogus ambient URL both before and after. But the whole point of this feature was removing hidden environmental coupling from the test bootstrap. Leaving `setdefault` in place means the first future integration test that exercises the real `get_db` would silently target whatever database the developer happened to have exported — a failure mode that is both silent and dangerous (a test suite that writes to a dev or staging database). One word of change removes the trap permanently.

## Remaining Concerns

- **Issue #2** — `docs/CODEBASE_CONTEXT.md:19` names `SessionLocal`/`engine` as exports of `database.py`. Should be corrected to `get_engine()`, `get_session_factory()`, `Base` (re-export), `get_db()`. Assign to docs-writer.
- **Issue #3** — settings/engine cache-coherence is an implicit contract, currently honored by every caller. If a future test clears only the settings cache and then calls `get_engine()`, it will get a stale-URL engine with no error. Worth a comment or a combined `reset_caches()` helper if this surface grows.
- **Issue #6, #7** — cosmetic; defer to next cleanup pass.
- **Lint state** — the implementer deliberately did not "fix" pre-existing `isort` and `mypy` findings, matching codebase convention over config. I confirmed this reasoning is sound: `alembic/env.py`, `test_health.py`, and `test_models.py` all fail `isort` on untouched `main`, and the `mypy` `call-arg` error on `Settings()` is byte-for-byte pre-existing. Correctly out of scope; the config/convention mismatch is a separate cleanup.

## Test Coverage Assessment

- **Covered:** AC1 (`test_database.py` — Base module location, re-export identity, all-8-models metadata identity), AC2 (`test_config.py` — 6 tests: construction, cache identity, cache ignores env drift, `cache_clear` re-read, no import-time instance, CORS parsing), AC3 (`TestLazyEngine` — 6 tests: no import-time globals, engine/factory idempotency, factory↔engine binding, URL from lazy settings, `get_db` generator contract), AC4 (full suite green), AC5 (subprocess import with stripped env), AC6 (full suite + executed smoke boot).
- **Missing / lower-value gaps:**
  - No automated assertion that `app.database` / `app.config` are absent from `sys.modules` after a model import. The subprocess test proves the *observable* property (import succeeds with no env), which is what AC5 states, and I verified the `sys.modules` property manually. Nice-to-have, not required.
  - `app/seed/__init__.py::run_seed()` remains untested (38% coverage, pre-existing at baseline). The one line this feature changed there was covered by the implementer's manual seed run. Pre-existing gap, correctly out of scope.
  - No test asserts the settings/engine cache-coherence contract from Issue #3.

## Risk Summary

- **Blast radius is the dominant risk and it is contained.** ~15 transitive importers were rewired and three module-level globals deleted outright. Grep-verified zero remaining references across code, alembic, seed, and config. Later-wave backend features (04, 05, 07, 09, 10) must use `get_settings()` / `get_session_factory()` / `get_engine()`; the implementation record already carries this note for them, and any miss fails loudly at import rather than silently.
- **`app/main.py:19` still resolves settings at module scope**, so `import app.main` requires `DATABASE_URL`. Plan-sanctioned, but it is the reason conftest needs an env-var hook at all. If a later feature wants a clean `get_settings` dependency override, moving CORS configuration into a lifespan handler is the unlock.
- **`docs/CODEBASE_CONTEXT.md` drift (Issue #2)** — documentation now describes an API that no longer exists. Low technical risk, real onboarding/agent-context risk given this file is used as context by other pipeline agents.
- **No ledger present** — no `ledger-events.jsonl` exists in this repo, and this pass was an initial review (no incoming remediation request, verdict not `Changes Requested`), so no ledger row was required under the contract.
