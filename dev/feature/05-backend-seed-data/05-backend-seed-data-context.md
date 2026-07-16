# Context: Backend Seed Role Data Files

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/seed/roles.py` | Currently 1,091 lines: `ROLES_DATA` (30 role dicts), `ROLE_DEPENDENCIES_DATA` (9 tuples), `seed_roles()`, `seed_role_dependencies()`. Becomes a thin loader | Modify |
| `yourwolf-backend/app/seed/data/roles.json` `[PROPOSED - name TBD]` | New data file holding the 30 role definitions and role dependencies | Create |
| `yourwolf-backend/tests/test_seed.py` | Currently 17 lines / 2 tests (`TestSeedWakeOrder`, importing `ROLES_DATA`). Strengthened per AC4 | Modify |

### Read-only reference files

| File | Role |
|------|------|
| `yourwolf-backend/app/seed/__init__.py` | `run_seed()` orchestrator — imports `seed_roles`, `seed_role_dependencies` from `app.seed.roles`. Preserve these function signatures |
| `yourwolf-backend/app/seed/__main__.py` | CLI entry point — behavior must not change (non-goal) |
| `yourwolf-backend/app/seed/abilities.py` | `ABILITIES_DATA` (15 ability primitives) + `seed_abilities()`. NOT in scope — role→ability coupling is by string `ability_type` key resolved at seed time via `ability_map` |
| `yourwolf-backend/app/models/role.py` | `Role`, `Team`, `Visibility` enums |
| `yourwolf-backend/app/models/ability_step.py` | `AbilityStep`, `StepModifier` enum |
| `yourwolf-backend/app/models/role_dependency.py` | `RoleDependency`, `DependencyType` enum |
| `yourwolf-backend/app/models/win_condition.py` | `WinCondition` |
| `yourwolf-backend/Dockerfile` | Uses `COPY . .` — a new `app/seed/data/` directory is copied automatically; only `.dockerignore` (if any) could exclude it (verify) |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Plan's key-files list names `app/seed/abilities.py` "(verify)" — verified: abilities are referenced from roles only by string `ability_type` keys (e.g., `"view_card"`), resolved in `seed_roles()` via a DB-built `ability_map`. No structural change to `abilities.py` needed | Confirms non-goal; abilities stay Python | None |
| `roles.py` also contains `ROLE_DEPENDENCIES_DATA` — 9 `(source_name, target_name, DependencyType)` tuples — consumed by `seed_role_dependencies()`. AC1 covers "role→ability/dependency relationships"; dependencies must move to the data file too (or a sibling section of it) | Data file needs two sections (roles + dependencies) or two files | Add task |
| Enum values in `ROLES_DATA` are mixed-form: `"team"` uses the `Team` enum object, but `"modifier"` in ability steps is already a string coerced via `StepModifier(step_data["modifier"])`, and win-condition `condition_type` is a plain string. JSON serialization must normalize `Team` to its string value and the loader must reconstruct it | Loader must map `Team`/`DependencyType` from strings; `StepModifier` already string-based at data layer | Note for implementer |
| `seed_roles()` currently logs a warning and silently skips a step when an `ability_type` is unknown — plan AC/edge cases demand hard failure on dangling references from the loader. Loader-level validation (data-file integrity) is new behavior; do NOT change `seed_roles()` DB-time skip behavior beyond what AC requires | Distinguish load-time validation (fail fast) from seed-time behavior (preserve) | Note for implementer |
| Existing tests `test_doppelganger_wake_order_is_1` and `test_copycat_wake_order_is_1` import `ROLES_DATA` directly from `app.seed.roles` — they will break if the symbol is removed. Keeping a module-level `ROLES_DATA` produced by the loader preserves them | Loader should expose the same `ROLES_DATA` (and `ROLE_DEPENDENCIES_DATA`) names, or tests must be updated | Add task |
| Dockerfile uses `COPY . .` so AC5 is satisfied by default; no `MANIFEST.in`/package-data machinery exists (app is not pip-packaged — run via uvicorn). Verify no `.dockerignore` excludes `*.json` | AC5 likely trivial; still verify in-container seed run | Manual QA task retained |
| Plan says test count "17 lines" — confirmed. Test baseline: 250 passed, coverage 89.49% (pytest enforces `--cov-fail-under=80` via `pyproject.toml addopts`) | New data file must not drop coverage below 80 | None |
| No `tests/phase*/` or other phase-scoped test directory pattern exists in this repo | No consolidated phase test file expected | None |
| Local `.venv` (Python 3.14, uv-managed) does not have pytest installed; suite runs via uv with dev requirements (command below) | Implementer should use the recorded command | None |

No contradictions requiring Decomposer attention beyond the `ROLE_DEPENDENCIES_DATA` inclusion, which fits within AC1's existing wording.

## Architectural Decisions

- **Data file format**: JSON preferred per the refactor audit; final call is the implementer's (plan AC1). JSON is directly reusable by the roadmap's Phase 06 "bundled seed data" desktop need.
- **One file + one loader**: No generic data-loading framework. The loader reads exactly one known file (plan Section D).
- **Stable cross-reference keys**: Role dependencies and role→ability links are expressed by names/string keys (already the case in code: role names and `ability_type` strings) and resolved by the loader/seed functions.
- **Fail-fast loading**: Missing file, malformed JSON, or unknown enum value must raise a clear error before any seeding occurs — no partial seeds.

## Constraints

- `app/seed/__main__.py` CLI interface unchanged (non-goal).
- `seed_roles(db)` and `seed_role_dependencies(db)` signatures must remain importable from `app.seed.roles` (consumed by `app/seed/__init__.py:run_seed`).
- Seeding idempotency/DB behavior unchanged: existing-role skip checks, commit points, and log messages preserved. No new normal-path logs.
- Byte-identical seeding outcome (AC3): same 30 roles, same field values, same relationships — verified by test or scripted comparison.
- Coverage gate: pytest enforces `--cov-fail-under=80`.
- Codebase style: black (line length per `[tool.black]`), isort profile "black", mypy in dev requirements.

## Scope Boundaries

- Do not modify `app/seed/abilities.py` structure — `ABILITIES_DATA` stays as Python (unless a relationship requirement forces otherwise; none found).
- Do not change seed CLI entry behavior (`app/seed/__main__.py`).
- Do not change `run_seed()` in `app/seed/__init__.py` beyond what import compatibility requires (expected: no change).
- Do not alter DB models (`app/models/*`).
- Do not change seeding's idempotent/destructive runtime behavior or its existing logging.
- Do not build a generic/pluggable data-loading framework.

## Relationships to Sibling Plans

- **Depends on `02-backend-config-database`** (Wave 1): seed modules consume the engine/session accessors that 02 rewires (`SessionLocal` import in `app/seed/__init__.py`). Runtime dependency; file overlap limited to `app/seed/__init__.py`.
- Wave 2, parallel-safe with other Wave 2 features.
- Forward-looking: the data file format feeds the roadmap's Phase 06 "bundled seed data" for the desktop bundle.

## Suggested Implementation Order

1. After `02-backend-config-database` completes.
2. Within this feature: Stage 1 (extraction + loader) then Stage 2 (verification hardening).

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python 3.14 (uv-managed `.venv`) + FastAPI 0.109 + SQLAlchemy 2.0 + Pydantic 2 |
| Test Runner | `cd yourwolf-backend && uv run --no-project --python 3.14 --with-requirements requirements-dev.txt pytest -q` |
| Test Baseline | 250 passed, 0 failed, coverage 89.49% (gate: 80%) — captured 2026-07-16 |
| Lint | mypy configured in dev requirements; no ruff/flake8. `uv run --no-project --python 3.14 --with-requirements requirements-dev.txt mypy app` |
| Format | `black .` and `isort .` (configs in `pyproject.toml`) via same uv invocation |

Note: the project `.venv` exists but does not include pytest; use the uv command above rather than `.venv/bin/python -m pytest`.

## Relevant Learnings

None applicable — `.github/learnings/` does not exist in this repository.
