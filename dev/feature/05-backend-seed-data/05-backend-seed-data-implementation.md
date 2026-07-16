# Implementation Record: Backend Seed Role Data Files

## Summary

Extracted the 30 official role definitions and 9 role dependencies from Python literals in `app/seed/roles.py` (1,091 lines) into `app/seed/data/roles.json`, and rewrote `roles.py` as a thin, fail-fast loader (393 lines). The seed functions `seed_roles(db)` and `seed_role_dependencies(db)` are byte-for-byte unchanged, preserving idempotency, commit points, and log messages.

Both the data file and the AC3 golden snapshot were **generated programmatically from the pre-refactor code path** (via a throwaway script run before `roles.py` was touched), not transcribed by hand. This eliminates transcription error as a failure mode and makes the AC3 equality test a genuine comparison against the previous behavior rather than a self-referential one.

`tests/test_seed.py` grew from 17 lines / 2 tests to 28 tests covering seed equality, referential integrity, and loader validation. `app/seed/roles.py` line coverage rose from 21% to 89%.

**Role name length audit (load-bearing for feature 07):** all 30 seed role names fall within the 2-50 bound feature 07 must reconcile. Shortest is `"Cow"` (3 chars); longest is `"Paranormal Investigator"` (23 chars). **No seed role name violates the 2-50 bounds** — feature 07 can adopt those bounds without changing seed data. This is locked in by a regression test (`test_role_names_respect_length_bounds`).

## Sibling Features

Scanned all sibling feature directories (first 5 lines of each `-plan.md` only).

- **02-backend-config-database** (Wave 1, landed): `app/seed/__init__.py` already migrated to `get_session_factory()`; `Base` now in `app/models/base.py`. Built on this — not reverted. `app/seed/__init__.py` untouched by this feature.
- **04-backend-domain-exceptions** (Wave 2, concurrent): observed landing `app/exceptions.py`, `app/main.py`, routers, services, and `tests/test_exceptions.py` during this run. Accounts for 11 of the tests in the final count that are not mine. No file overlap.
- **06-frontend-game-rules** (Wave 2, concurrent): frontend only. No overlap.
- **07-backend-validation-consolidation** (Wave 3, downstream): must reconcile role-name length bounds to 2-50. See the audit above — no seed data blocks that change.
- **Phase 06 roadmap ("bundled seed data")**: JSON format chosen partly because it is directly reusable by a future desktop bundle; noted in the loader module docstring.

Shared module note: `app/seed/abilities.py` is read (not modified) by the loader for ability-type validation.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | plan/AC1 | n/a (code-review evidence + AC3 test) | Data extraction | Done | `app/seed/data/roles.json` | `yourwolf-backend/app/seed/data/roles.json` (30 roles, 9 deps) | PENDING | PENDING |
| AC2 | plan/AC2 | `test_shipped_data_file_loads` | Loader reproduces prior objects | Done | `app/seed/roles.py` | `yourwolf-backend/app/seed/roles.py:193-228`; `tests/test_seed.py::TestSeedDataShape` | PENDING | PENDING |
| AC3 | plan/AC3 | `test_fresh_seed_matches_pre_refactor_snapshot` | Seeded DB snapshot equality | Done | `app/seed/roles.py`, `app/seed/data/roles.json` | `tests/test_seed.py::TestSeedEquality`; `tests/data/expected_seed_snapshot.json` | PENDING | PENDING |
| AC4 | plan/AC4 | `TestSeedDataShape`, `TestSeedReferentialIntegrity` | Count + field equality + integrity | Done | `tests/test_seed.py` | `yourwolf-backend/tests/test_seed.py` (28 tests) | PENDING | PENDING |
| AC5 | plan/AC5 | n/a (manual QA + CLI verification) | Packaging ships `app/seed/data/` | Done (container QA deferred) | `Dockerfile` (unchanged) | See "Gaps"; verified via `python -m app.seed` from foreign cwd | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | 30 role definitions + relationships move to a data file under `app/seed/data/` | Done | `app/seed/data/roles.json` | JSON chosen per audit preference. Two sections: `roles` (30) and `role_dependencies` (9). `Team` serialized to its string value; key order and key presence/absence preserved exactly from the literals |
| AC2 | `roles.py` becomes a thin loader producing the same objects | Done | `app/seed/roles.py` | 1091 → 393 lines. `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA` still module-level; `Team` and `DependencyType` reconstructed; dependencies rebuilt as tuples |
| AC3 | Fresh seed yields identical outcome, verified by test not by eye | Done | `tests/test_seed.py`, `tests/data/expected_seed_snapshot.json` | Snapshot generated from the **pre-refactor** code path before `roles.py` changed |
| AC4 | `test_seed.py` strengthened: count, field equality, referential integrity | Done | `tests/test_seed.py` | 2 → 28 tests; `app/seed/roles.py` coverage 21% → 89% |
| AC5 | Data file ships with the package | Done (container QA deferred) | none (Dockerfile unchanged) | No `.dockerignore` in the backend build context; `COPY . .` includes `app/seed/data/`. Not git-ignored (`git check-ignore` no match). Loader resolves via `__file__`, verified cwd-independent |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/seed/roles.py` | Modify | Replaced ~900 lines of literals with a validating loader (`load_seed_data`, `SeedDataError`, `_read_data_file`, `_require_list`, `_parse_role`, `_parse_dependency`). `seed_roles` / `seed_role_dependencies` bodies unchanged | AC1, AC2 |
| `yourwolf-backend/app/seed/data/roles.json` | Create | 30 roles + 9 dependencies, generated from the pre-refactor literals | AC1 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_seed.py` | Modify | 2 → 28 tests: shape, referential integrity, seed equality, idempotency, loader fail-fast validation. Kept both original wake-order tests unchanged | AC2, AC3, AC4 |
| `yourwolf-backend/tests/data/expected_seed_snapshot.json` | Create | Golden DB snapshot captured from the pre-refactor code path | AC3 |

## Test Results

- **Baseline**: 282 passed, 0 failed, 89.83% coverage (recorded by orchestrator; re-confirmed at start of this run)
- **Final**: 319 passed, 0 failed, 94.21% coverage
- **New tests added**: 26 net in `tests/test_seed.py` (2 → 28). The remaining delta (+11) is feature 04's concurrent `tests/test_exceptions.py`, not this feature
- **Regressions**: None

Gates: `black --check` clean; `mypy app/seed/roles.py` reports no errors in this file (17 pre-existing errors elsewhere in `app/models/*` are untouched and predate this work).

## Deviations from Plan

1. **isort not applied** (deliberate). Running `isort` in this working directory reclassifies `app` as first-party and splits it from `sqlalchemy` into a separate block. Verified that **every untouched file in the repo** (`app/seed/abilities.py`, `app/seed/__init__.py`, `app/models/role.py`, `tests/conftest.py`) fails `isort --check-only` under that same invocation — i.e. the committed codebase consistently uses a single merged alphabetical block (`app.*` before `sqlalchemy`). I reverted isort's reformat to match the existing convention rather than introduce a second import style in two files. Flagged for the reviewer: the repo's isort config appears to disagree with the committed code, but fixing that is out of scope here.
2. **Loader-level ability-type validation added** (`_parse_role`). Per Section B and the context's "Note for implementer", load-time validation fails fast on dangling `ability_type`. The DB-time warn-and-skip branch in `seed_roles()` was deliberately left untouched per the constraint, even though load-time validation now makes it unreachable for the shipped data file. It remains reachable when abilities are absent from the DB.
3. **Data file generated, not hand-written.** A throwaway script serialized the live pre-refactor `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA`. Safest default for a 900-line data move; the script lives in scratchpad and is not part of the deliverable.

## Gaps

1. **AC5 container QA not executed** — the Docker daemon is not running in this environment, so "run seed inside the container and verify 30 roles" could not be performed. Mitigated by static verification (no `.dockerignore`; not git-ignored; `COPY . .` covers the directory) and by running the real CLI entry point `python -m app.seed` from a different working directory against a SQLite DB, which seeded 30 roles / 9 deps / 48 steps / 31 win_conditions successfully. This proves the `__file__`-relative path resolution works regardless of cwd, which is the actual packaging risk under `WORKDIR /app`. Recommend a QA agent run the container check.

## Reviewer Focus Areas

- **`app/seed/data/roles.json` fidelity** — generated, not hand-typed; AC3's `test_fresh_seed_matches_pre_refactor_snapshot` compares against a snapshot captured from the old code path. Note the snapshot and the data file share a generator, so the strongest independent evidence of fidelity is `git diff` of the removed literals against the JSON.
- **`app/seed/roles.py:94-142` (`_parse_role`)** — `known_ability_types` is recomputed per role; trivial for 30 roles, deliberately not hoisted to avoid import-time coupling, but worth a look.
- **`app/seed/roles.py:229` — module-level `load_seed_data()` at import time.** Any malformed data file now raises `SeedDataError` on *import* of `app.seed.roles`, not at seed time. This is the intended fail-fast behavior, but it means an import of the seed package can raise. Confirm this is acceptable.
- **Import ordering** (see Deviation 1) — I matched committed convention over the isort config. Confirm this is the right call.
- **Optional-key preservation** — the JSON preserves absent keys (e.g. `default_count`, `is_primary_team_role`) exactly where they were absent, so `seed_roles()`'s `.get(..., default)` calls behave identically. Normalizing them would have changed `ROLES_DATA`'s structure.
