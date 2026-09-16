# 04 Game Snapshot Repository

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** `useGame`, `WakeOrderResolutionPage`, and `GameFacilitatorPage` obtain snapshots through the Feature 02 `GameRepository` exposed by Feature 03.
- **AC2:** Feature 02's existing `GameSnapshot` shape and `isGameSnapshot` validator in `src/data/` remain canonical. Their behavior and null-on-missing semantics match the session-storage implementation, whose duplicate shape and guard are deleted without another rewrite.
- **AC3:** `WakeOrderResolutionPage` awaits the initial snapshot write before navigating or re-rendering.
- **AC4:** `GameFacilitatorPage` awaits start and advance writes before rendering the new phase. A failed write shows the existing error banner and leaves the previous phase visible.
- **AC5:** Closing and reopening the facilitator URL restores night at its first action and restores the complete view when that was the saved phase.
- **AC6:** Corrupt or missing snapshots produce the existing “Game not found” behavior.
- **AC7:** `yourwolf-frontend/src/storage/game_session_storage.ts` and `yourwolf-frontend/src/test/storage/game_session_storage.test.ts` are deleted, and no file under `yourwolf-frontend/src/` reads `sessionStorage`.
- **AC8:** Existing and updated hook, wake-order, facilitator, route, and data-layer tests cover persistence, asynchronous ordering, corruption, missing data, and write failure.

### Non-Goals

- Do not change `GameSnapshot`, engine phases, narration, role adaptation, or URL semantics.
- Do not list past games or add a resume screen.
- Do not add live cross-tab synchronization.
- Do not migrate role saves.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC2 | `yourwolf-frontend/src/hooks/useGame.ts`, `yourwolf-frontend/src/data/`, `yourwolf-frontend/src/storage/game_session_storage.ts` | Existing test to update |
| AC3 | `yourwolf-frontend/src/pages/WakeOrderResolution.tsx` | Existing test to update |
| AC4-AC6 | `yourwolf-frontend/src/pages/GameFacilitator.tsx` | Existing test to update; must-have automated test |
| AC7 | `yourwolf-frontend/src/storage/`, `yourwolf-frontend/src/test/storage/` | Code-review evidence only; must-have automated test |
| AC8 | Affected hook, page, route, and data suites | Existing test to update |

## B. Correctness & Edge Cases

- Await durable writes before exposing the new state to the UI.
- Preserve the previous phase after any failed start or advance write.
- Validate the embedded record shape after the requested key matches, so corrupt-shape tests reach the intended guard.
- Reject arrays where a plain record is required.
- Two tabs may observe changes after refresh; no live notification is required.
- A snapshot retains its copied role inputs if a catalog role later changes.

## C. Consistency & Architecture Fit

- Reuse Feature 02's existing `src/data/` runtime guard and delete the duplicate session-storage validator. Do not create a third validator.
- Consume `GameRepository` through the provider seam from Feature 03.
- Keep the existing `useGame`, `WakeOrderResolutionPage`, and `GameFacilitatorPage` responsibilities and visible error states.
- Preserve exact `GameSnapshot` and `isGameSnapshot` names copied from the Phase and current source.
- Do not touch `src/engine/` or `src/domain/`.

## D. Clean Design & Maintainability

- Remove the session-storage implementation once every caller uses the repository.
- Avoid a transitional dual-write path.
- Keep write ordering explicit at the page action boundary.
- Keep it clean: one persistence path, one guard, no compatibility module, no polling.

## E. Completeness: Observability, Security, Operability

- **Observability:** Use existing error banners for failed reads and writes. Add no normal-path logs.
- **Security:** Validate stored snapshots before use. Store no secrets.
- **Runbook:** Run focused data, hook, wake-order, facilitator, and route suites. Search `src/` for `sessionStorage`. Run full coverage, lint, and build. Roll back all callers with the storage implementation if reversal is required.

## F. Test Plan

- AC1-AC2: migrate the session-storage behavior assertions to Feature 02's existing data-layer guard and repository tests.
- AC3-AC6: update wake-order and facilitator tests with controllable asynchronous writes and reopen scenarios.
- AC7-AC8: prove old files are absent and no source reference remains.
- High-value checks:
  1. Given a pending initial write, when Start Game is clicked, then navigation waits for persistence.
  2. Given a failed advance write, when advance is attempted, then the old phase remains and the error banner appears.
  3. Given a night snapshot, when a new app instance opens the same URL, then night resumes at the first action.
  4. Given a complete snapshot, when reopened, then the complete view appears.
  5. Given a key-matched corrupt plain object or array, when loaded, then the repository returns null and the page shows “Game not found”.
- Reuse Feature 03's render helper, unique databases, existing snapshot fixtures, and page interaction helpers.
- This rewires synchronous storage to asynchronous persistence. Update all timing assertions and retain explicit missing, corrupt, and write-failure coverage.
- Stage 0 is not required because the baseline suite exists and the global frontend coverage gate is 80 percent.

## Stage 1: Snapshot Boundary Migration
**Goal**: Use Feature 02's existing snapshot shape and validator behind `GameRepository`, remove the duplicate session-storage boundary, and update consumers.
**Success Criteria**: AC1-AC4 pass.
**Status**: Not Started

## Stage 2: Persistence and Removal Proof
**Goal**: Prove reopen behavior and remove every session-storage path.
**Success Criteria**: AC5-AC8 pass.
**Status**: Not Started
