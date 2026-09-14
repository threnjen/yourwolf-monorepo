# Phase 04A blast-radius review

- revision reviewed: `aa8c4814fa92395e75efd21d6764da0c4493e257..989a3591b57b4d341286b55d295415af5d1af6a4`
- changed-file source: `dev/feature/changed-files.txt`
- diff source: `dev/feature/range.diff`
- verdict: **incomplete coverage**

The four new engine suites and the existing full suites are green, but no application caller or transport-to-engine integration path reaches the new exports. The findings below are limited to that outward blast radius.

## Checks performed

| Check | Evidence | Result |
|---|---|---|
| Graph change and flow analysis | Head `989a3591b57b4d341286b55d295415af5d1af6a4`; `detect_changes` reported 22 possible test gaps, `get_affected_flows` reported 0 flows, and `get_impact_radius` reported 0 impacted nodes | Complete |
| Caller and name-reference scan | Repository scan found engine imports only under `yourwolf-frontend/src/test/engine/`; existing pages and API clients still import domain or transport types | Complete |
| Existing test evidence | Engine suites: 4 files and 144 tests. Full frontend: 46 files and 679 tests. Full backend: 492 tests. Evidence: `dev/feature/PHASE_04A-execution-manifest.md:16-23,146-148` and `dev/feature/PHASE_04A-phase-close/03k-reviewer-test-falsification-report.md:58-65` | Complete |
| DTO, schema, and cross-boundary trace | Frontend transport types, router state, API callers, backend schema/service, and engine inputs were compared at the cited locations below | Complete |

## Findings

### BR-001 — New engine exports have no production caller or end-to-end coverage

severity: medium  
lane: blast-radius  
evidence:

- The added public functions are `createGameSession`, `startGame`, and `advancePhase` in `yourwolf-frontend/src/engine/gameSession.ts:48-104`, `validateGameSetup` in `yourwolf-frontend/src/engine/gameSetupValidation.ts:27-107`, and script/preview builders in `yourwolf-frontend/src/engine/narration.ts:49-180`.
- `get_affected_flows` found zero affected runtime flows, and the repository scan found no imports of these modules from `src/pages`, `src/hooks`, `src/api`, or the backend. The only imports are the new focused engine tests.
- The actual setup path still gates only on selected-card totals in `yourwolf-frontend/src/hooks/useGameSetup.ts:30-60`, passes router state through `yourwolf-frontend/src/pages/WakeOrderResolution.tsx:118-129`, and calls `gamesApi.create`. The facilitator still calls `gamesApi.start` and `gamesApi.advancePhase` in `yourwolf-frontend/src/pages/GameFacilitator.tsx:208-228`.
- `yourwolf-frontend/src/test/pages/WakeOrderResolution.test.tsx:257-281` verifies a mocked `gamesApi.create`, while `yourwolf-frontend/src/test/pages/GameFacilitator.test.tsx:162-180,210-228,242-260` verifies mocked API calls. These suites do not execute the engine through an application path.
- No Phase 04b adapter, integration, or manual game-flow suite ran in this revision. The execution manifest records no manual QA and places end-to-end game-flow and preview checks outside this phase at `dev/feature/PHASE_04A-execution-manifest.md:177-179`.

reviewer: 03j-reviewer-blast-radius

### BR-002 — Existing role DTOs do not have a tested conversion to the engine contract

severity: medium  
lane: blast-radius  
evidence:

- `EngineRoleInput` requires `wake_target`, `ability_steps`, `wake_order: number | null`, counts, and primary-team metadata at `yourwolf-frontend/src/engine/types.ts:5-24`.
- The list DTO used by setup, `RoleListItem`, has counts and primary metadata but no `wake_target` or `ability_steps` at `yourwolf-frontend/src/types/transport.ts:94-110`. The full `Role` has `wake_target` and `ability_steps` but no `min_count`, `max_count`, or `is_primary_team_role` at `yourwolf-frontend/src/types/transport.ts:42-59`. Its dependency entries also lack the engine-required `role_id` at `yourwolf-frontend/src/types/transport.ts:86-92`.
- Existing setup mocks represent a non-waking role by omitting `wake_order`: `createMockOfficialRole` converts `null` to `undefined` at `yourwolf-frontend/src/test/mocks.ts:63-83`. The engine’s `uniqueWakingRoles`, wake-sequence validation, and preview guard reject `null` or non-positive numbers but do not reject `undefined` at `yourwolf-frontend/src/engine/narration.ts:33-43`, `yourwolf-frontend/src/engine/gameSetupValidation.ts:187-200`, and `yourwolf-frontend/src/engine/narration.ts:159-162`.
- Therefore, a direct or partial mapping that forwards an omitted transport `wake_order` can admit a non-waking role into narration and can require that same role in a custom sequence. Current engine helpers and parity fixtures construct explicit `null` values, such as `yourwolf-frontend/src/test/engine/narration.test.ts:29-44,213-216`, so this transport representation is not covered.
- No adapter or caller test exercises the conversion. The duplicate public names `GameSession`, `GamePhase`, and `NarratorAction` also describe separate engine and transport shapes in `yourwolf-frontend/src/engine/gameSession.ts:10-36`, `yourwolf-frontend/src/engine/types.ts:27-40`, and `yourwolf-frontend/src/types/game.ts:1-58`, while `yourwolf-frontend/src/api/games.ts:1-32` remains bound to the transport versions.

reviewer: 03j-reviewer-blast-radius

### BR-003 — Engine and backend phase advancement have different setup behavior without a cross-boundary assertion

severity: medium  
lane: blast-radius  
evidence:

- The added engine rejects `advancePhase` from `setup` at `yourwolf-frontend/src/engine/gameSession.ts:89-98`.
- The existing backend service checks only the terminal `complete` phase before advancing at `yourwolf-backend/app/services/game_service.py:165-180`; it does not reject `setup`, so its phase table permits a setup-to-night advance.
- The current UI uses a separate `gamesApi.start` call before later `gamesApi.advancePhase` calls at `yourwolf-frontend/src/pages/GameFacilitator.tsx:208-228`, so no current application path compares these semantics.
- `yourwolf-frontend/src/test/api/games.api.test.ts:92-103` asserts only the advance URL and a mocked response phase. Backend advancement tests begin from a started game at `yourwolf-backend/tests/test_game_service.py:196-225`. The green suites therefore do not detect a behavior change if a future caller substitutes the engine transition for the API call or reaches the API while still in setup.

reviewer: 03j-reviewer-blast-radius

### BR-004 — Engine setup values are broader than the backend schema and have no boundary test

severity: medium  
lane: blast-radius  
evidence:

- The backend create schema constrains `player_count` to 3–20, `center_card_count` to 0–5, and `discussion_timer_seconds` to 60–1800 at `yourwolf-backend/app/schemas/game.py:11-18`.
- The new engine input exposes those fields as unconstrained `number` values at `yourwolf-frontend/src/engine/gameSetupValidation.ts:11-18`. `validateGameSetup` checks only that `role_ids.length` equals their sum at `yourwolf-frontend/src/engine/gameSetupValidation.ts:30-35`, and `createGameSession` copies the values unchanged at `yourwolf-frontend/src/engine/gameSession.ts:60-68`.
- All engine setup fixtures use in-range values (`5`, `3`, and `300`) at `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:86-95` and `yourwolf-frontend/src/test/engine/gameSession.test.ts:63-74`; no engine or integration suite exercises the backend lower and upper bounds.
- Because no caller or adapter currently validates this seam, a future direct engine caller can construct a session state that cannot be represented by the existing `/games` request schema while all current parity and API-mock suites remain green.

reviewer: 03j-reviewer-blast-radius

## Checks Not Run

| Check | Expected evidence | Reason not run | Follow-up |
|---|---|---|---|
| Transport-to-engine adapter and real caller coverage | A test exercising `GameSetup` → wake-order state → engine validation/session/narration → facilitator output | No adapter or production engine caller exists in the reviewed head; the execution manifest records this boundary as absent | Run when the integration path is introduced |
| End-to-end game-flow and preview smoke | Browser or equivalent integration evidence over setup, wake order, night script, and phase transitions | No Phase 04b integration/manual suite ran in this revision | Run the Phase 04b flow against real DTOs and API responses |

## Conclusion

The existing test evidence is green for the new pure modules and for the unchanged API-backed UI, but it does not establish the outward contracts between them. The report remains incomplete until a caller/adapter path is exercised, especially for optional wake-order values, phase-transition behavior, and backend setup bounds.
