# 05 Local Role Save and QA Selection Delta

**Validation commit:** `e1a72c2aa84b5d9c8fae2aa68c2d56881e026f71`

## Key Files

| File | Verified symbols or role | Selection impact |
|---|---|---|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `RoleBuilderPage`, `handleDraftChange`, `handleSave` | Draft validation is debounced here. Save currently calls only `rolesApi.create`, then navigates to `/roles`. This is the primary persistence seam. |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `BasicInfoStep`, `nameStatus`, visible `Taken ✗` state | The server name check currently lives inside the Basic Info step. Its result is not available to `RoleBuilderPage` or `Wizard` after the step unmounts. |
| `yourwolf-frontend/src/hooks/useNameCheck.ts` | `useNameCheck`, `NameStatus` | The hook trims names, waits 500 ms, ignores stale responses, and degrades failures to `idle`. It calls `rolesApi.checkName` for every settled name of at least two characters. |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | `Wizard`, `canProceedFromStep` | Save is enabled only by `validation?.is_valid` and `saving`. Server name availability does not currently gate the action. |
| `yourwolf-frontend/src/api/roles.ts` | `rolesApi.validate`, `rolesApi.checkName`, `rolesApi.create`, `draftToPayload` | Validation and name check remain. Remove only the production `rolesApi.create` call path; keep the client method and direct API contract tests until Phase 05B. |
| `yourwolf-frontend/src/data/conversion.ts` | `createCustomRole` | Feature 02 already owns the one draft-compatible conversion responsibility. It mints the role UUID and supplies private visibility, unlocked state, zero counters, count defaults, and no dependencies. |
| `yourwolf-frontend/src/data/records.ts` | `CustomRoleInput`, `RoleRecord` | `RoleDraft` is structurally compatible with the nested step and win-condition record arrays. `createCustomRole` consumes the caller-supplied timestamps and ignores the input's top-level `id`. |
| `yourwolf-frontend/src/data/repositories.ts` | `RoleRepository.list`, `RoleRepository.put` | The local collision check requires the complete role list. The final write is asynchronous and must settle before navigation. |
| `yourwolf-frontend/src/data/indexeddb.ts` | `createIndexedDbRepositories`, `roles.list`, `roles.put` | `list` returns every stored role when unfiltered. `put` validates the complete local record, then stores it under `role.id`. |
| `yourwolf-frontend/src/context/repository_context.tsx` | `RepositoryProvider`, `useRepositories` | The app already exposes one bootstrapped repository aggregate. No refresh or event bus exists in the provider. |
| `yourwolf-frontend/src/hooks/useRoles.ts` | `useRoles`, `refetch` | Roles are read on hook mount and explicit refetch. Navigation from the builder to `/roles` mounts a fresh consumer, while later navigation to `/games/new` mounts the unfiltered setup consumer. |
| `yourwolf-frontend/src/pages/RolesPage.tsx` | `RolesPage` | The default filters include `official` and `private`, so a saved private role is visible after navigation without changing filters. |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | `GameSetupPage` | The page calls unfiltered `useRoles()`, so a later route visit reads the saved custom role without a reload. |
| `yourwolf-frontend/src/App.tsx` | `App`, `CatalogGate` | The provider wraps the shell and all routes. Feature 05 must keep the existing bootstrap gate intact. |
| `yourwolf-frontend/src/routes.tsx` | `/roles/new`, `/roles`, `/games/new`, `/games/new/wake-order`, `/games/:gameId` | These are the actual routes the integration test and manual checklist must use. |
| `yourwolf-frontend/src/test/test_utils.tsx` | `createRepositoryTestContext`, `renderWithRepositories` | Supplies a bootstrapped unique IndexedDB database with explicit close and delete cleanup. Use it for repository-backed builder and integration coverage. |
| `yourwolf-frontend/src/test/setup.ts` | Global Axios request guards | GET catalog routes, `/games`, and `/roles/preview-script` are already forbidden. Exact `POST /roles` rejection is still missing. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | `navigateToReview`, create, validation, and preview cases | Current save tests mock `rolesApi.create` and render without a repository provider. They must move to the reviewed provider seam and preserve validation/preview coverage. |
| `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | debounce, trimming, availability, failure, and stale-response cases | Existing server name-check behavior is a regression asset. Add local-collision coordination without weakening these checks. |
| `docs/phases/PHASE_04B/PHASE_04B_QA.md` | Previous pending game-flow checklist | Useful only as a control-label inventory. Its catalog HTTP, role-detail HTTP, session-storage, and backend-start assumptions are obsolete in Phase 05A. |

## Current Constraints

- Features 02 through 04 are approved with no unfixed findings. Reuse `createCustomRole`, `RoleRepository`, `RepositoryProvider`, and the repository test helper. Do not add another conversion, provider, store, or persistence path.
- The local case-insensitive collision check must run before either retained server call. A matching official or custom name must suppress both the 500 ms `rolesApi.checkName` request and the 1000 ms `rolesApi.validate` request, not only block the final `put`.
- Preserve the validated draft name in storage. Normalize with trimming/case folding only for comparison.
- A current successful name-check result must participate in save eligibility. Today `NameStatus` is private to `BasicInfoStep`, and `Wizard` enables Save without it. Do not treat an old, `idle`, failed, or `taken` result as a passed server check.
- Keep live server validation, local preview generation, name-check debouncing, and stale-response protection. Phase 05B owns porting the two remaining server checks and deleting their HTTP surface.
- Build the persisted record through `createCustomRole`. Refresh `updated_at` at the save boundary because the helper copies the caller's timestamp and the draft timestamp originates when the blank draft was created.
- Await `repositories.roles.put` before navigation. A rejection must retain the draft and current wizard state, show the existing builder error surface, and issue no `POST /roles` request.
- Do not add provider-wide invalidation or cross-tab live synchronization. After a successful awaited write, navigation to `/roles` creates a fresh repository-backed role read. A later visit to `/games/new` creates another fresh unfiltered read.
- Add the Axios guard as an exact `POST /roles` path check. Preserve `POST /roles/validate` and `GET /roles/check-name`. Keep the named endpoint exception ahead of the generic role-detail GET guard.
- Do not modify `src/engine/`, `src/domain/`, backend code, Tauri configuration, or official-role edit/delete behavior.
- Add no normal-path logging. The builder error banner and existing loading/error UI remain the observability surface.
- Repository-backed tests must use unique database names and explicit close/delete cleanup through `createRepositoryTestContext` or `renderWithRepositories`.
- The final integration test must exercise one provider-backed runtime, not only compose existing mocked page tests. No current test completes the full route flow through setup, wake order, facilitator phases, and completion.
- Every row in `docs/phases/PHASE_05A/PHASE_05A_QA.md` must start `Pending`. The user chose `qa: no`, so neither automated success nor document review may mark a manual row passed.
- The manual checklist must use shipped defaults and visible controls. The verified six-card scenario is Players `6`, Center Cards `0`, and one selection each of Werewolf, Minion, and Villager. Their defaults total six cards: 2 + 1 + 3.
- The verified phase controls are `Next`, `Start Game`, `Begin Night Phase`, `Next →`, `Start Discussion`, `Skip to Voting`, `Reveal Results`, and `Complete Game`. Reopen checks use the same `/games/{gameId}` URL.
- Custom-role manual steps use `/roles/new`, the four wizard steps, `+ Add Condition` for the required win condition, and `Create Role`. After save, verify the role on `/roles` under the default `My Roles` filter and on `/games/new`.
- For backend-stopped-first-launch QA, start the frontend independently with `npm run dev`; the current Docker Compose frontend declares a backend dependency and is not evidence that the backend was stopped from the start.
- The local database is `yourwolf-local`; the metadata store key is `seed`, and `SEED_VERSION` is `1`. A manual reseed check must describe a reproducible metadata-version change and reload, then verify 30 official roles, 15 abilities, and preservation of the custom role. Automated repository tests remain the evidence for stale-official deletion and transaction rollback.
- Dev and packaged Tauri origins have separate stores by design. Phase 05A can document this fact, but it cannot claim a packaged-origin observation before Phase 06 supplies that runtime.

## Verification Assets

| Asset | Current coverage | Required selected-feature use |
|---|---|---|
| `yourwolf-frontend/src/test/data/conversion.test.ts` | Pins custom-role UUID creation and every persisted default. | Reuse as the conversion contract. Add only a missing boundary case if builder mapping reveals one. |
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Pins role list/put behavior, bootstrap, reseed preservation, stale official deletion, rollback, and snapshot persistence. | Keep as repository authority. Do not duplicate these cases in page tests. |
| `yourwolf-frontend/src/test/context/repository_context.test.tsx` | Pins provider bootstrap, stable aggregate identity, cleanup, and failure states. | Treat the provider as established. The integration test should consume it, not retest its internals. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Pins current validation error handling, local preview behavior, successful server-create navigation, and server-create failure. | Replace create assertions with local collision order, current server-check gating, successful `put`, rejected `put`, retained draft, navigation, and no-POST coverage. |
| `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts` | Pins debounce timing, trimming, response states, failures, and stale-result handling. | Preserve all cases and add the selected local-collision suppression contract at the correct owning seam. |
| `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx` | Pins save-button validation gating and wizard navigation. | Update if name availability becomes an explicit Wizard input. Keep validation gating intact. |
| `yourwolf-frontend/src/test/pages/RolesPage.test.tsx` | Pins default visibility filters and role rendering. | Prove the saved private record renders from the shared repository state. |
| `yourwolf-frontend/src/test/pages/GameSetup.test.tsx` | Pins unfiltered role consumption, counts, and setup controls. | Prove the same saved private record is selectable without a browser reload. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Pins distinct local detail reads, setup validation, durable initial snapshot write, and navigation ordering. | Reuse in the combined smoke path. Do not reopen its reviewed unit contracts. |
| `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx` | Pins awaited phase writes, failure preservation, reopen behavior, and complete view. | Reuse controls and assertions in the combined smoke path. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Pins actual routes and current Axios guards. | Add exact `POST /roles` rejection while proving validation and name-check remain allowed. |
| `yourwolf-frontend/src/test/setup.ts` | Enforces forbidden request paths globally in application tests. | Add exact role-create rejection and preserve every existing guard. |
| Integration test at `[PROPOSED - name TBD]` | No current combined full-game test exists. Existing coverage is split across route, wake-order, hook, and facilitator suites. | Mount one provider-backed app flow, complete a game without builder use, and prove no `/api/v1` request occurs. |
| `docs/phases/PHASE_05A/PHASE_05A_QA.md` | Does not exist at selection time. | Create it after automated behavior is green. Use current routes, controls, IndexedDB behavior, and pending-only manual statuses. |
| Feature 02 review | Approved after one repair round; frontend integration 701/701 and backend integration 503/503. | Treat conversion and repository contracts as reviewed prerequisites. |
| Feature 03 review | Approved after one repair round; frontend integration 707/707 and backend integration 503/503. | Treat provider, catalog hooks, Axios GET guards, and test cleanup as reviewed prerequisites. |
| Feature 04 review | Approved after one repair round; frontend integration 709/709 and backend integration 503/503. | Treat durable snapshots and reopen semantics as reviewed prerequisites. |

Commands, run from `yourwolf-frontend/`:

- Focused: `npm exec vitest -- run src/test/data src/test/context src/test/hooks/useNameCheck.test.ts src/test/pages/RoleBuilder.test.tsx src/test/components/RoleBuilder/Wizard.test.tsx src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0`; add the selected integration test path after the implementer chooses its name.
- Full frontend: `npm exec vitest -- run --coverage`
- Lint: `npm run lint`
- Build: `npm run build`
- HTTP call-site proof: `rg -n "rolesApi\.create|/api/v1|apiClient\.(get|post|put|patch|delete)" src`

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| `RoleBuilderPage.handleSave` currently performs only `rolesApi.create(draft)` before navigation. It has no repository dependency. | The selected feature owns one bounded call-site replacement. There is no partial local save to preserve. | Obtain the reviewed repository aggregate, build through `createCustomRole`, await `roles.put`, then navigate. |
| Server name availability is checked 500 ms after name edits inside `BasicInfoStep`; draft validation begins after 1000 ms in `RoleBuilderPage`. | The current request order is name check before validation, but neither path knows about local collisions. A save-only collision check would violate AC1 because both HTTP calls may already have run. | Coordinate local collision state with both debounced paths and prove a collision causes zero server calls and zero writes. |
| `NameStatus` disappears when the Basic Info step unmounts, and `Wizard` gates Save only on server validation. | A taken, failed, stale, or still-checking server name can currently reach `handleSave`. Server create was the final duplicate defense; local `put` has no uniqueness rule. | Make the current name-check result part of save eligibility or re-establish it at the save boundary without weakening debounce/stale-response behavior. |
| `createCustomRole` already accepts the draft's nested record shapes, generates the top-level UUID, and applies every Phase 05A default. | A page-local object literal would duplicate reviewed conversion logic and can drift. | Reuse the helper. Supply a fresh save timestamp because the helper copies `updated_at`. |
| `RoleRepository.put` is an upsert keyed by UUID and does not enforce name uniqueness. | The page-level local comparison is load-bearing. Two clicks or stale list state could otherwise create duplicate names under different ids. | Disable repeat submission with existing `saving`; compare against a complete list immediately before the write and test official and custom collisions. |
| The provider exposes no catalog invalidation mechanism. `RolesPage` and `GameSetupPage` each read on mount. | A new refresh bus would add a second state system without a current consumer need. | Rely on awaited write plus route mounting. Use the shared repository instance in tests to prove both pages observe the record. |
| The global Axios mock rejects catalog GETs but its POST handler currently rejects only `/games` and `/roles/preview-script`. | A regression to server role creation would remain green unless a test explicitly mocked it. | Add exact `POST /roles` rejection and route-level assertions that `/roles/validate` remains allowed. |
| No current test drives the full setup-to-complete flow through one mounted provider. | Distributed green page suites do not satisfy AC7's combined integration claim. | Add one integration test at `[PROPOSED - name TBD]`; do not mislabel the existing page suites as the combined smoke. |
| The Phase 04B checklist expects catalog and detail HTTP calls, starts through Docker Compose, and injects `sessionStorage` failures. | Copying it would produce steps that cannot pass the Phase 05A runtime. | Rewrite the checklist around independent frontend startup, zero game-flow `/api/v1` traffic, IndexedDB persistence, tab close/reopen, and metadata-driven reseed. Keep all rows pending. |
| The actual six-card defaults and facilitator controls match the phase's intended manual flow. | The previous checklist's role-count scenario remains useful after removing its HTTP expectations. | Use Werewolf + Minion + Villager and the verified control sequence listed under Current Constraints. |

No selected-plan contradiction requires a patch. The plan's acceptance criteria already require local-first call order, both retained server checks, the existing conversion responsibility, one provider, and a combined smoke test. The source findings above add implementation detail without changing those requirements.
