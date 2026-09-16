# Phase 5a: Local Catalog and Store

**Status**: Planned
**Depends on**: Phase 04b (Engine Frontend Integration)
**Estimated complexity**: Medium
**Cross-references**: Planning decisions and research summary in `docs/phases/DISCOVERY_CONTEXT.md` (section "Phase 05 replanning"); research report in `dev/research/tauri-v2-webview-storage-and-speech/`; Phase 04b summary at `docs/phases/PHASE_04B/PHASE_04B_SUMMARY.md`; canonical seed data in `yourwolf-backend/app/seed/`

## What's New

Browsing roles, setting up a game, and opening the role builder no longer need the server. The 30 official roles and the ability catalog ship inside the app and load on first launch. A game in progress survives closing the tab, not just a refresh, because it lives in the browser's local database instead of per-tab session storage. Creating and saving a custom role still uses the server until Phase 05b.

## Problem

The role catalog, role detail, and ability catalog come from the backend, so the app is unusable without a running server before a game even starts. The 30 official roles exist only in a database the future desktop and mobile apps will not ship with. In-progress games live in session storage, which dies with the tab and is per tab, so a closed window loses the game at the worst moment. This hurts every offline user, which after Phase 08 is every user.

## Objective

Introduce a local data layer, a repository interface with one IndexedDB implementation, and move the catalog reads and the game snapshot onto it. This is the durable storage foundation every later phase builds on, chosen so the same code runs unchanged in the browser, in Tauri desktop, and in Tauri mobile.

## Scope

### In Scope

- **Seed data files**: extract the 15 ability primitives from `yourwolf-backend/app/seed/abilities.py` into `yourwolf-backend/app/seed/data/abilities.json`, and make the backend seeder read that file the way `roles.py` reads `roles.json`. Copy `roles.json` and `abilities.json` into `yourwolf-frontend/src/data/seed/`. Add a frontend test that reads the backend files by relative path and fails when the copies differ. Add an npm script that refreshes the copies.
- **Repository interface** in a new `src/data/` directory: a `RoleRepository` (list with team and visibility filters, get by id, put, delete), an `AbilityRepository` (list), and a `GameRepository` (get and put a `GameSnapshot`). Every stored record carries `id`, `updated_at`, and for roles `visibility`. The interface is plain TypeScript with no React and no storage imports.
- **IndexedDB implementation** of the three repositories in one database with one object store per record type, behind a small typed wrapper. Use the `idb` package (about 1 KB) rather than raw IndexedDB event handlers. Tests run under Vitest with the `fake-indexeddb` dev dependency.
- **Stable ids**: official seed roles get a deterministic id derived from the role name. Custom roles get `crypto.randomUUID()`. Seed dependencies, which reference roles by name, resolve to those ids at seed time.
- **First-launch seeding**: on app start, a bootstrap step seeds the roles and abilities when the store is empty and records the seed version. The catalog is idempotent, so a second launch does nothing. A seed version bump reseeds official roles without touching custom roles.
- **Loading gate**: the app shell shows a loading state until the bootstrap resolves, and an error state with the message if the database cannot open.
- **Catalog call sites** move to the repositories: `useRoles`, `useAbilities`, and the role detail fetch in `WakeOrderResolution`. The Phase 04b adapters keep their shape, so the engine input is unchanged. The `Role` and `RoleListItem` transport types stay for the server-backed builder paths until Phase 05b.
- **Game snapshot** moves from `src/storage/game_session_storage.ts` to the `GameRepository`. The `GameSnapshot` shape and the null-on-missing semantics are preserved, per the Phase 04b decision. The session storage module and its tests are deleted. Because the repository is asynchronous, the facilitator start and advance paths await the write before re-rendering.
- **Hook seam**: a React context or module-level provider hands the repositories to hooks so page tests can inject an in-memory or fake-IndexedDB instance.
- **Test updates**: the roles, abilities, and game hooks, the wake-order and facilitator page tests, the routes test, and the shared mocks. The shared Axios guard in `src/test/setup.ts` grows to reject `/roles` list, `/roles/{id}`, and `/abilities`.
- **Manual QA document** covering first launch, a full game with the backend stopped from the start, closing and reopening the tab mid-game, and the reseed path.

### Out of Scope

- Role validation, name check, and role save. These stay on the server. Phase 05b.
- Deleting the Axios client. Phase 05b, when the last call leaves.
- Export and import of custom roles. Phase 05c.
- Any Tauri configuration. Phase 06a.
- SQLite, sql.js, or any native storage plugin. Decided out of the roadmap.
- Editing or deleting official roles.
- Changing engine semantics or anything under `src/engine/` and `src/domain/`.
- Listing or resuming past games. The repository stores snapshots by id, and only the facilitator URL reads them.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Seed data files | `abilities.json` extracted, backend reads it, frontend copies with parity test and refresh script | backend seed, frontend data |
| 2 | Repository interface and IndexedDB implementation | `src/data/` interfaces, `idb`-backed implementation, `fake-indexeddb` tests, stable id minting | data |
| 3 | Bootstrap and catalog reads | First-launch seeding, loading gate, `useRoles`, `useAbilities`, and role detail on the repository, Axios guard extended | hooks, pages, app shell |
| 4 | Game snapshot on the repository | `GameRepository` replaces `game_session_storage.ts`, facilitator and wake-order paths await writes, manual QA document | hooks, pages, storage, documentation |

## Technical Context

- **Remaining server calls**: `rolesApi.list` in `src/hooks/useRoles.ts`, `rolesApi.getById` in `src/pages/WakeOrderResolution.tsx`, `abilitiesApi.list` in `src/hooks/useAbilities.ts`. The builder calls (`validate`, `create`, `checkName`) stay.
- **Snapshot callers**: `src/hooks/useGame.ts`, `src/pages/GameFacilitator.tsx`, `src/pages/WakeOrderResolution.tsx`, all through `saveGameSnapshot` and `loadGameSnapshot` in `src/storage/game_session_storage.ts`. That module already has a runtime type guard for a parsed snapshot. Move the guard, do not rewrite it.
- **Adapters**: `src/adapters/role_adapters.ts` merges a list item with a detail response into `EngineRoleInput`. A local full role satisfies both inputs, so the adapter can take the local record directly or be given both views. Keep the null-handling tests.
- **Seed shape**: `roles.json` is `{roles: [...], role_dependencies: [{source, target, dependency_type}]}` with 30 roles and no ids. `abilities.py` holds `ABILITIES_DATA`, a list of `{type, name, description, parameters_schema}`. `load_seed_data()` in `roles.py` validates the file up front and raises `SeedDataError`; mirror that for abilities.
- **Transport types**: `src/types/transport.ts` declares `RoleListItem` (with counts, primary flag, dependencies) and `Role` (with steps and win conditions). The local role record is the union of both plus `updated_at`.
- **Fetch hook**: `src/hooks/useFetch.ts` wraps any async fetcher. The repository-backed hooks can keep using it.
- **Import boundary**: `eslint.config.js` keeps `src/engine` and `src/domain` free of React and UI-layer imports. `src/data/` must follow the same rule: no React, no `api`, no `hooks`, no `components`, no `pages`. Add it to the pure-layer rule set.
- **Test setup**: `vite.config.ts` runs Vitest under jsdom with `src/test/setup.ts`. jsdom has no IndexedDB, so the setup file imports `fake-indexeddb/auto`.
- **Coverage**: global threshold is 80 percent on lines, branches, functions, and statements. Phase 04b closed at 92 percent lines.
- **Docker**: both packages build from their own directory. Seed files cannot live at the monorepo root.

## Edge Cases & Failure Modes

- **IndexedDB unavailable or blocked**: the bootstrap rejects, the shell shows an error state naming the cause, and no page renders against an empty catalog.
- **Database open succeeds but seeding fails midway**: seeding runs in one transaction, so the store is either fully seeded or empty. The next launch retries.
- **Seed version bump with custom roles present**: official roles are replaced by id, custom roles untouched, dependencies re-resolved.
- **Custom role name collides with an official role name**: allowed at this phase, because the local catalog has no name rule yet. Phase 05b adds the rule.
- **Two tabs open**: both read the same database. A game advanced in one tab shows the newer phase in the other after refresh. Accepted; no live sync.
- **Corrupt snapshot record**: the moved type guard rejects it and the facilitator shows "Game not found", as in Phase 04b.
- **Write fails at start or advance**: the facilitator shows the error banner and keeps the previous phase rendered, as in Phase 04b.
- **Role edited after a game started**: the snapshot holds its own copy of the role inputs. Unchanged.
- **Dev versus production origin**: each origin holds its own database. Expected, documented in the manual QA.

## Dependencies & Risks

- **Dependency**: the Phase 04b adapters, the `GameSnapshot` shape, and the engine contract stay stable.
- **Dependency**: the backend seed refactor for abilities lands in the same phase so the parity test has a file to compare against.
- **Risk**: the async repository changes hook timing and surfaces act-warnings or races in page tests. Mitigation: inject a fake repository per test and await the bootstrap in a shared render helper.
- **Risk**: a name-derived id scheme collides for two official roles. Mitigation: the seed test asserts all 30 ids are distinct, and the Phase 01 seed test already pins names to 2 to 50 characters.
- **Risk**: the frontend seed copy drifts from the backend. Mitigation: the parity test fails the suite, and the refresh script is the only sanctioned way to update the copy.
- **Risk**: `idb` or `fake-indexeddb` version drift. Mitigation: pin exact versions in `package.json`, commit `package-lock.json`.

## Success Criteria

- [ ] With the backend stopped before the app loads, the roles page lists all 30 official roles grouped by team, game setup lists them, and a full game completes with no request to `/api/v1`.
- [ ] The role builder's ability palette lists 15 abilities with the backend stopped.
- [ ] Closing the tab mid-night and reopening the facilitator URL returns to the night phase at the first action.
- [ ] Closing the tab on the complete view and reopening shows the complete view.
- [ ] A second launch creates no duplicate official roles. The seed test asserts 30 roles, 15 abilities, and distinct ids.
- [ ] Bumping the seed version reseeds official roles and leaves a pre-existing custom role record intact, proven by a repository test.
- [ ] The parity test fails when either frontend seed copy differs from its backend file, proven by mutating a copy in a test.
- [ ] The backend abilities seeder reads `abilities.json`, and the backend seed tests still pass.
- [ ] `src/storage/game_session_storage.ts` and its tests are absent. No file under `src/` reads `sessionStorage`.
- [ ] The shared Axios guard rejects `/roles` list, `/roles/{id}`, `/abilities`, `/games`, and `/roles/preview-script`, and the full suite is green.
- [ ] `src/data/` passes the pure-layer ESLint rule with zero exemptions, and no file under `src/engine/` or `src/domain/` changed.
- [ ] The app shell shows a visible loading indicator until bootstrap resolves and a visible error banner if the database fails to open.
- [ ] Global frontend coverage stays above 80 percent.
- [ ] The manual QA document exists at `docs/phases/PHASE_05A/PHASE_05A_QA.md`.

## QA Considerations

- This phase changes user-facing flow and adds a loading gate, so a manual QA document is required. It covers first launch, a full game with the backend stopped from the start, tab close and reopen at every phase, and the two-tab case.
- Backend change: the abilities seeder reads JSON instead of Python dicts. The API contract is unchanged. The backend seed tests are the gate.
- Affected suites: roles, abilities, and game hooks, wake-order and facilitator pages, routes, shared mocks, adapters, the new `src/data/` suite, backend `tests/test_seed.py`.
- The Phase 04b manual rows were never executed. The Phase 05a manual document supersedes them for the game flow.

## Notes for Phase - Execute

Suggested decomposition in dependency order: **(1)** seed data files → **(2)** repository interface and IndexedDB implementation → **(3)** bootstrap and catalog reads → **(4)** game snapshot on the repository and manual QA.

- Feature 1 is the only feature that touches the backend. Keep it to the abilities seeder, its data file, and its tests.
- Feature 2 owns `src/data/` end to end and the id minting. It has no React and no page changes. Its tests run against `fake-indexeddb`.
- Feature 3 owns the provider seam, the bootstrap, the loading gate, and the three catalog hooks. It extends the Axios guard.
- Feature 4 owns the snapshot migration and deletes the session storage module. It writes the manual QA document last, after the flow is proven in the automated suites.
- Do not touch `src/engine/` or `src/domain/`. Where a guard is needed, put it in `src/data/` or the adapters and test it there.
- Keep the `GameSnapshot` type and the absence semantics exactly. Later phases and the export feature depend on them.
