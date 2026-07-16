# Review Record: Backend Seed Role Data Files

## Summary

The extraction is faithful and the AC3 test is genuine — both independently verified, not accepted from the record. Two real defects were found in the loader's validation contract and fixed at review.

Headline verifications (each re-run by me, not read):

- **Data fidelity is exact.** I exec'd the pre-refactor `app/seed/roles.py` from `19b4520` and compared its live `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA` against the new loader's output: `==` is `True` for both, including role order and **per-role key order** (which matters, because `seed_roles()` uses `.get(k, default)` for four optional keys — preserving key *absence* is load-bearing). `seed_roles` / `seed_role_dependencies` bodies are byte-for-byte identical to baseline; the only diff in that region is the removed literal block.
- **AC3 is not vacuous.** See the dedicated section below — I proved the golden file is a real pre-refactor artifact.
- **The name audit is correct.** Independently confirmed: 30 names, shortest `"Cow"` = 3, longest `"Paranormal Investigator"` = 23, zero violations of 2–50. Feature 07 can adopt those bounds safely.
- **Referential integrity is clean.** 30/30 unique names; 0 dependencies naming undefined roles; 0 self-referential deps; 0 duplicate `(source, target)` pairs; 48 ability_steps all resolving to the 15 known ability types; 31 win_conditions.

The primary architectural concern — import-time `load_seed_data()` — I judge **acceptable and materially different from feature 02's case**, not a regression. Full reasoning below; this was the main judgment call and I did not take the implementer's framing at face value.

## Verdict

**Approved with Reservations**

Reservations: AC5 remains **unverified** (container QA never executed — cannot be marked met from static review), and the import-time-load decision, while I endorse it, is a precedent that needs recording so it is not cargo-culted in either direction.

## The import-time load: acceptable, not a regression

The question is whether `ROLES_DATA, ROLE_DEPENDENCIES_DATA = load_seed_data()` at module scope regresses the direction feature 02 (`67cdb75`) established. I read `app/config.py`, `app/database.py`, and feature 02's implementation record before deciding, and probed the invariant empirically.

**Finding: (a) — materially different. No change made.**

The reasoning, stated explicitly:

1. **Feature 02's principle is not "no code runs at import" — that is impossible in Python.** Enum classes, Pydantic models, and SQLAlchemy declarative classes are all constructed at import throughout this codebase. The principle 02 actually established is narrower and more useful: *importing a module must not require ambient environment or acquire external resources.* Its own AC5 codifies exactly this — "`import app.models.role` succeeds with no `DATABASE_URL`".

2. **That invariant still holds, and I verified it rather than reasoning about it.** `env -i PATH=/usr/bin:/bin ./.venv/bin/python -c "import app.seed.roles"` → succeeds, loads 30 roles. With *no environment at all*. The specific property feature 02 fought for is intact.

3. **The concrete harms 02 removed do not recur.** 02's pain was causal, not aesthetic: import-time `Settings()` required `DATABASE_URL`, which forced the positional `os.environ` hack in conftest — an *import-order sensitivity*. A package-adjacent data file read has no env dependency and no ordering dimension, so it cannot reproduce that failure mode. It is deterministic: it either always works or always fails, in every environment, caught on first collection.

4. **Blast radius never reaches app boot.** I verified `app.main` does not transitively import `app.seed` (`app.seed in sys.modules after importing app.main: False`). The only importers are `app/seed/__init__.py` (the CLI) and tests. This is categorically unlike `config`/`database`, which every model pulled in.

5. **It preserves the pre-refactor contract, which AC2/AC3 demand.** Before, `ROLES_DATA` was *also* built at import — by the Python parser — and a malformed literal raised `SyntaxError` at import. Reading a bundled JSON is closer to parsing a literal than to opening a socket. There is in-package precedent: `ABILITIES_DATA` in `abilities.py` is a module-level constant.

**Where I disagree with the implementer's framing:** they justify import-time as necessary for "fail-fast / no-partial-seed". That argument is weak — `load_seed_data()` validates fully *before returning*, so a lazy `@cache get_seed_data()` would satisfy "no partial seed" equally. The decision is defensible on the grounds above, not on the fail-fast grounds cited. The right conclusion via the wrong reasoning; recorded so the precedent is understood correctly.

**Residual cost, accepted:** a corrupt data file surfaces as a pytest *collection error* rather than a clean test failure, and if a future router ever imports `app.seed.roles` (e.g. to list official roles) a missing data file would crash app boot. Logged as Issue #6 (Low) and in cross-phase decisions.

## AC3: the snapshot is genuinely pre-refactor

The stated risk was that the golden snapshot might be a re-serialization of the new JSON compared against itself — a tautology. It is not, and I did not settle this by reading.

Two independent proofs:

1. **Direct baseline diff of the data.** Exec'd `19b4520`'s `roles.py` and compared its live literals to the new `ROLES_DATA`: identical, including key order. This alone makes the data fidelity claim solid regardless of the snapshot's provenance.
2. **Golden file reproduced from the old code path.** I seeded a fresh SQLite DB by calling the **pre-refactor** `seed_roles()` / `seed_role_dependencies()` from `19b4520`, snapshotted it with the committed `_snapshot_seeded_db()`, and compared to `tests/data/expected_seed_snapshot.json` → **`True`**. The committed golden file is a faithful artifact of the old path.

The test is therefore a real equality check: `JSON → loader → seed_roles → DB → snapshot` vs. a golden captured from code that no longer exists. The implementer's caveat that "the snapshot and the data file share a generator" is a fair one to raise, but the shared generator was itself driven by the old literals, and proof (2) closes the loop independently of it.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | **Met** | `app/seed/data/roles.json` | 30 roles + 9 deps. Verified equal to `19b4520` literals incl. key order/absence. |
| AC2 | **Met** | `app/seed/roles.py:1-260` | 1091 → 393 lines (now ~440 after review hardening). `Team`/`DependencyType` reconstructed; deps rebuilt as tuples. Seed fn bodies byte-identical to baseline. |
| AC3 | **Met (independently proven)** | `tests/test_seed.py::TestSeedEquality`; `tests/data/expected_seed_snapshot.json` | Golden reproduced from old code path at `19b4520`. Not vacuous. |
| AC4 | **Met** | `tests/test_seed.py` | 2 → 34 tests (28 from implementer + 6 added at review). `app/seed/roles.py` coverage 21% → 91%. |
| AC5 | **UNVERIFIED** | `Dockerfile` (unchanged) | **Requires a container build+run.** See below. |

**AC5 explicitly not marked met.** Static evidence is strong and I confirmed each piece myself — no `.dockerignore` exists in the backend build context, `Dockerfile:24` is `COPY . .` under `WORKDIR /app`, `git check-ignore` reports `roles.json` is not ignored, and `__file__`-relative resolution makes it cwd-independent. But the plan's evidence category for AC5 is "Manual QA: seed runs inside container", and no image was built or run in this review (Docker daemon unavailable). Reading a `COPY . .` line is not observing a file present in an image. **Required check:** build the backend image, run `python -m app.seed` inside it, confirm 30 roles.

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Loader accepts a role omitting fields `seed_roles()` indexes directly (`wake_order`, `wake_target`, `description`, `votes`, `win_conditions`) → `KeyError` part-way through the insert loop instead of a clear `SeedDataError` at load. Violates plan §B ("fail fast with a clear error, not seed partially"). | Medium | `app/seed/roles.py` `_parse_role` | AC2, §B | **Fixed** |
| 2 | Non-dict `ability_steps` entry or scalar `ability_steps` leaks `AttributeError: 'str' object has no attribute 'get'` — contract violation; the docstring documents `SeedDataError`. | Medium | `app/seed/roles.py` `_parse_role` | AC2, §B | **Fixed** |
| 3 | `load_seed_data` docstring claimed *"Validation is exhaustive"* — demonstrably false (see #1/#2). Overclaiming docstrings on a validating loader are worse than none. | Low | `app/seed/roles.py` `load_seed_data` | AC2 | **Fixed** |
| 4 | `known_ability_types` rebuilt per role (30×). Implementer's stated rationale — "deliberately not hoisted to avoid import-time coupling" — is invalid: `ABILITIES_DATA` is already imported at module scope (`roles.py:20`), so the coupling exists regardless. Perf irrelevant at this size; the bogus rationale was the concern. | Low | `app/seed/roles.py` `_parse_role` | — | **Fixed** |
| 5 | AC5 container QA never executed. | Medium | `Dockerfile` | AC5 | **Open** |
| 6 | Import-time load means a corrupt data file yields a pytest *collection* error, and creates latent coupling if a router ever imports `app.seed.roles`. | Low | `app/seed/roles.py:~260` | — | **Wont-Fix** (accepted; see reasoning above + cross-phase entry) |
| 7 | `ROLES_DATA` is a module-level mutable list of dicts; a test mutating it in place pollutes others. Pre-existing in kind (true of the old literals too). | Low | `app/seed/roles.py:~260` | — | **Open** |
| 8 | isort deviation (Deviation 1). | Low | `app/seed/roles.py`, `tests/test_seed.py` | — | **Wont-Fix** — correct call, matches the identical precedent already endorsed at feature 02's review and recorded in review-learnings. The repo consistently uses a merged block; the isort config disagrees with the entire committed tree. Fixing the config is a repo-wide concern, not this feature's. |

Deviation 2 (loader-level ability-type validation, leaving the DB-time warn-and-skip branch reachable when abilities are absent from the DB) reviewed and **endorsed** — correct reading of the constraint.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/app/seed/roles.py` | Added `_require_keys()` + `_require_entry_list()` helpers and `REQUIRED_ROLE_KEYS` / `REQUIRED_STEP_KEYS` / `REQUIRED_WIN_CONDITION_KEYS`. `_parse_role` now validates that `ability_steps`/`win_conditions` are lists of objects and that every role/step/win-condition carries the fields `seed_roles()` indexes — all raising `SeedDataError` before any DB work. | 1, 2 |
| `yourwolf-backend/app/seed/roles.py` | Corrected the `load_seed_data` docstring to state what is and is not validated (enum members yes; field value types no — schema enforces those). | 3 |
| `yourwolf-backend/app/seed/roles.py` | Hoisted `KNOWN_ABILITY_TYPES` to a module constant. | 4 |
| `yourwolf-backend/tests/test_seed.py` | Added 6 regression tests: role missing seeder-required field, role missing `win_conditions`, non-object ability step, non-list `ability_steps`, step missing required field, win condition missing required field. | 1, 2 |

Each fix was probed negatively before and after — all four failure modes leaked before, all raise `SeedDataError` with a clear message now. Post-fix I re-ran the baseline equality check: `ROLES_DATA` still `==` the `19b4520` literals, and the golden snapshot still reproduces from the old path. The hardening is inert for valid data (I confirmed all 30 shipped roles carry every required key; only 4 optional keys are legitimately sparse — `default_count`/`min_count`/`max_count` on 3 roles, `is_primary_team_role` on 4 — and those remain `.get()`-defaulted, untouched).

## Remaining Concerns

- **Issue #5 (Medium, Open):** AC5 unverified. Needs a container build + `python -m app.seed` + confirm 30 roles. Recommend QA.
- **Issue #7 (Low, Open):** mutable module-level `ROLES_DATA`. Not worth a fix now.
- **Issue #6 (Low, Wont-Fix):** accepted import-time precedent; recorded so it is applied with judgment, not as a blanket rule.

## Test Coverage Assessment

- **Covered:** AC1 (via AC3 equality + shape tests), AC2 (`TestSeedDataShape`, `TestSeedDataLoader`), AC3 (`test_fresh_seed_matches_pre_refactor_snapshot` — independently validated as non-vacuous), AC4 (`TestSeedDataShape`, `TestSeedReferentialIntegrity`, `TestSeedEquality`).
- **Missing:** AC5 has no automated coverage and cannot easily have any — it is a packaging property. Container QA required.
- **Added at review:** 6 loader fail-fast tests closing the Issue #1/#2 gaps.
- `app/seed/__init__.py::run_seed()` remains untested (~38%) — pre-existing, already logged as Deferred Work by feature 02 and assigned to this feature. Not addressed; `run_seed()` was not modified here and the seed path is exercised end-to-end by `TestSeedEquality`.

## Test Status

- **Full suite: 330 passed, 0 failed, 94.37% coverage** (from 324 / 94.29% at entry; +6 tests, +0.08%).
- `app/seed/roles.py`: 91% (was 89%).
- `black --check` clean on both changed files. `mypy app/seed/roles.py` — no errors in this file (17 pre-existing errors in `app/models/*` are byte-identical to baseline and out of scope).

## Risk Summary

- **`app/seed/data/roles.json`** — 1,106 lines of generated data. Fidelity is not a residual risk: proven equal to the `19b4520` literals including key order and key absence.
- **AC5 packaging is the one genuine open risk.** If the data file were ever excluded from the image, `python -m app.seed` fails at import. Import-time load actually makes this *fail earlier and more clearly* (before any DB connection) — but it is unverified in a container.
- **Import-time load is a deliberate, recorded precedent**, not drift. It is safe specifically because the resource is package-adjacent and env-free; it does not license import-time work that touches env, network, or DB.
- **Loader validation was the real defect** and it was contract-level, not cosmetic: the module's whole reason to exist is fail-fast validation, and its docstring claimed exhaustiveness it did not have. Now closed and pinned by tests.
- Seed function bodies byte-identical to baseline — idempotency, commit points, and log messages preserved.

## Ledger

No `ledger-events.jsonl` / `ledger-commits.jsonl` and no remediation-ledger-contract instruction file exist anywhere in this repo (searched repo-wide). No ledger row was appended. Reporting explicitly rather than assuming success.
