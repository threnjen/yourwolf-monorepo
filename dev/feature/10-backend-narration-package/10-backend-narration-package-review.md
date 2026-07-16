# Review Record: Backend Narration Package (ScriptService Decomposition)

## Summary

Reviewed `c6f601e` (decompose `ScriptService` into `app/services/narration/`) against its
true parent. **Note on the stated baseline:** the review prompt gives `c6f601e`'s parent as
`2d0d8f3`; git says the parent is `4f29691` (feature 09). This does not affect the review —
`git diff 2d0d8f3 4f29691` is empty for `script_service.py` and `test_script_service.py`, so
both refs are identical comparison points for every file this feature touches. Feature-10
scope was isolated with `git diff 4f29691 c6f601e -- yourwolf-backend/` (8 files).

This feature's entire justification is one claim: a 541→195-line rewrite is safe because
output is byte-identical. That claim was **not accepted on the implementer's evidence** — the
implementer's parity harness was deleted, so I rebuilt an independent one. The claim holds.

**Every substantive claim in the implementation record was independently reproduced and
every one was true.** That is an unusual result and it is the basis for the verdict. Details
in [Claim Verification](#claim-verification).

Two real gaps were found and fixed, neither a behavior regression: the deliberately-frozen
"Werewolfs" bug was pinned only in tests (not at the source a Phase 04 porter will read), and
the Section B de-duplication edge case was unpinned by any test, old or new.

## Verdict

**Approved with Reservations**

Reservations are the two fixed gaps plus the unperformed manual QA (Gap 1). No blockers. The
seams are sound and I endorse them as the Phase 04 port structure.

## Claim Verification

The prompt flagged 8 claims for independent verification. All were reproduced from scratch.

| # | Claim | Method | Result |
|---|---|---|---|
| 1 | Plan's named oracle was not an oracle | Counted asserts in `git show 2d0d8f3:...test_script_service.py` | **CONFIRMED.** 83 asserts / 1,273 lines. 14 exact-string asserts exist, but all are on wake/close-eyes lines, Narrator bookends, and stand-in `.name` — **zero** on the 15 `_*_instruction` generators. `test_change_to_team_no_param` asserts only `is not None` + `isinstance(str)` + `len > 0`; any non-empty string passes. A full copy rewrite would have gone green. Third confirmed fabricated coverage claim in this plan family. |
| 2 | New oracle is not self-referential | Imported the committed `WAKE_CASES`/`INSTRUCTION_CASES`/`DURATION_CASES` tables and asserted them against the **old** module | **CONFIRMED.** 67 table cases, **0 mismatches vs. OLD** — matching the record's claimed 67 exactly. Expectations are hardcoded literals, not derived from the new code. The only two references to live module constants (`test_duration_table_covers_exactly_the_known_types`, `test_all_dispatched_types_produce_instructions`) are completeness guards, not value oracles. Not the vacuous-snapshot pattern feature 05 had. |
| 3 | Old-vs-new byte parity | Rebuilt an independent harness: loaded `git show 2d0d8f3:...script_service.py` read-only, diffed old vs new across a synthetic matrix + all 30 real seed roles | **CONFIRMED. 2,656 comparisons, 0 mismatches.** All 30 seed roles, all 15 ability types (seed data exercises every one), 10 wake targets × 5 role names, both modifiers, plus durations. Harness also captured exceptions as comparable outcomes — see Risk Summary re: a shared pre-existing crash. |
| 4 | Previously-uncovered lines now assert OLD behavior | Mapped each flagged old line number to its source text, then to a pinned case | **CONFIRMED.** 354–362 → `WAKE_CASES` (alien/vampire/`role.*`/fallback); 406 → unknown-type→None; 423/433/436/443 → view/swap/take fallbacks; 455/457–458/460–461/463 → all 5 `thumbs_up` branches; 518–519 → 2-option `random_num_players`. All pinned with exact strings, all validated against OLD by claim 2's run. Coverage 89%→100% is real, not line-touching. |
| 5 | "Werewolfs" bug frozen and pinned | Rendered both paths; inspected pin site | **Freeze correct; pin insufficient.** See Issue #1. |
| 6 | `role` param unused in all 15 generators | AST walk of the old module for `Name`/`Attribute` refs to `role` | **CONFIRMED.** Exactly 15 generators; `uses_role=False` for all 15; zero `role.*` attribute accesses. Dropping the param is provably identity. |
| 7 | 9 deleted tests each have a stronger replacement | Diffed test defs old vs new; traced each deletion to a replacement | **CONFIRMED.** Exactly 9 removed. Each asserted only non-None/substring/`len>0` and has an exact-equality replacement in `INSTRUCTION_CASES`. `test_all_15_types_produce_instructions` (hardcoded 15-item list, `is not None`) → `test_all_dispatched_types_produce_instructions`, which derives the list from `STEP_DURATIONS` and so cannot drift — strictly stronger. **No assertion lost.** |
| 8 | AC6 rejection sound | Checked the dependency the rejection turns on | **SOUND.** `PreviewScriptRequest.ability_steps: list[AbilityStepCreateInRole]` (`schemas/role.py:245`) is a real dependency, and `schemas/game.py` imports only `models.game_session` + `schemas.base`. Moving it would genuinely invert the dependency. The rationale is factually grounded, not a convenience excuse. The proposed `schemas/narration.py` alternative is the better fix and is correctly deferred to Phase 04. |

Additional plan-accuracy claim spot-checked: the `seeded_roles` fixture has **8** roles
(`conftest.py:381-389` — Werewolf, Seer, Insomniac, Robber, Troublemaker, Villager ×3), not
the 30 the plan's AC4 asserts the existing suite covered. **Confirmed** — a fourth false plan
claim, and the reason the implementer's decision to run against real `app/seed/roles.py` data
was necessary rather than gold-plating.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | **Met** | `app/services/narration/templates.py` | 15 generators, `build_wake_instruction`, `STEP_DURATIONS`, `_TEMPLATES` dispatch all present. Purity verified mechanically: zero hits for `sqlalchemy\|Session\|joinedload\|.query(\|relationship\|Column\|declarative` across the package. Only model import is the `StepModifier` enum — permitted by AC1's clarification. |
| AC2 | **Met** | `app/services/narration/inputs.py`; `script_service.py:30-77` | `RoleScriptInput`/`AbilityStepInput` frozen dataclasses. `_StandInRole`/`_StandInStep`/`_StandInAbility`/`_RoleLike`/`_StepLike` — zero references repo-wide (grep across `app/` + `tests/`). Adapters `_role_to_input`/`_preview_request_to_input` directly unit-tested. |
| AC3 | **Met** | `app/services/narration/script_builder.py`; `script_service.py` | 541→195 lines confirmed. `git diff 2d0d8f3 c6f601e -- app/routers/ app/schemas/` is **empty** — routers needed not even an import change, exceeding AC3's "at most import-path changes". |
| AC4 | **Met — independently reproduced** | all narration modules | 2,656-comparison independent harness, 0 mismatches, across all 30 seed roles + default/custom/partial-fallback wake order. Stronger than the record's own evidence. |
| AC5 | **Met** | 3 test files | 83 → 139 raw asserts (+67%) — verified by counting at `c6f601e`. 47 test defs → 153 collected cases. Split follows the seams exactly (templates / builder / preview+DB). |
| AC6 | **Met (rejection accepted)** | `schemas/role.py` unchanged | AC6 explicitly permits rejection. Rationale verified factually correct. |

**Unverified — requires a runtime step:** the plan's Stage 2 manual QA ("generate a night
script for a seeded game in the running app") was not performed by the implementer and not by
me — no app instance was started. I agree with the implementer that a 30-role automated
byte-parity diff is strictly stronger evidence of *output* parity than a manual spot-check,
and I am satisfied on that basis. What neither check covers is the **HTTP round-trip**:
serialization of `NightScript` through the live `routers/games.py` endpoint. Router tests pass
and routers are byte-unchanged, so risk is low, but this is inference from static review plus
unit tests, not observed runtime behavior. Flagging honestly rather than marking it verified.

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Frozen "Werewolfs" copy bug pinned only in tests; `templates.py` carries no warning at the source a Phase 04 porter reads | Medium | `app/services/narration/templates.py:94` | AC4 | **Fixed** |
| 2 | Section B edge case "duplicate role instances de-duplicated" unpinned by any test, old or new; 100% line coverage masks it | Medium | `app/services/script_service.py:171` | AC4, AC5 | **Fixed** |
| 3 | Adapter asymmetry: `_role_to_input` uses `parameters=step.parameters or {}`, `_preview_request_to_input` uses bare `parameters=step.parameters` | Low | `script_service.py:48` vs `:73` | — | **Wont-Fix** — not a bug. `AbilityStepCreateInRole.parameters` is non-Optional with `default_factory=dict`, so Pydantic guarantees a dict; and `build_step_instruction` re-guards with `or {}`. Matches old behavior exactly. Cosmetic only. |
| 4 | `narration/__init__.py` exports a clean barrel, but its only consumer (`script_service.py`) imports from submodules directly, bypassing it | Low | `script_service.py:19-24` | — | **Open** — harmless; the barrel is a deliberate public surface for Phase 04. Not worth churn in a parity-critical diff. |

### Issue #1 detail

`build_wake_instruction` renders `team.werewolf` as "Werewolves, wake up and look for other
werewolves."; `_thumbs_up_instruction` renders the same team as "**Werewolfs**, put your
thumbs out." via naive `f"{team.title()}s"`. Both confirmed by execution.

**The freeze is correct and I endorse it.** AC4 freezes copy and the plan's non-goals bar
wording changes; "fixing" it here would be an undocumented behavior change that silently
corrupts the Phase 04 port oracle. The implementer made the right call.

**The pin was not sufficient.** It existed only as a comment in
`tests/test_narration_templates.py:155-157`. The failure mode is specific and likely: a Phase
04 porter reads `templates.py`, sees `f"{team.title()}s"`, recognizes it as an obvious
pluralization bug, and "corrects" it to "Werewolves" while transcribing to TypeScript. The
Python test that pins it **never runs against the TypeScript port**, so nothing catches it.
The warning has to live where the porter is looking. Added a source-level comment.

### Issue #2 detail

`role_ids = list({gr.role_id for gr in game_roles})` de-duplicates roles dealt to multiple
players (a game can hold two Werewolves). No test in the old suite or the new one constructs
two `GameRole` rows sharing a `role_id`, so the behavior was never asserted — `script_service.py`
reports 100% coverage because the set comprehension executes on every call regardless of
whether duplicates exist. A textbook case of line coverage not implying behavior coverage,
and precisely the kind of gap this feature exists to close before the port.

**Mutation-tested finding — the plan's stated mechanism is wrong.** I removed the de-dup set
(file-copy backup, restored immediately; no git mutation) and the new tests **still passed**.
`Role.id.in_([x, x, y])` already returns each `Role` row once, so the set enforces nothing
about the output — it only avoids duplicate bind params. The plan's Section B attributes the
behavior to "the role-ID set"; that attribution is false. This matters for Phase 04: a TS port
using a different data-access path gets no help from SQL `IN` semantics and must de-duplicate
explicitly. The added tests therefore pin the observable **behavior**, and their docstring
states the mechanism honestly rather than claiming to pin the set.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-backend/app/services/narration/templates.py` | Added a source-level `KNOWN COPY BUG — DO NOT "FIX" HERE` comment at the `thumbs_up` team branch, naming the "Werewolfs"/"Werewolves" divergence, the AC4 freeze, the pinned test, and an explicit Phase 04 instruction to transcribe the bug faithfully into TypeScript. No behavior change. | #1 |
| `yourwolf-backend/tests/test_script_service.py` | Added `TestDuplicateRoleDeduplication` (2 tests): a role dealt to two seats is narrated once (one wake line, one close-eyes line), and de-duplication leaves no gaps in the action `order` sequence. Docstring records the mutation-test result that SQL `IN` — not the set — enforces this today. | #2 |

Both fixes are confined to feature-10 files. Verified: `git status --porcelain` shows only
`app/services/narration/templates.py` and `tests/test_script_service.py` modified. Feature 09's
files (`game_service.py`, `role_service.py`, `game_setup_validation.py`, `role_validation.py`,
`pagination.py`) and `yourwolf-frontend/` untouched.

**Git constraint honored.** No `git stash`/`checkout`/`reset`/`restore` or any working-tree
mutating command was run at any point. Baseline sources were read with `git show <ref>:<path>`
only; the one mutation test used a Python file copy for backup and restore.

## Remaining Concerns

- **Issue #4 (Low):** unused barrel — cosmetic, defer.
- **Manual QA / HTTP round-trip (Gap 1):** unverified by execution, as stated above. Low risk
  (routers byte-unchanged, router tests green). Recommend a single manual night-script fetch
  against a seeded game before the Phase 04 port begins, purely to close the serialization path.
- **`script_builder.py` is not framework-free.** It imports `NarratorAction` (`schemas/game.py`)
  and `NarratorPreviewAction` (`schemas/role.py`) — Pydantic models. AC1 forbids DB/ORM only,
  and Pydantic is not ORM, so this is compliant, and the implementer disclosed it (Deviation 7).
  Accepted: a second mapping layer would add risk for no gain. But the "pure" package does
  depend on the schema layer, and the Phase 04 port must supply equivalent TS types. Noted so
  the port does not discover it late.
- **Pre-existing crash preserved (not a regression):** `swap_card` with `target_b=None` raises
  `TypeError` in both old and new (`"center" in None`). My harness confirms old and new raise
  **identically**, so parity holds. Unreachable from the API — `AbilityStepCreateInRole.parameters`
  is a validated dict and seed data never produces it. Out of scope for a parity-frozen feature;
  logged for a future hardening pass.

## Test Coverage Assessment

- **Covered:** AC1 (purity, mechanical), AC2 (adapters, direct unit tests), AC3 (builder
  ordering/assembly; routers unchanged), AC4 (2,656-comparison independent parity harness +
  67-case durable oracle validated against OLD), AC5 (139 asserts / 153 cases), AC6 (import
  graph compiles; suite green).
- **Section B edge cases:** all seven now pinned. No-step roles ✓; `wake_order` null/0 excluded
  ✓; empty night still gets opening/closing ✓; unknown ability → skipped ✓; `StepModifier.OR`
  prefix + `requires_player_action` ✓; preview `wake_order` null/0 → empty ✓; custom-sequence
  missing-ID fallback ✓; **duplicate de-dup ✓ (added at review — was the one gap)**.
- **Missing:** manual/HTTP round-trip verification of `NightScript` serialization (see above).
- **Final state:** **492 passed, 0 failed, 96.08% coverage** (490 + my 2). `script_service.py`
  100%, `narration/templates.py` 100%, `narration/script_builder.py` 100%, `narration/inputs.py`
  100%. `black --check` clean on the file I touched; `mypy` reports **zero** errors in
  `app/services/narration/` and `app/services/script_service.py` (the 22 remaining errors are
  pre-existing in feature 09's `game_setup_validation.py` and other untouched files).

## Ledger

The instructions require appending a `discovered-failure` row (Issues #1/#2 are new
review-stage findings) to a remediation ledger. **No ledger exists and no contract defines its
schema:** `find` returns no `ledger-events.jsonl` / `ledger-commits.jsonl` anywhere in the repo,
and no `remediation-ledger-contract` instruction file exists under `.github/`. Rather than
invent a schema and write rows a downstream grader would misparse, I am reporting the absence
explicitly, per the contract's own instruction to report rather than assume success. Branch is
`main`, not `phase/*`. If the orchestrator supplies the ledger path and schema, the two rows to
append are: `stage: "review"`, `detected_by: "reviewer"`, `severity: "medium"`,
`human_intervention_required: false`, both resolved in-pass.

## Risk Summary

- **The parity claim is real, and it is now the strongest evidence in this remediation.**
  2,656 old-vs-new comparisons across all 30 seed roles, 0 mismatches, reproduced independently
  of the implementer's deleted harness. The 541→195 rewrite is justified.
- **The plan was wrong four times; the implementer caught all four and said so.** The named
  oracle had zero exact-string assertions on the code being moved (a full copy rewrite would
  have passed); the `seeded_roles` fixture has 8 roles, not 30; `TestMissingInstructionTemplates`
  tested present templates with docstrings citing another feature's ACs; the environment notes
  were stale. Writing the oracle **before** refactoring was not gold-plating — it was the only
  thing standing between this rewrite and silent copy drift into the TypeScript engine.
- **`tests/test_narration_templates.py` is now load-bearing infrastructure.** Its 67 expectation
  tables are validated against both the pre- and post-refactor implementations and are the Phase
  04 parity contract. Any edit to these strings is a behavior change, not a refactor.
- **The de-dup mechanism in the plan's Section B is misattributed** (SQL `IN`, not the set —
  mutation-proven). The port must not assume the set is what protects it.
- **`script_service.py:171` and `script_builder.py` are the seams Phase 04 inherits.** The
  `_get_waking_roles` two-query merge is faithful (same filters, same `joinedload`, same stable
  sort, same fallback index); SQLAlchemy queries are generative so the shared `query` +
  conditional `order_by` is safe. Custom-sequence ordering has no `ORDER BY` in either old or
  new — DB row order is unspecified for tied roles. Pre-existing and parity-preserving, but the
  TS port should not rely on incidental ordering there.
</content>
