## Stage 1: Shared Engine Contracts

- [x] Create `EngineRoleInput`/`NarratorAction`/`NarratorPreviewAction` in `yourwolf-frontend/src/engine/types.ts` as a named ES module with no React, DOM, Node, network, persistence, API, hook, component, page, style, or transport-type imports. (AC1, AC2, AC7)
- [x] Define `EngineAbilityStepInput` with readonly `ability_type`, `order`, `modifier: StepModifier`, `is_required`, and `parameters` fields matching `AbilityStepInput`, using a readonly parameter record. (AC1, AC7)
- [x] Define `EngineRoleInput` with readonly `name`, `wake_target`, `ability_steps`, `id`, `wake_order`, `team: Team`, `is_primary_team_role`, `min_count`, and `max_count` fields, using a readonly step array. (AC1, AC7)
- [x] Import only the verified `Team` and `StepModifier` domain types with `import type`; do not reuse `RoleDraft`, `AbilityStepDraft`, `src/types/game.ts`, or `src/types/transport.ts`. (AC1, AC7)
- [x] Define `NarratorAction` with readonly `order`, `role_name`, `instruction`, `duration_seconds`, and `requires_player_action` fields. (AC2)
- [x] Define `NarratorPreviewAction` with readonly `order`, `instruction`, and `is_section_header` fields. (AC2)
- [x] Review the final implementation for calls to `setStepModifier`, `moveStepUp`, or `moveStepDown`. No direct calls exist, so AC8 is not applicable and no speculative wrapper was added. (AC8)

## Stage 2: Frozen Templates and Durations

- [x] Create `yourwolf-frontend/src/engine/templates.ts` with a readonly `STEP_DURATIONS` map covering all 15 verified ability types and a five-second default for unknown types. (AC3, AC5)
- [x] Implement `buildWakeInstruction` for `player.self`, the three recognized team targets, `role.` targets with underscore-to-space rewriting, null and empty values, and unknown-string fallthrough. (AC4)
- [x] Implement `buildStepInstruction` with all 15 verified ability templates and literal parameter branches from `templates.py`, returning no instruction for unknown ability types. (AC3, AC5)
- [x] Type `buildWakeInstruction` as an engine-role-input-to-string function, `buildStepInstruction` as an engine-step-input-to-`string | undefined` function, and `getStepDuration` as an engine-step-input-to-number function. (AC1, AC2, AC4, AC5)
- [x] Apply the `OR ` prefix only after a recognized instruction renders, and preserve non-OR modifier behavior. (AC3, AC5)
- [x] Preserve `getStepDuration` behavior, including `stop` at zero seconds and the five-second unknown-type default. (AC5)
- [x] Preserve the frozen `thumbs_up` output `Werewolfs, put your thumbs out.` separately from the wake output `Werewolves, wake up and look for other werewolves.` (AC6)
- [x] Keep the dispatch table local, avoid a role argument on step generators, add no logging, and avoid mutable registries or compatibility aliases. (AC7)

## Stage 3: Verification

- [x] Create `yourwolf-frontend/src/test/engine/templates.test.ts` and transcribe the literal `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES` expectations from `yourwolf-backend/tests/test_narration_templates.py`. (AC3, AC4, AC5, AC6)
- [x] Add independent literal assertions for all 15 dispatch entries, unknown ability omission, unknown duration default, OR-prefix ordering, null and empty wake targets, role-target underscore rewriting, and the frozen `Werewolfs` spelling. (AC3, AC4, AC5, AC6)
- [x] Add compile-time or runtime shape evidence that engine role, step, and narration contracts expose every required field as readonly without importing transport DTOs. (AC1, AC2, AC7)
- [x] Keep test expectations independent from `STEP_DURATIONS` and the implementation dispatch table. Do not derive expected strings, case counts, or durations from production exports. (AC3)
- [x] Use a temporary forbidden-import probe to verify the configured ESLint boundary rejects React, UI-layer, and `src/types` imports from `src/engine/**`; remove the probe after evidence is captured. (AC7)
- [x] Run `cd yourwolf-frontend && npm test -- --run` and confirm the phase-scoped engine tests pass with no new failures. (AC3, AC9)
- [x] Run `cd yourwolf-frontend && npm run lint` and confirm zero warnings, including the new engine files. (AC7, AC9)
- [x] Run `cd yourwolf-frontend && npm run build` and confirm no new TypeScript or bundling failures. (AC9)
- [x] Run `cd yourwolf-frontend && npm run test:coverage` and verify the `src/engine/` rows reach at least 90 percent for statements, branches, functions, and lines while the global 80 percent thresholds remain unchanged. (AC9)
- [x] Verify the final diff changes only `yourwolf-frontend/src/engine/`, `yourwolf-frontend/src/test/engine/`, and the assigned pipeline artifacts, then record the final names selected for all proposed symbols in implementation notes. (AC7, AC9)
