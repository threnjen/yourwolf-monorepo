# Phase 5a: Local Catalog and Store

**Status**: Implementation Complete — Browser Manual QA Pending
**Depends on**: Phase 04b (Engine Frontend Integration)
**Estimated complexity**: Medium
**Cross-references**: Planning decisions and research summary in `docs/phases/DISCOVERY_CONTEXT.md` (section "Phase 05 replanning"); refinement context in `docs/phases/PHASE_05A/PHASE_05A_DISCOVERY_CONTEXT.md`; research report in `dev/research/tauri-v2-webview-storage-and-speech/`; Phase 04b summary at `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`; canonical seed data in `yourwolf-backend/app/seed/`

## What's New

Browsing roles, setting up a game, opening the role builder, and saving a custom role no longer need the server for their data. The 30 official roles and the ability catalog ship inside the app and load on first launch. A custom role you save appears in the roles list and in game setup right away, because it is stored on the device. A game in progress survives closing the tab, not just a refresh, because it lives in the browser's local database instead of per-tab session storage. Draft validation and non-colliding role-name checks still ask the server until Phase 05b.

## Problem

The role catalog, role detail, and ability catalog come from the backend, so the app is unusable without a running server before a game even starts. The 30 official roles exist only in a database the future desktop and mobile apps will not ship with. A custom role saved through the builder lands in that same server database, so it is lost to an offline user. In-progress games live in session storage, which dies with the tab and is per tab, so a closed window loses the game at the worst moment. This hurts every offline user, which after Phase 08 is every user.

## Objective

Introduce a local data layer, a repository interface with one IndexedDB implementation, and move every catalog read, the role save, and the game snapshot onto it. This is the durable storage foundation every later phase builds on, chosen so the same code runs unchanged in the browser, in Tauri desktop, and in Tauri mobile.

## Scope

### In Scope

- **Seed data files**: extract the 15 ability primitives from `yourwolf-backend/app/seed/abilities.py` into `yourwolf-backend/app/seed/data/abilities.json`, and make the backend seeder read that file the way `roles.py` reads `roles.json`. Copy `roles.json` and `abilities.json` into `yourwolf-frontend/src/data/seed/`. Add a frontend test that reads the backend files by relative path and fails when the copies differ. Add an npm script that refreshes the copies.
- **Repository interface** in a new `src/data/` directory: a `RoleRepository` (list with team and visibility filters, get by id, put, delete), an `AbilityRepository` (list), a `GameRepository` (get and put a `GameSnapshot`), and a metadata record that holds the applied seed version. Every stored record carries `id` and `updated_at`. Roles also carry `visibility`. The interface is plain TypeScript with no React and no storage imports.
- **Local record types**: `src/data/` declares its own role, ability, and snapshot record types and imports nothing from `src/types/`. The role record is structurally compatible with both the transport `Role` and `RoleListItem` views, proven by a type-level test, so the builder, the pages, and the Phase 04b adapters keep working against one shape. Seeded official roles fill every field the seed lacks with fixed defaults: `visibility` is `official`, `default_count`, `min_count`, and `max_count` default to 1 and `is_primary_team_role` to false when absent, mirroring the backend seeder, each ability step id derives from the role id and the step order, each step's `ability_name` resolves from the ability catalog by type at seed time, each win condition id derives from the role id and its index, `is_locked` is true, `vote_score` and `use_count` are zero, and `created_at` equals `updated_at` at seed time. Seeded abilities get an id derived from the type, `is_active` true, and the seed timestamp. A custom role maps the builder draft to the record with `visibility` `private`, `is_locked` false, zero counters, an empty dependency list, and the same count defaults.
- **IndexedDB implementation** of the repositories in one database with one object store per record type plus the metadata store, behind a small typed wrapper. Use the `idb` package (about 1 KB) rather than raw IndexedDB event handlers. Tests run under Vitest with the `fake-indexeddb` dev dependency.
- **Stable ids**: official seed roles get a deterministic id derived from the role name. Custom roles get `crypto.randomUUID()`. Seed dependencies, which reference roles by name, resolve to those ids at seed time.
- **First-launch seeding**: on app start, a bootstrap step compares a seed version constant in the seed module against the metadata record. When the record is absent, the bootstrap seeds the roles and abilities in one transaction and writes the version. When the versions match, it does nothing. When the constant is newer, it puts every new official role by id, deletes every record with `visibility` `official` whose id is not in the new seed, leaves custom roles untouched, and writes the new version, all in one transaction.
- **Loading gate**: `App.tsx` gates `AppRoutes` on the bootstrap, inside `Layout`, so the navigation chrome renders while the catalog loads. The gate shows a loading state until the bootstrap resolves and an error state with the message if the database cannot open.
- **Catalog call sites** move to the repositories: `useRoles`, `useAbilities`, and the role detail fetch in `WakeOrderResolution`. The wake-order page reads each distinct selected role by id from the repository and passes the full record as both adapter inputs. The adapters keep their two-input signature and their null-handling tests, so the engine input is unchanged.
- **Role save** moves to the repository. Before any server call or write, the builder checks the draft name against every local role, case-insensitive, and blocks a match with the existing name-taken message. The builder still calls the server for draft validation and non-colliding name checks, then puts the role into the local store with a UUID, `visibility` `private`, and an `updated_at` timestamp. The transport `Role`, `RoleListItem`, `ValidationResult`, and `NameCheckResult` types stay for the two remaining server calls until Phase 05b.
- **Game snapshot** moves from `src/storage/game_session_storage.ts` to the `GameRepository`. The `GameSnapshot` shape and the null-on-missing semantics are preserved, per the Phase 04b decision. The session storage module and its tests are deleted. Because the repository is asynchronous, the facilitator start and advance paths await the write before re-rendering.
- **Provider seam and render helper**: a React context provider hands the repositories to hooks. A shared test render helper mounts the provider with a fresh fake-IndexedDB database, runs the bootstrap, and awaits it before returning. Every page and hook test that reads roles, abilities, or the snapshot uses that helper.
- **Test updates**: the roles, abilities, and game hooks, the wake-order, facilitator, and role builder page tests, the app test, the routes test, and the shared mocks. The shared Axios guard in `src/test/setup.ts` grows to reject `GET /roles`, `GET /roles/{id}`, `POST /roles`, and `GET /abilities`.
- **Manual QA document** covering first launch, a full game with the backend stopped from the start, saving a custom role and seeing it in the list and in game setup, closing and reopening the tab mid-game, and the reseed path.

### Out of Scope

- Draft validation and the name check. These stay on the server. Phase 05b ports them to the domain.
- Deleting the Axios client. Phase 05b, when the last call leaves.
- Export and import of custom roles. Phase 05c.
- Any Tauri configuration. Phase 06a.
- SQLite, sql.js, or any native storage plugin. Decided out of the roadmap.
- Editing or deleting official roles from the UI. The repository exposes put and delete for later phases, but no page calls them for official roles.
- Changing engine semantics or anything under `src/engine/` and `src/domain/`.
- Listing or resuming past games. The repository stores snapshots by id, and only the facilitator URL reads them.
- Live sync between two open tabs.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Seed data files | `abilities.json` extracted, backend reads it, frontend copies with parity test and refresh script | backend seed, frontend data |
| 2 | Repository interface and IndexedDB implementation | `src/data/` interfaces, local record shape, `idb`-backed implementation, metadata store, `fake-indexeddb` tests, stable id minting | data |
| 3 | Bootstrap and catalog reads | Seeding and reseed, loading gate, provider seam and render helper, `useRoles`, `useAbilities`, and role detail on the repository, Axios guard extended | hooks, pages, app shell, test helpers |
| 4 | Game snapshot on the repository | `GameRepository` replaces `game_session_storage.ts`, facilitator and wake-order paths await writes | hooks, pages, storage |
| 5 | Local role save and manual QA | Builder saves to the repository after server checks, manual QA document | pages, documentation |

## Technical Context

- **Remaining server calls after this phase**: `rolesApi.validate` in `src/pages/RoleBuilder.tsx` and `rolesApi.checkName` in `src/hooks/useNameCheck.ts`.
- **Moved calls**: `useRoles`, `WakeOrderResolution`, `useAbilities`, and `RoleBuilder` use repositories instead of `rolesApi.list`, `rolesApi.getById`, `abilitiesApi.list`, and `rolesApi.create`.
- **Read callers**: `useRoles` is used by `src/pages/RolesPage.tsx` with a visibility filter and by `src/pages/GameSetup.tsx`. `useAbilities` is used by `src/components/RoleBuilder/steps/AbilitiesStep.tsx`.
- **Snapshot callers**: `src/hooks/useGame.ts`, `src/pages/GameFacilitator.tsx`, and `src/pages/WakeOrderResolution.tsx` all use the provider-backed `GameRepository` in `src/data/indexeddb.ts`. The repository validates stored snapshots and returns `null` for missing or malformed records.
- **Adapters**: `src/adapters/role_adapters.ts` merges a list item with a detail response into `EngineRoleInput`. A local full record satisfies both inputs.
- **Seed shape**: `roles.json` is `{roles: [...], role_dependencies: [{source, target, dependency_type}]}` with 30 roles and no ids. Steps carry `order`, `modifier`, `ability_type`, `parameters`, `is_required`, and no id. Win conditions carry no id. `abilities.json` holds a list of `{type, name, description, parameters_schema}`. Both loaders validate their files before database work and raise `SeedDataError` for invalid data.
- **Transport types**: `src/types/transport.ts` declares `RoleListItem` (counts, primary flag, dependencies) and `Role` (steps with ids, win conditions with ids, `is_locked`, `vote_score`, `use_count`, `created_at`, `updated_at`). The local record fills every field, per the shape rule above.
- **Fetch hook**: `src/hooks/useFetch.ts` wraps any async fetcher and requires a memoized fetcher. The repository-backed hooks keep using it with the repository from context.
- **App shell**: `src/App.tsx` renders `Layout` around `AppRoutes`. `src/App.test.tsx` and `src/routes.test.tsx` mount it.
- **Import boundary**: `eslint.config.js` keeps `src/engine` and `src/domain` free of React, `types`, `api`, `hooks`, `components`, and `pages` imports. `src/data/` joins that same rule set with the same bans, including `types`. Prove the rule fires on a deliberate violation before removing it.
- **Test setup**: `vite.config.ts` runs Vitest under jsdom with `src/test/setup.ts`. jsdom has no IndexedDB, so the setup file imports `fake-indexeddb/auto`, and the render helper opens a uniquely named database per test.
- **Coverage**: global threshold is 80 percent on lines, branches, functions, and statements. Phase 04b closed at 92 percent lines.
- **Docker**: both packages build from their own directory. Seed files cannot live at the monorepo root.

## Edge Cases & Failure Modes

- **IndexedDB unavailable or blocked**: the bootstrap rejects, the shell shows an error state naming the cause, and no page renders against an empty catalog.
- **Database open succeeds but seeding fails midway**: seeding runs in one transaction, so the store is either fully seeded or empty. The metadata version is written in that same transaction. The next launch retries.
- **Seed version bump with custom roles present**: official roles are replaced by id, custom roles are untouched. A custom role that depends on an official role by id still resolves, because official ids are derived from names and do not change.
- **Custom role name collides with any local role name, official or custom**: blocked by the local case-insensitive check before any server call. A non-colliding name reaches the retained server checks until Phase 05b.
- **Seed bump renames or removes an official role**: the old record is deleted in the reseed transaction. A custom role that depended on it keeps the dangling dependency id, and the builder shows that dependency as unknown. Accepted; Phase 05b's validation port decides whether to warn.
- **Server validation passes but the local write fails**: the builder shows the error and keeps the draft on screen. Nothing is written to the server.
- **Server unreachable at save**: validation fails with the existing network error and no local save happens. Accepted for this phase. Phase 05b removes the server from the save path.
- **Two tabs open**: both read the same database. A role saved in one tab appears in the other after refresh. A game advanced in one tab shows the newer phase in the other after refresh. No live sync.
- **Corrupt snapshot record**: the moved type guard rejects it and the facilitator shows "Game not found", as in Phase 04b.
- **Write fails at start or advance**: the facilitator shows the error banner and keeps the previous phase rendered, as in Phase 04b.
- **Role edited after a game started**: the snapshot holds its own copy of the role inputs. Unchanged.
- **Dev versus production origin**: each origin holds its own database. Expected, documented in the manual QA.

## Dependencies & Risks

- **Dependency**: the Phase 04b adapters, the `GameSnapshot` shape, and the engine contract stay stable.
- **Dependency**: the backend seed refactor for abilities lands in the same phase so the parity test has a file to compare against.
- **Risk**: the async repository changes hook timing and surfaces act-warnings or races in page tests. Mitigation: the shared render helper awaits the bootstrap, and each test gets its own database name.
- **Risk**: a name-derived id scheme collides for two official roles. Mitigation: the seed test asserts all 30 ids are distinct, and the Phase 01 seed test already pins names to 2 to 50 characters.
- **Risk**: the frontend seed copy drifts from the backend. Mitigation: the parity test fails the suite, and the refresh script is the only sanctioned way to update the copy.
- **Risk**: the local record's derived defaults leak into a server write in Phase 09 sync. Mitigation: the defaults are documented on the record type, and the sync phase maps official roles by name, per the learnings.
- **Risk**: `idb` or `fake-indexeddb` version drift. Mitigation: pin exact versions in `package.json`, commit `package-lock.json`.

## Success Criteria

- [ ] With the backend stopped before the app loads, the roles page lists all 30 official roles grouped by team, game setup lists them, and a full game completes with no request to `/api/v1`. Automated integration coverage is green; browser evidence remains pending.
- [ ] The role builder's ability palette lists 15 abilities with the backend stopped. Automated repository and page coverage is green; browser evidence remains pending.
- [ ] With the backend running, saving a custom role makes it appear in the roles list and in game setup without a reload, and no `POST /roles` request is sent. Automated integration coverage is green; browser evidence remains pending.
- [ ] Closing the tab mid-night and reopening the facilitator URL returns to the night phase at the first action.
- [ ] Closing the tab on the complete view and reopening shows the complete view.
- [x] A second launch creates no duplicate official roles. The seed test asserts 30 roles, 15 abilities, and distinct ids.
- [x] Bumping the seed version reseeds official roles, leaves a pre-existing custom role record intact, and that custom role's dependency on an official role still resolves, proven by a repository test.
- [x] Bumping the seed version with a role removed from the seed deletes that official record and no custom record, proven by a repository test.
- [x] Saving a custom role whose name matches an existing local role, differing only in case, is blocked with the name-taken message and writes nothing, proven by a page test.
- [x] A type-level test proves the local role record is assignable to both transport views, and `src/data/` imports nothing from `src/types/`.
- [x] The parity test fails when either frontend seed copy differs from its backend file, proven by mutating a copy in a test.
- [x] The backend abilities seeder reads `abilities.json`, and the backend seed tests pass.
- [x] `src/storage/game_session_storage.ts` and its tests are absent. No file under `src/` reads `sessionStorage`.
- [x] The shared Axios guard rejects `GET /roles`, `GET /roles/{id}`, `POST /roles`, `GET /abilities`, `/games`, and `/roles/preview-script`, and the full suite is green.
- [x] `src/data/` passes the pure-layer ESLint rule with zero exemptions, and no file under `src/engine/` or `src/domain/` changed.
- [x] Automated tests verify that the app shell shows a loading indicator inside the navigation chrome and a visible error banner if the database fails to open.
- [x] Global frontend coverage stays above 80 percent.
- [x] The manual QA document exists at `docs/phases/PHASE_05A/PHASE_05A_QA.md`.

## Verification Status

| Area | Status | Evidence |
|---|---|---|
| Feature implementation | Complete | Five feature reviews are approved with no unresolved findings. The execution manifest is the canonical checkpoint map. |
| Backend full suite | Complete | 503 tests passed with 96.04 percent coverage. |
| Frontend full suite | Complete | 715 tests passed with 92.27 percent line coverage. |
| Frontend lint and build | Complete | Both commands passed during the production readiness review. |
| Optional consolidated QA | Skipped | The user selected `qa: no`. Feature-required automated suites still passed. |
| Browser manual QA | Pending | Run the 31 available rows in `PHASE_05A_QA.md`. |
| Packaged-runtime origin QA | Deferred to Phase 06 | Row 7.2 requires a packaged Tauri runtime, which is outside Phase 05a. |

## QA Considerations

- This phase changes user-facing flow and adds a loading gate, so a manual QA document is required. Its 31 runnable rows cover first launch, a full game with the backend stopped from the start, saving a custom role and finding it in the list and in game setup, tab close and reopen at every phase, the two-tab case, and the reseed path.
- The packaged-Tauri origin check is deferred to Phase 06 because this phase contains no Tauri runtime.
- Backend change: the abilities seeder reads JSON instead of Python dicts. The API contract is unchanged. The backend seed tests are the gate.
- Affected suites: roles, abilities, game, and name-check hooks, wake-order, facilitator, role builder, roles, and game setup pages, app, routes, shared mocks, adapters, the new `src/data/` suite, backend `tests/test_seed.py`.
- The Phase 04b manual rows were never executed. The Phase 05a manual document supersedes them for the game flow.

## Notes for Phase - Execute

Implemented decomposition in dependency order: **(1)** seed data files → **(2)** repository interface and IndexedDB implementation → **(3)** bootstrap, provider seam, and catalog reads → **(4)** game snapshot on the repository → **(5)** local role save and manual QA.

- Feature 1 is the only feature that touches the backend. Keep it to the abilities seeder, its data file, and its tests.
- Feature 2 owns `src/data/` end to end: the record types with their seeded defaults, the `ability_name` resolution, the id minting, the metadata store, and the reseed transaction including stale official deletion. It has no React and no page changes. Its tests run against `fake-indexeddb`.
- Feature 3 owns the provider, the shared render helper, the bootstrap, the loading gate, and the three catalog reads. It extends the Axios guard for the read paths. Every later feature's page tests use its render helper.
- Feature 4 owns the snapshot migration and deletes the session storage module.
- Feature 5 owns the builder's local name check, the save call site, the draft-to-record mapping, and the `POST /roles` guard entry. It writes the manual QA document last, after the flow is proven in the automated suites.
- Do not touch `src/engine/` or `src/domain/`. Where a guard is needed, put it in `src/data/` or the adapters and test it there.
- Keep the `GameSnapshot` type and the absence semantics exactly. Later phases and the export feature depend on them.
- Keep the adapter signature. Pass the local record as both inputs rather than adding an entry point.
