# Phase 4b: Engine Frontend Integration

**Status**: In Progress
**Depends on**: Phase 04a (Client-Side Game Engine)
**Estimated complexity**: Medium
**Cross-references**: Engine contract in `yourwolf-frontend/src/engine/`; Phase 04a summary at `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md`; planning decisions in `docs/phases/DISCOVERY_CONTEXT.md`; Python reference stays untouched in `yourwolf-backend/`

## What's New

Facilitating a game no longer needs the server. Creating a game, reading the night script, and stepping through the phases all happen on the device, and a refresh in the middle of a game returns to the same phase instead of a blank page. The narrator preview in the role builder updates instantly from local logic. Browsing roles, validating a draft, and saving a role still use the server until Phase 05.

## Problem

The app cannot run a game without a network connection. Six places in the frontend still call the Python backend: game creation, loading a game, loading its night script, starting it, advancing its phase, and the narrator preview. Phase 04a delivered the local logic, but a facilitator with no connection still gets an error at "Start Game". A separate sharp edge: refreshing the facilitator page today reloads the game from the server, and with an in-memory engine that path would lose the game entirely.

## Objective

Route those six call sites through the engine, persist the in-progress game in session storage so navigation and refresh both work, and prove the full game flow end to end without a game request leaving the browser.

## Scope

### In Scope

- **Transport-to-engine adapters** outside `src/engine/`, in a new `src/adapters/` directory: a role list item merged with its detail response to `EngineRoleInput`, role list items to `RoleDependencyInput`, and `RoleDraft` to `EngineRoleInput` for preview. The list item supplies name, team, wake order, counts, primary-team flag, and dependencies. The detail response supplies only ability steps and wake target. The adapter treats a null `ability_type` on a persisted step as unknown so the engine skips it. An absent or null `wake_target` in the detail response both become null in the engine input. An absent or null `wake_order` on the list item both become null.
- **Role detail fetch**: a `getById` method on the roles client calling `GET /roles/{id}`. The transport `Role` type stays as declared, because the list item already carries the counts, primary-team flag, and dependencies. At "Start Game" the wake-order page fetches each distinct selected role in parallel and surfaces one error banner if any fetch fails.
- **Game session store**: a `sessionStorage`-backed module keyed by game id that stores the engine session and the adapted role inputs together. Reads return null for a missing or unparseable entry. The facilitator page reads by the id in the URL and shows "Game not found" with a link to game setup when the entry is missing. One entry per game id. The app never removes an entry, so the tab's lifetime is the cleanup. A second game in the same tab gets a new id and a new entry. A completed game keeps its entry so a refresh still shows the completed view. The stored role inputs are a snapshot, so editing a role after the game starts does not change the running game.
- **Call-site replacement**: game creation on the wake-order page, game load and night script in the game hooks, start and advance on the facilitator page, and the narrator preview in the role builder. The night script is built on demand from the stored role inputs and the session's wake order sequence. Start and advance write the new session back to the store before the page re-renders.
- **Wake order**: the page-level in-group shuffle from Phase 3.6 stays and its flattened result is always passed to the engine as the custom sequence, including when only one role wakes.
- **Router state guard**: a runtime type guard on the setup payload the wake-order page reads from router state, redirecting to game setup when the shape is wrong.
- **Setup warnings**: the warnings the engine returns from setup validation render as an informational list on the facilitator's setup view.
- **Deletion**: the games API client, its test file, and the game-session mock builders no longer used by any test.
- **Test updates**: page tests for the wake-order, facilitator, and role builder pages, the routes test, the game hook tests, the roles client test, and shared mocks.
- **Manual QA document** covering the full game flow, refresh, and preview.

### Out of Scope

- Any change to the Python backend. Its game routes stay for cloud use.
- Role validation, name check, role save, and the role catalog fetch. These stay on the server until Phase 05.
- Persisting the script reader's current action across refresh. Refresh returns to the night phase at the first action.
- Dealing roles or tracking positions. The engine does not port these, per the Phase 04a decision.
- Changing engine semantics, including tie-breaking and the start-before-advance rule.
- A local role catalog. Phase 05.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Adapters, store, role detail fetch | Pure adapter functions, the session store module, `rolesApi.getById` | adapters, storage, api |
| 2 | Local game flow | Wake-order page creates locally, hooks read the store, facilitator starts and advances locally, games client deleted | pages, hooks, tests |
| 3 | Local narrator preview | Role builder preview built by the engine from the draft | pages, adapters |
| 4 | Offline flow integration | Automated integration evidence, deleted-path verification, and the phase-required manual QA checklist | verification, documentation |

## Technical Context

- **Call sites**: `src/pages/WakeOrderResolution.tsx:122` (create), `src/hooks/useGame.ts:14` (load) and `:43` (script), `src/pages/GameFacilitator.tsx:211` (advance) and `:222` (start), `src/pages/RoleBuilder.tsx:39` (preview).
- **Engine surface**: `createGameSession`, `startGame`, `advancePhase` in `src/engine/gameSession.ts`; `buildNightScript`, `buildPreview`, `totalDurationSeconds` in `src/engine/narration.ts`; input types in `src/engine/types.ts`. `createGameSession` takes an injected id generator, so the adapter layer supplies `crypto.randomUUID`.
- **Data gap**: `RoleListItem` in `src/types/transport.ts` omits `ability_steps` and `wake_target` by backend design but carries `min_count`, `max_count`, `is_primary_team_role`, and `dependencies`. `GET /roles/{id}` returns the steps and wake target. The adapter merges the two per role.
- **Import boundary**: `eslint.config.js` forbids `src/engine` and `src/domain` from importing `types`, `api`, `hooks`, `components`, or `pages`. Adapters live outside both and may import from all of them.
- **Existing handoff**: `useGameSetup` builds a `WakeOrderRouterState` and `GameSetup.tsx:108` navigates with it. The consumer casts `location.state` with no runtime check.
- **Facilitator consumption**: the facilitator reads `phase`, `player_count`, `center_card_count`, `discussion_timer_seconds`, all present on the engine session. `ScriptReader` reads only `script.actions`.
- **Tests**: page and hook tests mock `../../api/games` with `vi.mock`. Those mocks go away with the client. `src/test/mocks.ts` holds `createMockGameSession` and `createMockNightScript` built on the server shapes.
- **Learnings to honor**: an optional TypeScript property does not model a runtime null, so the adapters need null-input tests. Keep the Phase 3.6 shuffle at page level and never expect the engine default to shuffle.

## Edge Cases & Failure Modes

- **Role detail fetch fails for one role**: no session is created, the error banner shows, and the button re-enables.
- **Engine rejects setup**: the engine's validation message renders in the error banner. Phase 04a already pins these messages to the Python wording, so no separate comparison is needed here.
- **Refresh during night, discussion, voting, or resolution**: the page reloads the session from the store at the same phase. The night script rebuilds identically because the role inputs and sequence are stored.
- **Direct navigation to an unknown game id**: "Game not found" with a link to game setup, no exception.
- **Corrupt store entry**: treated as missing.
- **Session storage unavailable or full at creation**: creation fails with a visible error rather than navigating to a page that cannot load.
- **Store write fails at start or advance**: the facilitator shows the error banner and keeps the previous phase rendered.
- **Role edited after the game started**: the running game keeps its stored snapshot. Intended, no catalog reconciliation.
- **Malformed router state on the wake-order page**: redirect to game setup, as the null case does today.
- **Preview of a draft with no wake order**: empty preview, as the server returned.
- **Preview of a draft mid-edit with an unknown ability type**: the step is skipped, no error.
- **Two tabs**: session storage is per tab, so a game is visible only in the tab that created it. Accepted for this phase.

## Dependencies & Risks

- **Dependency**: the Phase 04a engine contract and the Phase 3.6 wake order helpers stay stable.
- **Risk**: the adapter drifts from what the backend actually returns for `GET /roles/{id}`. Mitigation: adapter tests use a fixture captured from a real response, and the manual QA runs against seed roles.
- **Risk**: a page test keeps a path to the server through a leftover mock and the no-games-request criterion passes vacuously. Mitigation: enforce the guard in the shared axios mock in `src/test/setup.ts`, which is the only HTTP layer the tests can observe.
- **Risk**: the store is a throwaway for Phase 05 and could grow. Mitigation: one module, one key scheme, no business logic inside it.
- **Risk**: deleting the games client breaks a test that imported it indirectly. Mitigation: the full suite and the ESLint run are acceptance gates.

## Success Criteria

- [ ] A full game completes with no `/games` request. The automated no-games guard is green. The browser network check remains pending in `PHASE_04B_QA.md`.
- [x] Automated page tests cover refresh recovery for setup, night, discussion, voting, resolution, and complete. Night refresh resets to the first locally rebuilt action.
- [x] The automated engine and hook suites verify the seed-role night script against the Phase 04a fixture for the chosen sequence.
- [x] RoleBuilder tests verify local preview output and continued server validation. The shared request guard rejects `/roles/preview-script`.
- [x] Wake-order tests verify engine validation failures remain visible and prevent game creation.
- [x] Facilitator tests verify setup warnings render when present and remain absent when empty.
- [x] Wake-order tests verify malformed router state redirects to game setup.
- [x] Facilitator tests verify an unknown game id shows "Game not found" with a setup link.
- [x] The roles client detail method is covered. The games client, its test, and unused game mocks are absent from frontend source.
- [x] Facilitator tests verify a completed game survives refresh and retains its complete view.
- [x] Wake-order tests verify detail-fetch failure shows an error, creates no game, and re-enables the action.
- [x] Wake-order and facilitator tests verify storage failures show an error and preserve the prior visible state.
- [x] The manual QA document exists at `docs/phases/PHASE_04B/PHASE_04B_QA.md` and all manual rows remain pending until execution.
- [x] Adapter tests cover absent and null `wake_target`, absent and null `wake_order`, null `ability_type`, and an empty step list.
- [x] ESLint passes with zero warnings and no file under `src/engine/` changed.
- [x] Global frontend coverage remains above the 80 percent threshold.

Automated evidence is recorded in `dev/test-results/04-offline-flow-integration/`. Manual network, browser, and storage checks remain pending.

## Verification Status

| Area | Status | Evidence |
|---|---|---|
| Focused integration suites | Complete | `dev/test-results/04-offline-flow-integration/affected.json`: 229 tests passed, 0 failed. |
| Full frontend suite | Complete | `dev/test-results/04-offline-flow-integration/full.json`: 685 tests passed, 0 failed. |
| Coverage | Complete | `dev/test-results/04-offline-flow-integration/coverage/coverage-summary.json`: 92.32% lines/statements, 93.01% functions, 94.46% branches. |
| Lint and build | Complete | `dev/test-results/04-offline-flow-integration/lint-final.json` has 0 errors and 0 warnings. `build.log` records a successful build. |
| Deleted-path and protected-path checks | Complete | No games or preview client references remain under `yourwolf-frontend/src`. No backend, engine, or domain files changed. |
| Manual browser QA | Pending | Follow `PHASE_04B_QA.md`. No manual checks have been executed in this phase run. |

## QA Considerations

- This phase changes user-facing flow, so `PHASE_04B_QA.md` provides the required manual checklist. It includes the offline check: stop the backend after loading the role list and details, then complete a game.
- Automated QA is the no-games-request guard, the adapter tests, and the updated page tests.
- Affected suites: wake-order page, facilitator page, role builder page, routes, game hooks, roles client, shared mocks.

## Notes for Phase - Execute

Suggested decomposition: **(1)** adapters, store, and role detail fetch → **(2)** local game flow and games client deletion → **(3)** local narrator preview.

- Feature 1 lands first and is pure enough to test without React. It owns the null-handling tests.
- No-games-request guard. Suggested implementation shape, to be verified by Phase - Execute against current code and tests: the app uses axios, not `fetch`, and `src/test/setup.ts` already replaces axios with stub methods. Make those stub `get` and `post` methods throw on any `/games` path, so every page and hook test enforces the criterion without a dedicated test.
- Feature 2 owns the router state guard, the parallel detail fetch on Start Game, the store reads in the hooks, and the deletion. Keep the facilitator's phase views unchanged and swap only the data source.
- Feature 3 is independent of feature 2 and small. Keep `rolesApi.validate` as is.
- Feature 4 verifies the combined route graph, records automated evidence, and keeps manual checks pending until a browser-capable runner executes them.
- Do not touch `src/engine/` or `src/domain/`. Where an adapter needs a guard the engine lacks, put it in the adapter and test it there.
- Land as one pull request.
