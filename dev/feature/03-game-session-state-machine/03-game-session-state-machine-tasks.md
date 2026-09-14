## Stage 1: Setup Validation Port

- [x] Define the local readonly setup-input and dependency contracts in `gameSetupValidation.ts` and `gameSession.ts`, including the verified `EngineRoleInput` values, selected-role dependency data, wake sequence, and injected id generator.
- [x] Port the Python setup-rule precedence into `gameSetupValidation.ts`: total role count, known ids, per-role min/max counts, primary-team requirements, dependencies, then wake-order sequence.
- [x] Preserve duplicate role ids as multiple cards while resolving role metadata and primary-team checks from unique role ids.
- [x] Preserve the exact Python error text for count, unknown-id, card-count, primary-team, required-dependency, and wake-sequence failures.
- [x] Preserve hard `requires` dependency failures and non-blocking `recommends` warning text as separate result channels.
- [x] Port wake-sequence validation for duplicate ids, ids outside selected roles, selected non-waking roles, omitted selected waking roles, accepted empty sequences with no waking roles, and omitted sequences remaining absent.
- [x] Add `gameSetupValidation.test.ts` with all 32 scenarios from `yourwolf-backend/tests/test_game_setup_validation.py`, retaining both independently scoped occurrences of the duplicate `test_count_rule_precedes_unknown_role_id_check` name as equivalent independently scoped cases.
- [x] Add precedence cases where the later rule demonstrably fails, then assert the earlier rule's exact message wins.
- [x] Add atomicity checks showing every rejected setup produces no session result and does not mutate caller-owned role, dependency, or sequence values.
- [x] Keep scalar bounds at the transport boundary. Do not import or clone transport DTO validation into the pure engine.

## Stage 2: Immutable Phase Transitions

- [x] Define `GameSession` in `gameSession.ts` as a local readonly in-memory value. Preserve the six verified phase values and the setup fields, accepted wake sequence, current wake index, deterministic id, and dependency-warning information required by the feature.
- [x] Define `IdGenerator` and ensure `gameSession.ts` has no ambient `crypto`, time, shuffle, persistence, or network dependency.
- [x] Implement `createGameSession` so validation completes before constructing a setup-phase session, successful output uses the injected id, and caller inputs remain unchanged.
- [x] Implement `startGame` so only setup sessions start, the result is a new night-phase value with `current_wake_order` set to zero, and the verified start rejection text is preserved for non-setup input.
- [x] Implement `advancePhase` so setup and complete are rejected, valid calls move exactly one phase through night, discussion, voting, resolution, and complete, and the complete rejection text matches the Python reference.
- [x] Pin the deliberate setup-advance tightening with one explicit engine error. Leave the Python `GameService.advance_phase()` behavior unchanged.
- [x] Add `gameSession.test.ts` transition-table scenarios for create, setup-only start, setup advance rejection, every valid phase step, terminal rejection, current wake index initialization, deterministic id output, and warning propagation.
- [x] Assert reference/deep-value immutability for rejected operations and caller immutability for successful create, start, and advance operations.
- [x] Keep role shuffle, player/center assignment, role usage counters, timestamps, persistence, refresh identity, routing, and wake-index advancement out of the session implementation.

## Stage 3: Verification

- [x] Verify every plan edge case has a direct assertion in `gameSetupValidation.test.ts` or `gameSession.test.ts`, including duplicate cards, all primary-team paths, hard/soft dependencies, sequence variants, invalid transitions, immutability, and deterministic ids.
- [x] Verify the final engine modules import only local engine contracts and permitted domain types. Probe a forbidden transport import against the engine boundary, confirm the lint diagnostic, then remove the probe.
- [x] Verify no new source in `yourwolf-frontend/src/engine/` references the ambient `crypto` global or introduces a random, time, network, DOM, React, persistence, or logging dependency.
- [x] Run the phase-scoped tests with `cd yourwolf-frontend && npm test -- --run` and confirm the supplied frontend baseline remains green with the new engine tests.
- [x] Run `cd yourwolf-frontend && npm run lint` and confirm zero warnings, including the new engine modules and tests.
- [x] Run `cd yourwolf-frontend && npm run build` and confirm no new TypeScript or bundling failures.
- [x] Run `cd yourwolf-frontend && npm run test:coverage` and confirm every `src/engine/` row reaches at least 90 percent for statements, lines, branches, and functions without changing global thresholds.
- [x] Confirm the final diff changes only the four proposed engine/test files plus assigned pipeline records. Do not modify backend, transport, domain, UI, API, configuration, or unrelated tests.
- [x] Record the final idiomatic names selected for every proposed type, function, module, and test file in the implementation record, including the local phase and warning representation chosen to close the plan gaps.
