# Phase 4a: Client-Side Game Engine

**Status**: Complete
**Depends on**: Phase 3.6 (Wake Order Resolution)
**Estimated complexity**: Medium
**Cross-references**: Python reference implementation in `yourwolf-backend/app/services/narration/`; phase-management reference in `yourwolf-backend/app/services/game_service.py`; follow-on frontend integration in Phase 04b

## What's New

Nothing changes for the user in this phase. The app contains a second implementation of narration, setup validation, and phase progression under `src/engine/`, but no screen calls it until Phase 04b. Narration templates and fixture-covered outputs match Python. Default wake-order ties and setup advancement deliberately differ: the engine breaks ties by role name and requires `startGame()` before `advancePhase()`.

## Problem

The app cannot run a game without a network connection because the frontend still routes night scripts, narrator previews, setup, and phase progression through the Python backend. The client engine supplies the verified local logic, but Phase 04b must integrate it before the offline path exists.

## Objective

Provide a pure TypeScript engine under `src/engine/` for narration, setup validation, and game phase management, with no callers yet. Pinned tables and fixtures verify narration parity. Deterministic wake-order ties and stricter setup advancement are explicit engine contracts rather than Python parity claims.

## Scope

### In Scope
- A `src/engine/` module of pure functions. No React, DOM, Node, network, or persistence dependencies. ESLint boundary rules for this path are already active.
- Engine input and output types. The engine role input carries the Python `RoleScriptInput` fields (`name`, `wake_target`, `ability_steps`) plus the fields the engine needs for filtering, sorting, and setup validation: `id`, `wake_order`, `team`, the primary-team flag, and the minimum and maximum card counts. The engine output types are transcribed from the narration schemas the Python builders return. Script generation, preview, and session creation all take the engine role input. Neither the domain `RoleDraft` nor the transport `PreviewScriptRequest` is an engine input type. Phase 04b adapts both to the engine role input.
- Instruction templates for all 15 ability types, wake instructions for every `wake_target` pattern the Python reference recognizes (`player.self`, `team.werewolf`, `team.alien`, `team.vampire`, the `role.` prefix with underscores rewritten to spaces, and the fallthrough that treats null or any other string as `player.self`), and the step duration map with its default.
- Night script generation: ordered narrator actions from a set of roles and an optional custom wake sequence, including the opening and closing narrator actions and total duration.
- Narrator preview generation from one engine role input, including the section header for `perform_immediately` and `perform_as` steps, and the empty result for roles that do not wake.
- Wake order sorting. Default order is ascending `wake_order`, ties broken by role name. A custom sequence overrides it: roles named in the sequence come first in sequence order, sequence entries that name no role in the game are ignored, a role id repeated in the sequence takes its last position as the Python reference does, and roles the sequence does not name follow in default order.
- Step modifier handling (AND, OR, IF) as the Python builders apply it to instruction text and player-action flags.
- An in-memory game session and phase state machine with three operations: create (setup), start (setup to night), and advance (one step along night → discussion → voting → resolution → complete). Complete is the terminal phase reached by advance, not an operation. Start is the only way out of setup, so the engine is stricter than the Python reference, which lets advance skip start. Start moves the phase and sets the session's current wake index to zero, as the Python reference does. Nothing advances that index in this phase.
- Create takes the setup fields the Python `GameSessionCreate` schema carries (player count, center card count, discussion timer, role ids, optional wake order sequence) plus the engine role inputs and role dependency data for the selected roles, supplied by the caller. It ports the setup validation rules from `game_setup_validation.py` and rejects the first violated rule without creating a session: role count must equal players plus center cards, every role id must be known, per-role card counts must respect the role's minimum and maximum, primary team rules, role dependencies with the same warnings the Python returns, and a wake order sequence with no duplicates that names only selected roles. `tests/test_game_setup_validation.py` is the oracle, transcribed.
- Engine boundary hardening called for in `docs/learnings/cross-phase-decisions.md`: id generation is injected rather than read from the ambient `crypto` global, and any domain step-editing helper the engine calls directly gets index-bounds and first-step guards at the engine boundary, tested.
- A parity test suite under `src/test/engine/` that transcribes the Python narration template tables, the script service tests, and the setup validation tests, plus two fixtures generated once from the Python narration builders and committed as data in the same directory: a night-script fixture for the 30 seed roles, and a preview fixture produced by converting each seed role to the engine role input, including the roles whose expected preview is empty.

### Out of Scope
- Replacing any API call site. Hooks, pages, and API clients are untouched. That is Phase 04b.
- Refresh, session identity, or routing behavior for in-memory games, including runtime validation of the wake-order router state noted in `docs/learnings/cross-phase-decisions.md`. Phase 04b owns these, because they live at the call sites.
- Porting the start-game role shuffle, player and center position assignment, and role usage counter. The facilitator UI renders none of these, players hold physical cards, and the usage counter is a server statistic.
- Data persistence (Phase 05), Tauri (Phase 06), audio narration (Phase 07).
- Any change to the Python backend, including the deferred `schemas/narration.py` move.
- Any change to narrator copy. The frozen "Werewolfs" inconsistency is reproduced, not fixed.
- Changing `src/domain/` semantics. Guards are added at the engine boundary, not inside domain helpers the UI depends on.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Engine types and templates | Input and output types built on `src/domain/` shapes, plus the 15 instruction templates, wake instructions, and step durations, with the transcribed 67-case oracle | Types, templates, parity tests |
| 2 | Script generator and preview | Night script assembly, wake order sorting with custom sequence, modifier handling, narrator preview with section headers, and the night-script and preview parity fixtures | Script builder, preview, fixture tests |
| 3 | Game session state machine | In-memory session with create (ported setup validation), start, advance, and injected id generation, with the transcribed validation oracle | State machine, validation, tests |

## Technical Context

- **Primary source to port**: `yourwolf-backend/app/services/narration/`. `templates.py` holds `STEP_DURATIONS`, `build_step_instruction()`, `build_wake_instruction()`, and `get_step_duration()`. `script_builder.py` holds `build_role_script()`, `build_night_script_actions()`, `build_preview_actions()`, and `total_duration_seconds()`. The package is free of DB, ORM, and session access but imports two Pydantic output schemas, `NarratorAction` from `schemas/game.py` and `NarratorPreviewAction` from `schemas/role.py`. The engine needs equivalent TypeScript output types.
- **Input contract**: `app/services/narration/inputs.py` defines `RoleScriptInput` and `AbilityStepInput` with field names chosen for one-for-one transcription. Start here.
- **Filters that live outside the package**: `script_service.py` excludes roles with `wake_order` null or zero before calling the builders, and returns an empty preview for such roles. The engine must apply these filters itself.
- **Phase management reference**: `game_service.py` defines `PHASE_ORDER` and the advance and start rules. `game_setup_validation.py` holds the setup validation rules that create ports, and `tests/test_game_setup_validation.py` holds their 32 tests. `app/models/game_session.py` defines `GamePhase`.
- **Seed roles**: the 30 seed roles live in `yourwolf-backend/app/seed/data/roles.json` as static data with no ids. Ids are assigned at seed time, so role name is the only stable identity across environments. The seed data ties `wake_order` heavily (eight roles at 4, five each at 1 and 2). The Python default path orders by `wake_order` alone and leaves ties to the database, and `src/domain/wakeOrder.ts` shuffles within a group. Neither is reproducible, so the engine breaks ties by role name and the fixture generator sorts the same way before calling the builders. The generator assigns each seed role a deterministic id derived from its name so custom-sequence fixtures can name roles.
- **Test location**: frontend tests live under `src/test/`, mirroring the source tree. Engine tests and fixture data go in `src/test/engine/`. Vitest coverage uses the v8 provider with global thresholds of 80 percent and no per-directory threshold.
- **Parity oracle**: `tests/test_narration_templates.py` holds `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES`, 67 literal cases validated against the pre-refactor implementation. `tests/test_script_service.py` covers assembly behavior. Both are transcribed, never regenerated.
- **Frontend domain layer to build on**: `src/domain/teams.ts`, `roleDraft.ts` (`StepModifier`, `RoleDraft`, `AbilityStepDraft`), `wakeOrder.ts` (grouping and flattening with injectable RNG), `abilitySteps.ts`, `roleSelection.ts`, `constants.ts`.
- **Types the engine may not import**: `src/types/transport.ts` and `src/types/game.ts`. `eslint.config.js` blocks `src/engine/**` from importing React, `api`, `hooks`, `components`, `pages`, `styles`, and `types`. Phase 04b owns any adapter between transport DTOs and engine types.
- **Known domain-layer sharp edges** (from `docs/learnings/cross-phase-decisions.md`): `createEmptyDraft()` reads the ambient `crypto.randomUUID()`; `setStepModifier` can violate the first-step invariant that `renumberSteps` owns; `moveStepUp` and `moveStepDown` corrupt the list on out-of-range indices and are safe only behind UI guards. The engine treats the invariant as owned by `renumberSteps` and guards at its own boundary.
- **Frozen copy**: `_thumbs_up_instruction` renders `team.werewolf` as "Werewolfs" while the wake instruction says "Werewolves". Reproduce it.

## Edge Cases & Failure Modes

- **Role with no ability steps**: still produces wake and close-eyes actions.
- **`wake_order` null or zero**: excluded from the night script and yields an empty preview.
- **Unknown ability type**: the step is skipped. It adds no action and contributes no duration to the total. The default duration applies only when a recognized step's type has no entry in the duration map.
- **No waking roles**: the script still has the opening and closing narrator actions.
- **`OR` modifier**: prefixes "OR " to the instruction and sets `requires_player_action` true. Both preserved.
- **Custom sequence naming a role not in the game**: the entry is ignored.
- **Custom sequence repeating a role id**: the role takes its last position in the sequence. Create rejects such a sequence, so this is reachable only by calling the sorter directly, and a test pins it.
- **Waking roles the custom sequence does not name**: the Python reference sorts these after the named roles in incidental database row order, which the port must not reproduce. The engine orders unnamed roles by `wake_order`, then role name. The custom-order fixture is generated only from sequences that name every waking role, so it never depends on the incidental ordering.
- **Ties in default wake order**: broken by role name, in the engine and in the fixture generator.
- **Invalid setup on create**: each ported validation rule rejects with the message the Python raises, and no session is created.
- **`wake_target` value outside the recognized set**: for example `team.village`, treated as `player.self`, matching the Python fallthrough.
- **`role.` wake target**: the role name is extracted from the pattern with underscores rewritten to spaces.
- **Duplicate role instances**: one script block per unique role.
- **Wake target null**: treated as `player.self`.
- **State machine misuse**: starting a game not in setup, advancing a game still in setup, or advancing past complete, is rejected without mutating state. The first and last mirror the Python errors. The middle is a deliberate tightening; note it in the implementation record.
- **Deterministic ids**: with an injected id generator the same inputs yield the same session, so snapshot tests are stable.

## Dependencies & Risks

- **Dependency**: Phase 3.6 wake order sequence semantics in `src/domain/wakeOrder.ts` must stay stable.
- **Risk**: translation drift between Python and TypeScript. Mitigation: transcribe the oracle tables literally, and generate the night-script and preview fixtures once from the seed JSON through the Python narration builders, committed as data, so seed-role parity is checked without a running server.
- **Risk**: engine types drift from the transport DTOs Phase 04b must adapt. Mitigation: engine types are transcribed from the Python input dataclasses, which the transport DTOs already mirror. Record any field-name divergence in the phase discovery context for 04b.
- **Risk**: the engine ships with no callers, so nothing exercises it at runtime. Mitigation: coverage and parity criteria below are the acceptance gate, and 04b follows immediately.

## Success Criteria

Implementation and verification cover the criteria below. Paired coverage, redundancy analysis, flake analysis, and mutation-tested regression guards complete the phase-close evidence.

- [x] All 67 transcribed template cases pass, including the frozen "Werewolfs" output.
- [x] Night scripts for all 30 seed roles match the committed Python-generated fixture exactly, in default wake order with ties broken by role name, and in custom sequences that name every waking role.
- [x] Unnamed roles under a partial custom sequence sort by `wake_order` then role name, a repeated id takes its last position, an entry naming no role is ignored, and a test pins each.
- [x] Preview output for each seed role, converted to the engine role input, matches the committed Python-generated preview fixture exactly, including section headers and the empty results.
- [x] Every enumerated `wake_target` pattern, the `role.` underscore rewrite, and the unknown-string fallthrough have a test.
- [x] Roles with `wake_order` null or zero are excluded from scripts and produce an empty preview.
- [x] The state machine walks setup → night → discussion → voting → resolution → complete and rejects invalid transitions without state change. Start sets the current wake index to zero.
- [x] All 32 transcribed setup validation cases pass against create, and create returns the Python warnings for satisfied-with-warning dependencies.
- [x] Id generation is injectable and the engine has no reference to the ambient `crypto` global.
- [x] ESLint boundary rules pass with zero warnings for `src/engine/**`.
- [x] Unit test coverage for `src/engine/` is at least 90 percent for lines, branches, functions, and statements, as read from the `src/engine/` rows of the `vitest run --coverage` report. The global 80 percent threshold is unchanged.
- [x] Every edge case above has a test.
- [x] No source, test, configuration, or fixture file outside `src/engine/` and `src/test/engine/` changes. Pipeline records under `dev/` and documentation under `docs/` are exempt. The parity fixture data lives in `src/test/engine/`.

## QA Considerations

- No UI changes. No manual QA document is required for this phase.
- Automated QA is the parity suite and the ESLint boundary check.
- Phase 04b carries the end-to-end manual QA for game flow and preview.

## Notes for Phase - Execute

Suggested decomposition, one feature per deliverable: **(1)** types and templates → **(2)** script generator and preview → **(3)** game session state machine.

- Feature 1 must land first. Both the script generator and preview depend on the templates, and the oracle tables are the definition of done for it.
- Feature 2 owns both parity fixtures. Generate them with a throwaway Python script that loads `app/seed/data/roles.json`, assigns each role a deterministic id derived from its name, sorts by `wake_order` then name, and calls the narration builders directly, with no database. Commit the resulting data under `src/test/engine/` and do not commit the generator. The preview fixture input is each seed role converted to the engine role input.
- Feature 3 depends on the engine role input type from feature 1 and on nothing from feature 2. It takes an injected id generator and nothing else that is random. The setup validation port is the bulk of its work, and the 32-case Python suite is its definition of done.
- Do not touch `src/domain/` helper semantics. Where the engine needs a guard the domain helper lacks, add it in the engine and test it there.
- Do not add an adapter from `src/types` DTOs. That is Phase 04b work and the ESLint rule will reject it here.
- This phase should land as one pull request with no source, test, configuration, or fixture changes outside `src/engine/` and `src/test/engine/`.
