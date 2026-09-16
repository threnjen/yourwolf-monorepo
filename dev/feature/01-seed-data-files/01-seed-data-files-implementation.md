# Implementation Record: 01 Seed Data Files

## Summary

Extracted the canonical ability catalog into validated backend JSON, retained the public `ABILITIES_DATA` and `seed_abilities()` surfaces, copied role and ability catalogs into the frontend, and added a dependency-free refresh command plus parity guard.

## Sibling Features

- `02-indexeddb-repositories` consumes both frontend seed copies and the canonical record shapes.
- `03-catalog-bootstrap` consumes the seed data through the repositories created by Feature 02.
- Shared modules: `yourwolf-backend/app/seed/abilities.py`, `yourwolf-backend/app/seed/data/*.json`, and `yourwolf-frontend/src/data/seed/*.json`.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | `TestAbilitySeedDataLoader.test_shipped_data_file_loads_all_abilities` | Load canonical JSON and compare all records | Complete | `yourwolf-backend/app/seed/data/abilities.json`, `yourwolf-backend/app/seed/abilities.py` | `yourwolf-backend/tests/test_seed.py`, `dev/feature/01-seed-data-files/backend-final.xml` | PENDING | PENDING |
| AC2 | AC2 | `TestAbilitySeedDataLoader.test_seed_uses_all_loaded_abilities` | Seed validated catalog through existing entry point | Complete | `yourwolf-backend/app/seed/abilities.py`, `yourwolf-backend/app/seed/roles.py` | `yourwolf-backend/tests/test_seed.py`, `dev/feature/01-seed-data-files/backend-final.xml` | PENDING | PENDING |
| AC3 | AC3 | `TestAbilitySeedDataLoader.test_missing_file_raises`, `test_malformed_json_raises`, `test_non_list_payload_raises`, `test_non_object_entry_raises`, `test_missing_required_field_raises`, `test_invalid_field_shape_raises` | Invalid input fixtures raise `SeedDataError` before seeding | Complete | `yourwolf-backend/app/seed/abilities.py`, `yourwolf-backend/tests/test_seed.py` | `dev/feature/01-seed-data-files/backend-seed-final.xml` | PENDING | PENDING |
| AC4 | AC4 | `frontend seed copies > matches the canonical roles file`, `matches the canonical abilities file` | Compare parsed backend and frontend JSON files | Complete | `yourwolf-backend/app/seed/data/roles.json`, `yourwolf-backend/app/seed/data/abilities.json`, `yourwolf-frontend/src/data/seed/roles.json`, `yourwolf-frontend/src/data/seed/abilities.json` | `yourwolf-frontend/src/test/data/seed_parity.test.ts`, `dev/feature/01-seed-data-files/frontend-seed-parity-final.xml` | PENDING | PENDING |
| AC5 | AC5 | `frontend seed copies > fails when a copied seed is mutated` | Mutate an isolated parsed copy and assert the parity guard fails | Complete | `yourwolf-frontend/src/test/data/seed_parity.test.ts` | `dev/feature/01-seed-data-files/frontend-seed-parity-final.xml` | PENDING | PENDING |
| AC6 | AC6 | Refresh-script command check plus parity suite | Copy canonical files from package-local npm script | Complete | `yourwolf-frontend/package.json` | `dev/feature/01-seed-data-files/frontend-seed-parity-final.xml`, `yourwolf-frontend/package-lock.json` (unchanged and synchronized) | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Canonical JSON contains the 15 existing ability primitives | Complete | `yourwolf-backend/app/seed/data/abilities.json` | Loaded records equal the pre-refactor catalog. |
| AC2 | Backend seeder loads and validates canonical JSON | Complete | `yourwolf-backend/app/seed/abilities.py`, `yourwolf-backend/app/seed/roles.py` | `SeedDataError` is defined in `abilities.py` and re-exported through `roles.py` to avoid a reverse import cycle. |
| AC3 | Seed tests cover valid, malformed, absent, and invalid ability data | Complete | `yourwolf-backend/tests/test_seed.py` | 42 focused tests passed with coverage disabled. |
| AC4 | Frontend contains exact role and ability copies | Complete | `yourwolf-frontend/src/data/seed/roles.json`, `yourwolf-frontend/src/data/seed/abilities.json` | Refresh command and byte comparison both succeed. |
| AC5 | Parity suite detects drift and proves failure capability | Complete | `yourwolf-frontend/src/test/data/seed_parity.test.ts` | 3 parity tests passed, including in-memory mutation proof. |
| AC6 | Npm refresh script exists and lockfile remains synchronized | Complete | `yourwolf-frontend/package.json` | `npm run seed:refresh` completed successfully. No dependency metadata changed, so package-lock remains unchanged. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/seed/abilities.py` | Modified | Added JSON loader and field-shape validation. Loaded `ABILITIES_DATA` from the canonical file. Defined shared `SeedDataError`. | Preserve public seed behavior while failing before database work. |
| `yourwolf-backend/app/seed/roles.py` | Modified | Imported `SeedDataError` from the ability loader module and removed the duplicate class definition. | Keep one error contract without creating the documented circular import. |
| `yourwolf-backend/app/seed/data/abilities.json` | Added | Canonical 15-record ability catalog. | Move data out of Python and ship it with the backend package. |
| `yourwolf-frontend/src/data/seed/roles.json` | Added | Exact copy of backend role catalog. | Provide frontend-local seed data. |
| `yourwolf-frontend/src/data/seed/abilities.json` | Added | Exact copy of backend ability catalog. | Provide frontend-local seed data. |
| `yourwolf-frontend/package.json` | Modified | Added `seed:refresh` npm script. | Make copying both canonical files reproducible. |
| `yourwolf-frontend/src/test/data/node_modules.d.ts` | Added | Minimal test-only declarations for Node filesystem modules. | Keep parity test dependency-free because `@types/node` is not a project dependency. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|-----|
| `yourwolf-backend/tests/test_seed.py` | Modified | Added 8 ability loader and seeding tests. | AC1-AC3. |
| `yourwolf-frontend/src/test/data/seed_parity.test.ts` | Added | Added backend/frontend parsed-content parity checks and isolated mutation proof. | AC4-AC5. |

## Test Results
- **Execution**: executed-green
- **Command**: `uv run pytest --junitxml=../dev/feature/01-seed-data-files/backend-final.xml` from `yourwolf-backend` — 500 total, 500 passed, 0 failed. `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/01-seed-data-files/frontend-final.xml` from `yourwolf-frontend` — 688 total, 688 passed, 0 failed.
- **Results artifact**: `dev/feature/01-seed-data-files/backend-final.xml`, `dev/feature/01-seed-data-files/frontend-final.xml`
- **Baseline**: 492 passed, 0 failed backend. 685 passed, 0 failed frontend. Artifacts: `dev/feature/PHASE_05A-baseline/backend-pytest.xml`, `dev/feature/PHASE_05A-baseline/frontend-vitest.xml`.
- **Final**: 500 passed, 0 failed backend. 688 passed, 0 failed frontend.
- **New tests added**: 11
- **Affected suites run**: `tests/test_seed.py` 42/42 passed with `--no-cov`, frontend parity 3/3 passed, full backend and frontend suites, frontend lint/build, scoped backend Black/isort.
- **Regressions**: None

The required unmodified focused command `uv run pytest tests/test_seed.py --junitxml=../dev/feature/01-seed-data-files/backend-seed-required.xml` ran 42 tests with 42 passed and 0 failed, then exited nonzero only because the repository-wide 80% coverage threshold applies to a single-file run. The green focused artifact is `backend-seed-final.xml`, produced with `--no-cov`.

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`.
- **Review findings**: One medium plan-conformance finding resolved by adding
  parameterized invalid-shape cases for all ability string fields.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None
- **Post-repair evidence**: Backend 503/503 and frontend 688/688 passed in the
  integrated suites. Focused backend seed tests passed 45/45, and focused
  frontend parity tests passed 3/3.

## Unfixed findings

None.

## Deviations from Plan

- The plan left the frontend parity test name unspecified. Implemented `yourwolf-frontend/src/test/data/seed_parity.test.ts`.
- The plan left the shared `SeedDataError` location constrained by an import cycle. Defined it in `abilities.py` and imported it in `roles.py`, preserving the existing `app.seed.roles.SeedDataError` import surface without introducing a second error type.
- Added a test-only Node module declaration instead of adding `@types/node`, because no new dependency was required by the plan.

## Gaps

None.

## Reviewer Focus Areas

- Ability JSON loader validation in `yourwolf-backend/app/seed/abilities.py` — verify all invalid inputs fail before database writes.
- `SeedDataError` import direction between `abilities.py` and `roles.py` — verify compatibility imports and absence of cycles.
- Frontend parity path resolution and mutation proof in `yourwolf-frontend/src/test/data/seed_parity.test.ts`.
- Refresh command paths in `yourwolf-frontend/package.json` — verify it works from the frontend package context.
