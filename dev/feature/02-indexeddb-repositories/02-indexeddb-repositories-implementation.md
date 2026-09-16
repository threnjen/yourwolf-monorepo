# Implementation Record: 02 IndexedDB Repositories

## Summary

Implemented the pure TypeScript local data boundary and one IndexedDB-backed repository set. Seed conversion supplies Phase 05A defaults, deterministic official and nested IDs, dependency resolution, custom-role UUIDs, snapshot validation, and atomic initial/reseed transactions. Added exact-pinned `idb` and `fake-indexeddb` dependencies, test setup polyfill, type compatibility coverage, data-layer tests, and the `src/data/` ESLint boundary.

## Sibling Features

- `01-seed-data-files` supplies the copied role and ability JSON consumed by conversion.
- `03-catalog-bootstrap` will consume `createIndexedDbRepositories`, `bootstrap`, role filters, and ability reads.
- `04-game-snapshot-repository` will consume `GameSnapshot` and `GameRepository` while migrating existing session-storage callers.
- `05-local-role-save-and-qa` will consume `createCustomRole` and `RoleRepository.put`.
- Shared modules: `yourwolf-frontend/src/data/`, `yourwolf-frontend/src/test/setup.ts`, and `yourwolf-frontend/eslint.config.js`.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | repository contract imports and method tests | Plain repository interfaces expose role, ability, game, and metadata contracts | Complete | `src/data/repositories.ts`, `src/data/index.ts` | `src/test/data/repositories.test.ts`, `src/data/repositories.ts` | PENDING | PENDING |
| AC2 | AC2 | local role transport compatibility test | Type-level assignability to `Role` and `RoleListItem`, plus record default assertions | Complete | `src/data/records.ts`, `src/data/conversion.ts` | `src/test/data/type_compatibility.test.ts`, `src/test/data/conversion.test.ts` | PENDING | PENDING |
| AC3 | AC3 | IndexedDB repository suite and dependency manifest | One typed database wrapper with four stores and exact dependency pins | Complete | `src/data/indexeddb.ts`, `package.json`, `package-lock.json`, `src/test/setup.ts` | `src/test/data/repositories.test.ts`, `npm ls idb fake-indexeddb --depth=0` | PENDING | PENDING |
| AC4 | AC4 | stable ID conversion tests | Deterministic role, ability, step, win-condition, dependency IDs and UUID custom IDs | Complete | `src/data/ids.ts`, `src/data/conversion.ts` | `src/test/data/conversion.test.ts` | PENDING | PENDING |
| AC5 | AC5 | seed conversion tests | Convert 30 roles and 15 abilities, resolve ability names/dependencies, and fill defaults | Complete | `src/data/conversion.ts`, `src/data/seed.ts` | `src/test/data/conversion.test.ts`, `src/test/data/seed_parity.test.ts` | PENDING | PENDING |
| AC6 | AC6 | bootstrap transaction tests | Initial seed, matching-version no-op, and newer-version reseed behavior | Complete | `src/data/indexeddb.ts`, `src/data/seed.ts` | `src/test/data/repositories.test.ts` | PENDING | PENDING |
| AC7 | AC7 | stable-id and stale-official reseed test | Reseed updates officials, removes stale officials, preserves customs, and writes metadata atomically | Complete | `src/data/indexeddb.ts`, `src/data/conversion.ts` | `src/test/data/repositories.test.ts` | PENDING | PENDING |
| AC8 | AC8 | repository CRUD and rollback tests | Filters, get/put/delete, null-on-missing snapshots, and forced transaction rollback | Complete | `src/data/indexeddb.ts` | `src/test/data/repositories.test.ts`, `dev/feature/02-indexeddb-repositories/data-final.xml` | PENDING | PENDING |
| AC9 | AC9 | temporary relative and alias lint probes | Pure-layer rule rejects both `../types` and `@/types` imports, then probes are removed | Complete | `eslint.config.js` | Probe command output, `npm run lint` | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Pure repository interfaces exist for roles, abilities, games, and metadata | Complete | `src/data/repositories.ts`, `src/data/index.ts` | No React, storage, API, or transport imports. |
| AC2 | Local records provide required defaults and satisfy both transport role views | Complete | `src/data/records.ts`, `src/data/conversion.ts` | Snapshot types are declared locally to avoid the existing broad `**/types` ESLint pattern. |
| AC3 | One typed IndexedDB database has one store per record type plus metadata | Complete | `src/data/indexeddb.ts`, `package.json`, `package-lock.json` | `idb@8.0.0` and `fake-indexeddb@6.2.4` are exact-pinned. |
| AC4 | Stable and custom IDs follow the phase rules | Complete | `src/data/ids.ts`, `src/data/conversion.ts` | Duplicate role, ability, nested-step, and win-condition IDs reject conversion. |
| AC5 | Seed conversion produces the complete local catalog | Complete | `src/data/conversion.ts`, `src/data/seed.ts` | Seed parity remains covered by the prerequisite suite. |
| AC6 | Bootstrap handles absent, matching, and newer seed versions | Complete | `src/data/indexeddb.ts` | Matching versions preserve existing records and metadata timestamps. |
| AC7 | Reseed is stable, custom-preserving, stale-official-deleting, and atomic | Complete | `src/data/indexeddb.ts` | Roles, abilities, and metadata share one read/write transaction. |
| AC8 | Repository behavior and transaction failure modes are tested | Complete | `src/test/data/repositories.test.ts` | Focused suite covers CRUD, filters, missing records, reseed, and rollback. |
| AC9 | `src/data/` receives and passes the pure-layer boundary | Complete | `eslint.config.js` | Both deliberate import probes failed lint before removal. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/data/records.ts` | Added | Declared independent role, ability, dependency, metadata, custom-input, and snapshot records. | Keep local persistence contracts independent from transport DTOs. |
| `yourwolf-frontend/src/data/repositories.ts` | Added | Declared role, ability, game, and metadata repository interfaces. | Provide the framework-independent boundary for later features. |
| `yourwolf-frontend/src/data/ids.ts` | Added | Added deterministic official, ability, nested, and dependency ID functions. | Preserve IDs across launches and reseeds. |
| `yourwolf-frontend/src/data/conversion.ts` | Added | Validated seed conversion, defaults, name resolution, collision checks, and custom-role mapping. | Convert sparse packaged seed data into complete local records. |
| `yourwolf-frontend/src/data/seed.ts` | Added | Exported seed inputs and `SEED_VERSION`. | Centralize bootstrap seed configuration. |
| `yourwolf-frontend/src/data/indexeddb.ts` | Added | Added typed `idb` wrapper, repository implementations, snapshot guard, bootstrap, reseed, and rollback handling. | Persist local records atomically in IndexedDB. |
| `yourwolf-frontend/src/data/index.ts` | Added | Re-exported public data contracts and implementation helpers. | Give downstream features one stable import surface. |
| `yourwolf-frontend/eslint.config.js` | Modified | Applied pure-layer restrictions to `src/data/` and added relative/alias transport patterns. | Enforce the repository boundary. |
| `yourwolf-frontend/src/test/setup.ts` | Modified | Imported `fake-indexeddb/auto`. | Provide IndexedDB APIs to Vitest under jsdom. |
| `yourwolf-frontend/package.json` | Modified | Added exact `idb` runtime and `fake-indexeddb` development dependencies. | Use the planned IndexedDB implementation and test polyfill. |
| `yourwolf-frontend/package-lock.json` | Modified | Locked `idb@8.0.0` and `fake-indexeddb@6.2.4`. | Keep npm installs reproducible. |
| `docs/learnings/project-learnings.md` | Modified | Recorded the deferred IndexedDB request failure-injection learning. | Preserve a reusable transaction-test failure pattern. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/data/conversion.test.ts` | Added | Added catalog defaults, nested IDs, dependency resolution, collision/error, custom UUID, and seed-version tests. | AC2, AC4, AC5. |
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Added | Added bootstrap, no-op, filters, CRUD, game snapshots, reseed, stale deletion, custom preservation, and rollback tests. | AC3, AC6, AC7, AC8. |
| `yourwolf-frontend/src/test/data/type_compatibility.test.ts` | Added | Added runtime-backed type-level assignments to both transport role views. | AC2. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/02-indexeddb-repositories/frontend-final.xml` from `yourwolf-frontend`
- **Results artifact**: `dev/feature/02-indexeddb-repositories/frontend-final.xml`
- **Baseline**: 688 passed, 0 failed. Artifact: `dev/feature/PHASE_05A-baseline/frontend-vitest-current.xml`
- **Final**: 699 total, 699 passed, 0 failed. Coverage: 91.8% lines/statements, 92.0% branches, 93.45% functions.
- **New tests added**: 11
- **Affected suites run**: data-layer suite 14/14; full frontend suite 699/699; `npm run lint`; `npm run build`; `npm ls idb fake-indexeddb --depth=0`
- **Focused command**: `npm exec vitest -- run src/test/data --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/02-indexeddb-repositories/data-final.xml`
- **Focused results artifact**: `dev/feature/02-indexeddb-repositories/data-final.xml`
- **Focused counts**: 14 total, 14 passed, 0 failed. The threshold override is required because Vitest instruments all untouched repository source files during a focused run.
- **Regressions**: None

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`.
- **Review findings**: Five medium plan-conformance findings resolved by
  strengthening snapshot-row validation, deterministic dependency collision
  handling, rollback coverage, seed conversion coverage, and reseed coverage.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None
- **Post-repair evidence**: Frontend data tests passed 16/16, the integrated
  frontend suite passed 701/701, and the integrated backend suite passed
  503/503. Frontend lint and build passed, and exact dependency pins resolved.

## Unfixed findings

None.

## Deviations from Plan

- The existing ESLint `**/types` pattern also matches `src/engine/types`. The local `SnapshotRole` and `SnapshotAbilityStep` shapes therefore live in `src/data/records.ts` rather than importing the engine type module. They remain structurally compatible with `EngineRoleInput` for the later snapshot migration.
- The focused coverage command uses zero thresholds because the repository’s V8 configuration includes all source files, including untouched app modules. The full frontend command runs the required 80% gate and is green.

## Gaps

None.

## Reviewer Focus Areas

- `src/data/indexeddb.ts` transaction sequencing and abort handling, especially `applySeed` failure paths.
- `src/data/conversion.ts` sparse seed defaults, dependency name resolution, and generated-ID collision checks.
- `src/data/indexeddb.ts` snapshot guard and persistence wrapper, including null-on-missing behavior.
- `eslint.config.js` alias and relative transport import restrictions for all pure layers.
- Exact dependency pins in `package.json` and `package-lock.json`.
