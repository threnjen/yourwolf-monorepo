# 03m — Finding Consolidator Candidates (PHASE_04A)

- **Consolidator:** `03m-finding-consolidator`
- **Reviewed range:** `aa8c4814fa92395e75efd21d6764da0c4493e257`..`989a3591b57b4d341286b55d295415af5d1af6a4`
- **Status:** **COMPLETE for consolidation**
- **Disposition:** This is a candidate list, not a fix list. No candidate is adjudicated here.

## Source reports

| Report | Source lane | State | Findings represented |
|---|---|---|---:|
| `dev/feature/PHASE_04A-phase-close/03j-reviewer-blast-radius-report.md` | `blast-radius` | Incomplete coverage; four findings | 4 |
| `dev/feature/PHASE_04A-phase-close/03k-reviewer-test-falsification-report.md` | `test-falsification` | Needs-fix; four findings | 4 |
| `dev/feature/PHASE_04A-phase-close/03l-reviewer-plan-blind-report.md` | `plan-blind` | No-go for production use; six findings | 6 |
| `dev/feature/PHASE_04A-phase-close/04h-cleanliness-auditor-report.md` | `cleanliness` | Complete; four findings | 4 |
| `dev/feature/PHASE_04A-phase-close/04d-consistency-auditor-report.md` | `consistency` | Findings — alignment required; four findings | 4 |
| `dev/feature/PHASE_04A-phase-close/04f-test-health-report.md` | `test-health` | **INCOMPLETE** hand-off, no per-finding severity | 1 report-level candidate |
| `dev/feature/PHASE_04A-security.md` | `security` | PASS, no supported finding | 0 |

The conditional dependency and Unity lanes did not fire. No candidate is included from either
lane.

## Normalization and deduplication

1. Every candidate is filed in the `consolidation` lane. The source lanes, source finding IDs,
   evidence citations, and reviewer names remain in each candidate.
2. Severity is normalized to `Critical`, `High`, `Medium`, or `Low`. The highest supplied
   severity is retained when a candidate merges reports.
3. `04f` supplies incomplete-evidence labels rather than a per-finding severity. Its
   report-level candidate is normalized to `Medium` solely to retain the incomplete hand-off as
   a candidate. This is bookkeeping, not a validity decision.
4. A Medium or Low candidate is `carry-forward`, including a production, verification, or
   scope-sensitive claim. The underlying claim type remains explicit in the finding text and
   evidence.
5. The merged High no-caller claim is a preliminary `scope-candidate` because its source
   evidence places the application caller and integration path outside this 04a unit. The High
   test-power claim is a `verification-candidate`. No candidate is a fix authorization.
6. Reports are merged only when they describe the same underlying claim. The no-production-caller
   claims in `03j BR-001` and `03l` finding 1 are one candidate. Phase-transition setup semantics,
   wake-progress state, stale parity wording, and phase-document status drift remain separate
   claims even where they cite a related phase-summary location.

## Accounting

| Measure | Count |
|---|---:|
| Explicit severity-rated report findings read | 22 |
| Additional report-level incomplete `04f` hand-off | 1 |
| Candidate inputs before deduplication | 23 |
| Deduplicated candidates | 22 |
| Critical | 0 |
| High | 2 |
| Medium | 12 |
| Low | 8 |

| Candidate class | Count |
|---|---:|
| `production-candidate` | 0 |
| `verification-candidate` | 1 |
| `scope-candidate` | 1 |
| `carry-forward` | 20 |

| Contributing source lane | Candidate rows |
|---|---:|
| `blast-radius` | 4 |
| `test-falsification` | 4 |
| `plan-blind` | 6 |
| `cleanliness` | 4 |
| `consistency` | 4 |
| `test-health` | 1 |
| `security` | 0 |

Source-lane totals count a multi-lane candidate once in each contributing lane and therefore
exceed the deduplicated total.

## Cross-lane duplicate groups

| Consolidated candidate | Source findings | Deduplication basis |
|---|---|---|
| `C-01` | `03j BR-001`; `03l` finding 1 | Both reports identify the absence of a production caller and end-to-end application path for the new engine. The distinct graph, caller-scan, test, and manifest citations are retained together. |

The following apparent overlaps are not merged: `03j BR-003` concerns the engine/backend setup
transition contract, while `03l` finding 4 concerns the engine's wake-progress state. `04h C10-1`
concerns a stale Python-parity statement, while `04d CONS-001` and `CONS-002` concern phase-summary
form and lifecycle status. `03j BR-002` concerns the missing transport-to-engine conversion
boundary, while `04d CONS-004` concerns a forwarding type export.

## Candidates

### C-01 — New engine exports have no production caller or end-to-end application path

- **candidate_id:** `C-01`
- **severity:** `High`
- **lane:** `consolidation`
- **source_lanes:** `blast-radius / plan-blind`
- **finding:** 03j and 03l claim that the new session, setup-validation, narration, and template
  exports are reachable only from focused engine tests in the reviewed range. The application
  setup, wake-order, and facilitator paths still use the existing API clients, and no Phase 04b
  adapter or integration path reaches the new engine.
- **evidence:** `03j BR-001` (Medium) cites `yourwolf-frontend/src/engine/gameSession.ts:48-104`,
  `gameSetupValidation.ts:27-107`, and `narration.ts:49-180` for the added exports; its graph
  analysis reports zero affected flows and its repository scan finds only engine-test imports.
  It cites the existing setup path at `yourwolf-frontend/src/hooks/useGameSetup.ts:30-60`,
  `src/pages/WakeOrderResolution.tsx:118-129`, and `src/pages/GameFacilitator.tsx:208-228`,
  the mocked API suites at `src/test/pages/WakeOrderResolution.test.tsx:257-281` and
  `src/test/pages/GameFacilitator.test.tsx:162-180,210-228,242-260`, and the execution manifest's
  absent Phase 04b integration/manual checks at `dev/feature/PHASE_04A-execution-manifest.md:177-179`.
  `03l` finding 1 (High) independently cites `gameSession.ts:1-8`, graph importer results that
  resolve only to engine tests, and `get_affected_flows` reporting zero flows for the changed
  engine files.
- **reviewers:** `03j-reviewer-blast-radius`; `03l-reviewer-plan-blind`
- **candidate_class:** `scope-candidate`
- **underlying:** scope and integration-evidence claim

### C-02 — Public-shape test does not observe production output

- **candidate_id:** `C-02`
- **severity:** `High`
- **lane:** `consolidation`
- **source_lanes:** `test-falsification`
- **finding:** 03k claims that the public-shape test constructs local `EngineRoleInput`,
  `EngineAbilityStepInput`, action, and preview-action literals and compares their keys without
  calling an engine function. Removing runtime construction or output fields while leaving the
  exported types available can therefore leave the test green.
- **evidence:** `03k TF-001` cites `yourwolf-frontend/src/test/engine/templates.test.ts:275-320`,
  where the four object literals are created inside the test and compared with hard-coded key
  arrays. The report notes that `Object.keys(...).toEqual(...)` also pins insertion order and
  observes no production return value.
- **reviewers:** `03k-reviewer-test-falsification`
- **candidate_class:** `verification-candidate`
- **underlying:** test-power and public-contract evidence claim

### C-03 — Existing role DTOs have no tested conversion to the engine contract

- **candidate_id:** `C-03`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `blast-radius`
- **finding:** 03j claims that the existing transport role DTOs do not have a tested conversion to
  the engine input contract. The list DTO omits `wake_target` and `ability_steps`, the full role
  DTO omits count and primary-team metadata, dependency entries omit `role_id`, and omitted
  `wake_order` can be forwarded as `undefined` even though engine helpers use explicit `null` for
  non-waking roles.
- **evidence:** `03j BR-002` cites `yourwolf-frontend/src/engine/types.ts:5-24` for required
  `EngineRoleInput` fields; `src/types/transport.ts:94-110` for the list DTO omissions,
  `:42-59` for the full-role omissions, and `:86-92` for dependency entries without `role_id`.
  It cites `src/test/mocks.ts:63-83` for converting `null` wake order to `undefined`, and the
  engine handling at `src/engine/narration.ts:33-43`, `gameSetupValidation.ts:187-200`, and
  `narration.ts:159-162`. The report contrasts those with explicit `null` fixtures at
  `src/test/engine/narration.test.ts:29-44,213-216`, notes that no adapter or caller test
  exercises the conversion, and cites the separate engine/transport `GameSession`, `GamePhase`,
  and `NarratorAction` shapes at `src/engine/gameSession.ts:10-36`, `src/engine/types.ts:27-40`,
  `src/types/game.ts:1-58`, and `src/api/games.ts:1-32`.
- **reviewers:** `03j-reviewer-blast-radius`
- **candidate_class:** `carry-forward`
- **underlying:** transport-boundary verification claim

### C-04 — Engine and backend phase advancement have different setup behavior

- **candidate_id:** `C-04`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `blast-radius`
- **finding:** 03j claims that the engine rejects `advancePhase` from `setup`, while the backend
  service checks only the terminal `complete` phase and can advance from `setup`. No current
  application path compares these semantics or asserts the cross-boundary behavior.
- **evidence:** `03j BR-003` cites `yourwolf-frontend/src/engine/gameSession.ts:89-98` for the
  engine rejection and `yourwolf-backend/app/services/game_service.py:165-180` for the backend
  check. It cites the separate UI `gamesApi.start` and `gamesApi.advancePhase` calls at
  `yourwolf-frontend/src/pages/GameFacilitator.tsx:208-228`, the URL-only client assertion at
  `src/test/api/games.api.test.ts:92-103`, and backend advancement tests starting from a started
  game at `yourwolf-backend/tests/test_game_service.py:196-225`.
- **reviewers:** `03j-reviewer-blast-radius`
- **candidate_class:** `carry-forward`
- **underlying:** cross-boundary behavior claim

### C-05 — Engine setup values are broader than the backend schema

- **candidate_id:** `C-05`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `blast-radius`
- **finding:** 03j claims that engine setup inputs expose unconstrained numeric values while the
  backend create schema constrains player count, center-card count, and discussion-timer bounds.
  The engine checks role totals but has no caller or adapter boundary test for the backend limits.
- **evidence:** `03j BR-004` cites `yourwolf-backend/app/schemas/game.py:11-18` for the backend
  bounds, `yourwolf-frontend/src/engine/gameSetupValidation.ts:11-18` for unconstrained engine
  fields and `:30-35` for the role-total-only check, and `src/engine/gameSession.ts:60-68` for
  copying values unchanged. It cites in-range fixtures at
  `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:86-95` and
  `src/test/engine/gameSession.test.ts:63-74`, and states that no engine or integration suite
  exercises the backend lower and upper bounds.
- **reviewers:** `03j-reviewer-blast-radius`
- **candidate_class:** `carry-forward`
- **underlying:** schema-boundary verification claim

### C-06 — Wake-order normalization is exercised only with strings

- **candidate_id:** `C-06`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `test-falsification`
- **finding:** 03k claims that the test named for wake-order normalization supplies an array of
  strings and expects the identical array. It does not exercise a runtime non-string sequence or
  observe a transformed result.
- **evidence:** `03k TF-002` cites `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:112-118`,
  where `['ww', 'robber', 'seer', 'insomniac']` is supplied and returned unchanged. The report
  states that removing string coercion or another normalization step can survive this test.
- **reviewers:** `03k-reviewer-test-falsification`
- **candidate_class:** `carry-forward`
- **underlying:** test-power and normalization-evidence claim

### C-07 — Injected ID dependency is a self-configured mock without a call assertion

- **candidate_id:** `C-07`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `test-falsification`
- **finding:** 03k claims that the deterministic-ID test passes two callbacks returning the same
  literal and checks only equality of the resulting sessions. The test does not prove that the
  injected callback was invoked or that ambient ID generation is absent.
- **evidence:** `03k TF-003` cites `yourwolf-frontend/src/test/engine/gameSession.test.ts:153-157`,
  where both callbacks return the same literal and only the two sessions' equality is asserted.
  The report states that an implementation ignoring `id_generator` and emitting any deterministic
  constant can satisfy the assertion.
- **reviewers:** `03k-reviewer-test-falsification`
- **candidate_class:** `carry-forward`
- **underlying:** dependency-injection test-power claim

### C-08 — Caller-mutation checks use incomplete and shallow snapshots

- **candidate_id:** `C-08`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `test-falsification`
- **finding:** 03k claims that the valid-session mutation test omits the owned `roles` and
  `dependencies` collections, while the transition snapshots shallow-copy nested arrays. A
  mutation of an omitted collection or a nested array on a rejected transition can therefore
  survive the checks.
- **evidence:** `03k TF-004` cites `yourwolf-frontend/src/test/engine/gameSession.test.ts:144-151`,
  where only `role_ids` and `wake_order_sequence` are snapshotted, and `:192-208`, where
  `{...started}` and `{...setup}` leave nested `warnings` and `role_ids` shared. It also cites
  the broader invalid-create serialization at `:159-179` and states that it does not close the
  valid-path gap.
- **reviewers:** `03k-reviewer-test-falsification`
- **candidate_class:** `carry-forward`
- **underlying:** immutability test-power claim

### C-09 — Unsupported ability steps disappear from the generated night script

- **candidate_id:** `C-09`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `plan-blind`
- **finding:** 03l claims that the narration builder skips an action when no template exists for
  an ability type. A role containing an unsupported, misspelled, or newer ability type can thus
  produce a playable-looking script with that action omitted and no warning or exception.
- **evidence:** `03l` finding 2 cites `yourwolf-frontend/src/engine/narration.ts:95-100`, where
  `buildStepInstruction` returning `undefined` causes a `continue`, and `src/engine/templates.ts:197-207`,
  where absent template entries return `undefined`. It cites the expected wake/close-only result
  for unknown ability names at `yourwolf-frontend/src/test/engine/narration.test.ts:145-158` and
  the direct `undefined` expectation at `src/test/engine/templates.test.ts:240-248`.
- **reviewers:** `03l-reviewer-plan-blind`
- **candidate_class:** `carry-forward`
- **underlying:** production behavior claim

### C-10 — Wake-sequence validation disagrees with narration about negative wake orders

- **candidate_id:** `C-10`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `plan-blind`
- **finding:** 03l claims that setup validation treats every non-null, non-zero wake order as
  waking, while narration excludes every wake order less than or equal to zero. A selected role
  with `wake_order: -1` and a custom sequence containing its ID can therefore validate but be
  omitted from the generated night narration.
- **evidence:** `03l` finding 3 cites `yourwolf-frontend/src/engine/gameSetupValidation.ts:187-191`
  for the validation classification and `src/engine/narration.ts:37-43` for the narration filter.
  It cites tests covering `null` and `0` as non-waking at
  `yourwolf-frontend/src/test/engine/narration.test.ts:66-68,213-216`, with no negative-value case.
- **reviewers:** `03l-reviewer-plan-blind`
- **candidate_class:** `carry-forward`
- **underlying:** cross-function behavior claim

### C-11 — Phase transitions leave wake progress permanently at zero

- **candidate_id:** `C-11`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `plan-blind`
- **finding:** 03l claims that session start sets `current_wake_order` to `0` and every later
  transition changes only the phase, leaving wake progress at zero through completion. The exposed
  state has no transition connecting the night phase to generated-script progress.
- **evidence:** `03l` finding 4 cites `yourwolf-frontend/src/engine/gameSession.ts:77-85` for the
  start state and `:89-103` for later transitions. It cites
  `yourwolf-frontend/src/test/engine/gameSession.test.ts:231-246`, which verifies that the value
  remains `0` after the session reaches `complete`.
- **reviewers:** `03l-reviewer-plan-blind`
- **candidate_class:** `carry-forward`
- **underlying:** production state-model claim

### C-12 — Unknown wake targets fail open to the role itself

- **candidate_id:** `C-12`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `plan-blind`
- **finding:** 03l claims that unknown or malformed wake targets fall back to a self-wake
  instruction rather than surfacing an invalid target. The report says this can silently direct a
  role holder to wake instead of preserving the intended group or role target.
- **evidence:** `03l` finding 5 cites `yourwolf-frontend/src/engine/templates.ts:174-195`, where
  falsy targets use `player.self`, known targets are handled specially, and all other values use
  `${role.name}, wake up.`. It cites `yourwolf-frontend/src/test/engine/templates.test.ts:42-56`,
  which expects `team.unknown`, `garbage`, and an empty target to resolve to the self-wake
  instruction.
- **reviewers:** `03l-reviewer-plan-blind`
- **candidate_class:** `carry-forward`
- **underlying:** production behavior claim

### C-13 — Team thumbs-up narration contains a user-visible spelling defect

- **candidate_id:** `C-13`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `plan-blind`
- **finding:** 03l claims that the team thumbs-up narration emits the misspelled `Werewolfs`
  spelling for werewolf players and previews.
- **evidence:** `03l` finding 6 cites `yourwolf-frontend/src/engine/templates.ts:110-115`, where
  the singular team name receives an appended `s` and the spelling is marked frozen. It cites
  `yourwolf-frontend/src/test/engine/templates.test.ts:121-123` and
  `yourwolf-frontend/src/test/engine/preview.fixture.json:114-123`, which preserve the emitted
  text `Werewolfs, put your thumbs out.`.
- **reviewers:** `03l-reviewer-plan-blind`
- **candidate_class:** `carry-forward`
- **underlying:** production copy claim

### C-14 — Phase summary overstates Python implementation identity

- **candidate_id:** `C-14`
- **severity:** `Medium`
- **lane:** `consolidation`
- **source_lanes:** `cleanliness`
- **finding:** 04h claims that the phase summary calls the TypeScript engine identical to the
  Python implementation even though the branch intentionally tightens setup-phase transitions
  and makes default wake-order ties deterministic.
- **evidence:** `04h C10-1` cites `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:10` for “second,
  identical implementation” and `:18` for “proven identical to the Python output”. It cites the
  setup-transition difference at `yourwolf-frontend/src/engine/gameSession.ts:89-95` and the
  summary's own deviation notes at `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:28,30`. It also
  cites deterministic name tie-breaking at `yourwolf-frontend/src/engine/narration.ts:27-30` and
  the Python incidental tie behavior documented at `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:28,58`.
- **reviewers:** `z-cleanliness-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** documentation contract claim

### C-15 — Engine test modules duplicate input construction

- **candidate_id:** `C-15`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `cleanliness`
- **finding:** 04h claims that the added engine test modules repeat near-identical
  `EngineRoleInput` construction and that the narration and template tests repeat
  `EngineAbilityStepInput` construction. The factories use different defaults, creating a test
  fixture-drift risk.
- **evidence:** `04h C3-1` cites `yourwolf-frontend/src/test/engine/gameSession.test.ts:13-28`,
  `gameSetupValidation.test.ts:11-26`, `narration.test.ts:29-44`, and `templates.test.ts:27-40`
  for repeated role factories. It cites `narration.test.ts:46-58` and `templates.test.ts:15-25`
  for the repeated step factories and notes differing defaults such as `wake_target` and
  `min_count`.
- **reviewers:** `z-cleanliness-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** test-maintenance claim

### C-16 — Role-target display conversion is repeated in two renderers

- **candidate_id:** `C-16`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `cleanliness`
- **finding:** 04h claims that two template renderers independently implement the same
  role-target-to-display-name conversion expression.
- **evidence:** `04h C4-1` cites `yourwolf-frontend/src/engine/templates.ts:117` and `:191`,
  where both renderers use `target.split('role.').join('').split('_').join(' ')`.
- **reviewers:** `z-cleanliness-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** duplicated-expression claim

### C-17 — Wake-sequence membership set is constructed twice

- **candidate_id:** `C-17`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `cleanliness`
- **finding:** 04h claims that `validateWakeSequence` constructs a `Set` from the same immutable
  sequence once for duplicate detection and again for missing-role membership checks.
- **evidence:** `04h C8-1` cites `yourwolf-frontend/src/engine/gameSetupValidation.ts:175` for
  the first `new Set(sequence)` and `:202` for the second. It cites the exact duplicate, extra,
  missing, empty, and non-waking sequence cases at
  `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:303-363`.
- **reviewers:** `z-cleanliness-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** duplicated-computation claim

### C-18 — Phase summary uses a nonstandard heading set and order

- **candidate_id:** `C-18`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `consistency`
- **finding:** 04d claims that the new phase summary introduces headings and ordering that differ
  from the established phase-summary form, including `What's New`, `Problem`,
  `Edge Cases & Failure Modes`, and `Notes for Phase - Execute`.
- **evidence:** `04d CONS-001` cites `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:8-14`,
  `:66-85`, and `:114-123` for the added headings and order. It compares them with the established
  sequence in `docs/phases/PHASE_3.6/PHASE_3.6_SUMMARY.md:8-12,30-40,51-56,66-73`.
- **reviewers:** `04d-consistency-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** documentation-form claim

### C-19 — Phase-level status surfaces disagree

- **candidate_id:** `C-19`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `consistency`
- **finding:** 04d claims that the phase summary, roadmap, README, and execution manifest expose
  conflicting lifecycle states. The summary says `Planned` with unchecked criteria while the
  manifest records completion, and the roadmap surfaces remain `Next` or `Planned`.
- **evidence:** `04d CONS-002` cites `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:3,92-106` for
  `Planned` and unchecked criteria, `dev/feature/PHASE_04A-execution-manifest.md:28-32,139-148`
  for completed feature and implementation entries, and `README.md:103-105` plus
  `docs/phases/PROJECT_ROADMAP.md:17-18` for the remaining `Next`/`Planned` states. It compares
  those with the completed-phase form at `docs/phases/PHASE_3.6/PHASE_3.6_SUMMARY.md:3,56-64`.
- **reviewers:** `04d-consistency-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** lifecycle-status documentation claim

### C-20 — Engine test modules mix Vitest declaration vocabulary

- **candidate_id:** `C-20`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `consistency`
- **finding:** 04d claims that the new engine suites mix `test(...)` and `it(...)` declarations,
  unlike the established neighboring domain suites.
- **evidence:** `04d CONS-003` cites `yourwolf-frontend/src/test/engine/gameSession.test.ts:1,81`,
  `gameSetupValidation.test.ts:1,108`, and `templates.test.ts:1,213` for `test(...)`, and
  `narration.test.ts:1,61` for `it(...)`. It compares the vocabulary with
  `yourwolf-frontend/src/test/domain/abilitySteps.test.ts:46-52` and
  `src/test/domain/wakeOrder.test.ts:23-26`.
- **reviewers:** `04d-consistency-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** test-convention claim

### C-21 — `gameSession.ts` forwards a type outside its defining module

- **candidate_id:** `C-21`
- **severity:** `Low`
- **lane:** `consolidation`
- **source_lanes:** `consistency`
- **finding:** 04d claims that `gameSession.ts` re-exports `RoleDependencyInput` from
  `gameSetupValidation.ts`, creating a compatibility seam outside the type's defining module.
- **evidence:** `04d CONS-004` cites `yourwolf-frontend/src/engine/gameSession.ts:1-8` for the
  import and forwarding export. It compares the pattern with direct defining-module imports at
  `yourwolf-frontend/src/domain/wakeOrder.ts:9-14` and
  `yourwolf-frontend/src/test/domain/wakeOrder.test.ts:9-10`, and cites the retired re-export
  decision at `docs/learnings/cross-phase-decisions.md:85`.
- **reviewers:** `04d-consistency-auditor`
- **candidate_class:** `carry-forward`
- **underlying:** module-boundary convention claim

### C-22 — Test-health hand-off is incomplete

- **candidate_id:** `C-22`
- **severity:** `Medium` *(normalized from 04f's incomplete-evidence labels; no per-finding severity was supplied)*
- **lane:** `consolidation`
- **source_lanes:** `test-health`
- **finding:** 04f reports an incomplete test-health hand-off. Paired base/HEAD coverage evidence
  and the three required `z-test-analyst` files are absent, so the coverage delta, test-redundancy,
  and flake checks were not run. The report emits no separate branch-introduced test-health
  finding.
- **evidence:** `04f` identifies missing analyst files and paired coverage reports in
  `dev/feature/PHASE_04A-phase-close/04f-test-health-report.md:31-47`, and records the
  `NOT-MEASURABLE` coverage result at `:49-63`. It records redundancy and flake outcomes as
  `NOT RUN` at `:65-115`, and lists the missing artifacts, absent baseline worktree, and required
  follow-up in `:120-145`. The report labels the hand-off `INCOMPLETE` at `:5-13,23-24` and
  concludes that no branch-introduced test-health finding is emitted at `:116-118,141-145`.
- **reviewers:** `z-test-health`
- **candidate_class:** `carry-forward`
- **underlying:** verification-evidence claim

## Security and conditional-lane disposition

`dev/feature/PHASE_04A-security.md` reports PASS with zero Critical, High, Medium, or Low security
findings. Its not-assessable section records that downstream adapters, runtime trust boundaries,
storage, network, dependencies, and repository-wide secrets were outside this diff-only scan. No
security candidate is included. The dependency and Unity lanes were conditional and did not fire.
