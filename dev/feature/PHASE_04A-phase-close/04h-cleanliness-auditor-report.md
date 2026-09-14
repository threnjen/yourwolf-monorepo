# Cleanliness Auditor Report — `aa8c4814`..`989a3591`

## TL;DR

**Non-passing.** The new phase summary calls the TypeScript engine identical to
the Python implementation even though the branch intentionally tightens one
phase transition and makes wake-order ties deterministic. The added code also
has three Low cleanup opportunities in test construction, role-target parsing,
and wake-sequence set creation.

## Review Metadata

- **Reviewer:** `z-cleanliness-auditor`
- **Lane:** `cleanliness`
- **Model tier:** cheap (orchestrator-assigned; no tier upgrade)
- **Review date:** 2026-09-13
- **Base commit:** `aa8c4814fa92395e75efd21d6764da0c4493e257`
- **Head commit:** `989a3591b57b4d341286b55d295415af5d1af6a4`
- **Revision pair:** `aa8c4814fa92395e75efd21d6764da0c4493e257..989a3591b57b4d341286b55d295415af5d1af6a4`
- **Branch:** `phase/phase-04-client-side-game-engine`
- **Report path:** `dev/feature/PHASE_04A-phase-close/04h-cleanliness-auditor-report.md`
- **Status:** **COMPLETE**

## Scope and Evidence

The review covers the complete caller-supplied revision pair. The authoritative
scope file, `dev/feature/changed-files.txt`, contains 34 entries. The supplied
`dev/feature/range.diff` contains 6,813 lines and the revision diff contains
6,431 additions and 150 deletions. All cited implementation and phase-summary
locations are added ranges in that diff, so the findings satisfy added-line
attribution. The confirmed base revision is readable directly. No separate
baseline worktree path was supplied, and no worktree was created.

The changed source modules are the five new files under
`yourwolf-frontend/src/engine/`. The four new TypeScript test modules and two
JSON fixtures were also inspected. `git diff --check` produced no whitespace
errors. The current code-review graph matches the head SHA. Its change analysis
reported zero affected runtime flows. Its dead-code query was run separately
and returned zero symbols.

## Verification Evidence

| Evidence | Result | Source |
|---|---|---|
| Frontend head suite | **Green:** 679 tests, 679 passed, 0 failed | `/tmp/phase04a-orchestrator-final-feature-frontend.xml`; `dev/feature/PHASE_04A-execution-manifest.md:18,146-148` |
| Backend reference suite | **Green:** 492 tests, 492 passed, 0 failed | `/tmp/phase04a-orchestrator-final-feature-backend.xml`; `dev/feature/PHASE_04A-execution-manifest.md:18,146-148` |
| Baseline suite | **Green:** frontend baseline 629 tests, 629 passed, 0 failed | `/tmp/phase04a-feature03-baseline.xml`; `dev/feature/03-game-session-state-machine/03-game-session-state-machine-implementation.md:59-64` |
| Exact-output and characterization coverage | **Present:** literal template assertions, 30-role night and preview fixtures, exact setup errors, and phase-transition assertions | `yourwolf-frontend/src/test/engine/templates.test.ts:42-273`; `yourwolf-frontend/src/test/engine/narration.test.ts:103-273`; `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:107-363`; `yourwolf-frontend/src/test/engine/gameSession.test.ts:80-254` |
| Engine coverage | **Green at head:** all engine rows meet the phase thresholds, with at least 96.22% statements/lines, 92.85% branches, and 100% functions | `yourwolf-frontend/coverage/lcov.info`; `dev/feature/03-game-session-state-machine/03-game-session-state-machine-implementation.md:64-68`; `dev/feature/PHASE_04A-execution-manifest.md:19` |
| Lint | **Green:** zero warnings, exit 0 | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-implementation.md:67`; `dev/feature/PHASE_04A-execution-manifest.md:20` |
| Format | Not configured in the frontend package | `yourwolf-frontend/package.json` has no format script; `dev/feature/PHASE_04A-execution-manifest.md:21` |
| Strict type checking | **Green:** `build` runs `tsc`, `tsconfig.json` enables `strict`, and the recorded build exits 0 | `yourwolf-frontend/package.json`; `yourwolf-frontend/tsconfig.json:18-20`; `dev/feature/03-game-session-state-machine/03-game-session-state-machine-implementation.md:68` |

The green suite and exact characterization assertions mean the structural code
recommendations below are **safe to apply behind the existing suite**. The
phase-summary wording finding requires a documentation consistency pass in
addition to the existing code tests.

## Check Table

| # | Inventory check | Result | Evidence | Branch-attributed finding |
|---:|---|---|---|---|
| 1 | Module size and growth | Complete — no size threshold crossed | New engine modules are 104, 218, 181, 216, and 40 lines at head, and absent at base. No module exceeds approximately 500 lines. The percentage-growth heuristic is undefined for new files from a zero-line base. | None |
| 2 | Mixed concerns within a module | Complete — no split candidate | `gameSetupValidation.ts` keeps one setup-validation pipeline, `gameSession.ts` owns session transitions while delegating validation, `narration.ts` keeps sorting and assembly for one narration responsibility, and `templates.ts` keeps one output-format dispatch. Imports point from session/narration to lower-level validation/templates and do not form a cycle. | None |
| 3 | Duplicated construction logic | Complete — Low finding | Four new test modules repeat near-identical `EngineRoleInput` construction, and two repeat `EngineAbilityStepInput` construction. | Low: [C3-1](#c3-1-centralize-repeated-engine-test-input-construction) |
| 4 | Repeated inline expressions | Complete — Low finding | The same role-target-to-display-name expression appears in both template renderers. | Low: [C4-1](#c4-1-name-the-role-target-display-conversion) |
| 5 | Duplicated formatting or string-building | Complete — no finding | The shared `titleCase` helper owns title formatting. The only compound comma/`or` join is local to `randomNumPlayersInstruction`; no independent renderer repeats it. | None |
| 6 | Repeated validation patterns | Complete — no finding | Validation guards are concentrated in one setup module, with no repeated longhand guard across multiple data-model classes. | None |
| 7 | Dead and unreachable code | Complete — graph-verified | `refactor_tool(mode="dead_code", file_pattern="yourwolf-frontend/src/engine")` returned `Found 0 dead code symbol(s)` at the current head. The absence of production callers is an intentional Phase 04a boundary, not dead code. | None |
| 8 | Duplicate computation | Complete — Low finding | `validateWakeSequence` constructs a `Set` from the same sequence for duplicate detection and later membership checks. | Low: [C8-1](#c8-1-reuse-the-wake-sequence-set) |
| 9 | Speculative abstraction | Complete — no finding | Added exports are exercised by the added tests, and the injected ID generator is consumed by session creation. The lack of runtime callers is explicitly deferred to Phase 04b. | None |
| 10 | Stale contract references | Complete — Medium finding | The phase summary says the engine is identical to Python while its own scope and implementation document intentional behavioral differences. | Medium: [C10-1](#c10-1-qualify-the-phase-summarys-python-parity-claim) |

## Findings by Cleanup Category

### 10. Stale contract references

#### C10-1. Qualify the phase summary's Python parity claim

- **severity:** Medium
- **lane:** cleanliness
- **evidence:** `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:10` calls the engine a “second, identical implementation,” and `:18` says it is “proven identical to the Python output.” The added implementation intentionally rejects setup-phase `advancePhase` at `yourwolf-frontend/src/engine/gameSession.ts:89-95`, whereas the summary itself records that tightening at `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:28,30`. The engine also breaks default wake-order ties by role name at `yourwolf-frontend/src/engine/narration.ts:27-30`, while the summary documents the Python tie behavior as incidental at `docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:28,58`.
- **reviewer:** `z-cleanliness-auditor`
- **recommendation:** Update the stale reference to say which outputs are parity-tested and name the deliberate setup-transition and deterministic tie-order differences. This is an **update stale reference** remedy, not a code change.
- **verification:** The head suite and exact transition, template, sorting, and fixture assertions are green. The documentation update is safe to apply behind the existing suite, followed by a phase-document consistency review.

### 3. Duplicated construction logic

#### C3-1. Centralize repeated engine test input construction

- **severity:** Low
- **lane:** cleanliness
- **evidence:** The branch adds near-identical `EngineRoleInput` factories at `yourwolf-frontend/src/test/engine/gameSession.test.ts:13-28`, `gameSetupValidation.test.ts:11-26`, `narration.test.ts:29-44`, and `templates.test.ts:27-40`. It also adds two `EngineAbilityStepInput` factories at `narration.test.ts:46-58` and `templates.test.ts:15-25`. The role factories differ in defaults such as `wake_target` and `min_count`, which creates future fixture-drift risk rather than being a harmless exact copy.
- **reviewer:** `z-cleanliness-auditor`
- **recommendation:** Extract a named shared test factory for the common engine role and step shapes, retaining explicit per-test overrides for the different defaults. This is an **extract helper** remedy.
- **verification:** Exact template, narration, setup, and session assertions cover the constructed inputs. The helper extraction is safe to apply behind the existing suite.

### 4. Repeated inline expressions

#### C4-1. Name the role-target display conversion

- **severity:** Low
- **lane:** cleanliness
- **evidence:** `yourwolf-frontend/src/engine/templates.ts:117` and `:191` independently implement `target.split('role.').join('').split('_').join(' ')` for the same role-target display concept. Both lines are added in this branch.
- **reviewer:** `z-cleanliness-auditor`
- **recommendation:** Extract a small function with a docstring naming the role-target display-name concept, then use it in both renderers. This is an **extract helper** remedy.
- **verification:** Exact role-target outputs are asserted at `yourwolf-frontend/src/test/engine/templates.test.ts:51-52,123`. The extraction is safe to apply behind the existing suite.

### 8. Duplicate computation

#### C8-1. Reuse the wake-sequence set

- **severity:** Low
- **lane:** cleanliness
- **evidence:** Within `validateWakeSequence`, `yourwolf-frontend/src/engine/gameSetupValidation.ts:175` constructs `new Set(sequence)` for the duplicate test, then `:202` constructs the same set again for missing-role membership checks. The sequence is immutable for the function call, so the repeated construction adds work and leaves two derivations that can drift if the validation changes.
- **reviewer:** `z-cleanliness-auditor`
- **recommendation:** Compute the sequence membership set once and reuse that local for both checks. This is a **consolidate local computation** remedy.
- **verification:** Exact duplicate, extra, missing, empty, and non-waking sequence cases are asserted at `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:303-363`. The local reuse is safe to apply behind the existing suite.

## Checks Not Run

| Check or evidence | Expected input | Reason not run | Follow-up / impact |
|---|---|---|---|
| Inventory checks 1–10 | Added-line diff, base/head trees, current graph, and available artifacts | None. Every inventory check ran. | No incomplete cleanliness check. |
| Optional `z-test-analyst` native handoff | `dev/feature/PHASE_04A-phase-close/test-analysis/test-analysis-plan.md`, `test-analysis-context.md`, and `test-analysis-tasks.md` | These optional test-health artifacts were not supplied. They are outside this evaluator's ten-check inventory, and direct source, diff, graph, and head verification artifacts were readable. | No impact on this cleanliness result. Supply them only if the separate test-health analysis must be rerun. |

## Conclusion

**Non-passing.** Cleanup category **#10, Stale contract references**, failed at
`docs/phases/PHASE_04A/PHASE_04A_SUMMARY.md:10,18` because the added summary
overstates Python identity while the added engine and the same summary document
record intentional setup-transition and wake-order differences. The remedy is
to **update the stale reference** so it distinguishes parity-tested behavior
from those deliberate deviations. The head suite, exact characterization
fixtures, lint, and strict build are green, so this documentation cleanup is
safe to apply behind the existing suite and should be followed by a document
consistency review.

Categories **#3, Duplicated construction logic**, **#4, Repeated inline
expressions**, and **#8, Duplicate computation** also produced Low findings at
the added ranges listed above. They do not change the Non-passing result, and
their helper/local cleanups are safe to apply behind the existing green suite.
