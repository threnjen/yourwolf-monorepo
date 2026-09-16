# Implementation Record: 04 Game Snapshot Repository

## Summary

Migrated game snapshot reads and writes from the deleted synchronous session-storage module to Feature 02's asynchronous `GameRepository` through Feature 03's `RepositoryProvider`. Start, advance, and initial game creation now await durable writes before exposing navigation or the next phase. Night-script reads ignore stale asynchronous completions. Existing snapshot validation remains canonical in `src/data/`, and malformed or missing snapshots retain the visible game-not-found behavior.

## Sibling Features

- `02-indexeddb-repositories` supplies `GameSnapshot`, `isGameSnapshot`, `GameRepository`, and IndexedDB null-on-missing validation.
- `03-catalog-bootstrap` supplies `RepositoryProvider`, `useRepositories`, and the isolated repository test seam.
- `05-local-role-save-and-qa` consumes the completed snapshot migration and will own local role writes.
- Shared modules changed here: `src/hooks/useGame.ts`, `src/pages/WakeOrderResolution.tsx`, `src/pages/GameFacilitator.tsx`, and the affected test suites. Engine, domain, and role-save modules remain untouched.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|-----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | provider-backed hook/page tests | Consumers read and write through `repositories.games` | Complete | `yourwolf-frontend/src/hooks/useGame.ts`, `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`, `yourwolf-frontend/src/pages/GameFacilitator.tsx` | `dev/feature/04-game-snapshot-repository/review-focused.xml` | `2711232` | PENDING |
| AC2 | AC2 | repository guard tests | Feature 02 snapshot shape and guard remain the only runtime contract | Complete | `yourwolf-frontend/src/data/records.ts`, `yourwolf-frontend/src/data/indexeddb.ts`, deleted storage module | `yourwolf-frontend/src/test/data/repositories.test.ts`, `dev/feature/04-game-snapshot-repository/review-focused.xml` | `2711232` | PENDING |
| AC3 | AC3 | wake-order pending-write test | Navigation stays pending until the initial `games.put` resolves | Complete | `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx`, `dev/feature/04-game-snapshot-repository/review-focused.xml` | `2711232` | PENDING |
| AC4 | AC4 | facilitator pending and rejected write tests | Start and advance await writes. Rejection leaves the previous phase and shows the error banner | Complete | `yourwolf-frontend/src/pages/GameFacilitator.tsx` | `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`, `dev/feature/04-game-snapshot-repository/review-focused.xml` | `2711232` | PENDING |
| AC5 | AC5 | facilitator reopen tests | Night resumes from the first action. Complete resumes the complete view | Complete | `yourwolf-frontend/src/hooks/useGame.ts`, `yourwolf-frontend/src/pages/GameFacilitator.tsx` | `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`, `dev/feature/04-game-snapshot-repository/review-focused.xml` | `2711232` | PENDING |
| AC6 | AC6 | missing and corrupt facilitator tests | Repository null results render existing recovery behavior | Complete | `yourwolf-frontend/src/hooks/useGame.ts`, `yourwolf-frontend/src/pages/GameFacilitator.tsx` | `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx`, `yourwolf-frontend/src/test/data/repositories.test.ts` | `2711232` | PENDING |
| AC7 | AC7 | source removal search | Deleted storage files and zero source references | Complete | deleted `yourwolf-frontend/src/storage/game_session_storage.ts`, deleted `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` | `rg -n "sessionStorage|game_session_storage|saveGameSnapshot|loadGameSnapshot" yourwolf-frontend/src` (zero matches) | `2711232` | PENDING |
| AC8 | AC8 | affected frontend suites | Data, hook, wake-order, facilitator, and route suites cover persistence, ordering, corruption, absence, stale reads, and failures | Complete | affected source and test files listed below | `dev/feature/04-game-snapshot-repository/review-focused.xml`, `dev/feature/04-game-snapshot-repository/frontend-review-final.xml` | `2711232` | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Game consumers use the provider-backed `GameRepository` | Complete | `src/hooks/useGame.ts`, `src/pages/WakeOrderResolution.tsx`, `src/pages/GameFacilitator.tsx` | No compatibility or dual-write path remains. |
| AC2 | Feature 02 owns the snapshot shape and validator | Complete | `src/data/records.ts`, `src/data/indexeddb.ts` | Added repository tests for separate ids, complete round-trip, key mismatch, partial snapshots, invalid team, array parameters, nested arrays, and top-level arrays. |
| AC3 | Wake-order creation awaits its initial snapshot write | Complete | `src/pages/WakeOrderResolution.tsx` | Navigation follows `await repositories.games.put(...)`. |
| AC4 | Facilitator transitions await writes and preserve the old phase on failure | Complete | `src/pages/GameFacilitator.tsx` | Both start and advance pending/rejection paths are covered. |
| AC5 | Reopen restores night and complete phases | Complete | `src/hooks/useGame.ts`, `src/pages/GameFacilitator.tsx` | Existing refresh tests use repository snapshots. Night-script stale completion tests cover disable, id change, and unmount. |
| AC6 | Missing and corrupt snapshots show game recovery | Complete | `src/hooks/useGame.ts`, `src/pages/GameFacilitator.tsx` | Repository guard returns null and the page retains its existing recovery link. |
| AC7 | Session storage implementation and references are removed | Complete | deleted storage module and test | Exact source search returned no matches. |
| AC8 | Affected tests cover asynchronous migration behavior | Complete | data, hook, wake-order, facilitator, route tests | Focused and full frontend suites are green. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|--------------|--------------|-----|
| `yourwolf-frontend/src/hooks/useGame.ts` | Modified | Reads snapshots through `useRepositories`, awaits repository reads, and ignores stale night-script completions. | Make hook reads asynchronous and safe across disabled or unmounted requests. |
| `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Modified | Awaits `repositories.games.put` before navigation. | Prevent navigation before durable initial persistence. |
| `yourwolf-frontend/src/pages/GameFacilitator.tsx` | Modified | Reads and writes snapshots through `repositories.games`, awaiting writes before refetch. | Keep phase transitions durable and preserve the old phase on rejection. |
| `yourwolf-frontend/src/storage/game_session_storage.ts` | Deleted | Removed duplicate snapshot shape, validator, and session-storage persistence. | Leave one canonical repository boundary. |
| `docs/CODEBASE_CONTEXT.md` | Modified | Updated the frontend storage description to reference the IndexedDB game repository. | Keep repository context aligned with the removed module. |
| `docs/ARCHITECTURE.md`, `docs/TROUBLESHOOTING.md` | Modified | Updated current storage diagrams and test guidance for IndexedDB snapshots. | Keep behavior and recovery documentation current. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|--------------|--------------|--------|
| `yourwolf-frontend/src/test/data/repositories.test.ts` | Modified | Added complete/missing round trips plus malformed wrapper, nested-shape, array-parameter, and top-level-array cases. | AC2, AC6, AC8. |
| `yourwolf-frontend/src/test/hooks/useGame.test.ts` | Modified | Migrated fixtures to a complete provider-backed repository double and added disabled, id-change, and unmount stale-read tests. | AC1, AC5, AC8. |
| `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx` | Modified | Migrated writes to `games.put` and added pending-write ordering coverage. | AC1, AC3, AC8. |
| `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx` | Modified | Migrated persistence fixtures to provider-backed repositories and added pending/rejected transition coverage. | AC1, AC4, AC5, AC6, AC8. |
| `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` | Deleted | Removed tests for the deleted session-storage implementation. | AC2, AC7. |

## Test Results

- **Execution**: executed-green
- **Command**: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/04-game-snapshot-repository/frontend-review-final.xml` from `yourwolf-frontend`
- **Results artifact**: `dev/feature/04-game-snapshot-repository/frontend-review-final.xml`
- **Baseline**: 707 passed, 0 failed. Artifact: `dev/feature/PHASE_05A-baseline/frontend-vitest-current.xml`
- **Final**: 709 total, 709 passed, 0 failed. Coverage: 92.23% lines/statements, 92.30% branches, 94.07% functions
- **Backend integration**: `uv run pytest --junitxml=../dev/feature/04-game-snapshot-repository/backend-review.xml` from `yourwolf-backend`; `dev/feature/04-game-snapshot-repository/backend-review.xml` — 503 total, 503 passed, 0 failed
- **New tests added**: 2 lifecycle tests. Existing repository assertions were expanded for migrated contracts.
- **Affected suites run**: focused data, hook, wake-order, facilitator, and route suites 70/70; full frontend 709/709; backend integration 503/503; `npm run lint`; `npm run build`; exact source removal search
- **Focused command**: `npm exec vitest -- run src/test/data/repositories.test.ts src/test/hooks/useGame.test.ts src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/04-game-snapshot-repository/review-focused.xml`
- **Focused results artifact**: `dev/feature/04-game-snapshot-repository/review-focused.xml` — 70 total, 70 passed, 0 failed
- **Regressions**: None

## Review and Fix Loop

- **Resolved review agents**: `03c-reviewer-plan-conformance`
- **Review findings**: Four plan-conformance findings resolved: disabled night-script loading cleanup, incomplete provider doubles, missing stale id/unmount coverage, and incomplete canonical snapshot guard migration coverage. Details: `dev/feature/04-game-snapshot-repository/04-game-snapshot-repository-review.md`.
- **Fix rounds**: 1
- **Carry-forward findings**: None
- **Fallback**: None

## Unfixed findings

None.

## Deviations from Plan

- The tests use Feature 03's `RepositoryProvider` with controllable repository doubles for deterministic pending and failure ordering. Feature 03's isolated IndexedDB helper remains the approved integration seam, while repository behavior itself is covered by the data-layer suite.
- No changes were required in `src/data/` because Feature 02 already owns the canonical snapshot contract and validator. The migration only added guard coverage and rewired consumers.

## Gaps

None.

## Reviewer Focus Areas

- `src/hooks/useGame.ts` — stale completion guard and repository availability handling.
- `src/pages/GameFacilitator.tsx` — await ordering between repository writes and `refetch`, including rejection preserving the rendered phase.
- `src/pages/WakeOrderResolution.tsx` — initial snapshot write completion before navigation.
- `src/data/indexeddb.ts` — canonical snapshot-row identity and malformed-shape validation retained from Feature 02.
