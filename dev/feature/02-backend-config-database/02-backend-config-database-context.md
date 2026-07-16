# Context: Backend Lazy Configuration & Database Wiring

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/models/base.py` [PROPOSED - name TBD] | New home for declarative `Base` | Create |
| `yourwolf-backend/app/config.py` | Replace import-time `settings = Settings()` (L26) with cached `get_settings()` | Modify |
| `yourwolf-backend/app/database.py` | Remove import-time `engine` (L11–16) and `SessionLocal` (L18); lazy accessors; re-export `Base` for compat | Modify |
| `yourwolf-backend/app/models/ability.py`, `ability_step.py`, `game_role.py`, `game_session.py`, `role.py`, `role_dependency.py`, `user.py`, `win_condition.py` | Import `Base` from new location (exactly these 8 import `Base`; `types.py` does not) | Modify |
| `yourwolf-backend/app/main.py` | Uses `settings.cors_origins_list` at module scope (L19) — must move to lazy access or lifespan | Modify |
| `yourwolf-backend/app/seed/__init__.py` | Imports and uses `SessionLocal` (L5, L22) — switch to lazy accessor | Modify |
| `yourwolf-backend/alembic/env.py` | Imports `settings` (L8) and `Base` from `app.database` (L9) at module level — update to lazy settings accessor | Modify |
| `yourwolf-backend/tests/conftest.py` | Delete `os.environ` mutation hack (L13–14, actually L8–14 comment block) and rewire test settings | Modify |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-backend/app/routers/roles.py`, `abilities.py`, `games.py`, `health.py` | Consume `get_db` — signature must not change |
| `yourwolf-backend/tests/test_health.py` | Imports `get_db` directly — must keep working |
| `yourwolf-backend/app/seed/__main__.py` | Entry point invoking `run_seed()` — verify only |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Model file count verified: exactly 8 files import `Base` from `app.database`; `app/models/types.py` does not (uses `sqlalchemy.engine.interfaces.Dialect` only) | Plan's "all 8 model files" is accurate | None |
| `app/main.py:3,19` reads `settings.cors_origins_list` at module scope during app construction | App module itself has import-time settings dependency; plan lists main.py as "verify" but it requires modification for AC2/AC5 spirit (importing `app.main` will still need settings — acceptable, but CORS wiring must use `get_settings()`) | Add task |
| `alembic/env.py:8` imports `settings` object directly and `env.py:9` imports `Base` from `app.database`; plan claims env.py "has its own DB URL handling" — it does NOT; it sets `sqlalchemy.url` from `settings.DATABASE_URL` (L18) | If the `settings` compatibility object is removed rather than made lazy, alembic breaks. env.py must be updated to `get_settings()`; `Base` import survives via compat re-export | Add task; warning to Decomposer |
| conftest env hack sets `DATABASE_URL=sqlite:///:memory:` and `ENVIRONMENT=test` before imports (L13–14); conftest also builds its own `test_engine` and overrides `get_db` (L32, L47–53) | Test DB plumbing already exists via `get_db` override; only the settings bootstrap needs rework — `Settings` still requires `DATABASE_URL` (no default), so tests must override `get_settings` or provide the value another way | None (plan AC4 covers it) |
| `pytest.ini_options` enforces `--cov-fail-under=80`; current coverage 89.49% | New lazy-init branches must stay covered | None |
| No `.github/learnings/` directory exists | Relevant Learnings: none applicable | None |
| `pyproject.toml` declares `requires-python = ">=3.14"` but active interpreter is Python 3.12.6 and suite passes | `functools.cache` available either way; noted inconsistency only | Accepted risk / none |

## Architectural Decisions

- **`get_settings()` cached accessor** (`functools.cache` or equivalent) is the canonical FastAPI pattern and enables test override without env mutation.
- **`Base` relocated to `app/models/base.py` [PROPOSED - name TBD]** with a compatibility re-export from `app.database`, so external references (alembic, tests, any stragglers) keep working during transition.
- **Engine/SessionLocal created lazily** — first use or lifespan startup in `app/main.py`; idempotent single creation, never per-request.
- **Keep the diff mechanical**: one new module, one lazy wrapper each for settings and engine, one-line import changes in the 8 model files. This is the audit's highest-blast-radius fix (~15 transitive importers).

## Constraints

- `get_db` dependency signature must not change (routers depend on it).
- No ORM/session behavior changes; no async migration (non-goals).
- No new normal-path logs; at most one engine-creation log at startup, and only if an existing startup-log pattern exists (none was observed — prefer no new logs).
- Engine created exactly once (idempotent lazy init).
- Coverage gate: suite must stay ≥ 80% (`--cov-fail-under=80`).

## Scope Boundaries

- Do not touch router logic, schemas, or services beyond import/accessor call-site updates.
- Do not alter alembic migration files — only `alembic/env.py` wiring.
- Do not change `Settings` field definitions or secret handling; `DATABASE_URL` is simply read later.
- Preserve conftest's existing `test_engine` / `get_db` override architecture; only replace the env-var bootstrap.

## Relationships to Sibling Plans

- Wave 1, parallel safe, no dependencies. Source: refactor audit findings 2.1 (High), 4.1, 1.2 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.
- Sibling features touching `yourwolf-backend/app/` should be aware `settings` module-level object may become lazy or be replaced by `get_settings()`.

## Suggested Implementation Order

Stages in plan order: Stage 1 (Base relocation) → Stage 2 (lazy settings/engine) → Stage 3 (test bootstrap cleanup). Each stage leaves the suite green.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python (venv at 3.12.6; pyproject claims >=3.14) + FastAPI + SQLAlchemy 2.x + Pydantic Settings; uv-managed venv |
| Test Runner | `cd yourwolf-backend && uv run pytest -q` (deps installed via `uv pip install -r requirements.txt -r requirements-dev.txt`) |
| Test Baseline | 250 passed, 0 failed, coverage 89.49% — captured 2026-07-16 |
| Lint | mypy configured (`[tool.mypy]`, disallow_untyped_defs); no ruff/flake8 config found |
| Format | `black` (line-length 88) + `isort` (profile black) per pyproject.toml |

## Relevant Learnings

None applicable — no `.github/learnings/` directory exists in this repository.
