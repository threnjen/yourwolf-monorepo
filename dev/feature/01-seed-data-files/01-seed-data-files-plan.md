# 01 Seed Data Files

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** `yourwolf-backend/app/seed/data/abilities.json` contains the 15 ability primitives currently defined by `ABILITIES_DATA` in `yourwolf-backend/app/seed/abilities.py`.
- **AC2:** The backend ability seeder loads and validates `abilities.json`, following the existing `load_seed_data()` and `SeedDataError` behavior in `yourwolf-backend/app/seed/roles.py`.
- **AC3:** Backend seed tests prove valid data still seeds all abilities and malformed, absent, or invalid JSON fails clearly.
- **AC4:** `yourwolf-frontend/src/data/seed/` contains exact copies of the backend `roles.json` and `abilities.json` files.
- **AC5:** A frontend parity test reads both backend files by relative path and fails if either frontend copy differs, including a mutation check that proves the guard can fail.
- **AC6:** `yourwolf-frontend/package.json` exposes an npm script that refreshes both frontend seed copies. `yourwolf-frontend/package-lock.json` remains synchronized.

### Non-Goals

- Do not create repository interfaces or IndexedDB stores.
- Do not alter backend API contracts or role seed semantics.
- Do not move canonical seed data to the monorepo root.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC3 | `yourwolf-backend/app/seed/abilities.py`, `yourwolf-backend/app/seed/data/abilities.json`, `yourwolf-backend/tests/test_seed.py` | Existing test to update; must-have automated test |
| AC4-AC5 | `yourwolf-backend/app/seed/data/roles.json`, `yourwolf-frontend/src/data/seed/`, frontend seed parity suite | Must-have automated test |
| AC6 | `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json` | Code-review evidence only; must-have automated test |

## B. Correctness & Edge Cases

- Preserve all 15 ability records and every `type`, `name`, `description`, and `parameters_schema` value.
- Reject a missing file, invalid JSON, a non-list payload, non-object entries, missing required fields, and invalid field shapes before database writes.
- Keep repeated seeding idempotent through the existing `seed_abilities` behavior.
- Make the parity check compare parsed content or deterministic file content without rewriting either source during the test.
- Report seed-data failures through `SeedDataError`; do not print or silently skip invalid records.

## C. Consistency & Architecture Fit

- Follow `load_seed_data()` in `yourwolf-backend/app/seed/roles.py` for file access and validation behavior.
- Keep the backend package as the canonical source because each Docker image builds from its package directory.
- Preserve `seed_abilities` as the backend entry point.
- The refresh script copies canonical files only. The parity test independently proves both copies match.
- No architectural deviation is planned.

## D. Clean Design & Maintainability

- Extend the existing seed-loading responsibility instead of adding a second configuration system.
- Keep schema checks close to the ability loader and avoid a general-purpose JSON framework.
- Keep it clean: one canonical source, one refresh path, one independent parity guard, no generated source code.

## E. Completeness: Observability, Security, Operability

- **Observability:** Preserve existing seed failure reporting. Add no normal-path logs.
- **Security:** Treat packaged JSON as untrusted at the load boundary and validate it before persistence.
- **Runbook:** Run the refresh script after canonical seed changes, then run backend seed tests and the frontend parity suite. Roll back by reverting the data and loader changes together. Monitor through test failures; no runtime metric is needed.

## F. Test Plan

- AC1-AC3: update existing backend seed tests and add malformed ability-file scenarios.
- AC4-AC5: add a frontend parity suite that compares both copied files with their canonical sources.
- AC6: verify the npm refresh command completes and leaves the parity suite green.
- High-value checks:
  1. Given the canonical ability file, when the seeder runs, then all 15 abilities retain their exact fields.
  2. Given invalid JSON, when the loader runs, then it raises `SeedDataError` before any seed write.
  3. Given a required ability field is absent, when validation runs, then it rejects the entry with useful context.
  4. Given either frontend copy is mutated in an isolated test fixture, when parity runs, then the test fails.
  5. Given the refresh script runs, when both copies are compared, then they match the backend files.
- Reuse existing backend database fixtures. Use temporary files or test fixtures for malformed and mutated data.
- This changes a seed implementation. Existing `yourwolf-backend/tests/test_seed.py` assertions remain in scope and must not be weakened.
- Stage 0 is not required because both baseline suites exist and enforce at least 80 percent coverage.

## Stage 1: Canonical Ability Data
**Goal**: Move ability primitives into validated backend JSON without changing seeded behavior.
**Success Criteria**: AC1-AC3 pass with existing seed behavior preserved.
**Status**: Not Started

## Stage 2: Frontend Copies and Drift Guard
**Goal**: Ship both catalogs with a reproducible copy command and a failure-capable parity test.
**Success Criteria**: AC4-AC6 pass, including the mutation proof.
**Status**: Not Started
