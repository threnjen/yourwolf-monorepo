# 01 Engine Types and Templates — Context

## Key Files

### Files to create

| Path | Role | Change type |
|------|------|-------------|
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/types.ts` | Shared readonly engine role, ability-step, and narration output contracts. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/templates.ts` | Pure instruction dispatch, wake instruction rendering, and duration lookup. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/templates.test.ts` | Literal narration-template oracle and boundary tests. The manifest proposes this path, but it does not exist yet. | Create |

### Read-only references

| Path | Role | Change type |
|------|------|-------------|
| `yourwolf-frontend/src/domain/teams.ts` | Defines the verified `Team` union and canonical `TEAMS` values. | Read-only reference |
| `yourwolf-frontend/src/domain/roleDraft.ts` | Defines the verified `StepModifier` union. `RoleDraft` and `AbilityStepDraft` remain UI editing types, not engine inputs. | Read-only reference |
| `yourwolf-frontend/src/domain/abilitySteps.ts` | Defines `setStepModifier`, `moveStepUp`, and `moveStepDown`, whose direct-call guards are conditional under AC8. | Read-only reference |
| `yourwolf-frontend/src/test/domain/abilitySteps.test.ts` | Existing coverage for domain step-editing behavior. | Read-only reference |
| `yourwolf-frontend/src/types/game.ts` | Existing transport-facing `NarratorAction`; the engine must define its own equivalent and must not import this module. | Read-only reference |
| `yourwolf-frontend/src/types/transport.ts` | Existing transport-facing `NarratorPreviewAction`; the engine must define its own equivalent and must not import this module. | Read-only reference |
| `yourwolf-frontend/eslint.config.js` | Existing `src/engine/**/*.{ts,tsx}` import-boundary configuration. | Read-only reference |
| `yourwolf-frontend/vite.config.ts` | Existing Vitest, jsdom, v8 coverage provider, and global 80 percent thresholds. | Read-only reference |
| `yourwolf-backend/app/services/narration/inputs.py` | Verified `AbilityStepInput` and `RoleScriptInput` source contracts. | Read-only reference |
| `yourwolf-backend/app/services/narration/templates.py` | Verified `STEP_DURATIONS`, `build_wake_instruction`, `build_step_instruction`, and `get_step_duration` behavior. | Read-only reference |
| `yourwolf-backend/tests/test_narration_templates.py` | Hardcoded `WAKE_CASES`, `INSTRUCTION_CASES`, and `DURATION_CASES` parity oracle, plus unknown-type and modifier assertions. | Read-only reference |
| `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md` | Phase scope, frozen-copy decisions, and the 04a/04b boundary. | Read-only reference |
| `dev/feature/PHASE_04A-execution-manifest.md` | Ordered feature dependencies, proposed verification assets, and allowed write scope. | Read-only reference |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| `yourwolf-frontend/src/engine/` does not exist. | Both proposed source modules are new files, not modifications to an existing engine API. | Create only the source files named by the selected feature, retaining the `[PROPOSED - name TBD]` marker until implementation chooses final names. |
| `yourwolf-frontend/src/test/engine/` does not exist, and the supplied phase finding recommends separate module-focused files rather than one consolidated test file. | The feature needs a new template test file. No current-phase test can be updated or used as an existing anchor. | Add `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/templates.test.ts`; do not add a consolidated phase test solely for this feature. |
| The plan's AC1 enumerates the role fields but does not enumerate the public step-input fields for `[PROPOSED - name TBD] EngineAbilityStepInput`. `inputs.py` verifies `ability_type`, `order`, `modifier`, `is_required`, and `parameters`. | Features 02 and 03 consume the step shape. Leaving it implicit allows two sibling implementations to choose different field names or nullability. | Add the verified step fields explicitly to the new readonly contract and cover its shape in the feature tests. This is a plan refinement, not a new runtime capability. |
| `NarratorAction` already exists in `yourwolf-frontend/src/types/game.ts`, and `NarratorPreviewAction` already exists in `yourwolf-frontend/src/types/transport.ts`. Both are forbidden imports for `src/engine/**`. | The names are verified globally, but the engine still needs local readonly declarations. Reusing them by import would violate AC7 and couple rules to wire DTOs. | Declare local equivalent output types in `[PROPOSED - name TBD] types.ts`. Keep all transport modules read-only and unimported. |
| The backend output schemas default `NarratorAction.duration_seconds` to `10`, `NarratorAction.requires_player_action` to `True`, and `NarratorPreviewAction.is_section_header` to `False`, while the existing frontend interfaces expose all output fields as required. | A type-only port can accidentally make output fields optional even though serialized actions always carry them. | Keep the engine output fields required and readonly. Let later builders supply the values; do not import schema or transport defaults. |
| `test_narration_templates.py` contains 67 literal table cases and additional exact assertions for unknown types, dispatch coverage, OR modifiers, and the duration map. | Copying only the three table declarations would omit boundary behavior that the source oracle already pins. | Transcribe all three literal tables and the additional behavior checks into the proposed engine test file. Keep expected strings independent from production constants. |
| `src/domain/abilitySteps.ts` has known out-of-range and first-step modifier sharp edges, but this feature's proposed files do not call those helpers. | AC8's boundary-hardening condition is currently inactive. A speculative wrapper would add an API outside the feature's responsibility and change no required behavior. | Verify the final implementation introduces no direct helper call. If none exists, record AC8 as not applicable and add no wrapper or domain change. |
| `eslint.config.js` already scopes the pure-layer restriction to `src/engine/**/*.{ts,tsx}` and blocks React, UI layers, and `types`. | The configuration is ready for the new files, but a clean lint run alone does not prove the rule rejects a forbidden import. | Do not edit the config. The implementer or reviewer should use a temporary forbidden-import probe as code-review evidence, then remove the probe. |
| The phase manifest records no fidelity-table departure, and no `PHASE_04A` discovery-context file is present. | There is no external-discovery artifact to merge into this feature. The supplied Environment State and phase test finding remain authoritative. | Treat the absence as intentional. No additional discovery or phase-level test consolidation is required. |

## Architectural Decisions

- Follow named ES module exports and the narrow-domain-shape pattern already used in `src/domain/`.
- Define local engine projections instead of importing `RoleDraft`, `AbilityStepDraft`, or transport DTOs. Import only the verified `Team` and `StepModifier` domain types with type-only imports.
- Define `[PROPOSED - name TBD] EngineRoleInput` with `name`, `wake_target`, `ability_steps`, `id`, `wake_order`, `team`, `is_primary_team_role`, `min_count`, and `max_count`. Define `[PROPOSED - name TBD] EngineAbilityStepInput` with the one-for-one `AbilityStepInput` fields verified in `inputs.py`.
- Make input and output fields readonly, including nested step arrays and parameter records, so callers cannot mutate engine-owned values through the contract. Use module-level functions rather than service classes or mutable registries.
- Preserve the verified Python contracts `STEP_DURATIONS`, `build_wake_instruction`, `build_step_instruction`, and `get_step_duration` semantically. Keep the dispatch table local and export only the contracts sibling engine modules consume.
- Model an unknown instruction as `string | undefined` at the TypeScript boundary, and expose `STEP_DURATIONS` as readonly data so callers cannot mutate the dispatch contract.
- Declare `[PROPOSED - name TBD] NarratorAction` and `[PROPOSED - name TBD] NarratorPreviewAction` locally with required readonly fields. Their names are copied from the phase and backend contracts, but the engine declarations are new and remain proposed until implementation selects final idiomatic names.
- Keep the literal template table independent from test expectations. The test suite transcribes the Python oracle rather than deriving expected strings from production constants.
- Preserve the 15-template dispatch, wake-target fallthrough, OR-prefix timing, five-second unknown duration default, zero-second `stop` duration, and frozen `Werewolfs` spelling. Do not reintroduce a `role` parameter to step generators.
- Add no barrel, path alias, adapter, logging, or compatibility layer. Feature 02 owns script assembly and Feature 04b owns transport adaptation and caller wiring.

## Constraints

- Implementation and test changes are limited to `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/`. Pipeline records and documentation are exempt.
- The engine is dependency-free pure TypeScript. It must not import React, the DOM, Node, network, persistence, API clients, hooks, components, pages, styles, or `src/types` transport modules.
- Use ES module syntax, `import type` for type-only bindings, no `any`, readonly types, and module-level pure functions. Add no normal-path logs.
- The Python narration copy and the 67-case literal oracle are frozen. The `thumbs_up` result for `team.werewolf` must remain `Werewolfs, put your thumbs out.` while wake copy remains `Werewolves, wake up and look for other werewolves.`
- Unknown ability types return no instruction. The OR prefix applies only after a recognized instruction renders. Unknown duration lookups return five seconds, and `stop` remains zero seconds.
- Null, empty, and unknown wake targets must follow the Python fallthrough. Role-target underscores become spaces.
- Do not change `src/domain/` semantics, the backend, narrator copy, `vite.config.ts`, `eslint.config.js`, package manifests, global coverage thresholds, or unrelated frontend tests.
- Do not call `setStepModifier`, `moveStepUp`, or `moveStepDown` from this feature. If implementation scope changes and a direct call appears, AC8 requires tested boundary guards at the engine boundary before that call is accepted.
- Existing frontend lint and build checks are phase-level gates. The feature must add no failures and must not repair unrelated baseline issues under this scope.

## Scope Boundaries

- Do not assemble full night scripts or previews. Feature 02 owns script and preview assembly.
- Do not create, start, or advance game sessions. Feature 03 owns session state and setup validation.
- Do not replace API call sites or add transport-to-engine adapters. Phase 04b owns integration.
- Do not add persistence, routing, refresh handling, Tauri, audio, UI callers, configuration, or logging.
- No manual QA document or UI smoke test is required for this feature. Phase 04b owns runtime smoke coverage.
- Do not change `src/domain/` helper behavior. AC8 is conditional and does not authorize speculative wrappers.
- Do not modify Python files, backend schemas, narrator copy, or the global 80 percent coverage threshold.
- Do not add a barrel or path alias solely for this feature.
- Preserve caller immutability and the exact branch behavior listed in the plan's correctness section. No I/O, retries, timeouts, concurrency, or idempotency machinery is needed for these pure functions.

## Relationships to Sibling Plans

- This feature has no prerequisite feature.
- Feature `02-narration-scripts-preview` depends on the role, step, narration output, template, and duration contracts produced here. It owns assembly, ordering, modifiers at the builder level, preview headers, and parity fixtures.
- Feature `03-game-session-state-machine` depends on the role metadata contract produced here but does not depend on Feature 02 at runtime. The manifest keeps it later to avoid concurrent writes to `src/engine/**` and `src/test/engine/**`.
- Phase 04b consumes the completed engine APIs and owns six API call-site replacements, transport adaptation, router-state validation, refresh behavior, and end-to-end manual QA.
- Phase 04a intentionally has no integration/bootstrap feature because it creates unused, independently callable engine APIs. Runtime integration belongs to Phase 04b.

## Suggested Implementation Order

1. Stage 1: Create the shared readonly engine input and narration output contracts in `[PROPOSED - name TBD] types.ts`, including the explicit step-input refinement and AC7 import boundary.
2. Stage 2: Create `[PROPOSED - name TBD] templates.ts` with the frozen 15-template dispatch, wake instructions, duration map, and defaults.
3. Stage 3: Add the separate literal parity test file, boundary cases, shape evidence, and verification evidence. Record the final chosen public names for all proposed symbols.

No Stage 0 test bootstrap is required because Phase - Execute supplied a green 42-file, 535-test baseline with coverage above 50 percent.

## Environment State

| Property | Value |
|----------|-------|
| Tech stack | TypeScript 5.3, Vite 5.4, Vitest 2.1 with v8 coverage; Python 3.14 reference implementation |
| Test runner | `cd yourwolf-frontend && npm test -- --run` |
| Test baseline | 42 files and 535 tests passed on 2026-09-13. Existing React `act(...)` and React Router future-flag warnings remain non-failing. |
| Coverage baseline | `cd yourwolf-frontend && npm run test:coverage` passed. Global results: 91.57% statements, 94.51% branches, 91.75% functions, 91.57% lines. `src/engine/` does not exist yet. |
| Lint | `cd yourwolf-frontend && npm run lint` passed with zero warnings on 2026-09-13. |
| Format | Not configured in `yourwolf-frontend/package.json`. |
| Build | `cd yourwolf-frontend && npm run build` passed on 2026-09-13. |
| Phase-scoped test pattern | `yourwolf-frontend/src/test/engine/**/*.test.ts`; no current-phase files exist. Separate module-focused files are recommended instead of one consolidated file. |
| Allowed implementation scope | `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/` only. Pipeline records and documentation are exempt. |

## Relevant Learnings

- From `docs/learnings/cross-phase-decisions.md`: **`src/domain/` is the single source of truth for frontend domain vocabulary.** Reuse `Team` from `domain/teams.ts` and `StepModifier` from `domain/roleDraft.ts`; do not recreate team or modifier literals in the engine.
- From `docs/learnings/cross-phase-decisions.md`: **The frontend transport/domain type split is complete.** The domain layer is self-contained, and future engine code must keep the dependency direction inward rather than importing `src/types`.
- From `docs/learnings/cross-phase-decisions.md`: **`tests/test_narration_templates.py` is the Phase 04 TypeScript port oracle and is load-bearing.** Its 67 cases are hardcoded literals validated against the pre-refactor implementation. Do not tidy, parametrize away, or regenerate those expectations from implementation constants.
- From `docs/learnings/cross-phase-decisions.md`: **The `thumbs_up` `Werewolfs` bug is frozen.** The TypeScript port must reproduce the wrong spelling, and a copy correction requires a separate feature that updates both ports and their pins.
- From `docs/learnings/cross-phase-decisions.md`: **The 04a engine lands with no callers, while 04b owns adapters and runtime integration.** Do not pull routing, transport, or refresh behavior into this feature.
- From `docs/learnings/cross-phase-decisions.md`: **The domain step-editing helpers retain UI-hidden sharp edges.** Add guards only if this feature directly calls those helpers. No current Feature 01 file requires such a call.
- From `docs/learnings/review-learnings.md`: **A plan-cited regression anchor may not exist.** Verify assertions against the specific contract, not merely the presence of the backend test file. The literal tables and exact assertions were inspected here.
- From `docs/learnings/review-learnings.md`: **An oracle written by the same agent must be checked against the old implementation.** Keep expected values as independent literals rather than reading them from the new template table.
- From `docs/learnings/review-learnings.md`: **A clean lint run does not prove a boundary rule is active.** Probe the new engine path with a temporary forbidden import, then remove the probe and retain the compliant source.
- From `docs/learnings/review-learnings.md`: **Readonly outer containers can still expose mutable nested values.** Make nested step arrays, parameter records, and output collections readonly where the contract promises immutable caller-visible values.
