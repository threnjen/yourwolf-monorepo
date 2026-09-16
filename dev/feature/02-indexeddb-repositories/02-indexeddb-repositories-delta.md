# Selection Delta: 02 IndexedDB Repositories

## Key Files

| File | Verified symbols or data | Selected-feature relevance |
|---|---|---|
| `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md` | Repository contracts, local record defaults, stable-id rules, reseed transaction, and pure-layer boundary | Authoritative scope and acceptance source. |
| `docs/phases/DISCOVERY_CONTEXT.md` | IndexedDB-only local storage decision and name-derived official ids | Project-wide architectural constraints. |
| `docs/phases/PHASE_05A/PHASE_05A_DISCOVERY_CONTEXT.md` | Independent `src/data/` types and backend-equivalent seed defaults | Phase-specific implementation constraints. |
| `dev/feature/01-seed-data-files/01-seed-data-files-implementation.md` | Frontend seed copies and parity suite | Confirms the prerequisite outputs and executed-green integration evidence. |
| `dev/feature/01-seed-data-files/01-seed-data-files-review.md` | Approved after one repair, with no unfixed findings | Confirms Feature 01 is safe to consume. |
| `yourwolf-frontend/src/data/seed/roles.json` | `roles`, `role_dependencies`; 30 roles and 9 dependency edges | Input for role conversion, stable ids, dependency resolution, and reseed tests. |
| `yourwolf-frontend/src/data/seed/abilities.json` | 15 ability records with `type`, `name`, `description`, and `parameters_schema` | Input for ability conversion and step `ability_name` resolution. |
| `yourwolf-frontend/src/types/transport.ts` | `Role`, `RoleListItem`, `AbilityStep`, `WinCondition`, `Ability`, `RoleDependency`, `Visibility` | Structural-compatibility target for the local role record. Production `src/data/` code must not import this module. |
| `yourwolf-frontend/src/adapters/role_adapters.ts` | `RoleListItemAdapterInput`, `RoleDetailAdapterInput`, `adaptRoleToEngine`, `adaptDependenciesToEngine` | Confirms that one full local role can satisfy both adapter inputs without changing adapter signatures. |
| `yourwolf-frontend/src/storage/game_session_storage.ts` | `GameSnapshot`, `isGameSnapshot`, `saveGameSnapshot`, `loadGameSnapshot` | Exact snapshot shape and validation behavior that Feature 04 must move without rewriting. |
| `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` | Missing/corrupt, id isolation, partial shape, invalid team, array parameters, and write-error cases | Existing snapshot-semantics evidence. Feature 02 establishes `GameRepository`; Feature 04 migrates this guard and these behaviors. |
| `yourwolf-frontend/src/engine/gameSession.ts` | `GameSession`, `GamePhase` | Nested session contract used by `GameSnapshot`. |
| `yourwolf-frontend/src/engine/types.ts` | `EngineRoleInput`, `EngineAbilityStepInput` | Nested role contract used by `GameSnapshot`. |
| `yourwolf-frontend/eslint.config.js` | `UI_LAYERS`, `TRANSPORT_LAYERS`, `layerPatterns` | Pure-layer rule to extend from `src/domain/` and `src/engine/` to `src/data/`. |
| `yourwolf-frontend/tsconfig.json` | `resolveJsonModule: true`; `@/*` path alias | Allows typed JSON imports and requires the lint probe to cover alias imports as well as relative imports. |
| `yourwolf-frontend/vite.config.ts` | jsdom setup and global 80 percent thresholds | Test environment and coverage gate. |
| `yourwolf-frontend/src/test/setup.ts` | Current global test setup; no IndexedDB polyfill import | Future bootstrap point for `fake-indexeddb/auto`. |
| `yourwolf-frontend/package.json` | No `idb` or `fake-indexeddb` declaration | `idb` must be an exact-pinned runtime dependency. `fake-indexeddb` must be an exact-pinned dev dependency. |
| `yourwolf-frontend/package-lock.json` | Lockfile version 3; no `idb` or `fake-indexeddb` entry | Must change with `package.json` and preserve exact resolved versions. |

## Current Constraints

- Validation commit: `d511d733d8ba2809717d439044cf9582b28ed1cc`. The code-review graph was current at this commit.
- Feature 01 is complete and approved. Its focused repair suites passed 45 backend seed tests and 3 frontend parity tests. Its integration gates passed 503 backend tests and 688 frontend tests.
- `src/data/` currently contains only the two seed JSON files. No repository, record, metadata, conversion, id, database, or bootstrap module exists yet.
- Keep the selected plan's non-goals. Do not add React providers, hooks, pages, app loading states, runtime call-site migrations, SQLite, Tauri configuration, or cross-tab synchronization. Do not change `src/engine/` or `src/domain/`.
- Declare production record and repository types inside `src/data/`. Do not import `src/types/` from that layer. Use `src/types/transport.ts` only in a type-level test that proves structural compatibility.
- Do not normalize the checked-in seed JSON. The backend intentionally preserves absent optional count fields. Conversion supplies defaults without rewriting the copied seed files.
- Preserve the existing adapter signature. A full local role must be usable as both the list and detail inputs.
- Preserve the `GameSnapshot` caller contract. `GameRepository.get` returns the snapshot or `null`; `GameRepository.put` accepts the snapshot. If the IndexedDB store needs top-level `id` and `updated_at`, keep that persistence wrapper behind the repository so it does not alter `GameSnapshot`.
- Keep the current guard for Feature 04 to move. Feature 02 must not delete or rewrite `src/storage/game_session_storage.ts` or its tests.
- Seed, stale-official deletion, and metadata version changes belong to one IndexedDB transaction. A failure must retain the entire prior state.
- Stable official ids derive from names. Stable ability ids derive from types. Step and win-condition ids derive from the parent role plus order or index. Custom role ids use `crypto.randomUUID()`.
- The repository must preserve custom records and may preserve dangling dependency ids after an official role disappears.
- Add no normal-path logging. Reject open, validation, and transaction failures with actionable errors.
- Use `idb`, not raw IndexedDB event handlers. Add `idb` under `dependencies` and `fake-indexeddb` under `devDependencies`, with exact versions in both dependency manifests.
- Extend the existing ESLint override's file glob and messages so `src/data/**/*.{ts,tsx}` receives the React, UI-layer, and transport-type bans. The current rule does not cover `src/data/`: an alias probe importing `@/types/transport` under the virtual filename `src/data/__boundary_probe__.ts` exits successfully today.
- Prove the new boundary with temporary violations. Include both a relative `src/types/` import and the existing `@/*` alias form, because the repository already supports aliases and boundary rules match raw import specifiers.
- Relevant durable learnings: distinguish plain objects from arrays in runtime guards; probe boundary rules instead of trusting clean lint; preserve sparse seed defaults; treat path aliases as part of the boundary contract; and keep the local data record independent of transport DTOs.

## Verification Assets

| Asset | What it proves |
|---|---|
| `yourwolf-frontend/src/test/data/seed_parity.test.ts` | The selected feature consumes exact copies of the canonical backend role and ability data. |
| `dev/feature/01-seed-data-files/backend-integration-gate.xml` | Feature 01 backend integration remained green: 503 passed, 0 failed. |
| `dev/feature/01-seed-data-files/frontend-integration-gate.xml` | Feature 01 frontend integration remained green: 688 passed, 0 failed. |
| `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` | Existing null-on-missing, malformed-record, key-isolation, and write-failure snapshot semantics. |
| `yourwolf-frontend/src/test/adapters/role_adapters.test.ts` | Existing full-role-to-engine and dependency conversion behavior. |
| `yourwolf-frontend/eslint.config.js` plus temporary relative and alias violation probes | The pure-layer boundary actually rejects `src/types/` imports from `src/data/`. Remove both probes after observing failures. |
| New data-layer suites at `[PROPOSED - name TBD]` | Must cover contracts, conversions, generated-id collisions, filters, CRUD, missing records, initial seed, matching-version no-op, atomic rollback, stable-id reseed, stale-official deletion, and custom-record preservation. |
| Type-level test at `[PROPOSED - name TBD]` | Must prove the local role record is assignable to both `Role` and `RoleListItem` without production imports from `src/types/`. |
| From `yourwolf-frontend`: `npm exec vitest -- run <selected data-layer test paths> --coverage` | Focused selected-feature behavior and coverage. Replace the placeholder with the implemented test paths. |
| From `yourwolf-frontend`: `npm exec vitest -- run --coverage` | Full frontend regression suite and global 80 percent thresholds. |
| From `yourwolf-frontend`: `npm run lint` | Repository lint gate after the temporary boundary probes are removed. |
| From `yourwolf-frontend`: `npm run build` | Strict TypeScript compilation and production bundle. |
| From `yourwolf-frontend`: `npm ls idb fake-indexeddb --depth=0` | Confirms the intended runtime/dev dependency installation and versions. |

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| The role seed root is exactly `{roles, role_dependencies}` with 30 roles and 9 edges. Every dependency is `{source, target, dependency_type}` and references roles by name. | Dependency conversion must build the name-to-id map before emitting local dependency records. | Implement and test name resolution, including unresolved-name failure and stable ids. |
| Seed roles have four distinct top-level key sets. `default_count`, `min_count`, and `max_count` are absent from 27 roles. `is_primary_team_role` is absent from 26 roles. | Conversion cannot assume normalized seed input. | Apply the phase defaults of `1`, `1`, `1`, and `false` during conversion only. |
| All seed roles contain `description`, `wake_order`, and `wake_target`, but two roles store both wake fields as `null`. Transport `Role` and `RoleListItem` declare these fields as optional non-null values. | A local record declared with nullable wake fields would not be assignable to the transport interfaces. | Convert seed `null` wake values to absence or otherwise model the local fields as optional non-null values. Let the existing adapter convert absence back to engine `null`. |
| The 48 seed ability steps have no ids or `ability_name`. Their key sets vary because `condition_type` and `condition_params` are optional. Win conditions have no ids and optional `condition_params`. | Conversion owns deterministic nested ids, ability-name lookup, and preservation of optional-field absence. | Add exact conversion tests for steps with and without conditional fields and win conditions with and without params. |
| Every ability seed has exactly `type`, `name`, `description`, and `parameters_schema`; none has `id`, `is_active`, or a timestamp. | Ability conversion must supply every persisted field. | Derive the id from `type`, set `is_active` to true, and use the seed timestamp required by the phase. |
| `Role` and `RoleListItem` are complementary, not identical. `Role` owns votes, locking, update time, steps, and win conditions. `RoleListItem` owns counts, primary-team status, and dependencies. | The local role must be a deliberate superset. Reusing either transport interface as the production record would omit required fields. | Declare the independent local record and prove one-way assignability to both transport views. |
| Current `GameSnapshot` is exactly `{session: GameSession, roles: readonly EngineRoleInput[]}`. Its private guard rejects arrays where records are expected, validates session phases and nested role/step fields, and `loadGameSnapshot` additionally rejects a lookup-key/session-id mismatch. | The IndexedDB storage row's required `id` and `updated_at` cannot silently become new caller-visible snapshot fields. The key-match check remains load-bearing. | Keep persistence metadata behind `GameRepository`; record Feature 04's move of the guard and the key-match behavior in implementation notes. |
| `src/data/` is outside the current ESLint pure-layer file glob. Both `idb` and `fake-indexeddb` are absent from `package.json`, `package-lock.json`, and the installed top-level dependency tree. `src/test/setup.ts` does not import `fake-indexeddb/auto`. | AC3, AC8, and AC9 require new dependency, setup, and configuration work. | Add and pin both packages, install the polyfill for tests, extend the boundary, and verify the rule with deliberate failures. |
| `tsconfig.json` already enables `resolveJsonModule` and the DOM library, and Vitest already runs under jsdom with global 80 percent thresholds. | No TypeScript or Vite configuration change is required for seed JSON imports or IndexedDB typings. | Preserve these files unless implementation evidence proves a configuration gap. |
| No verified source contradicts the selected plan. | A plan revision would add detail rather than repair an error, which selection mode forbids. | Leave `02-indexeddb-repositories-plan.md` at revision 1. |

