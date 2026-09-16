# Review: 04 Game Snapshot Repository

## Verdict

Approved after one plan-conformance review and repair round. The review found four defects in the implementation checkpoint and resolved all four. The final frontend and backend suites are green, lint and build are green, and the source-removal search returns no forbidden references.

## Scope

- Pipeline: `phase`
- Implementation checkpoint: `2711232`
- Review lane: `plan-conformance`
- Review round: one. The repair tests and integration runs below are verification for this round, not a second review.
- Reviewed artifacts: the implementation record, plan, selection delta, execution manifest, completed Feature 02 and Feature 03 records, all nine Feature 04 code/test changes, and the uncommitted architecture/context/troubleshooting documentation changes.

## Findings and repairs

### F-01 — disabling a pending night-script read could leave loading stuck

- severity: medium
- lane: plan-conformance
- evidence: At checkpoint `2711232`, `useNightScript` returned immediately for `enabled === false` at `yourwolf-frontend/src/hooks/useGame.ts:48-50`. Its `finally` block only cleared loading when the old effect remained current at `:80-83`. Disabling a pending IndexedDB read therefore invalidated the request without clearing the loading state. The `executed-failing` red run used `npm exec vitest -- run src/test/hooks/useGame.test.ts --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/04-game-snapshot-repository/review-red-4.xml` from `yourwolf-frontend`, with results artifact `dev/feature/04-game-snapshot-repository/review-red-4.xml`: 11 total, 9 passed, and 2 failed.
- repair: `useNightScript` now creates the current-request guard before the disabled branch, clears loading when disabled, and still invalidates the old request during cleanup at `yourwolf-frontend/src/hooks/useGame.ts:48-56`. The controlled test proves loading clears on disable and the stale completion cannot set script state at `yourwolf-frontend/src/test/hooks/useGame.test.ts:163-189`.
- verification: `dev/feature/04-game-snapshot-repository/review-repair-focused.xml` reports 19 total, 19 passed, and 0 failed. The full frontend artifact reports 709 total, 709 passed, and 0 failed.
- reviewer: 03c-reviewer-plan-conformance

### F-02 — lifecycle tests bypassed the provider contract

- severity: medium
- lane: plan-conformance
- evidence: At checkpoint `2711232`, the provider-path and pending-read tests cast `{games}` directly to `IndexedDbRepositories` at `yourwolf-frontend/src/test/hooks/useGame.test.ts:85-92` and `:158-171`. `RepositoryProvider` calls `bootstrap`, so these doubles were not valid provider inputs and the tests could resolve through the provider's unavailable-repository path instead of exercising the pending `games.get` path.
- repair: Added a repository double with the complete provider contract, including resolved `bootstrap`, `reseed`, `close`, and typed store placeholders at `yourwolf-frontend/src/test/hooks/useGame.test.ts:25-43`. The provider-path and lifecycle tests now use that helper at `:90-98`, `:172-180`, `:204-212`, and `:231-237`.
- verification: The repaired focused hook/data run in `dev/feature/04-game-snapshot-repository/review-repair-focused.xml` reports 19 total, 19 passed, and 0 failed. The affected frontend run in `review-focused.xml` reports 70 total, 70 passed, and 0 failed.
- reviewer: 03c-reviewer-plan-conformance

### F-03 — stale completion coverage did not cover id changes or unmount

- severity: medium
- lane: plan-conformance
- evidence: At checkpoint `2711232`, `useNightScript` had only a disabled-read stale test at `yourwolf-frontend/src/test/hooks/useGame.test.ts:158-181`. The plan explicitly requires stale completions to remain harmless when the request identity changes or the component unmounts.
- repair: Added controlled tests for game-id changes and unmount, including a spy that proves an unmounted completion does not build a script at `yourwolf-frontend/src/test/hooks/useGame.test.ts:191-245`. The production current-request guard covers both paths at `yourwolf-frontend/src/hooks/useGame.ts:49-67`.
- verification: `review-repair-focused.xml` reports 19 total, 19 passed, and 0 failed. The final full frontend artifact reports 709 total, 709 passed, and 0 failed.
- reviewer: 03c-reviewer-plan-conformance

### F-04 — repository migration tests did not preserve all canonical guard contracts

- severity: medium
- lane: plan-conformance
- evidence: At checkpoint `2711232`, repository tests covered one setup snapshot, wrapper timestamp mismatch, embedded-id mismatch, invalid team, invalid parameters, and a top-level array, but did not independently cover separate game ids and complete phase round-trip, a lookup-key versus wrapper-id mismatch, a partial snapshot, or a snapshot-array value. These are the deleted storage suite's meaningful contracts and the plan's explicit key-match, shape, and array edge cases.
- repair: Added independent setup and complete snapshot round trips plus missing-id assertions at `yourwolf-frontend/src/test/data/repositories.test.ts:71-94`. Added wrapper/embedded key mismatch, partial snapshot, and nested snapshot-array rows at `:96-158`, while retaining invalid team, array parameters, and top-level array cases at `:160-220`. The canonical Feature 02 guard remains unchanged and checks plain-record shape, wrapper id/timestamp, embedded snapshot shape, and embedded session id at `yourwolf-frontend/src/data/indexeddb.ts:105-145`.
- verification: The affected data suite is green in `review-focused.xml` with 8 total, 8 passed, and 0 failed. The final full frontend artifact reports 709 total, 709 passed, and 0 failed.
- reviewer: 03c-reviewer-plan-conformance

## Acceptance criteria evidence

| Criterion | Evidence | Result |
|---|---|---|
| AC1 | `useGame` obtains snapshots from `useRepositories` at `yourwolf-frontend/src/hooks/useGame.ts:43-65`; wake-order and facilitator pages obtain `repositories` at `yourwolf-frontend/src/pages/WakeOrderResolution.tsx:65-69` and `yourwolf-frontend/src/pages/GameFacilitator.tsx:212-214`. Their writes use `repositories.games.put` at Wake Order `:149-150` and facilitator `:236-242`, `:255-261`. | Verified by affected frontend suites: 70/70 green. |
| AC2 | Feature 02's canonical guard remains in `yourwolf-frontend/src/data/indexeddb.ts:37-39,105-145`, and `GameRepository.get` returns null for any failed row guard at `:224-235`. Round-trip and malformed-shape coverage is in `yourwolf-frontend/src/test/data/repositories.test.ts:71-220`. | Verified. |
| AC3 | Wake-order start awaits the initial write before navigation at `yourwolf-frontend/src/pages/WakeOrderResolution.tsx:115-150`. Pending-write and rejection assertions are at `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx:330-342` and `:525-535`. | Verified. |
| AC4 | Facilitator start and advance await `put` before `refetch` at `yourwolf-frontend/src/pages/GameFacilitator.tsx:230-266`. Pending and rejected writes preserve the rendered previous phase and expose the error at `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx:115-159`. | Verified. |
| AC5 | Night refresh resets the reader to its first action and complete refresh renders the completed view at `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx:161-187`. `useNightScript` rebuilds from the stored snapshot at `yourwolf-frontend/src/hooks/useGame.ts:65-79`. | Verified. |
| AC6 | Repository reads return null for missing and malformed rows through the guard at `yourwolf-frontend/src/data/indexeddb.ts:137-145`, while facilitator renders the existing recovery state at `yourwolf-frontend/src/pages/GameFacilitator.tsx:217-227`. Data and page tests cover missing/corrupt behavior at `yourwolf-frontend/src/test/data/repositories.test.ts:88-220` and the facilitator missing-game tests in the affected suite. | Verified. |
| AC7 | Both old files are absent. The exact source search `rg -n 'sessionStorage|game_session_storage|saveGameSnapshot|loadGameSnapshot' yourwolf-frontend/src` returned zero matches. | Verified. |
| AC8 | Affected data, hook, wake-order, facilitator, and route suites ran together. The focused artifact reports 70 total, 70 passed, and 0 failed. The final frontend integration artifact reports 709 total, 709 passed, and 0 failed. | Verified. |

## Documentation review

The uncommitted `docs/ARCHITECTURE.md`, `docs/CODEBASE_CONTEXT.md`, and `docs/TROUBLESHOOTING.md` changes were reviewed for plan-conformant storage boundaries. Their current descriptions now identify IndexedDB `GameRepository` snapshots, provider-backed game flow, and backend calls limited to role validation, name checks, and role save at `docs/ARCHITECTURE.md:5-7`, `:197-207`, `docs/CODEBASE_CONTEXT.md:3`, `:215-242`, `:261-266`, and `docs/TROUBLESHOOTING.md:251`. No phase document required a content change because the repair preserves the documented behavior and scope.

## Test execution evidence

All required authoritative suites ran after repair.

| Suite | Status | Exact command | Results artifact | Counts |
|---|---|---|---|---|
| Affected frontend | `executed-green` | From `yourwolf-frontend`: `npm exec vitest -- run src/test/data/repositories.test.ts src/test/hooks/useGame.test.ts src/test/pages/WakeOrderResolution.test.tsx src/test/pages/GameFacilitator.test.tsx src/test/routes.test.tsx --coverage --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0 --reporter=junit --outputFile=../dev/feature/04-game-snapshot-repository/review-focused.xml` | `dev/feature/04-game-snapshot-repository/review-focused.xml` | 70 total, 70 passed, 0 failed |
| Backend integration | `executed-green` | From `yourwolf-backend`: `uv run pytest --junitxml=../dev/feature/04-game-snapshot-repository/backend-review.xml` | `dev/feature/04-game-snapshot-repository/backend-review.xml` | 503 total, 503 passed, 0 failed |
| Full frontend integration | `executed-green` | From `yourwolf-frontend`: `npm exec vitest -- run --coverage --reporter=junit --outputFile=../dev/feature/04-game-snapshot-repository/frontend-review-final.xml` | `dev/feature/04-game-snapshot-repository/frontend-review-final.xml` | 709 total, 709 passed, 0 failed |

Additional required checks:

- `npm run lint` from `yourwolf-frontend`: exit 0.
- `npm run build` from `yourwolf-frontend`: exit 0. TypeScript compilation and Vite production build completed.
- `git diff --check`: exit 0.
- Exact forbidden-reference search: `test ! -e yourwolf-frontend/src/storage/game_session_storage.ts && echo storage module absent; test ! -e yourwolf-frontend/src/test/storage/game_session_storage.test.ts && echo storage test absent; if rg -n 'sessionStorage|game_session_storage|saveGameSnapshot|loadGameSnapshot' yourwolf-frontend/src; then exit 1; else echo forbidden source references: none; fi`. Output confirmed both files absent and `forbidden source references: none`.

## Unfixed findings

None.

## Review record

- reviewer: `03c-reviewer-plan-conformance`
- fix rounds: 1
- regressions: None. This statement is supported by the `executed-green` frontend and backend artifacts above.
- phase-doc sync: no phase document content changed. The repair stayed within the feature's implementation and test artifacts, with only the already-uncommitted accuracy corrections in the three reviewed docs.
