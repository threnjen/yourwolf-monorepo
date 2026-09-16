# Review: 02 IndexedDB Repositories

## Verdict

Approved after one review-and-repair pass. The feature conforms to the plan,
all acceptance criteria have executed-green evidence, and no unfixed findings
remain.

## Review scope

- Implementation checkpoint: `0cf39a2`.
- Review lane: `plan-conformance` only.
- Original implementation scope: the 14 code, configuration, dependency, and
  test files listed in the implementation record.
- Repair scope: `yourwolf-frontend/src/data/conversion.ts`,
  `yourwolf-frontend/src/data/indexeddb.ts`,
  `yourwolf-frontend/src/test/data/conversion.test.ts`, and
  `yourwolf-frontend/src/test/data/repositories.test.ts`.
- The implementation and repair preserve the plan's pure TypeScript boundary,
  one typed IndexedDB wrapper, and downstream repository contracts.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| AC1 | Complete | `yourwolf-frontend/src/data/repositories.ts:10-33` declares the role, ability, game, and metadata contracts. `yourwolf-frontend/src/data/index.ts:1-32` exposes the public boundary. The production data files import only pure data/domain modules, and `yourwolf-frontend/eslint.config.js:47-85` applies the pure-layer restrictions to `src/data/`. `npm run build` also type-checks the boundary. |
| AC2 | Complete | `yourwolf-frontend/src/data/records.ts:35-67,89-98` declares local role, ability, snapshot, and metadata records. `yourwolf-frontend/src/data/conversion.ts:194-213,262-285` supplies the persisted defaults. `yourwolf-frontend/src/test/data/type_compatibility.test.ts:1-18` assigns one `RoleRecord` to both transport views, and the full build type-checks those assignments. |
| AC3 | Complete | `yourwolf-frontend/src/data/indexeddb.ts:20-35` declares one typed database with `roles`, `abilities`, `games`, and `metadata` stores. `:153-175` creates the wrapper. `yourwolf-frontend/src/test/setup.ts:1-3` installs `fake-indexeddb`. Exact pins appear in `yourwolf-frontend/package.json:21,39`, `package-lock.json:15,33`, and the resolved package entries at `package-lock.json:3218-3226,3690-3694`. `npm ls idb fake-indexeddb --depth=0` resolves `idb@8.0.0` and `fake-indexeddb@6.2.4`. |
| AC4 | Complete | `yourwolf-frontend/src/data/ids.ts:1-23` defines deterministic role, ability, step, win-condition, and dependency IDs. `yourwolf-frontend/src/data/conversion.ts:166-193,237-252` rejects generated role, ability, step, win-condition, and dependency collisions. `:262-285` uses `crypto.randomUUID()` for custom roles. `yourwolf-frontend/src/test/data/conversion.test.ts:13-38,85-133,135-161` covers stable nested IDs, collision rejection for every collision-capable source dimension, and the UUID seam. |
| AC5 | Complete | `yourwolf-frontend/src/data/conversion.ts:105-140` resolves ability names and optional condition fields. `:143-153,194-227` supplies sparse seed defaults and active ability records. `yourwolf-frontend/src/data/seed.ts:1-6` exports the copied seeds and version. `yourwolf-frontend/src/test/data/conversion.test.ts:13-83` verifies all 30 roles, all 15 active abilities, every role default, every nested step and win ID, ability names, and dependencies. |
| AC6 | Complete | `yourwolf-frontend/src/data/indexeddb.ts:243-305` compares metadata versions and performs initial, no-op, newer-version, and abortable seed paths. `:307-321` exposes bootstrap and reseed. `yourwolf-frontend/src/test/data/repositories.test.ts:28-51,123-173` covers empty bootstrap, matching-version no-op, newer reseed, and partial failure. |
| AC7 | Complete | `yourwolf-frontend/src/data/indexeddb.ts:271-290` deletes only stale official records, rewrites current official records, preserves custom rows, and writes metadata through the same read/write transaction. `yourwolf-frontend/src/test/data/repositories.test.ts:123-150` asserts custom preservation including an official dependency, stable Tanner ID, stale deletion, and the new metadata version. |
| AC8 | Complete | `yourwolf-frontend/src/test/data/repositories.test.ts:53-121` covers filters, get, put, delete, missing records, valid snapshots, and malformed snapshot rows. `:123-173` covers both reseed cases and verifies all three stores remain unchanged after a write has started and the transaction fails. The focused data suite and both integrated suites are executed-green below. |
| AC9 | Complete | `yourwolf-frontend/eslint.config.js:47-85` applies the pure-layer rules to data files and rejects both relative and alias transport imports, including type-only imports. A temporary probe containing `../types/transport` and `@/types/transport` produced two `@typescript-eslint/no-restricted-imports` errors from `npm exec eslint src/data/__boundary_probe__.ts`; the probe was removed. The final `npm run lint` passed. |

## Findings

### Resolved — snapshot row validation did not preserve the existing key-match and wrapper semantics

- `severity`: medium
- `lane: plan-conformance`
- `evidence`: At checkpoint `0cf39a2`, `yourwolf-frontend/src/data/indexeddb.ts:214-220` checked the wrapper key and snapshot shape but accepted a snapshot whose embedded session id differed from the lookup id and accepted a non-string wrapper timestamp. The delta requires both the moved guard and lookup-key/session-id match at `dev/feature/02-indexeddb-repositories/02-indexeddb-repositories-delta.md:75`.
- `repair`: Added `isGameSnapshotRecord` at `yourwolf-frontend/src/data/indexeddb.ts:137-145` to validate the plain wrapper, string `updated_at`, snapshot shape, wrapper id, and embedded session id. Added malformed-row coverage at `yourwolf-frontend/src/test/data/repositories.test.ts:89-121`.
- `reviewer: 03c-reviewer-plan-conformance`

### Resolved — deterministic dependency IDs could collide without rejection

- `severity`: medium
- `lane: plan-conformance`
- `evidence`: At checkpoint `0cf39a2`, `yourwolf-frontend/src/data/conversion.ts:194-208` generated dependency IDs from the source/target pair but never checked duplicates. Two edges with the same pair and different dependency types therefore produced one repeated ID. No test exercised that collision.
- `repair`: Materialized converted dependencies and rejected repeated IDs at `yourwolf-frontend/src/data/conversion.ts:176-193`. Added a requires/recommends same-pair collision case at `yourwolf-frontend/src/test/data/conversion.test.ts:120-132`.
- `reviewer: 03c-reviewer-plan-conformance`

### Resolved — rollback evidence failed before any transaction write

- `severity`: medium
- `lane: plan-conformance`
- `evidence`: At checkpoint `0cf39a2`, `yourwolf-frontend/src/test/data/repositories.test.ts:106-115` used `failAfter: 0`, so the failure occurred before the first write and checked only one role plus metadata. That did not prove rollback of a partially written roles/abilities/metadata transaction required by the plan at `02-indexeddb-repositories-plan.md:36-39,73`.
- `repair`: Changed the scenario to `failAfter: 1` and asserted exact roles, abilities, and metadata snapshots at `yourwolf-frontend/src/test/data/repositories.test.ts:153-173`. The implementation's shared transaction and abort path remain at `yourwolf-frontend/src/data/indexeddb.ts:246-305`.
- `reviewer: 03c-reviewer-plan-conformance`

### Resolved — seed conversion coverage checked only representative defaults and nested records

- `severity`: medium
- `lane: plan-conformance`
- `evidence`: At checkpoint `0cf39a2`, `yourwolf-frontend/src/test/data/conversion.test.ts:13-45` checked one role, one step, one win condition, and one ability. The plan requires all sparse defaults, all 30 official roles, and all 15 active abilities at `02-indexeddb-repositories-plan.md:8,11`.
- `repair`: Expanded the catalog test to assert every role's defaults, every step ID and ability name, every win-condition ID, all 15 `is_active` values, and the complete 30/15 counts at `yourwolf-frontend/src/test/data/conversion.test.ts:13-64`.
- `reviewer: 03c-reviewer-plan-conformance`

### Resolved — reseed evidence did not exercise custom dependencies or stable official IDs

- `severity`: medium
- `lane: plan-conformance`
- `evidence`: At checkpoint `0cf39a2`, `yourwolf-frontend/src/test/data/repositories.test.ts:86-103` preserved a custom role without dependencies and did not assert that an unchanged official role retained its deterministic ID. The plan explicitly requires custom dependencies and stable official IDs at `02-indexeddb-repositories-plan.md:38,71-72`.
- `repair`: Added a custom dependency on Tanner and asserted the unchanged Tanner ID at `yourwolf-frontend/src/test/data/repositories.test.ts:123-150`.
- `reviewer: 03c-reviewer-plan-conformance`

## Unfixed findings

None.

## Test execution evidence

| Suite | Status | Exact command | Results artifact | Counts |
|---|---|---|---|---|
| Frontend focused data suite | `executed-green` | `npm exec vitest -- run src/test/data --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/02-indexeddb-repositories/review-data-repair.xml` from `yourwolf-frontend` | `dev/feature/02-indexeddb-repositories/review-data-repair.xml` | 16 total, 16 passed, 0 failed |
| Frontend integrated suite | `executed-green` | `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/02-indexeddb-repositories/frontend-review.xml` from `yourwolf-frontend` | `dev/feature/02-indexeddb-repositories/frontend-review.xml` | 701 total, 701 passed, 0 failed. Coverage: 91.95% statements/lines, 92.36% branches, 93.47% functions. |
| Backend integrated suite | `executed-green` | `uv run pytest --junitxml=../dev/feature/02-indexeddb-repositories/backend-review.xml` from `yourwolf-backend` | `dev/feature/02-indexeddb-repositories/backend-review.xml` | 503 total, 503 passed, 0 failed. Coverage: 96.04%. |

## Non-test gates

- `npm run lint` passed from `yourwolf-frontend`.
- `npm run build` passed from `yourwolf-frontend` with TypeScript compilation and a Vite production build.
- `npm ls idb fake-indexeddb --depth=0` resolved the exact required versions.
- The temporary relative and alias import probe failed lint with the expected two diagnostics, then was removed.

## Plan-conformance conclusion

The repository contracts, record conversion, deterministic IDs, snapshot guard,
atomic reseed behavior, pure-layer boundary, and exact dependency pins now have
direct evidence. Regressions: None. No authoritative suite remains unrun.
