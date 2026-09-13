# 02 Narration Scripts and Preview — Context

## Key Files

### Files to create

| Path | Role | Change type |
|------|------|-------------|
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/narration.ts` | Pure wake ordering, script assembly, preview assembly, and duration functions over the verified engine contracts. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/narration.test.ts` | Focused TypeScript tests for ordering, assembly, filtering, modifiers, duration, preview headers, and fixture parity. The phase manifest proposes this path, but it is missing at the review commit. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/night-script.fixture.json` | Static Python-generated expected night-script data for all 30 seed roles in deterministic default and complete custom orders. | Create |
| `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/preview.fixture.json` | Static Python-generated expected preview data for all 30 seed roles, including the two non-waking empty results. | Create |

### Read-only references

| Path | Role | Change type |
|------|------|-------------|
| `yourwolf-frontend/src/engine/types.ts` | Verified Feature 01 readonly `EngineRoleInput`, `EngineAbilityStepInput`, `NarratorAction`, and `NarratorPreviewAction` contracts. | Read-only reference |
| `yourwolf-frontend/src/engine/templates.ts` | Verified Feature 01 wake and step instruction functions, frozen duration table, OR-prefix behavior, and inherited-property guards. | Read-only reference |
| `yourwolf-frontend/src/test/engine/templates.test.ts` | Existing literal template oracle and boundary tests. It already proves inherited property names are unknown at the template boundary. | Read-only reference |
| `yourwolf-frontend/src/domain/wakeOrder.ts` | Existing semantic filtering and role de-duplication precedent. Its wake-order sort preserves input order for ties and therefore does not satisfy this feature's name tie-break. | Read-only reference |
| `yourwolf-frontend/eslint.config.js` | Existing probe-tested pure-engine import boundary. It rejects React, UI-layer, and transport-type imports from `src/engine/**`. | Read-only reference |
| `yourwolf-frontend/vite.config.ts` | Existing Vitest jsdom setup, v8 coverage provider, and global coverage thresholds. | Read-only reference |
| `yourwolf-frontend/package.json` | Existing frontend test, lint, build, and coverage scripts. No format script is configured. | Read-only reference |
| `yourwolf-backend/app/services/narration/inputs.py` | Python narration input contract that Feature 01 transcribed and this feature consumes through the engine projection. | Read-only reference |
| `yourwolf-backend/app/services/narration/templates.py` | Frozen Python instruction copy and duration behavior used by Feature 01 and the fixture oracle. | Read-only reference |
| `yourwolf-backend/app/services/narration/script_builder.py` | Pure Python role-script, night-script, preview, and total-duration reference implementation. | Read-only reference |
| `yourwolf-backend/app/services/narration/__init__.py` | Python package export surface confirming the four builder functions and three template functions used as the port contract. | Read-only reference |
| `yourwolf-backend/app/services/script_service.py` | DB-facing filtering, de-duplication, custom wake-sequence behavior, and preview wake-order guard surrounding the pure builders. | Read-only reference |
| `yourwolf-backend/tests/test_narration_script_builder.py` | Dedicated pure-builder oracle with 28 direct test methods covering role assembly, night assembly, preview headers, and duration sums. | Read-only reference |
| `yourwolf-backend/tests/test_script_service.py` | DB/service integration and endpoint tests, including wake filtering, duplicate role behavior, custom sequence behavior, and preview boundary cases. | Read-only reference |
| `yourwolf-backend/tests/test_narration_templates.py` | 67-case literal wake, instruction, modifier, dispatch, and duration oracle used by Feature 01 and the port. | Read-only reference |
| `yourwolf-backend/app/seed/data/roles.json` | Official 30-role seed input. It contains 28 positive waking roles and two null-wake roles, Villager and Tanner. | Read-only reference |
| `yourwolf-backend/app/seed/roles.py` | Seed loader and defaults for omitted `min_count`, `max_count`, and `is_primary_team_role` fields needed when constructing complete engine inputs for fixture generation. | Read-only reference |
| `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md` | Phase scope, frozen-copy decisions, parity requirements, and the 04a/04b boundary. | Read-only reference |
| `dev/feature/PHASE_04A-execution-manifest.md` | Ordered feature prerequisites, supplied verification assets, allowed write scope, and the phase recommendation for separate engine test files. | Read-only reference |
| `dev/feature/01-engine-types-templates/01-engine-types-templates-implementation.md` | Verified Feature 01 names, outputs, test evidence, and the inherited-property guard repair. | Read-only reference |
| `dev/feature/01-engine-types-templates/reviews/03c-reviewer-plan-conformance-report.md` | Reviewed Feature 01 contract and boundary evidence at the review commit. | Read-only reference |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| All concrete source paths named by the plan's traceability matrix exist at `bd61870`: `yourwolf-frontend/src/engine/`, its Feature 01 files, the Python narration sources, `test_script_service.py`, `roles.json`, `wakeOrder.ts`, and `vite.config.ts`. | The plan's existing references resolve. No missing prerequisite source file blocks implementation. | No plan change. Keep existing paths read-only and create only the proposed narration module, focused test, and fixtures. |
| `[PROPOSED - name TBD] yourwolf-frontend/src/engine/narration.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/narration.test.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/night-script.fixture.json`, and `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/preview.fixture.json` are absent at the review commit. The existing engine directory contains only the verified Feature 01 files. | The proposed module, test, and fixture paths are new files, not modifications to an existing narration API. | Create these paths only. Preserve the proposed-name markers until implementation records the final names. |
| The plan names `yourwolf-backend/tests/test_script_service.py` as the assembly source. The repository has a separate `yourwolf-backend/tests/test_narration_script_builder.py` with the direct pure-builder assertions, while `test_script_service.py` exercises DB adaptation, endpoint behavior, wake filtering, and representative integration cases. | Transcribing only the plan-named file would miss the strongest direct checks for role blocks, action ordering, section headers, and duration sums. This is a plan-source warning for Phase - Execute. | Add the dedicated pure-builder file as the primary assembly oracle and retain `test_script_service.py` for surrounding service semantics. Add tasks for both sources without modifying either backend test file. |
| `test_narration_script_builder.py` covers an ordinary unknown ability string, but does not directly pass inherited object-property names such as `constructor`, `toString`, or `__proto__` through the full builder. Feature 01's `templates.test.ts` covers those names only at the template boundary. | Assembly could accidentally calculate a duration or emit an action after the template guard changes even while both existing suites pass. | Add direct script-level cases for inherited names and assert that each contributes neither an action nor duration after `buildStepInstruction` returns `undefined`. |
| Feature 01's verified `buildStepInstruction` and `getStepDuration` use own-property checks. The verified template function owns OR text prefixing. | Reimplementing dispatch or prefixing in the assembly layer would duplicate behavior and could make inherited names or OR actions diverge. | Call `buildStepInstruction` first, skip `undefined`, then call `getStepDuration`; set the action flag from `is_required` or the `or` modifier without adding a second `OR ` prefix. |
| `collectWakingRoles` filters positive wake orders and de-duplicates ids, but sorts ties by input order. Python custom-sequence sorting also leaves unnamed roles in incidental database order. | Direct reuse would violate the feature's deterministic role-name tie-break and partial-sequence fallback. | Use the domain function only as a filtering precedent. Implement the proposed local sorter with ascending wake order then role name for defaults and unnamed custom-sequence roles. |
| The seed file contains 30 roles, 28 with positive wake orders and two with null wake orders. Most roles omit `min_count`, `max_count`, and `is_primary_team_role`, and `seed_roles` supplies defaults of `1`, `1`, and `false`. | Fixture conversion cannot pass raw JSON directly to the complete verified `EngineRoleInput` shape. Preview parity must include two empty results, and all engine inputs need explicit defaults. | Apply the loader defaults during one-time fixture generation without editing the seed file. Include all 30 roles in both fixture datasets. |
| Python's custom-sequence branch runs only when the sequence is truthy. An empty sequence therefore follows default wake ordering. The plan describes an optional sequence but does not state the empty-array behavior. | An implementation that treats `[]` as an active sequence could produce no role blocks instead of the Python-compatible default order. This is a plan-gap warning for Phase - Execute. | Add a direct empty-sequence test and preserve default ordering when the optional sequence is absent or empty, unless the plan is explicitly revised. |
| Python `build_night_script_actions` accepts an already ordered role list and does not accept ids or a custom sequence. The service sorts roles before invoking it. | The fixture generator cannot ask the Python builder to apply a custom sequence. Deterministic ids are needed for TypeScript sorter inputs, while Python expected output needs the role list ordered before builder invocation. | Generate deterministic ids from role names, sort the converted inputs by wake order then name, and pass the ordered role list to the Python builders. For the complete custom fixture, reorder that list before invocation. Do not commit the generator. |
| The plan names proposed `buildNightScript` and `totalDurationSeconds` but does not state whether the night builder returns a wrapper containing total duration or an action list paired with a separate sum function. Existing Python separates `build_night_script_actions` and `total_duration_seconds`, and Feature 01 exposes only local action output types. | An unrecorded wrapper would create a new contract that has no Python or Feature 01 counterpart. | Preserve the Python split: the proposed night builder returns ordered actions, and the proposed total function sums those actions. Record the final return shape in implementation notes. |
| The phase-level finding recommends separate module-focused tests. `yourwolf-frontend/src/test/engine/templates.test.ts` now exists, and no consolidated phase test file is recommended. | A single consolidated file would overlap Feature 01 and make ownership unclear. | Add the proposed narration-focused test file and leave `templates.test.ts` unchanged. |
| No frontend source currently imports the engine beyond the existing Feature 01 template test. The phase manifest and phase summary both defer callers to Phase 04b. | There is no current caller or frontend test to update, and no runtime smoke test can exercise this feature in 04a. | Treat frontend tests and fixtures as new assets. Do not wire hooks, pages, components, API clients, routing, or session state. |
| The phase manifest records no fidelity departure, and no `PHASE_04A` discovery-context file exists. | There is no external-discovery correction to merge. The supplied environment state and manifest findings remain authoritative. | Record fidelity departure as none and proceed from the supplied state. |

## Architectural Decisions

- Consume the verified readonly `EngineRoleInput`, `EngineAbilityStepInput`, `NarratorAction`, and `NarratorPreviewAction` declarations from `yourwolf-frontend/src/engine/types.ts`. Do not import `src/types/game.ts`, `src/types/transport.ts`, `RoleDraft`, or `PreviewScriptRequest`.
- Reuse `buildWakeInstruction`, `buildStepInstruction`, and `getStepDuration` from `yourwolf-frontend/src/engine/templates.ts`. Treat `undefined` from `buildStepInstruction` as the only unknown-step signal. Skip unknown steps before duration calculation.
- Keep the implementation in `[PROPOSED - name TBD] yourwolf-frontend/src/engine/narration.ts` as one cohesive pure module unless implementation evidence establishes a separate responsibility. Export only the proposed public functions that the feature needs.
- Keep all new public names proposed until implementation chooses final idiomatic names: `[PROPOSED - name TBD] sortWakingRoles`, `[PROPOSED - name TBD] buildRoleScript`, `[PROPOSED - name TBD] buildNightScript`, `[PROPOSED - name TBD] buildPreview`, and `[PROPOSED - name TBD] totalDurationSeconds`.
- Use named ES module exports and the engine's existing explicit `.ts` import style. The engine must remain dependency-free pure TypeScript with inward-only imports.
- Filter out roles whose `wake_order` is null or zero before night assembly and preview assembly. De-duplicate role instances by id before creating role blocks.
- Sort default roles by positive `wake_order` ascending and role name for ties. For a non-empty custom sequence, map repeated ids to their last sequence position, ignore ids with no matching role, place named roles first, and sort unnamed waking roles by wake order then name. Treat an empty sequence as the Python default path.
- Build role actions with wake and close-eyes actions even when no ability steps exist. Sort steps by `order`, preserve dense sequential action orders, preserve `is_required`, and force an OR step's `requires_player_action` to true while the template owns the OR text.
- Build night actions with the opening narrator action, each unique waking role block, and the closing narrator action. Keep duration calculation as a separate sum over the action list, matching the Python builder split.
- Build previews by mapping role-script actions into the verified preview output shape, then append one exact section header when any recognized `perform_immediately` or `perform_as` step exists. Return an empty preview before header logic for null or zero wake order.
- Generate both fixture files once from the Python builders using static seed data. Use deterministic ids derived from role names and deterministic name tie-breaking before builder invocation. Keep fixture expectations independent from TypeScript production output and do not commit the throwaway generator.
- Preserve frozen narration copy, including `Werewolfs, put your thumbs out.` for the `team.werewolf` thumbs-up template and `Werewolves` in the wake template. Do not add a copy correction.

## Constraints

- Implementation and test changes are limited to `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/`. Pipeline records and documentation are outside that implementation scope.
- The narration module must not import React, the DOM, Node, network clients, persistence, API clients, hooks, components, pages, styles, or transport DTOs.
- Use readonly input and output collections and do not mutate roles, steps, custom sequences, or fixture data. Return new result collections where the contract requires a transformed value.
- Keep normal-path logging absent. This feature is synchronous local logic, and deterministic actions and fixture diffs are the diagnostic surface.
- Preserve all literal Python copy and duration behavior. Unknown steps produce no actions and no duration. Unknown duration lookups remain the Feature 01 five-second default, but assembly must not call duration lookup for a skipped instruction.
- Preserve null, empty, and unknown wake-target fallthrough from the template module. Preserve role-target underscore-to-space rewriting and all 15 recognized ability types through the reused template functions.
- Preserve the `OR ` prefix exactly once. OR steps require player action even when `is_required` is false. Other steps use `is_required`.
- Keep fixture files as test data only. Do not load them in application runtime paths, fetch them over the network, or regenerate them in TypeScript tests.
- Do not modify Python sources or tests, seed JSON, domain wake-order semantics, Feature 01 engine files, package manifests, Vite configuration, ESLint configuration, global coverage thresholds, or unrelated frontend tests.
- Do not add adapters for `RoleDraft` or `PreviewScriptRequest`. Phase 04b owns transport and UI adaptation.
- Do not create or advance game sessions. Feature 03 owns the state machine, and the manifest keeps it later because both features write under the shared engine test/source directories.
- Do not add API callers, routing, refresh handling, persistence, audio, Tauri, UI, or manual QA. Phase 04b owns runtime integration and smoke coverage.

## Scope Boundaries

- Create only `[PROPOSED - name TBD] yourwolf-frontend/src/engine/narration.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/narration.test.ts`, `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/night-script.fixture.json`, and `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/preview.fixture.json` for this feature.
- Preserve `yourwolf-frontend/src/engine/types.ts`, `yourwolf-frontend/src/engine/templates.ts`, and `yourwolf-frontend/src/test/engine/templates.test.ts` as Feature 01-owned contracts and evidence.
- Preserve `yourwolf-frontend/src/domain/wakeOrder.ts` behavior. The engine may copy its filtering intent but must not change its shuffle or tie semantics.
- Preserve `yourwolf-backend/app/services/narration/`, `yourwolf-backend/app/services/script_service.py`, `yourwolf-backend/tests/test_narration_script_builder.py`, `yourwolf-backend/tests/test_script_service.py`, `yourwolf-backend/tests/test_narration_templates.py`, and `yourwolf-backend/app/seed/data/roles.json` as read-only oracles.
- Keep all fixture generation outside committed source. The committed JSON files are static expected values, not runtime data sources.
- Keep Phase 04b integration, transport conversion, hooks, pages, router state, refresh behavior, and manual game-flow checks out of this feature.
- Keep Feature 03 session validation and transitions out of this feature. No shared runtime dependency exists between the two features.

## Relationships to Sibling Plans

- Feature `01-engine-types-templates` is the prerequisite. It completed at the review commit and provides the verified engine role, step, output, template, and duration contracts consumed here.
- Feature `03-game-session-state-machine` also depends on Feature 01, not on this feature at runtime. The manifest schedules it after this feature to avoid concurrent writes under `src/engine/` and `src/test/engine/`.
- Phase 04b consumes the completed engine APIs and owns six API call-site replacements, transport-to-engine adaptation, router-state handling, refresh behavior, and end-to-end manual QA.
- Phase 04a intentionally has no integration/bootstrap feature. These APIs remain unused and independently callable until Phase 04b.

## Suggested Implementation Order

1. Complete Stage 1 in the proposed narration module: filtering, deterministic default and custom ordering, role blocks, night assembly, and duration summing.
2. Complete Stage 1 focused tests for action order, duplicate roles, no-wake roles, unknown and inherited step names, OR flags, and input immutability.
3. Complete Stage 2 preview behavior, including null and zero wake-order handling and the single copied-role section header.
4. Generate the two proposed fixtures once from the Python builders and seed JSON. Apply deterministic ids, loader defaults, name tie-breaking, default ordering, and a complete custom sequence before invoking the builders.
5. Complete Stage 2 fixture comparisons for all 30 seed roles, then complete Stage 3 full-suite, lint, build, coverage, scope, and boundary checks.
6. Record the final names selected for every proposed symbol and path in the implementation record. Keep the manifest prerequisite graph unchanged: Feature 01 → Feature 02 and Feature 01 → Feature 03.

## Environment State

| Property | Value |
|----------|-------|
| Tech stack | TypeScript 5.3, Vite 5.4, Vitest 2.1 with v8 coverage; Python 3.14 reference implementation |
| Test runner | `cd yourwolf-frontend && npm test -- --run` |
| Test baseline | Frontend `executed-green` at `bd61870`: 616 total, 616 passed, 0 failed. Backend oracle `executed-green`: 157 total, 157 passed, 0 failed. |
| Coverage baseline | `cd yourwolf-frontend && npm run test:coverage` passed after Feature 01. `src/engine/` aggregate: 98.91% statements, 98.73% branches, 100% functions, 98.91% lines. |
| Lint | `cd yourwolf-frontend && npm run lint` passed with zero warnings on 2026-09-13. |
| Format | Not configured in `yourwolf-frontend/package.json`. |
| Build | `cd yourwolf-frontend && npm run build` passed on 2026-09-13. |
| Phase-scoped test pattern | `yourwolf-frontend/src/test/engine/**/*.test.ts`; `templates.test.ts` now exists. Separate module-focused files remain recommended instead of one consolidated file. |
| Allowed implementation scope | `yourwolf-frontend/src/engine/` and `yourwolf-frontend/src/test/engine/` only. Pipeline records and documentation are exempt. |

## Relevant Learnings

- From `docs/learnings/cross-phase-decisions.md`: **`tests/test_narration_templates.py` is the Phase 04 TypeScript port oracle and is load-bearing.** Its 67 cases are hardcoded literals validated against the pre-refactor implementation. Keep expected strings independent and do not regenerate them from TypeScript production constants.
- From `docs/learnings/cross-phase-decisions.md`: **The `thumbs_up` `Werewolfs` spelling is frozen.** The wake copy says `Werewolves`, but the thumbs-up copy intentionally retains `Werewolfs`. The port must reproduce both outputs exactly.
- From `docs/learnings/cross-phase-decisions.md`: **Duplicate-role de-duplication is an observable behavior, not a SQL mechanism.** SQL `IN` uniqueness helps the backend, but an in-memory TypeScript array must explicitly produce one role block per unique id.
- From `docs/learnings/cross-phase-decisions.md`: **The 15 step generators take parameters only.** The wake generator takes the role because it needs the role name. Do not add a role argument to step generation for symmetry.
- From `docs/learnings/cross-phase-decisions.md`: **Custom wake ordering must not inherit incidental database order.** The engine and fixture generator use role-name tie-breaking, while Phase 04b passes the Phase 3.6 shuffled custom sequence when it needs group randomization.
- From `docs/learnings/cross-phase-decisions.md`: **The engine lands without callers in 04a.** Transport adaptation, routing, refresh behavior, and runtime integration belong to Phase 04b.
- From `docs/learnings/cross-phase-decisions.md`: **Seed JSON intentionally omits some optional fields.** `seed_roles` supplies defaults for omitted count and primary-role fields. Fixture conversion must preserve that sparse-data contract rather than editing or normalizing the seed file.
- From `docs/learnings/review-learnings.md`: **A plan-cited test file is not automatically the right regression anchor.** Verify that the named file asserts the behavior being ported. Here, the direct pure-builder oracle is `test_narration_script_builder.py`, with `test_script_service.py` retained for service-boundary behavior.
- From `docs/learnings/review-learnings.md`: **An oracle written by the same agent must be checked against the old implementation.** Keep fixture and test expectations as independent literals generated from the Python reference, never from the TypeScript implementation under test.
- From `docs/learnings/review-learnings.md`: **Coverage does not prove de-duplication or guard behavior.** Supply duplicate ids, null and zero wake orders, partial and empty sequences, and inherited step names as direct inputs, and assert the observable results.
- From `docs/learnings/review-learnings.md`: **Configuration guarantees must be probed.** Feature 01 already verified the engine import boundary with a temporary forbidden-import probe. Keep new narration imports within that boundary and do not weaken the configuration.
