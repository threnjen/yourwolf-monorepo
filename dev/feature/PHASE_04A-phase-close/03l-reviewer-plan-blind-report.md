# Plan-blind behavior report — Phase 04A

- **Revision reviewed:** `aa8c4814fa92395e75efd21d6764da0c4493e257..989a3591b57b4d341286b55d295415af5d1af6a4`
- **Scope:** `dev/feature/PHASE_04A-phase-close/code-tests.diff` and the changed engine source and test files named by that diff.
- **Verdict:** **NO-GO for production use.** The supplied tests pass, but the new engine has no resolved production caller, and several accepted metadata cases produce incomplete or misleading game behavior.

## Exposed behavior

- `validateGameSetup` throws `Error` values in a fixed order: total card count, unknown role IDs, per-role card limits, missing primary team roles, required dependencies, then an optional wake-sequence check. Missing recommended dependencies become warning strings.
- `createGameSession` validates before invoking `id_generator`, copies the selected IDs, warnings, and optional wake sequence, and returns a `setup` session. `startGame` changes only `phase` to `night` and sets `current_wake_order` to `0`. `advancePhase` walks `night → discussion → voting → resolution → complete` and throws for `setup`, `complete`, or an invalid runtime phase.
- `sortWakingRoles` removes non-positive/null wake orders and duplicate IDs, then uses either the custom sequence or wake order/name sorting. `buildNightScript` always emits opening and closing narrator actions, skips unsupported ability steps, and uses five seconds for an unknown duration. `buildPreview` returns no actions for non-positive/null wake orders and appends a copied-role section for `perform_immediately` or `perform_as` steps.
- Unknown or malformed wake targets fall back to waking the role itself. Several template parameters also fall back to generic wording. The team thumbs-up template emits the literal `Werewolfs` spelling.
- Failure is exception-based. A failed setup does not call the ID generator or return a partial session. Successful session transitions return new top-level objects, while invalid transitions leave the input object unchanged.

## Executed evidence

- `./node_modules/.bin/vitest run src/test/engine/gameSession.test.ts src/test/engine/gameSetupValidation.test.ts src/test/engine/narration.test.ts src/test/engine/templates.test.ts`: **4 files passed, 144 tests passed**.
- `./node_modules/.bin/tsc --noEmit`: **passed with exit code 0**.
- `git diff --check aa8c4814fa92395e75efd21d6764da0c4493e257..989a3591b57b4d341286b55d295415af5d1af6a4`: **passed**.
- Code-review graph at head `989a3591b57b4d341286b55d295415af5d1af6a4`: `get_affected_flows` reported **0 flows**, `get_impact_radius` reported **0 impacted nodes / 0 additional files**, and importers for the new engine modules resolved only to the new engine files and tests. The graph warned that npm-aliased imports can be missing, so this reachability result is based on the direct imports visible in the changed tree.

## Findings

### 1. The new engine is test-only and not reachable from the application

- **severity:** High
- **lane:** plan-blind
- **evidence:** `gameSession.ts:1-8` imports only setup validation. Graph `importers_of` found only `gameSession.test.ts` and `gameSetupValidation.test.ts` for `gameSession.ts`, only `narration.test.ts` for `narration.ts`, and only `narration.ts` plus `templates.test.ts` for `templates.ts`. Graph `get_affected_flows` found zero flows for all 11 changed files. The changed-file diff contains the engine modules and their tests, with no production caller.
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** The behavior described above can be exercised by tests, but no application execution path invokes session creation, transitions, narration, or template generation.

### 2. Unsupported ability steps disappear from the generated night script

- **severity:** Medium
- **lane:** plan-blind
- **evidence:** `narration.ts:95-100` continues without adding an action when `buildStepInstruction` returns `undefined`. `templates.ts:197-207` returns `undefined` for every ability type absent from `TEMPLATES`. `narration.test.ts:145-158` locks the result to only wake/close actions for three unknown ability names, and `templates.test.ts:240-248` locks the direct result to `undefined`.
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** A role containing an unsupported, misspelled, or newer ability type produces a playable-looking script with that action omitted and no warning or exception. Required game actions can therefore be silently skipped.

### 3. Wake-sequence validation disagrees with narration about negative wake orders

- **severity:** Medium
- **lane:** plan-blind
- **evidence:** `gameSetupValidation.ts:187-191` classifies every non-null, non-zero `wake_order` as waking. `narration.ts:37-43` excludes every `wake_order <= 0`. A selected role with `wake_order: -1` and a custom sequence containing its ID can therefore pass `validateGameSetup` but be omitted by `buildNightScript`. Tests cover `null` and `0` as non-waking (`narration.test.ts:66-68`, `213-216`) but do not cover negative values.
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** A setup can validate a role as present in the wake sequence while the generated narration never wakes that role.

### 4. Phase transitions leave wake progress permanently at zero

- **severity:** Medium
- **lane:** plan-blind
- **evidence:** `gameSession.ts:77-85` sets `current_wake_order` to `0` at start. `gameSession.ts:89-103` changes only `phase` during every later transition and spreads the existing `current_wake_order`. `gameSession.test.ts:231-246` verifies that the value is still `0` after the session reaches `complete`.
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** The exposed session state has no observable wake-role progress and no transition that connects the night phase to the generated script. Consumers cannot derive current wake progress from this state.

### 5. Unknown wake targets fail open to the role itself

- **severity:** Medium
- **lane:** plan-blind
- **evidence:** `templates.ts:174-195` replaces falsy targets with `player.self`, handles a few known team/role targets, and returns `${role.name}, wake up.` for every other value. `templates.test.ts:42-56` explicitly expects `team.unknown`, `garbage`, and an empty target to resolve to the self-wake instruction.
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** A malformed or newly introduced wake target does not fail setup or surface a warning. It silently instructs the role holder to wake instead of preserving the intended group or role target.

### 6. The team thumbs-up narration contains a user-visible spelling defect

- **severity:** Low
- **lane:** plan-blind
- **evidence:** `templates.ts:110-115` appends `s` to the singular team name and comments that the `Werewolfs` spelling is frozen. `templates.test.ts:121-123` and `preview.fixture.json:114-123` preserve the emitted text `Werewolfs, put your thumbs out.`
- **reviewer:** 03l-reviewer-plan-blind
- **impact:** Werewolf players receive the misspelled team name in generated narration and previews.
