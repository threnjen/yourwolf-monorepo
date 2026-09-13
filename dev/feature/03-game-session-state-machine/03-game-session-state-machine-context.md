# 03 Game Session State Machine — Context

## Key Files

### Files to create

| Path | Role | Change type |
|------|------|-------------|
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSession.ts` | Local readonly in-memory session value and pure create, start, and advance operations. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSetupValidation.ts` | Ordered setup-rule evaluation over caller-supplied engine roles and dependency data. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSession.test.ts` | State-machine, immutability, and injected-id verification. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` | Transcribed 32-case setup-validation oracle and warning/error checks. | Create |

### Read-only references

| Path | Role | Change type |
|------|------|-------------|
| `yourwolf-frontend/src/engine/types.ts` | Verified readonly `EngineRoleInput`, `EngineAbilityStepInput`, and narration output contracts from Feature 01. | Read-only reference |
| `yourwolf-frontend/src/engine/narration.ts` | Completed Feature 02 sibling module. It is narration-only and has no session dependency. | Read-only reference |
| `yourwolf-frontend/src/test/engine/templates.test.ts` | Existing Feature 01 engine test and phase coverage anchor. | Read-only reference |
| `yourwolf-frontend/src/test/engine/narration.test.ts` | Existing Feature 02 engine test and fixture-shape anchor. | Read-only reference |
| `yourwolf-frontend/src/domain/teams.ts` | Source of the verified team vocabulary used by `EngineRoleInput`. | Read-only reference |
| `yourwolf-frontend/src/domain/wakeOrder.ts` | Existing wake-order filtering and Phase 3.6 sequence semantics. | Read-only reference |
| `yourwolf-frontend/src/types/game.ts` | Existing transport `GamePhase`, `GameSessionCreate`, and `GameSession` names. Engine code must not import this module. | Read-only reference |
| `yourwolf-frontend/src/types/transport.ts` | Existing transport DTO layer. Engine code must not import transport types. | Read-only reference |
| `yourwolf-frontend/eslint.config.js` | Existing pure-engine import boundary and raw import-pattern behavior. | Read-only reference |
| `yourwolf-frontend/vite.config.ts` | Existing Vitest collection and v8 coverage configuration. | Read-only reference |
| `yourwolf-backend/app/services/game_setup_validation.py` | Python source for validation order, exact errors, normalized wake sequences, and warnings. | Read-only reference |
| `yourwolf-backend/tests/test_game_setup_validation.py` | 32-method setup-validation oracle, including the duplicated method name in two independent classes. | Read-only reference |
| `yourwolf-backend/app/services/game_service.py` | Python phase order and start/advance behavior reference. Shuffle, dealing, persistence, timestamps, and counters are excluded from this port. | Read-only reference |
| `yourwolf-backend/tests/test_game_service.py` | Existing start and advance assertions, including exact start and terminal-phase errors. | Read-only reference |
| `yourwolf-backend/app/models/game_session.py` | Verified `GamePhase` values and ORM defaults for setup and current wake order. | Read-only reference |
| `yourwolf-backend/app/models/role.py` | Verified role metadata, team values, primary-role flag, and min/max card fields. | Read-only reference |
| `yourwolf-backend/app/models/role_dependency.py` | Verified `DependencyType.REQUIRES` and `DependencyType.RECOMMENDS` values and dependency field names. | Read-only reference |
| `yourwolf-backend/app/schemas/game.py` | Verified create-field names, scalar schema bounds, response warning field, and transport phase/session shapes. | Read-only reference |
| `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md` | Phase scope, stricter setup transition, non-goals, and fidelity requirements. | Read-only reference |
| `dev/feature/PHASE_04A-execution-manifest.md` | Feature order, supplied verification assets, allowed write scope, and sibling dependency record. | Read-only reference |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| The expected session modules and test files do not exist at `ae43d4f`. The existing engine contains only `types.ts`, `templates.ts`, `narration.ts`, and their Feature 01/02 tests and fixtures. | The proposed session names are genuinely new. No existing session API can be extended, and all four new paths require the `[PROPOSED - name TBD]` marker until implementation selects final names. | Create only the four proposed engine/test files. Preserve the existing Feature 01 and Feature 02 files. |
| `EngineRoleInput` is verified in `yourwolf-frontend/src/engine/types.ts` with `id`, `wake_order`, `team`, `is_primary_team_role`, `min_count`, and `max_count`, plus readonly ability-step data. | The Feature 01 prerequisite is complete and supplies every role field named by this plan. Feature 03 does not need Feature 02 at runtime. | Consume the verified engine contract through the engine layer. Do not redefine role metadata or import transport DTOs. |
| The engine import boundary matches raw import strings. Its `**/types` pattern also matches a same-directory `./types` specifier, while Feature 02 uses `./types.ts` successfully. | A natural extension of an existing engine import can fail lint even though it targets the local file. | Use the established explicit `.ts` specifier for engine-source imports of `types.ts`, then retain a temporary forbidden-import probe as review evidence. |
| `GamePhase`, `GameSessionCreate`, and `GameSession` exist in backend or frontend transport modules, but engine files are forbidden from importing `src/types`. The frontend transport `GameSession` omits `wake_order_sequence` and warnings, while the backend response includes them along with timestamps and `game_roles`. | Reusing the transport `GameSession` would either violate the boundary or lose fields required by AC3/AC5. The engine needs a local phase representation and a local session shape. | Keep the proposed engine session type local. Preserve the six verified phase values, carry the accepted setup sequence and dependency warnings in the engine result shape selected by the implementer, and leave transport types untouched. |
| AC1 names the presence of readonly role values, selected-role dependencies, and an injected id generator but does not name the corresponding input properties. AC3 requires warning text but does not say whether warnings live on the session or in a separate result. | Different property choices would make sibling callers and Phase 04b adapters diverge even when behavior matches. This is a plan completeness gap, not permission to import a second DTO. | Select the smallest local shape that exposes the required values and warning text, record the final public names in the implementation record, and keep every unverified name marked `[PROPOSED - name TBD]` until then. Add shape and warning-propagation tests. |
| `yourwolf-backend/app/schemas/game.py` applies scalar bounds of 3–20 players, 0–5 center cards, and 60–1800 discussion seconds. `validate_game_setup()` itself ports role-count, role-id, card-count, team, dependency, and wake-sequence rules but does not check those schema bounds. | The plan says caller-supplied counts are validated but does not explicitly decide whether the pure engine duplicates the Pydantic boundary. Adding an unplanned schema clone would expand scope, while omitting a required engine boundary would weaken direct callers. | Reconcile this at implementation time and document the chosen boundary. Do not silently add transport validation or claim parity for scalar bounds without tests. Keep the required setup-rule oracle separate from any explicitly approved scalar-bound checks. |
| `test_game_service.py` contains the existing start and advance phase assertions and exact messages, but the plan's traceability matrix names only `game_service.py` and `game_session.py`. | The transition port needs an existing behavior reference, while shuffle, assignment, counters, timestamps, and persistence tests are intentionally out of scope. | Treat `test_game_service.py` as a read-only transition oracle. Transcribe phase behavior and error text only. Do not modify or port excluded side effects. |
| Python `GameService.advance_phase()` permits `setup → night`, but the Phase 04A summary and this plan explicitly require the engine to reject advance from setup. The plan does not specify the new setup-rejection message. | This is a deliberate engine-only tightening, not an accidental parity change. A missing message pin would let future implementations drift while preserving the phase result. | Preserve the verified start error and complete-terminal error. Choose and pin one explicit engine error for advance-from-setup, and document that only this middle transition intentionally differs from Python. Leave backend behavior unchanged. |
| `test_game_setup_validation.py` has 32 test methods. `test_count_rule_precedes_unknown_role_id_check` appears once in `TestGameSetupRulePrecedence` and once in `TestRoleCountMatchesPlayersAndCenter`, covering different seams. | Counting names or deduplicating by method name would drop one precedence contract. | Keep both scenarios in the proposed validation test file, with independent assertions for direct validation and create-boundary precedence. |
| Backend validation resolves duplicate role ids through one role map for metadata but counts the duplicate ids as multiple cards. It evaluates rules in count, unknown-id, card-count, primary-team, dependency, then wake-sequence order. | A map-only port would lose card multiplicity, and a reordered helper chain would change client-visible errors. | Preserve duplicate counts separately from unique role metadata. Keep the ordered checks visibly separate and transcribe exact Python message templates and warning text. |
| Backend dependency validation has distinct hard `requires` errors and soft `recommends` warnings. `DependencyType` values are verified as `requires` and `recommends`. | Merging the two channels would incorrectly reject valid setups or lose advisory text. | Keep separate error and warning paths. Assert both missing-required rejection and missing-recommended success with the exact warning. |
| No frontend source currently imports the engine from a hook, page, API client, or component. Existing UI tests use the transport `GameSession`, and Feature 02 added narration-only code and fixtures. | There are no existing frontend callers or tests to update in 04a. Runtime integration and refresh behavior belong to 04b. | Add new engine-focused tests only. Leave API, hooks, pages, router state, browser storage, and existing UI tests untouched. |
| The supplied phase test pattern is `yourwolf-frontend/src/test/engine/**/*.test.ts`, and the phase manifest recommends separate module-focused files. | A consolidated phase test is not required and would mix validation and transition responsibilities. | Create separate proposed validation and session test files. Do not add a consolidated phase test file. |
| No `PHASE_04A` discovery-context document is present. | The phase input explicitly treats this as no external discovery requirement. | Use the supplied Phase - Execute Environment State and do not create a discovery-context document. |

## Architectural Decisions

- Use pure named functions and readonly values. Do not introduce a stateful session service, repository, event bus, persistence seam, or error hierarchy.
- Keep setup validation in `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSetupValidation.ts` and phase transitions in `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSession.ts`. They mirror separate Python responsibilities and change for different reasons.
- Consume the verified `EngineRoleInput` contract from `yourwolf-frontend/src/engine/types.ts`. Do not import `yourwolf-frontend/src/types/game.ts`, `yourwolf-frontend/src/types/transport.ts`, React, DOM, Node, network, API, hooks, components, pages, or styles.
- Keep these local public names proposed until implementation chooses idiomatic names: `[PROPOSED - name TBD] GameSession`, `[PROPOSED - name TBD] GameSessionCreateInput`, `[PROPOSED - name TBD] RoleDependencyInput`, `[PROPOSED - name TBD] IdGenerator`, `[PROPOSED - name TBD] createGameSession`, `[PROPOSED - name TBD] startGame`, and `[PROPOSED - name TBD] advancePhase`.
- Preserve the verified phase values `setup`, `night`, `discussion`, `voting`, `resolution`, and `complete`. A local engine phase representation is required because transport types are forbidden imports. Any additional public phase symbol remains `[PROPOSED - name TBD]` until implementation records it.
- Preserve the dependency field names `role_id`, `required_role_id`, and `dependency_type`, and the dependency values `requires` and `recommends`, at the engine boundary where they cross the port.
- Preserve validation precedence and the exact Python error/warning text. Count repeated role ids as repeated cards, but resolve role metadata and dependencies against unique ids.
- Treat missing `requires` dependencies as hard errors and missing `recommends` dependencies as non-blocking warnings. Keep the channels separate.
- Keep the engine-local session shape independent from the transport session shape. It must represent the accepted setup state, phase, current wake index, deterministic id, and the warning/sequence information required by AC3/AC5 without importing timestamps, game-role assignments, or wire DTOs.
- Inject only id generation. The engine must not reference the ambient `crypto` global, time, shuffle, or random state.
- Return new session values for successful transitions and preserve the input value without mutation on rejected operations. Start is the only setup exit. Advance moves exactly one phase after night and rejects both setup and complete.
- Keep no normal-path logs. Exact return values and error messages are the observability surface for this synchronous local engine.

## Constraints

- Implementation and test changes are limited to `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/`. Pipeline records and documentation are exempt from that source/test scope.
- Do not modify the Python backend, backend tests, frontend transport types, `src/domain/`, package manifests, `vite.config.ts`, `eslint.config.js`, global coverage thresholds, or unrelated frontend tests.
- Do not implement narration assembly or preview behavior. Feature 02 owns `narration.ts`, script/preview fixtures, and those tests.
- Do not wire hooks, pages, components, routes, API clients, router state, refresh handling, browser storage, Tauri, audio, or manual runtime QA. Phase 04b owns integration and end-to-end checks.
- Do not port role shuffling, player/center position assignment, role usage counters, persistence, timestamps, or dealing. The engine owns only setup validation and phase state.
- Do not import from `src/types`, even with `import type`. Declare or consume the narrow local engine contract instead.
- Do not read ambient `crypto`, `Date`, `Math.random`, or another external provider. Only the id generator is injected, and the engine does not need a shuffle or timestamp provider.
- Preserve the Python six-phase vocabulary, exact setup-rule precedence, exact error/warning wording, duplicate-card counting, primary-team behavior for werewolf/vampire/alien, and wake-sequence rules.
- Preserve omitted wake sequences as absent. Allow an empty sequence only where the source rule permits it, including a selected set with no waking roles.
- Preserve the deliberate tightening that rejects advance from setup. Do not change the Python service to match it.
- Add no normal-path logging, retry, timeout, concurrency, idempotency, persistence, or future-facing routing machinery.
- No Stage 0 test bootstrap is required because the supplied phase baseline is green and existing coverage is above 50 percent.

## Scope Boundaries

- Create only `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSession.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSetupValidation.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSession.test.ts`, and `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts` for this feature.
- Preserve `yourwolf-frontend/src/engine/types.ts`, `yourwolf-frontend/src/engine/templates.ts`, `yourwolf-frontend/src/engine/narration.ts`, and all existing engine tests and fixtures as sibling-owned contracts and evidence.
- Preserve `yourwolf-backend/app/services/game_setup_validation.py`, `yourwolf-backend/app/services/game_service.py`, `yourwolf-backend/app/models/game_session.py`, `yourwolf-backend/app/models/role.py`, `yourwolf-backend/app/models/role_dependency.py`, `yourwolf-backend/app/schemas/game.py`, and their tests as read-only parity sources.
- Do not update frontend API, hook, page, router, or UI tests in 04a. Existing callers continue to use transport DTOs until Phase 04b.
- Do not add an adapter between transport DTOs and engine inputs. Phase 04b owns that boundary.
- Do not change the Phase 04A manifest, phase summary, source lockfiles, or coverage configuration as part of implementation. Pipeline records may be updated by the orchestrator.
- Do not add a consolidated phase test or a manual QA document. Separate engine tests and automated gates are sufficient for this no-caller phase.

## Relationships to Sibling Plans

- Feature `01-engine-types-templates` is complete and is the sole runtime prerequisite. It supplies the verified `EngineRoleInput` metadata contract and pure engine boundary.
- Feature `02-narration-scripts-preview` is complete and shares the `src/engine/` and `src/test/engine/` ownership area, but it has no runtime dependency on session state. Its narration source, tests, and fixtures remain read-only for this feature.
- The manifest schedules Feature 03 third to avoid shared-directory collisions. The dependency graph remains `01 → 02` and `01 → 03`, not `02 → 03`.
- Phase 04b consumes the completed engine APIs and owns transport adaptation, API-call replacement, router-state validation, refresh behavior, and manual game-flow/preview QA.
- Phase 04a intentionally has no integration/bootstrap feature because the engine creates unused, independently callable pure APIs. Runtime integration belongs to Phase 04b.

## Suggested Implementation Order

1. Complete Stage 1 in `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSetupValidation.ts`: settle the local input/dependency/warning shape, port the ordered rules, and add the 32-case oracle in `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts`.
2. Complete Stage 2 in `[PROPOSED - name TBD] yourwolf-frontend/src/engine/gameSession.ts`: define the local immutable session shape, inject ids, implement create/start/advance, and cover transitions in `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/gameSession.test.ts`.
3. Complete Stage 3: verify every edge case and immutability assertion, probe the engine import boundary, inspect scoped coverage, and run the supplied phase gates. Record final choices for every proposed public name in implementation notes.

## Environment State

| Property | Value |
|----------|-------|
| Tech stack | TypeScript 5.3, Vite 5.4, Vitest 2.1 with v8 coverage; Python 3.14 reference implementation |
| Test runner | `cd yourwolf-frontend && npm test -- --run` |
| Test baseline | Frontend `executed-green` at `ae43d4f`: 629 total, 629 passed, 0 failed. Backend oracle `executed-green`: 185 total, 185 passed, 0 failed. |
| Coverage baseline | `cd yourwolf-frontend && npm run test:coverage` passed after Feature 02. `src/engine/` aggregate: 98.8% statements, 96.92% branches, 100% functions, 98.8% lines. |
| Lint | `cd yourwolf-frontend && npm run lint` passed with zero warnings on 2026-09-13. |
| Format | Not configured in `yourwolf-frontend/package.json`. |
| Build | `cd yourwolf-frontend && npm run build` passed on 2026-09-13. |
| Phase-scoped test pattern | `yourwolf-frontend/src/test/engine/**/*.test.ts`; `templates.test.ts` and `narration.test.ts` now exist. Separate module-focused files remain recommended instead of one consolidated file. |
| Allowed implementation scope | `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/` only. Pipeline records and documentation are exempt. |

Fidelity departures: none.

## Relevant Learnings

- From `docs/learnings/cross-phase-decisions.md`: **Phase 04a is split from integration.** The engine lands with no callers. Phase 04b owns API replacement, transport adaptation, router-state validation, refresh behavior, and end-to-end manual QA.
- From `docs/learnings/cross-phase-decisions.md`: **The client engine does not port shuffle, position assignment, or role usage counters.** Those are excluded capabilities, not missing work.
- From `docs/learnings/cross-phase-decisions.md`: **The engine breaks wake-order ties by role name.** Feature 03 does not change narration ordering, but it must not pull the Phase 3.6 shuffle or domain wake-order mutation into session state.
- From `docs/learnings/cross-phase-decisions.md`: **The frontend transport/domain type split is complete.** Domain and engine code must keep dependencies inward and must not import transport DTOs.
- From `docs/learnings/cross-phase-decisions.md`: **`createEmptyDraft()` is the known ambient `crypto.randomUUID()` seam.** Feature 03 must inject id generation and must not repeat that ambient dependency in engine code.
- From `docs/learnings/cross-phase-decisions.md`: **The setup oracle has two intentionally identical test method names in different classes.** Preserve both because one tests the extracted validation seam and one tests the service delegation boundary.
- From `docs/learnings/review-learnings.md`: **Evaluation-order tests must prove the later rule also fails.** Keep multi-violation payloads that make precedence observable, and do not rely on source order alone.
- From `docs/learnings/review-learnings.md`: **Separate hard validation errors from advisory warnings.** A validator with distinct `get_warnings` behavior must not merge soft recommendations into create-time rejection.
- From `docs/learnings/review-learnings.md`: **Reference identity can be load-bearing for no-op paths.** Assert that rejected transitions leave input values unchanged and that successful transitions do not mutate the source session.
- From `docs/learnings/review-learnings.md`: **Coverage does not prove edge-case behavior.** Directly supply duplicate ids, missing/extra/non-waking sequences, null or absent sequences, invalid phases, and missing dependencies.
- From `docs/learnings/review-learnings.md`: **A clean lint run does not prove an import boundary is active.** Probe at least one forbidden import against the engine glob, then remove the probe.
- From `docs/learnings/review-learnings.md`: **A plan-cited test file is not automatically a sufficient oracle.** Use the exact assertions in both `test_game_setup_validation.py` and `test_game_service.py`, and keep expected error text independent from the new implementation.
