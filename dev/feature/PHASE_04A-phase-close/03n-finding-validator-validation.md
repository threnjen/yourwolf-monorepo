# 03n — Finding Validator Validation (PHASE_04A)

## Decision

- review_cycle: repair-01
- reviewed_range: aa8c4814fa92395e75efd21d6764da0c4493e257..989a3591b57b4d341286b55d295415af5d1af6a4
- head_commit: 989a3591b57b4d341286b55d295415af5d1af6a4
- validation_lane: validation
- convergence: Pass
- confirmed_serious_production_findings: 0
- fix_list_entries: 0
- carry_forward_verification_blockers: C-02, C-07, C-08

The first full post-rebuild validation returns Pass. No Critical, Blocker, or High
candidate proves a shipped production defect on an accepted PHASE_04A path. Three
test-power claims remain Medium verification blockers for final review. They do not
authorize repairs.

## Scope and evidence basis

This validation reads and uses the following artifacts:

- Candidate list: dev/feature/PHASE_04A-phase-close/03m-finding-consolidator-candidates.md.
- Eligible raw reports: 03j-reviewer-blast-radius-report.md,
  03k-reviewer-test-falsification-report.md, and
  03l-reviewer-plan-blind-report.md.
- Eligible security report: dev/feature/PHASE_04A-security.md. It reports PASS with
  zero findings in the z-diff-security-scan lane.
- Accepted contract: docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md.
- Accepted feature plans: the plans under dev/feature/01-engine-types-templates,
  dev/feature/02-narration-scripts-preview, and
  dev/feature/03-game-session-state-machine.
- Implementation records: the three feature implementation records under those
  feature directories.
- Changed code and tests: the files listed by dev/feature/changed-files.txt and
  the PHASE_04A range in dev/feature/range.diff.
- Run evidence: /tmp/phase04a-orchestrator-final-feature-frontend.xml and
  /tmp/phase04a-orchestrator-final-feature-backend.xml.

The validator considered only candidates originating from these repair-eligible
source lanes:

- z-diff-security-scan
- z-reviewer-blast-radius
- z-reviewer-test-falsification
- z-reviewer-plan-blind

The four cleanliness candidates, four consistency candidates, the test-health
hand-off candidate, and unfired conditional lanes are outside this validation
scope. They are not repairs or validation findings here.

The accepted PHASE_04A contract explicitly defines an engine-only package with no
production callers. Phase 04b owns transport adaptation, API caller replacement,
runtime integration, routing, refresh behavior, and end-to-end manual checks.
The accepted plans also explicitly preserve the frozen Werewolfs copy, skip
unknown ability steps, reject advance from setup, keep scalar bounds at the
transport boundary, set current_wake_order to zero at start, and omit wake-index
advancement in this phase. Those are supported-path constraints used below.

## Candidate accounting

| Source lane | Candidate rows | Deduplicated candidates in this validation |
|---|---:|---:|
| z-diff-security-scan | 0 | 0 |
| z-reviewer-blast-radius | 4 | 4 contributing rows |
| z-reviewer-test-falsification | 4 | 4 |
| z-reviewer-plan-blind | 6 | 6 contributing rows |
| Total | 14 contributing rows | 13 |

C-01 is counted in both blast-radius and plan-blind source rows but is one
deduplicated candidate.

| Effective validation result | Count |
|---|---:|
| confirmed | 0 |
| rejected with scope-invalid status | 10 |
| not-proven, Medium verification blocker | 3 |
| Total | 13 |

| Source candidate severity | Count |
|---|---:|
| High | 2 |
| Medium | 10 |
| Low | 1 |

The source High candidate C-02 is recorded at effective severity Medium because
the required not-proven classification is a Medium verification blocker. Its
source severity remains recorded separately.

## Validation records

### C-01 — New engine exports have no production caller or end-to-end application path

- id: C-01
- severity: High
- lane: validation
- source_lanes: z-reviewer-blast-radius; z-reviewer-plan-blind
- finding: The candidate claims that the new session, setup-validation, narration,
  and template exports are reachable only from focused engine tests, while the
  application still calls the API clients.
- evidence: The candidate cites gameSession.ts, gameSetupValidation.ts, and
  narration.ts, the graph result of zero affected flows, and the existing
  useGameSetup, WakeOrderResolution, and GameFacilitator API paths. A deterministic
  repository scan of yourwolf-frontend/src excluding src/test/engine reports no
  non-test engine import. The accepted summary says the engine is unused until
  Phase 04b, and all three accepted plans exclude API callers and adapters.
- reviewers: 03j-reviewer-blast-radius; 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: Reproduced the no-caller observation with the repository scan
  above. The full frontend evidence is 679/679 with zero failures and zero errors.
- production_trace: The observed application paths call gamesApi from
  useGameSetup, WakeOrderResolution, and GameFacilitator. The only engine imports
  are the four engine test modules. This is the accepted PHASE_04A boundary, not
  a missing call on a supported PHASE_04A path. Phase 04b is the accepted caller
  and adapter path.
- action: Exclude from repair validation as outside the accepted PHASE_04A
  supported path. Retain the 04b integration boundary.
- status: rejected

### C-02 — Public-shape test does not observe production output

- id: C-02
- severity: Medium
- source_severity: High
- lane: validation
- source_lanes: z-reviewer-test-falsification
- finding: The candidate claims that the public-shape test creates local
  EngineRoleInput, EngineAbilityStepInput, NarratorAction, and
  NarratorPreviewAction literals and compares hard-coded keys without invoking a
  production function.
- evidence: The test at yourwolf-frontend/src/test/engine/templates.test.ts:275-320
  creates the four literals and checks their keys. It does not call a production
  output builder. Production narration does construct NarratorAction values in
  narration.ts:84-117 and :126-149, and preview values in narration.ts:164-177.
- reviewers: 03k-reviewer-test-falsification
- validation_status: not-proven
- reproduction: The deterministic command
  npm exec -- vitest run src/test/engine/templates.test.ts --reporter=dot -t
  'public shape' passes 1 test and skips 80. The command confirms the test is
  green, but not that it observes production output.
- production_trace: The test-power limitation is proven, but no malformed or
  missing runtime output is proven. The production trace reaches object
  construction in buildRoleScript, buildNightScript, and buildPreview, while the
  public TypeScript types are erased at runtime. The accepted plan labels shape
  evidence as a test plus code-review contract check, and the full engine suite
  and fixture comparisons pass. The available evidence cannot prove or disprove a
  shipped production defect.
- action: Carry forward as a Medium verification blocker for final review. Do not
  open a production repair from this test-power claim.
- status: carry-forward

### C-03 — Existing role DTOs have no tested conversion to the engine contract

- id: C-03
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-blast-radius
- finding: The candidate claims that transport role DTOs omit fields required by
  EngineRoleInput and lack a tested transport-to-engine conversion.
- evidence: The candidate cites engine/types.ts:5-24, transport.ts:42-59 and
  :94-110, transport dependencies at :86-92, and the null-to-undefined mock
  conversion. The accepted summary and plans state that Phase 04b adapts
  transport DTOs and that PHASE_04A must not add an adapter.
- reviewers: 03j-reviewer-blast-radius
- validation_status: scope-invalid
- reproduction: The deterministic no-adapter scan finds no non-test engine import.
  The focused engine suite passes 144/144, which covers engine-shaped inputs only.
- production_trace: No PHASE_04A production path converts a transport DTO to the
  engine input. The missing conversion is a deferred boundary responsibility,
  not a failure on the accepted pure-engine path. The transport DTO differences
  therefore cannot establish a PHASE_04A production defect.
- action: Exclude from repair validation as deferred Phase 04b boundary work.
- status: rejected

### C-04 — Engine and backend phase advancement have different setup behavior

- id: C-04
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-blast-radius
- finding: The candidate claims that the engine rejects advancePhase from setup
  while the backend service can advance from setup.
- evidence: gameSession.ts:89-98 rejects setup advance. The backend service at
  app/services/game_service.py:165-180 checks the terminal phase. The UI makes
  separate gamesApi.start and gamesApi.advancePhase calls. The accepted summary
  and game-session plan explicitly state that start is the only engine exit from
  setup and call this a deliberate tightening.
- reviewers: 03j-reviewer-blast-radius
- validation_status: scope-invalid
- reproduction: The focused transition command passes 10 matching tests with
  6 skipped, including the setup rejection. The backend XML evidence is 492/492
  with zero errors and failures.
- production_trace: No accepted PHASE_04A path crosses the engine and backend
  transition implementations. The engine behavior is the stated contract and
  the backend behavior belongs to a separate integration boundary. The
  difference is therefore not a shipped defect in this phase.
- action: Exclude from repair validation as an accepted engine contract and
  deferred integration comparison.
- status: rejected

### C-05 — Engine setup values are broader than the backend schema

- id: C-05
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-blast-radius
- finding: The candidate claims that engine setup numbers are unconstrained while
  the backend schema constrains player count, center-card count, and timer bounds.
- evidence: app/schemas/game.py:11-18 constrains player_count to 3-20,
  center_card_count to 0-5, and discussion_timer_seconds to 60-1800.
  gameSetupValidation.ts:11-18 declares the pure engine fields and :30-35
  validates role totals. The accepted game-session task explicitly says to keep
  scalar bounds at the transport boundary and not clone transport validation
  into the engine.
- reviewers: 03j-reviewer-blast-radius
- validation_status: scope-invalid
- reproduction: The full engine suite passes 144/144, and no accepted caller
  sends transport values into the engine in PHASE_04A.
- production_trace: createGameSession copies the engine-shaped setup values after
  engine validation at gameSession.ts:48-73. Since the accepted path is a pure
  engine call with transport validation deferred to 04b, the broader local
  number type does not prove a defect on a supported PHASE_04A path.
- action: Exclude from repair validation as deferred transport-boundary
  validation.
- status: rejected

### C-06 — Wake-order normalization is exercised only with strings

- id: C-06
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-test-falsification
- finding: The candidate claims that the test named for wake-order normalization
  supplies strings and only checks the unchanged string array.
- evidence: gameSetupValidation.test.ts:112-118 supplies
  ['ww', 'robber', 'seer', 'insomniac'] and expects the same values. The accepted
  engine input contract uses a readonly string sequence. UUID-to-string
  conversion belongs to the deferred transport adapter.
- reviewers: 03k-reviewer-test-falsification
- validation_status: scope-invalid
- reproduction: The deterministic command
  npm exec -- vitest run src/test/engine/gameSetupValidation.test.ts --reporter=dot
  -t 'normalizes a valid wake order sequence to strings' passes 1 test and
  skips 33.
- production_trace: The production function accepts the accepted string[] engine
  path and copies it at gameSetupValidation.ts:92-105. No supported PHASE_04A
  path supplies runtime UUID objects or requires coercion. The candidate tests a
  deferred boundary concern, not an accepted engine requirement.
- action: Exclude from repair validation as outside the accepted typed engine
  path.
- status: rejected

### C-07 — Injected ID dependency is a self-configured mock without a call assertion

- id: C-07
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-test-falsification
- finding: The candidate claims that the deterministic-ID test uses two callbacks
  returning the same literal and checks only equality of the two sessions.
- evidence: gameSession.test.ts:153-157 uses two callbacks returning fixed-id and
  asserts equality. It does not assert callback invocation independently.
  createGameSession invokes input.id_generator at gameSession.ts:48-68 after
  validation.
- reviewers: 03k-reviewer-test-falsification
- validation_status: not-proven
- reproduction: The deterministic command
  npm exec -- vitest run src/test/engine/gameSession.test.ts --reporter=dot -t
  'deterministic id generator' passes 1 test and skips 15.
- production_trace: The test-power gap is real, but the production trace directly
  invokes input.id_generator() at gameSession.ts:61. No ambient crypto reference
  exists in the engine source, and the accepted plan requires injected IDs. The
  evidence cannot prove a shipped production defect or prove that the current
  assertion is sufficient for every future implementation.
- action: Carry forward as a Medium verification blocker for final review. Do not
  open a production repair from the assertion weakness.
- status: carry-forward

### C-08 — Caller-mutation checks use incomplete and shallow snapshots

- id: C-08
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-test-falsification
- finding: The candidate claims that the valid create mutation test omits roles
  and dependencies and that transition snapshots shallow-copy nested arrays.
- evidence: gameSession.test.ts:144-151 snapshots role_ids and
  wake_order_sequence only. Tests at :192-208 use object spreads, which share
  nested arrays. The production create path copies role_ids, warnings, and the
  accepted wake sequence at gameSession.ts:65-71. Transition functions only
  return new top-level values at :81-103 and do not mutate nested data.
- reviewers: 03k-reviewer-test-falsification
- validation_status: not-proven
- reproduction: The deterministic command
  npm exec -- vitest run src/test/engine/gameSession.test.ts --reporter=dot -t
  'does not mutate' passes 1 test and skips 15. The transition pattern passes
  10 tests with 6 skipped.
- production_trace: The snapshots do not fully falsify a future mutation, so the
  verification gap is real. The available production trace has no nested
  mutation operation: create clones the owned output collections and start and
  advance return spreads without modifying the input session. The evidence
  cannot prove a shipped mutation defect.
- action: Carry forward as a Medium verification blocker for final review. Do not
  open a production repair from the incomplete snapshot.
- status: carry-forward

### C-09 — Unsupported ability steps disappear from the generated night script

- id: C-09
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-plan-blind
- finding: The candidate claims that an unknown ability step produces no action
  because narration continues when buildStepInstruction returns undefined.
- evidence: narration.ts:95-100 skips an undefined instruction and
  templates.ts:197-207 returns undefined for an absent template. The accepted
  narration plan AC4 and its edge-case list require unknown ability steps to be
  skipped before duration calculation. narration.test.ts:145-158 and
  templates.test.ts:240-248 pin this result.
- reviewers: 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: The deterministic unknown-step command passes 1 matching test and
  skips 12. The complete engine suite passes 144/144.
- production_trace: The trace exactly implements the accepted skip behavior.
  Unknown steps add no action and no duration by contract. No supported-path
  requirement asks the engine to warn or reject such input.
- action: Exclude as an accepted behavior, not a production defect.
- status: rejected

### C-10 — Wake-sequence validation disagrees with narration about negative wake orders

- id: C-10
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-plan-blind
- finding: The candidate claims that validation treats negative wake_order values
  as waking while narration excludes values less than or equal to zero.
- evidence: gameSetupValidation.ts:187-191 uses non-null and non-zero
  classification. narration.ts:37-43 excludes values less than or equal to zero.
  The backend role contract constrains wake_order to non-negative values, and the
  accepted narration plan defines the supported set as positive, non-null values.
- reviewers: 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: The existing null/zero wake-filter command passes 1 test and skips
  12. No accepted test or contract supplies a negative wake_order value.
- production_trace: A negative value is rejected or excluded at the transport and
  supported-input boundary. The negative-only disagreement is unreachable on the
  accepted PHASE_04A path, so it cannot establish a shipped production defect.
- action: Exclude as outside the accepted positive wake-order path.
- status: rejected

### C-11 — Phase transitions leave wake progress permanently at zero

- id: C-11
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-plan-blind
- finding: The candidate claims that start sets current_wake_order to zero and
  later transitions leave it at zero through complete.
- evidence: startGame sets current_wake_order to zero at gameSession.ts:77-85,
  and advancePhase changes only phase at :89-103. The full-path assertion at
  gameSession.test.ts:231-246 expects zero at completion. The accepted summary
  and game-session plan AC9 explicitly exclude wake-index advancement in this
  phase.
- reviewers: 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: The focused transition command passes the setup-to-complete
  path, including the zero assertion. The complete engine suite passes 144/144.
- production_trace: The production trace matches the accepted state-machine
  contract. No PHASE_04A operation represents individual narration progress.
  Wake-index advancement is a Phase 04b or later integration concern and is not
  a shipped defect in this path.
- action: Exclude as an accepted non-goal.
- status: rejected

### C-12 — Unknown wake targets fail open to the role itself

- id: C-12
- severity: Medium
- lane: validation
- source_lanes: z-reviewer-plan-blind
- finding: The candidate claims that malformed or unknown wake targets fall back
  to a self-wake instruction instead of raising an error.
- evidence: templates.ts:174-195 handles known targets and falls through to the
  role-self instruction. templates.test.ts:42-56 expects team.unknown, garbage,
  and empty targets to follow the defined fallback. The accepted summary and
  template plan AC4 explicitly require null and unknown-string fallthrough.
- reviewers: 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: The deterministic wake-target command passes 12 matching tests
  and skips 69. The complete engine suite passes 144/144.
- production_trace: The production trace implements the accepted Python-parity
  fallthrough. No supported-path requirement requires malformed target rejection.
  The candidate describes an accepted behavior, not a defect.
- action: Exclude as an accepted fallback behavior.
- status: rejected

### C-13 — Team thumbs-up narration contains a user-visible spelling defect

- id: C-13
- severity: Low
- lane: validation
- source_lanes: z-reviewer-plan-blind
- finding: The candidate claims that team thumbs-up narration emits the
  misspelled Werewolfs text.
- evidence: templates.ts:110-115 emits the spelling and labels it frozen.
  templates.test.ts:121-123 and preview.fixture.json:114-123 pin the same text.
  The accepted summary and plans require reproducing, not correcting, this
  copy until a separate feature changes both ports and pins.
- reviewers: 03l-reviewer-plan-blind
- validation_status: scope-invalid
- reproduction: The complete template and narration suites pass and preserve the
  fixture text.
- production_trace: The trace is intentional frozen-copy behavior on the
  accepted path. No PHASE_04A requirement permits a copy correction.
- action: Exclude as an accepted frozen-copy constraint and advisory-only claim.
- status: rejected

## Evidence and reproduction record

| Check | Result |
|---|---|
| Frontend orchestrator XML | 679 tests, 0 failures, 0 errors |
| Backend orchestrator XML | 492 tests, 0 failures, 0 errors |
| Focused engine suite | 4 files, 144 tests passed |
| Public shape test | 1 passed, 80 skipped |
| Deterministic ID test | 1 passed, 15 skipped |
| Create immutability test | 1 passed, 15 skipped |
| Transition tests | 10 passed, 6 skipped |
| Wake-order string test | 1 passed, 33 skipped |
| Unknown-step test | 1 passed, 12 skipped |
| Null/zero wake filter test | 1 passed, 12 skipped |
| Wake-target tests | 12 passed, 69 skipped |
| Non-test engine import scan | No matches |
| git diff --check | Pass |

The code-review graph at the reviewed head reports 1,958 nodes and 16,520
edges. Its importer queries resolve engine modules only to engine tests, and
get_affected_flows reports zero affected flows. The graph warning about
unresolved npm aliases does not change the direct repository scan or the
accepted no-caller contract.

## Frozen supported-path matrix

This is the first full post-rebuild validation for repair-01. The matrix below
is frozen from the accepted summary and the three accepted plans. Later
repair-cycle validators may update only these cells. A new path or requirement
requires an Escalate result and an explicit matrix change.

| cell_id | supported_path | invariant | status | severity | lineage | evidence |
|---|---|---|---|---|---|---|
| P04A-01 | Pure engine input/output contracts | Engine role, step, action, and preview shapes are readonly, complete, and independent of transport/API modules. | pass | None | C-01 scope-invalid; C-02 not-proven | types.ts:1-40; no non-test engine imports; frontend 679/679. |
| P04A-02 | Template rendering | Fifteen templates, wake-target cases, duration defaults, OR behavior, and frozen copy match the accepted oracle. | pass | None | C-12 scope-invalid; C-13 scope-invalid | templates.ts; templates.test.ts; focused wake-target run; full engine suite 144/144. |
| P04A-03 | Night-script assembly | Positive waking roles are deduplicated and ordered deterministically; unknown steps add no action or duration. | pass | None | C-09 scope-invalid | narration.ts:33-150; narration plan AC1-AC4; unknown-step run; fixture comparisons. |
| P04A-04 | Preview assembly | Null and zero wake orders return no preview; positive roles mirror role scripts and section headers; seed fixtures match. | pass | None | C-10 scope-invalid | narration.ts:159-180; narration tests; preview fixture parity. |
| P04A-05 | Typed setup validation | Count, id, card, primary-team, dependency, and positive wake-sequence rules run in accepted order and preserve warnings. | pass | None | C-06 scope-invalid; C-10 scope-invalid | gameSetupValidation.ts:26-217; 34 setup tests; full engine suite. |
| P04A-06 | Session creation from engine-shaped input | Create validates before injected ID generation, returns setup state, and copies owned arrays. | verification-blocked | Medium | C-07 not-proven; C-08 not-proven | gameSession.ts:48-73; focused ID and immutability runs; tests do not independently prove every dependency invocation or deep snapshot. |
| P04A-07 | In-memory phase transitions | Start is the only exit from setup, valid phases advance one step, complete is terminal, and current_wake_order remains zero in this phase. | pass | None | C-04 scope-invalid; C-11 scope-invalid | gameSession.ts:76-103; game-session plan AC6-AC9; transition runs. |
| P04A-08 | PHASE_04A package boundary | No API caller, transport adapter, routing, refresh, or runtime integration is added to the pure engine phase. | pass | None | C-01 scope-invalid; C-03 scope-invalid; C-05 scope-invalid | PHASE_04A summary:10,18,24,36-37,62,89-90; no non-test engine imports; graph zero flows. |
| P04A-09 | Public runtime-output observation | Accepted output contracts have an independent production-observation test or sufficient code-review evidence. | verification-blocked | Medium | C-02 not-proven | templates.test.ts:275-320 observes local literals; production construction is in narration.ts:84-177; no malformed runtime output is proven. |

## Convergence result

- return: Pass
- reason: No confirmed Critical, Blocker, or High production cell remains.
- remaining_cells: P04A-06 and P04A-09, both Medium verification blockers only.
- strict_decrease: Not applicable on the first full post-rebuild cycle.
- repair_authorization: None. The validator does not repair confirmed findings.
