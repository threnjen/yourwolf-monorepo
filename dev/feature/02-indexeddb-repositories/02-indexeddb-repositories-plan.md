# 02 IndexedDB Repositories

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** `yourwolf-frontend/src/data/` declares plain TypeScript contracts: `RoleRepository` lists with team and visibility filters and gets, puts, and deletes by id; `AbilityRepository` lists abilities; `GameRepository` gets and puts a `GameSnapshot`. The contracts import no React, storage, API, or `src/types/` module.
- **AC2:** Local role, ability, metadata, and `GameSnapshot` record types satisfy the Phase 05A fields and defaults. A type-level test proves the role record is assignable to both `Role` and `RoleListItem` in `yourwolf-frontend/src/types/transport.ts`.
- **AC3:** The `idb` implementation uses one database with one object store per record type plus metadata, behind a typed wrapper. Exact `idb` and `fake-indexeddb` versions are pinned in `yourwolf-frontend/package.json` and `yourwolf-frontend/package-lock.json`.
- **AC4:** Official role ids derive deterministically from role names, ability ids derive from ability types, step and win-condition ids derive from their parent role and order, and duplicate generated ids fail tests. Custom-role ids use `crypto.randomUUID()`.
- **AC5:** Seed conversion resolves `ability_name` and role dependencies, supplies every Phase 05A default, and creates 30 official roles plus 15 active abilities.
- **AC6:** Bootstrap compares the seed version constant with metadata. Initial seed, matching-version no-op, and newer-version reseed each satisfy the phase transaction rules.
- **AC7:** A reseed updates current official records, deletes stale official records, preserves every custom record, preserves stable official ids, and writes metadata in the same transaction.
- **AC8:** Repository tests run with `fake-indexeddb`, cover list filters, get, put, delete, missing-record semantics, transaction rollback, and the two reseed cases from the Phase success criteria.
- **AC9:** `yourwolf-frontend/eslint.config.js` applies the existing pure-layer import bans to `src/data/`, including type-only `src/types/` imports. A deliberate temporary violation proves the rule fires before the probe is removed.

### Non-Goals

- Do not add React providers, hooks, pages, or app loading states.
- Do not migrate runtime catalog, builder, or game call sites.
- Do not change `src/engine/` or `src/domain/`.
- Do not add SQLite, sql.js, Tauri configuration, native plugins, or cross-tab live sync.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC2 | `yourwolf-frontend/src/data/`, `yourwolf-frontend/src/types/transport.ts` | Must-have automated test; code-review evidence only |
| AC3-AC4 | `yourwolf-frontend/src/data/`, `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json` | Must-have automated test |
| AC5-AC7 | `yourwolf-frontend/src/data/`, `yourwolf-frontend/src/data/seed/` | Must-have automated test |
| AC8 | Frontend data repository suite | Must-have automated test |
| AC9 | `yourwolf-frontend/eslint.config.js` | Must-have automated test; code-review evidence only |

## B. Correctness & Edge Cases

- Treat blocked or unavailable IndexedDB as a rejected bootstrap, never an empty successful catalog.
- Seed roles, abilities, stale-official deletion, and metadata atomically. A mid-transaction failure must leave the prior database state intact.
- Preserve custom records during reseed, including dependencies on stable official ids.
- Accept dangling dependency ids when an official role is removed, as Phase 05A specifies.
- Match team and visibility filters without exposing IndexedDB details through the interfaces.
- Preserve `GameSnapshot` null-on-missing semantics and reject corrupt records with the moved guard in Feature 04.
- Distinguish plain objects from arrays in runtime record guards, per `docs/learnings/review-learnings.md`.

## C. Consistency & Architecture Fit

- Follow the pure-layer direction already enforced for `src/domain/` and `src/engine/`.
- Keep repository contracts independent of `idb`; only the implementation imports storage APIs.
- Preserve the existing transport and engine shapes through structural compatibility rather than importing transport types into production data code.
- Required downstream contract: Feature 03 can obtain repositories, run bootstrap, list filtered roles and abilities, and get a role by id. Feature 04 can get and put `GameSnapshot`. Feature 05 can list and put local roles.
- The concrete names `RoleRepository`, `AbilityRepository`, `GameRepository`, `GameSnapshot`, and the seed version constant are copied from the Phase document. Implementers choose idiomatic names for other new symbols.

## D. Clean Design & Maintainability

- Use one typed database wrapper and one conversion path for seed records.
- Keep deterministic-id logic pure and independently testable.
- Avoid a generic repository abstraction that obscures the different query contracts.
- Keep it clean: no React imports, no transport imports, no raw IndexedDB event handlers, no duplicated seed defaults.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. Surface open, validation, and transaction failures to callers with actionable error messages.
- **Security:** Store no secrets. Validate packaged seeds and runtime snapshot boundaries before trusting their shape.
- **Runbook:** Verify focused repository tests, full coverage, lint, and build. Roll back the dependency and data-layer changes together. Diagnose failure through rejected operations and tests, not added telemetry.

## F. Test Plan

- Map AC1-AC9 to repository, seed-conversion, type-level, transaction, and lint-probe evidence.
- High-value checks:
  1. Given an empty database, when bootstrap runs, then exactly 30 official roles, 15 abilities, and one seed-version record exist.
  2. Given the same seed version, when bootstrap runs again, then no duplicates or changed timestamps appear.
  3. Given a newer seed and a custom role depending on an official role, when reseed runs, then the custom record and stable dependency id remain.
  4. Given a removed official role and a custom role, when reseed commits, then only the stale official record is deleted.
  5. Given a forced failure during seeding, when the transaction aborts, then records and metadata retain their prior state.
- Use `fake-indexeddb` with a unique database name per test. Use the copied seed JSON as representative data.
- This introduces a public repository boundary. New tests must cover it directly, while full frontend tests guard structural compatibility and dependency changes.
- Stage 0 is not required because the baseline suite exists and the global frontend coverage gate is 80 percent.

## Stage 1: Contracts and Record Conversion
**Goal**: Define the pure repository boundary, local records, ids, defaults, and seed conversion.
**Success Criteria**: AC1, AC2, AC4, and AC5 pass.
**Status**: Not Started

## Stage 2: IndexedDB and Bootstrap Transactions
**Goal**: Implement typed stores, repository operations, initial seeding, and atomic reseeding.
**Success Criteria**: AC3, AC6, AC7, and AC8 pass.
**Status**: Not Started

## Stage 3: Boundary Enforcement
**Goal**: Enforce and prove the pure `src/data/` dependency boundary.
**Success Criteria**: AC9 passes, the deliberate probe is removed, and lint remains green.
**Status**: Not Started
