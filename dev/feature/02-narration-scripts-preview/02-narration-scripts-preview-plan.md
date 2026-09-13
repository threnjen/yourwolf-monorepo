# 02 Narration Scripts and Preview

## Plan Metadata

- `plan_revision`: `2`
- `last_validation_commit`: `bd6187073de968fee3533c1b441a97db268fe8bc`
- `stale_reason`: `none` — revalidated after `01-engine-types-templates` completed and its reviewed public contracts became concrete.

## A. Requirements & Traceability

### Acceptance Criteria

1. **AC1:** Night script generation accepts engine role inputs plus an optional custom wake sequence and returns ordered narrator actions with the opening action, one block per unique waking role, the closing action, and the exact total duration.
2. **AC2:** Default wake order sorts positive, non-null `wake_order` values ascending and breaks ties by role name. Roles with null or zero wake order are excluded.
3. **AC3:** A custom sequence places named roles first in sequence order, ignores unknown ids, gives a repeated id its last sequence position, and sorts unnamed waking roles by `wake_order` then role name.
4. **AC4:** Each waking role receives wake and close-eyes actions even with no ability steps. Ability steps sort by `order`; unknown types, including inherited object-property names, are skipped before duration calculation; the reused template function supplies the `OR` prefix while assembly forces `requires_player_action`; other steps use `is_required`.
5. **AC5:** Preview generation accepts one engine role input, returns no actions for null or zero wake order, otherwise mirrors the role script, and appends the exact section header for any `perform_immediately` or `perform_as` step.
6. **AC6:** A committed night-script fixture for all 30 seed roles matches output in deterministic default order and custom sequences that name every waking role.
7. **AC7:** A committed preview fixture covers all 30 seed roles after conversion to engine inputs, including roles with empty previews.
8. **AC8:** Both fixtures are generated once from the Python narration builders using deterministic ids derived from role names and a name tie-break before builder invocation. The throwaway generator is not committed.
9. **AC9:** Every enumerated edge case has direct test evidence, the full engine suite passes, and all `src/engine/` coverage rows meet at least 90 percent for lines, branches, functions, and statements.

### Non-goals

- Do not wire any hook, page, component, or API client to the engine.
- Do not change narrator copy, seed JSON, Python behavior, domain wake-order shuffle behavior, or transport DTOs.
- Do not create or advance a game session. Feature 03 owns session state.
- Do not persist or fetch fixtures at runtime.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1, AC4 | `yourwolf-frontend/src/engine/`; `yourwolf-backend/app/services/narration/script_builder.py` | Must-have automated test |
| AC2-AC3 | `yourwolf-frontend/src/engine/`; `yourwolf-frontend/src/domain/wakeOrder.ts` | Must-have automated test |
| AC5 | `yourwolf-frontend/src/engine/`; `yourwolf-backend/app/services/narration/script_builder.py`; `yourwolf-backend/app/services/script_service.py` | Must-have automated test |
| AC6-AC8 | `yourwolf-backend/app/seed/data/roles.json`; `yourwolf-frontend/src/test/engine/` | Must-have automated test; code-review evidence only |
| AC9 | `yourwolf-frontend/src/test/engine/`; `yourwolf-frontend/vite.config.ts` | Must-have automated test |

## B. Correctness & Edge Cases

- No waking roles still produce the opening and closing narrator actions.
- Duplicate role instances produce one role block per unique role id.
- Partial custom sequences never inherit incidental input or database order for unnamed roles.
- An unknown id in the sequence does not suppress or reorder valid roles except through the defined named-role positions.
- A repeated id uses its last sequence index when the sorter is called directly, even though session creation rejects duplicate sequences.
- Unknown ability steps, including `constructor`, `toString`, and `__proto__`, add no action and no duration.
- Null and zero wake-order roles produce empty previews.
- Do not mutate roles, steps, custom sequences, or fixture data.
- No retries, timeouts, or concurrency handling applies because the feature is synchronous and local.

## C. Consistency & Architecture Fit

- Consume the verified `EngineRoleInput`, `EngineAbilityStepInput`, `NarratorAction`, and `NarratorPreviewAction` contracts from `yourwolf-frontend/src/engine/types.ts`.
- Reuse the verified `buildWakeInstruction`, `buildStepInstruction`, and `getStepDuration` functions from `yourwolf-frontend/src/engine/templates.ts`. Treat `undefined` from `buildStepInstruction` as the only supported unknown-step signal, and skip that step before duration calculation. Do not add a second `OR` prefix in the assembly layer.
- Reuse the semantic filtering precedent in verified `collectWakingRoles`, but do not reuse its tie behavior because it preserves input order and Phase 04a requires role-name tie-breaking.
- Preserve the verified Python contracts `build_role_script`, `build_night_script_actions`, `build_preview_actions`, and `total_duration_seconds` semantically.
- New public names remain `[PROPOSED - name TBD]`: `[PROPOSED - name TBD] sortWakingRoles`, `[PROPOSED - name TBD] buildRoleScript`, `[PROPOSED - name TBD] buildNightScript`, `[PROPOSED - name TBD] buildPreview`, and `[PROPOSED - name TBD] totalDurationSeconds`.
- Expected new module path is `[PROPOSED - name TBD] yourwolf-frontend/src/engine/narration.ts`.
- Expected fixture paths are `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/night-script.fixture.json` and `[PROPOSED - name TBD] yourwolf-frontend/src/test/engine/preview.fixture.json`.

## D. Clean Design & Maintainability

- Keep sorting, assembly, and duration calculation as small pure functions in one cohesive narration module unless implementation evidence earns a split.
- Explicitly de-duplicate by role id. The Python database query's implicit row uniqueness does not transfer to an in-memory TypeScript array.
- Keep fixture expectations static. Tests must never generate expected output from the TypeScript implementation under test.
- Keep it clean:
  - Use stable sorting rules stated in the phase.
  - Keep opening, closing, wake, and close-eye constants local to narration.
  - Avoid a fixture-generation framework or committed generator.
  - Avoid adapters for `RoleDraft` or `PreviewScriptRequest`.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. Deterministic return values and exact fixture diffs provide the useful diagnostic surface.
- **Security:** Treat fixture generation as a local development step over committed seed data. Do not execute data-derived code or access a network.
- **Runbook:** Run phase-scoped parity tests, then full frontend test, lint, build, and coverage commands. Roll back by removing the narration module and its engine-only tests and fixtures. Monitor CI fixture diffs and coverage rows.

## F. Test Plan

- Transcribe script assembly behaviors from `tests/test_script_service.py`, including direct unknown-step cases that prove inherited object-property names add no action or duration. **Must-have automated test.** Covers AC1, AC4, and AC5.
- Pin every default and custom ordering edge with literal role inputs. **Must-have automated test.** Covers AC2-AC3.
- Compare all 30-role default/custom scripts to the committed Python-generated fixture. **Must-have automated test.** Covers AC6 and AC8.
- Compare all 30 previews, including empty arrays, to the committed Python-generated fixture. **Must-have automated test.** Covers AC7-AC8.
- Inspect all `src/engine/` coverage rows for the four 90 percent measures. **Must-have automated test.** Covers AC9.

Top five high-value checks:

1. Given tied waking roles in shuffled input, when default-sorted, then their names provide deterministic order.
2. Given a partial custom sequence with an unknown and repeated id, when sorted, then last-position, ignore, and unnamed fallback rules all hold.
3. Given duplicate role instances and unknown ability steps including inherited object-property names, when generating a script, then one role block appears and unknown steps change neither actions nor duration.
4. Given all seed roles, when generating default and complete-custom scripts, then the committed Python fixture matches exactly.
5. Given each seed role, when generating a preview, then the committed fixture matches, including section headers and empty previews.

Test data includes small literal engine roles and the two committed JSON fixtures. The fixture-generation step uses the verified Python builders and seed JSON without a database. No mocks, DOM, or server are required.

## Stage 1: Deterministic Ordering and Assembly
**Goal**: Build script ordering, role blocks, filtering, de-duplication, and duration behavior over Feature 01 contracts.
**Success Criteria**: AC1 through AC4 pass through focused automated tests.
**Status**: Not Started

## Stage 2: Preview and Python Fixtures
**Goal**: Port preview behavior and establish one-time Python-generated seed parity fixtures.
**Success Criteria**: AC5 through AC8 pass against committed fixture data.
**Status**: Not Started

## Stage 3: Verification
**Goal**: Prove every edge case, full-suite compatibility, and phase coverage.
**Success Criteria**: AC9 passes with no caller or configuration changes.
**Status**: Not Started
