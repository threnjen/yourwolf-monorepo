# 03 Catalog Bootstrap Selection Delta

**Validation commit:** `7c03fdaa866d8e70d0e710d90ea33c13ca67e22c`

## Key Files

| File | Verified symbols or role | Selection impact |
|---|---|---|
| `yourwolf-frontend/src/data/indexeddb.ts` | `createIndexedDbRepositories`, `IndexedDbRepositories`, `bootstrap`, `close` | Feature 02 provides one repository object, asynchronous bootstrap, and explicit connection cleanup. |
| `yourwolf-frontend/src/data/repositories.ts` | `RoleRepository`, `AbilityRepository`, `RoleListFilters` | Role reads support optional single-value `team` and `visibility` filters. Ability reads return the complete catalog. |
| `yourwolf-frontend/src/data/index.ts` | Public exports for the repository factory, aggregate type, and repository interfaces | The provider can consume the reviewed Feature 02 public boundary. |
| `yourwolf-frontend/src/App.tsx` | `App`, `Layout`, `AppRoutes` | `Layout` currently wraps `AppRoutes`. The bootstrap gate belongs between them. |
| `yourwolf-frontend/src/hooks/useFetch.ts` | `useFetch` | Repository-backed hooks must retain a memoized fetcher and the existing loading, error, and refetch behavior. |
| `yourwolf-frontend/src/hooks/useRoles.ts` | `useRoles` | The hook currently accepts a visibility array, stabilizes it through `visibilityKey`, and requests the HTTP catalog. |
| `yourwolf-frontend/src/hooks/useAbilities.ts` | `useAbilities` | The hook currently memoizes the HTTP ability-list fetcher and delegates state handling to `useFetch`. |
| `yourwolf-frontend/src/pages/RolesPage.tsx` | `RolesPage` | The page passes `official` and `private` visibility values by default and allows multiple active visibility values. |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | `GameSetupPage` | The page calls `useRoles()` without filters and groups the returned catalog by team. |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | `WakeOrderResolutionPage`, `handleStartGame` | The start path deduplicates selected role ids before concurrent detail reads, adapts the results, and preserves repeated card ids separately. |
| `yourwolf-frontend/src/adapters/role_adapters.ts` | `adaptRoleToEngine`, `adaptDependenciesToEngine` | `adaptRoleToEngine` retains its two-input signature. A full `RoleRecord` satisfies both inputs. |
| `yourwolf-frontend/src/test/setup.ts` | Global Axios mock and `rejectGamesRequest` | `fake-indexeddb/auto` is already installed. The guard currently rejects `/games` and `/roles/preview-script` only. |
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Unique database-name pattern and close/delete cleanup | Existing repository tests establish the isolation and cleanup pattern for the shared render helper. |
| `yourwolf-frontend/src/test/App.test.tsx` | `renderApp` | The app test mounts `App` inside `BrowserRouter` and currently mocks `useRoles`. |
| `yourwolf-frontend/src/test/routes.test.tsx` | `renderRoutes` | Route tests mount `AppRoutes` directly inside `MemoryRouter` and currently mock `useRoles`. |
| `yourwolf-frontend/src/test/hooks/useRoles.test.ts` | Existing loading, success, visibility-change, error, and refetch scenarios | These tests currently mock `rolesApi.list` and must move to the provider/repository seam. |
| `yourwolf-frontend/src/test/hooks/useAbilities.test.ts` | Existing loading, success, and error scenarios | These tests currently mock `abilitiesApi.list` and must move to the provider/repository seam. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Existing distinct-read, concurrency, adapter, error, and snapshot assertions | Replace the `rolesApi.getById` mock with repository-backed evidence while leaving Feature 04 snapshot assertions on the current storage seam. |

The provider and shared render-helper module and symbol names remain `[PROPOSED - name TBD]`. No matching implementation exists at this commit.

## Current Constraints

- Feature 03 depends on the approved Feature 02 repository boundary. Its review has no unfixed findings.
- Do not migrate game snapshots or role saves in this feature. `saveGameSnapshot` remains the Feature 04 seam.
- Keep `rolesApi.validate`, `rolesApi.checkName`, `rolesApi.create`, and the Axios client. Later features own those changes.
- Do not change `adaptRoleToEngine`, engine behavior, or files under `src/engine/` and `src/domain/`.
- Keep `useFetch` as the async-state mechanism. Its fetcher identity must remain stable to avoid repeated effects.
- Preserve the current `useRoles(visibility?: string[])` caller behavior. The repository accepts only one visibility value, while `RolesPage` can select several.
- A missing `RoleRepository.get` result is `null`. The wake-order start path must convert that absence into its existing visible failure flow before calling the adapter.
- The provider value must expose the complete `IndexedDbRepositories` object because Features 04 and 05 consume `games` and role writes through the same seam.
- Tests that open IndexedDB must use unique database names, close the repository connection, and delete the database after use.
- Add no normal-path logging. Surface bootstrap failures through the visible shell error state.
- Retain the existing global guards for `/games` and `/roles/preview-script`. Add guards for catalog `GET` requests without blocking the remaining validation and name-check calls.
- Existing API unit tests mock `src/api/client` directly. They do not prove runtime catalog call sites are offline and should remain separate from the global Axios guard evidence.

## Verification Assets

| Asset | Existing coverage or use |
|---|---|
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Proves bootstrap yields 30 roles and 15 abilities, matching-version bootstrap is a no-op, filters work, missing role reads return `null`, and isolated databases can be cleaned up. |
| `yourwolf-frontend/src/test/data/type_compatibility.test.ts` | Proves `RoleRecord` remains assignable to both transport role views consumed by current pages and adapters. |
| `yourwolf-frontend/src/test/adapters/role_adapters.test.ts` | Pins the two-input adapter merge and absent/runtime-null normalization. |
| `yourwolf-frontend/src/test/hooks/useRoles.test.ts` | Pins initial loading, visibility changes, refetch, error propagation, and non-`Error` fallback behavior. |
| `yourwolf-frontend/src/test/hooks/useAbilities.test.ts` | Pins initial loading, catalog success, and error behavior. |
| `yourwolf-frontend/src/test/pages/RolesPage.test.tsx` | Pins multiple visibility selections passed to `useRoles`. |
| `yourwolf-frontend/src/test/pages/GameSetup.test.tsx` | Pins the unfiltered role catalog consumer and setup rendering. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Pins one read per distinct role, concurrent reads, repeated-card preservation, adapter-driven session creation, error display, and current snapshot behavior. |
| `yourwolf-frontend/src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx` | Pins ability loading, catalog display, and selection behavior. |
| `yourwolf-frontend/src/test/App.test.tsx` | Starting point for shell loading, success, and database-open failure coverage. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Starting point for provider-backed route rendering and forbidden-request guard assertions. |
| `npm exec vitest -- run src/test/data src/test/hooks/useRoles.test.ts src/test/hooks/useAbilities.test.ts src/test/pages/RolesPage.test.tsx src/test/pages/GameSetup.test.tsx src/test/pages/WakeOrderResolution.test.tsx src/test/components/RoleBuilder/steps/AbilitiesStep.test.tsx src/test/App.test.tsx src/test/routes.test.tsx` | Focused frontend command for the selected scope. |
| `npm exec vitest -- run --coverage` | Full frontend coverage gate. Feature 02 review recorded 701 passed and 0 failed with coverage above 80 percent. |
| `npm run lint` | Frontend lint gate and pure-layer boundary check. |
| `npm run build` | TypeScript and production-build gate. |

Run the npm commands from `yourwolf-frontend/`.

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| Feature 02's reviewed public surface exports `createIndexedDbRepositories` and the complete `IndexedDbRepositories` type. | The provider can reuse the accepted repository aggregate without a second data abstraction. | Validate the plan. |
| No provider or shared render helper exists at validation commit `7c03fda`. | Their concrete file and symbol names remain unsettled. | Keep the plan's `[PROPOSED - name TBD]` label. |
| `App` already renders `Layout` around `AppRoutes`. | The planned loading and failure gate can preserve visible navigation chrome. | Validate AC2. |
| `useFetch` re-runs when its fetcher identity changes. Both catalog hooks already use memoized fetchers. | Repository context identity and visibility dependencies must not cause fetch loops. | Preserve the existing memoization contract and its tests. |
| `useRoles` accepts only `visibility?: string[]`; `RolesPage` supplies multiple visibility values, and `GameSetupPage` supplies no filter. No caller supplies a team filter. | AC4's original claim that these callers preserve team filtering contradicted the current source. The repository's single-value visibility filter also cannot directly represent the page's multi-select contract. | Patched AC4 to preserve verified visibility-array and unfiltered behavior. The implementation must cover multi-value filtering without changing callers. |
| `WakeOrderResolutionPage` already deduplicates role ids and starts all detail reads with one `Promise.all`. | Repository migration must preserve one concurrent read per distinct selected role. | Validate AC6 and retain the concurrency scenario. |
| `RoleRepository.get` returns `RoleRecord | null`, unlike `rolesApi.getById`, which either returns detail or rejects. | Passing `null` into the existing adapter would violate its contract and obscure the missing-role error. | Cover repository absence through the page's visible error path before adaptation. |
| The existing wake-order suite also asserts synchronous session-storage outcomes. | Feature 03 should change only role-detail retrieval in this suite. Feature 04 owns asynchronous snapshot migration. | Preserve the current storage assertions and seam during this feature. |
| `fake-indexeddb/auto` is already imported globally, and repository tests use UUID database names plus explicit close/delete cleanup. | The shared render helper can follow a proven isolation pattern. | Reuse the verified pattern and add cleanup evidence. |
| App and route tests currently avoid catalog I/O by mocking `useRoles`; hook tests mock the HTTP clients; page tests often mock hooks. | These patterns do not prove repository wiring or the absence of runtime catalog HTTP. | Move selected integration coverage to the provider/render helper while retaining focused component mocks where repository wiring is not the subject. |
| The global Axios guard rejects only `/games` and `/roles/preview-script`. API unit tests mock `src/api/client` independently. | Adding catalog read guards will exercise runtime call sites without invalidating direct API-contract tests. | Extend the global guard for `GET /roles`, `GET /roles/{id}`, and `GET /abilities`; preserve remaining server-call paths. |
| `AbilitiesStep.test.tsx` is the direct consumer test for `useAbilities`, but it is not listed in the manifest's Feature 03 expected write set. | AC5 and AC8 still require ability-browsing evidence even if the component test remains hook-mocked. | Treat it as a verification asset. Do not modify the manifest in selection mode. |

## Selected Plan Patch

Patched AC4 only. The source proves that the established caller contract is a visibility array for `RolesPage` and an unfiltered catalog for `GameSetup`. No verified caller passes a team filter.

No other selected-plan contradiction was found.
