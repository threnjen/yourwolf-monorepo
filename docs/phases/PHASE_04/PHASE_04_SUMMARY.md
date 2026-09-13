# Phase 4a: Client-Side Game Engine

**Status**: Planned
**Depends on**: Phase 3.6 (Wake Order Resolution)
**Estimated complexity**: Medium
**Cross-references**: Python reference implementation in `yourwolf-backend/app/services/narration/`; phase-management reference in `yourwolf-backend/app/services/game_service.py`; follow-on frontend integration in Phase 04b

## What's New

Nothing changes for the user in this phase. The game logic that today runs on the server gains a second, identical implementation inside the app, sitting unused until Phase 04b wires the screens to it. The payoff arrives in 04b, when running a game and previewing a role stop needing a server.

## Problem

The app cannot run a game without a network connection. Night script generation, narrator preview, and game phase progression all live in the Python backend, so the offline-first product the roadmap describes is impossible until that logic exists on the client. Every downstream MVP phase, local storage, desktop, narration, and mobile, is blocked on it.

## Objective

Port the narration package and game phase management from Python to a pure TypeScript engine under `src/engine/`, proven identical to the Python output by the existing pinned test tables, with no callers yet.

## Scope

### In Scope
- A `src/engine/` module of pure functions. No React, DOM, Node, network, or persistence dependencies. ESLint boundary rules for this path are already active.
- Engine input and output types transcribed from the narration input dataclasses and the narration schemas the Python builders return.
- Instruction templates for all 15 ability types, wake instructions for every `wake_target` pattern the Python reference recognizes (`player.self`, `team.werewolf`, `team.alien`, `team.vampire`, the `role.` prefix with underscores rewritten to spaces, and the fallthrough that treats null or any other string as `player.self`), and the step duration map with its default.
- Night script generation: ordered narrator actions from a set of roles and an optional custom wake sequence, including the opening and closing narrator actions and total duration.
- Narrator preview generation from a draft role, including the section header for `perform_immediately` and `perform_as` steps, and the empty result for roles that do not wake.
- Wake order sorting with custom sequence override, matching the Python behavior for missing and duplicate role ids.
- Step modifier handling (AND, OR, IF) as the Python builders apply it to instruction text and player-action flags.
- An in-memory game session and phase state machine with three operations: create (setup), start (setup to night), and advance (one step along night → discussion → voting → resolution → complete), plus a wake-index tracker. Complete is the terminal phase reached by advance, not an operation. Start is the only way out of setup, so the engine is stricter than the Python reference, which lets advance skip start. Start is a phase transition only.
- Engine boundary hardening called for in `docs/learnings/cross-phase-decisions.md`: id generation is injected rather than read from the ambient `crypto` global, and any domain step-editing helper the engine calls directly gets index-bounds and first-step guards at the engine boundary, tested.
- A parity test suite that transcribes the Python narration template tables and the script service tests, plus two fixtures generated once from the Python backend and committed as data: a night-script fixture for the 30 seed roles, and a preview fixture produced by converting each seed role to the draft shape the preview endpoint accepts.

### Out of Scope
- Replacing any API call site. Hooks, pages, and API clients are untouched. That is Phase 04b.
- Refresh, session identity, or routing behavior for in-memory games. Phase 04b decides this.
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
| 3 | Game session state machine | In-memory session with create, start, advance, wake-index tracking, and injected id generation | State machine, tests |

## Technical Context

- **Primary source to port**: `yourwolf-backend/app/services/narration/`. `templates.py` holds `STEP_DURATIONS`, `build_step_instruction()`, `build_wake_instruction()`, and `get_step_duration()`. `script_builder.py` holds `build_role_script()`, `build_night_script_actions()`, `build_preview_actions()`, and `total_duration_seconds()`. The package is free of DB, ORM, and session access but imports two Pydantic output schemas, `NarratorAction` from `schemas/game.py` and `NarratorPreviewAction` from `schemas/role.py`. The engine needs equivalent TypeScript output types.
- **Input contract**: `app/services/narration/inputs.py` defines `RoleScriptInput` and `AbilityStepInput` with field names chosen for one-for-one transcription. Start here.
- **Filters that live outside the package**: `script_service.py` excludes roles with `wake_order` null or zero before calling the builders, and returns an empty preview for such roles. The engine must apply these filters itself.
- **Phase management reference**: `game_service.py` defines `PHASE_ORDER` and the advance and start rules. `game_setup_validation.py` holds setup validation. `app/models/game_session.py` defines `GamePhase`.
- **Parity oracle**: `tests/test_narration_templates.py` holds `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES`, 67 literal cases validated against the pre-refactor implementation. `tests/test_script_service.py` covers assembly behavior. Both are transcribed, never regenerated.
- **Frontend domain layer to build on**: `src/domain/teams.ts`, `roleDraft.ts` (`StepModifier`, `RoleDraft`, `AbilityStepDraft`), `wakeOrder.ts` (grouping and flattening with injectable RNG), `abilitySteps.ts`, `roleSelection.ts`, `constants.ts`.
- **Types the engine may not import**: `src/types/transport.ts` and `src/types/game.ts`. `eslint.config.js` blocks `src/engine/**` from importing React, `api`, `hooks`, `components`, `pages`, `styles`, and `types`. Phase 04b owns any adapter between transport DTOs and engine types.
- **Known domain-layer sharp edges** (from `docs/learnings/cross-phase-decisions.md`): `createEmptyDraft()` reads the ambient `crypto.randomUUID()`; `setStepModifier` can violate the first-step invariant that `renumberSteps` owns; `moveStepUp` and `moveStepDown` corrupt the list on out-of-range indices and are safe only behind UI guards. The engine treats the invariant as owned by `renumberSteps` and guards at its own boundary.
- **Frozen copy**: `_thumbs_up_instruction` renders `team.werewolf` as "Werewolfs" while the wake instruction says "Werewolves". Reproduce it.

## Edge Cases & Failure Modes

- **Role with no ability steps**: still produces wake and close-eyes actions.
- **`wake_order` null or zero**: excluded from the night script and yields an empty preview.
- **Unknown ability type**: instruction is skipped with no action added. Duration falls back to the default.
- **No waking roles**: the script still has the opening and closing narrator actions.
- **`OR` modifier**: prefixes "OR " to the instruction and sets `requires_player_action` true. Both preserved.
- **Custom sequence naming a role not in the game**: ignored with a fallback index.
- **Waking roles the custom sequence does not name**: the Python reference sorts these after the named roles in incidental database row order, which the port must not reproduce. The engine orders unnamed roles by their default wake order, then by role id. The custom-order fixture is generated only from sequences that name every waking role, so it never depends on the incidental ordering.
- **`wake_target` value outside the recognized set**: for example `team.village`, treated as `player.self`, matching the Python fallthrough.
- **`role.` wake target**: the role name is extracted from the pattern with underscores rewritten to spaces.
- **Duplicate role instances**: one script block per unique role.
- **Wake target null**: treated as `player.self`.
- **State machine misuse**: starting a game not in setup, advancing a game still in setup, or advancing past complete, is rejected without mutating state. The first and last mirror the Python errors. The middle is a deliberate tightening; note it in the implementation record.
- **Deterministic ids**: with an injected id generator the same inputs yield the same session, so snapshot tests are stable.

## Dependencies & Risks

- **Dependency**: Phase 3.6 wake order sequence semantics in `src/domain/wakeOrder.ts` must stay stable.
- **Risk**: translation drift between Python and TypeScript. Mitigation: transcribe the oracle tables literally, and generate the night-script and preview fixtures from the Python backend once, committed as data, so seed-role parity is checked without a running server.
- **Risk**: engine types drift from the transport DTOs Phase 04b must adapt. Mitigation: engine types are transcribed from the Python input dataclasses, which the transport DTOs already mirror. Record any field-name divergence in the phase discovery context for 04b.
- **Risk**: the engine ships with no callers, so nothing exercises it at runtime. Mitigation: coverage and parity criteria below are the acceptance gate, and 04b follows immediately.

## Success Criteria

- [ ] All 67 transcribed template cases pass, including the frozen "Werewolfs" output.
- [ ] Night scripts for all 30 seed roles match the committed Python-generated fixture exactly, in default wake order and in custom sequences that name every waking role.
- [ ] Unnamed roles under a partial custom sequence sort by default wake order, then role id, and a test pins it.
- [ ] Preview output for each seed role, converted to draft shape, matches the committed Python-generated preview fixture exactly, including section headers.
- [ ] Every enumerated `wake_target` pattern, the `role.` underscore rewrite, and the unknown-string fallthrough have a test.
- [ ] Roles with `wake_order` null or zero are excluded from scripts and produce an empty preview.
- [ ] The state machine walks setup → night → discussion → voting → resolution → complete and rejects invalid transitions without state change.
- [ ] Id generation is injectable and the engine has no reference to the ambient `crypto` global.
- [ ] ESLint boundary rules pass with zero warnings for `src/engine/**`.
- [ ] Unit test coverage for `src/engine/` is at least 90 percent.
- [ ] Every edge case above has a test.
- [ ] No file outside `src/engine/` and its tests changes, except the parity fixture data.

## QA Considerations

- No UI changes. No manual QA document is required for this phase.
- Automated QA is the parity suite and the ESLint boundary check.
- Phase 04b carries the end-to-end manual QA for game flow and preview.

## Notes for Phase - Execute

Suggested decomposition, one feature per deliverable: **(1)** types and templates → **(2)** script generator and preview → **(3)** game session state machine.

- Feature 1 must land first. Both the script generator and preview depend on the templates, and the oracle tables are the definition of done for it.
- Feature 2 owns both parity fixtures. Generate them from the Python backend with a throwaway script, commit the resulting data, and do not commit the generator. The preview fixture input is each seed role converted to the preview request shape.
- Feature 3 is independent of features 1 and 2 and can run in parallel. It takes an injected id generator and nothing else that is random.
- Do not touch `src/domain/` helper semantics. Where the engine needs a guard the domain helper lacks, add it in the engine and test it there.
- Do not add an adapter from `src/types` DTOs. That is Phase 04b work and the ESLint rule will reject it here.
- This phase should land as one pull request with no changes outside `src/engine/`, its tests, and fixture data.
