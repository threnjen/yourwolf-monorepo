# 04 Game Snapshot Repository Selection Delta

Validated against commit `0c8e39d03ea0f94853942c3b7401ff9dff3cdb0d`.

## Key Files

| File | Verified symbols and role | Selection impact |
|---|---|---|
| `yourwolf-frontend/src/data/records.ts` | `GameSnapshot`, `SnapshotRole`, `SnapshotAbilityStep` | Feature 02 already owns the canonical snapshot contract. `SnapshotRole` is structurally compatible with the engine role snapshot used by the existing callers. |
| `yourwolf-frontend/src/data/repositories.ts` | `GameRepository.get`, `GameRepository.put` | Both repository operations are asynchronous. `get` preserves `GameSnapshot | null`; `put` persists the snapshot under `snapshot.session.id`. |
| `yourwolf-frontend/src/data/indexeddb.ts` | `isGameSnapshot`, `isGameSnapshotRecord`, `createIndexedDbRepositories` | Feature 02 already implemented the plain-object and array rejection guard, wrapper metadata validation, embedded session-id validation, and null-on-missing behavior. |
| `yourwolf-frontend/src/data/index.ts` | `GameSnapshot`, `GameRepository`, `isGameSnapshot`, `IndexedDbRepositories` exports | Supplies the stable public imports for the migration. |
| `yourwolf-frontend/src/context/repository_context.tsx` | `RepositoryProvider`, `useRepositories` | Feature 03 exposes `repositories.games` to hooks and pages after bootstrap. |
| `yourwolf-frontend/src/test/test_utils.tsx` | `createRepositoryTestContext`, `renderWithRepositories` | Supplies a bootstrapped unique IndexedDB database with explicit close and delete cleanup. Hook tests can use `createRepositoryTestContext` with a provider wrapper. |
| `yourwolf-frontend/src/storage/game_session_storage.ts` | `GameSnapshot`, `isGameSnapshot`, `saveGameSnapshot`, `loadGameSnapshot` | This is the duplicate synchronous boundary to delete after all callers move. |
| `yourwolf-frontend/src/hooks/useGame.ts` | `useGame`, `useNightScript` | Both reads currently call `loadGameSnapshot`. Repository reads must flow through `useRepositories`; the night-script effect becomes genuinely asynchronous. |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | `WakeOrderResolutionPage`, `handleStartGame` | Role reads already use the provider. The remaining synchronous snapshot write occurs immediately before navigation. |
| `yourwolf-frontend/src/pages/GameFacilitator.tsx` | `GameFacilitatorPage`, `GameFacilitatorContent`, `handleStartGame`, `handleAdvancePhase` | Both transitions synchronously load and save snapshots, then await `refetch`. Repository `get` and `put` must complete before `refetch` exposes the next phase. |
| `yourwolf-frontend/src/routes.tsx` | `/games/new/wake-order`, `/games/:gameId` | URL semantics remain unchanged. |

## Current Constraints

- Keep `GameSnapshot`, engine phases, narration, role adaptation, and facilitator URLs unchanged.
- Do not modify `yourwolf-frontend/src/engine/` or `yourwolf-frontend/src/domain/`.
- Use `GameRepository` through `useRepositories`. Do not add a compatibility module or dual-write path.
- Delete `yourwolf-frontend/src/storage/game_session_storage.ts` and `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` only after every source and test caller uses the repository.
- Preserve null-on-missing and corrupt-as-missing behavior. The IndexedDB row guard must continue validating the lookup key, wrapper timestamp, embedded session id, plain-object shapes, and array rejection.
- Await every repository read and write. A failed start or advance write must leave the rendered phase unchanged and show the existing error banner.
- Keep normal-path logging absent. The existing visible error states are the selected observability mechanism for this local UI path.
- Shared repository tests must use unique database names and explicit close/delete cleanup through `createRepositoryTestContext` or `renderWithRepositories`.
- Existing test imports remain relative. Production exports remain named.
- Relevant durable learnings: boundary-shape tests must reach the intended guard; runtime record guards must reject arrays; snapshot row identity includes wrapper and embedded ids; asynchronous resource tests need failure-path coverage.

## Verification Assets

| Asset | Current coverage | Required migration use |
|---|---|---|
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Stores and loads snapshots, returns null when missing, and rejects malformed wrapper metadata or mismatched embedded ids. | Retain these assertions and add the migrated malformed snapshot-shape and array cases from the deleted storage suite. |
| `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` | Pins the old shape guard, key matching, invalid team/parameters, missing data, and synchronous write failure. | Move behavior coverage to repository tests, then delete this file. Do not carry the session-storage mechanism forward. |
| `yourwolf-frontend/src/test/hooks/useGame.test.ts` | Covers loading, absence, refetch, ordered script rebuilding, disabled reads, and missing snapshots. | Mount the repository provider, persist through `repositories.games`, and add a controlled pending-read case for stale asynchronous completion. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Covers concurrent distinct role reads, snapshot content, navigation, missing roles, and synchronous storage failure. | Replace storage helpers with `repositories.games`; hold `put` pending to prove navigation waits, then reject it to prove the page remains and reports the error. |
| `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx` | Covers missing/corrupt snapshots, start and advance transitions, write failure, night refresh, intermediate phases, and complete refresh. | Use isolated repositories; hold and reject async `put` calls to prove the previous phase remains visible until persistence succeeds. |
| `yourwolf-frontend/src/test/routes.test.tsx` | Mocks the aggregate repository contract and covers the wake-order route. It does not currently render `/games/:gameId`. | Keep the aggregate mock compatible and add route-level facilitator coverage if the direct route contract changes during the provider rewire. |
| Feature 02 evidence | Approved review; focused data suite 16/16 and integrated frontend suite 701/701. | Treat `GameRepository` and its guard as established prerequisites. |
| Feature 03 evidence | Approved review; focused suite 147/147 and integrated frontend suite 707/707. | Treat `RepositoryProvider`, `useRepositories`, and repository test cleanup as established prerequisites. |

Commands:

- Focused: `npm exec vitest -- run src/test/data src/test/hooks/useGame.test.ts src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0`
- Full frontend: `npm exec vitest -- run --coverage`
- Lint: `npm run lint`
- Build: `npm run build`
- Removal proof: `rg -n "sessionStorage|game_session_storage|saveGameSnapshot|loadGameSnapshot" yourwolf-frontend/src`

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| Feature 02 already created and exported `GameSnapshot` and `isGameSnapshot` in `src/data/`; the session-storage module now contains a duplicate contract and validator. | The original plan instruction to move the guard would create or preserve a second validator. | Patched AC2, architecture guidance, test guidance, and Stage 1 to retain the Feature 02 implementation and delete the duplicate. Plan revision should advance from 1 when the manifest is updated by Phase - Execute. |
| `isGameSnapshotRecord` validates the IndexedDB row id, `updated_at`, snapshot shape, and `snapshot.session.id` together. | Repository reads are stricter than the old raw session-storage read while preserving null-on-invalid semantics. | Preserve the wrapper checks. Migrate malformed nested-shape and array tests so each guard family remains independently exercised. |
| `useGame` currently wraps a synchronous read in `useFetch`, while `useNightScript` performs that read inside an effect without cancellation. | IndexedDB makes both reads truly asynchronous. A late result can overwrite state after the game id or enabled flag changes unless the effect ignores stale completion. | Keep `useFetch` for `useGame`. Add stale-completion protection and a controlled pending-read test to `useNightScript` as part of AC8 asynchronous ordering. |
| `WakeOrderResolutionPage` already has an async action boundary and navigates only after the current synchronous save returns. | Replacing the call with `await repositories.games.put(...)` preserves the intended order with a small caller change. | Add a deferred-promise test that proves navigation does not occur while `put` is pending. |
| `GameFacilitatorContent` derives the next immutable session, saves it, and only then awaits `refetch`; it does not place the next session into React state directly. | Awaiting repository `put` before `refetch` naturally preserves the old phase on rejection. | Convert both load and save calls to awaited `repositories.games` operations. Test pending and rejected writes for start and advance. |
| The current facilitator and hook tests bypass `RepositoryProvider` and seed `sessionStorage` directly. | They cannot verify the selected repository path or database persistence. | Rebuild them around `createRepositoryTestContext` and `RepositoryProvider`; retain the existing visible-state assertions. |
| The route suite already mocks `games.get` and `games.put`, but it covers only the wake-order game route. | The aggregate mock will survive the rewire, but it does not prove facilitator routing. | Update only if needed by the rewire; direct facilitator tests remain the primary behavior evidence. |
| The current source has exactly three production callers of the session-storage boundary: `useGame.ts`, `WakeOrderResolution.tsx`, and `GameFacilitator.tsx`. | The removal scope is complete and bounded. | Rewire all three, delete the module and its test, then require the removal-proof search to return no matches. |

No other plan contradiction was found. No concrete name remains `[PROPOSED - name TBD]` in the selected plan or this delta.
