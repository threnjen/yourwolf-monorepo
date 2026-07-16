# Review Record: Backend Service Validator Extraction & Pagination Helper

## Summary

Move-only refactor extracting five game-setup rules, three role rules, and the duplicated
pagination arithmetic out of `GameService` / `RoleService` into three new modules. Because
this is a move-only refactor, any behavior delta is a defect — so the review was conducted
mechanically (AST comparison, mutation testing, empirical probes) against the parent commit
`2d0d8f3`, not by reading.

**The headline result: the only logic delta in the entire change is the deliberate deletion
of the dead `>50` name branch.** Every other difference across all seven moved functions is
`db`-parameter threading. This was established by AST-normalized comparison, not inspection.

The implementation record is unusually accurate. Every claim I tested held, including the
ones that would have been easy to fake (mutation-tested precedence, net-zero mypy, zero
tests lost). One implementer claim — that the plan's AC2 evidence is fabricated — is
independently confirmed and is the **fourth** such defect in this plan family.

Comparison point: parent `2d0d8f3` (per orchestrator; phase baseline `19b4520` predates
features 04/05/07 and manufactures phantom drift). Feature 10/11 reviewers were landing
changes concurrently; my deltas were isolated accordingly.

## Verdict

**Approved with Reservations**

The code is defect-free by every check I ran. The reservations are not about the code:
AC4's literal line target is unmet, and I am **ruling to accept it** (see Issue #1) because
the plan contradicts itself. The plan-accuracy defect needs escalation, not a code fix.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | **Met** | `app/services/game_setup_validation.py:38-251`, `game_service.py:48-93` | Five rules behind one `validate_game_setup()` entry point. Evaluation order **verified identical** to `2d0d8f3` and **mutation-tested by this review** (3/3 mutants killed by exactly the corresponding test). All four moved private validators are AST-identical modulo the `db` param. Raise types preserved (`DomainValidationError`). |
| AC2 | **Met** | `app/services/role_validation.py:27-164`, `role_service.py:388-425` | `validate_role`, `get_warnings`, `check_duplicate_name` moved. `get_warnings` non-raising and `validate_role` returns a list (never raises); `create_role:214-216` raises. Split intact. `RoleService` wrappers retained — required, since `routers/roles.py:151` calls `check_duplicate_name`. Plan's stated evidence source is false (Issue #5); actual coverage is real. |
| AC3 | **Met** | `app/services/pagination.py:41-68`, `role_service.py`, `game_service.py` | Arithmetic **character-for-character identical** to both inline originals. `list_games` diff is purely the substitution. `paginate` counts the same query object at the same point (post-filter, pre-eager-load); slice unchanged. All four required edges tested. |
| AC4 | **Partial — accepted by ruling** | `game_service.py` (321), `role_service.py` (425) | `game_service.py` 520→321 ✅. `role_service.py` 528→425, over the ~400 target. **Public API verified IDENTICAL** on both services by mechanical AST signature comparison (8→8 and 9→9 methods, zero added/removed). See Issue #1 for the ruling. |
| AC5 | **Met** | test suite | **All 47 baseline tests relocated verbatim** — AST body comparison shows 0 changed, 0 missing, 0 weakened. +7 net-new names in the game seam (+8 functions). Assertions 62 → 65 across the split. `test_role_validation.py` and `test_roles.py` byte-identical to baseline as claimed. |

### Verification methods used (what was proven vs. read)

| Claim | Method | Result |
|---|---|---|
| Evaluation order preserved | AST diff of `create_game` vs `validate_game_setup` + **3 injected mutations** | Order identical; each mutant killed by exactly its own precedence test, no others. Tests are order-sensitive, **not tautological**. |
| "Zero logic changes" | AST-normalized comparison of all 7 moved functions | True. Sole delta = deleted `>50` branch. |
| `>50` branch dead | **Empirical**: constructed `RoleCreate(name="x"*51)` and `"x"*100`; probed whitespace-smuggling (`" "*10 + "x"*45 + " "*10`, raw len 65) | All rejected `string_too_long`. `max_length` checks raw length; `strip()` only shortens. No `model_construct`/`validate_assignment` bypass exists in `app/`. **Provably unreachable.** |
| `<2` branch reachable | **Empirical**: `RoleCreate(name="  a  ")` | Constructs (len 5, passes `min_length=2`), strips to `"a"` (len 1) → rule fires. **Correctly kept.** |
| `limit=0` ZeroDivisionError pre-existing | Formula compared against both baseline call sites | `pages = math.ceil(total/limit) if total > 0 else 1` is **character-identical** at `2d0d8f3`. Preserved, **not newly introduced**. Routers declare `ge=1` (`roles.py:33,60`, `games.py:48`) — unreachable over HTTP. |
| Only leaf exceptions raised | Enumerated every `raise` in all 5 files | Only `DomainValidationError`, `NotFoundError`, `LockedError`. `_DOMAIN_ERROR_STATUS` (`main.py:19-23`) registers exactly those three; `DomainError` base unregistered **and never raised**. |
| mypy net-zero | **Ran mypy on an isolated `git archive` extract of `2d0d8f3`** | Baseline: 23 errors/10 files, **exactly 6 in `game_service.py`**. Now: 23 errors/10 files, 6 relocated to `game_setup_validation.py`, `game_service.py` at 0. **Net zero confirmed.** |
| Plan §A AC2 evidence | Read `test_roles.py` @ `2d0d8f3` | 687 lines, **zero** references to `validate_role`/`get_warnings`. All 9 classes are router CRUD. **Claim FALSE.** |
| No unused imports | AST import-vs-usage scan on all 5 files | None. `black --check` clean on all 5. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `role_service.py` is 425 lines vs the ~400 target | Medium | `app/services/role_service.py` | AC4 | **Wont-Fix (ruled: accept)** |
| 2 | Plan §A AC2 names `test_roles.py` as the relocation source; it contains zero role-validation tests | Medium (plan defect, not code) | plan §A traceability table | AC2 | Open (escalate) |
| 3 | Duplicate test name `test_count_rule_precedes_unknown_role_id_check` in two classes of one file | Low | `tests/test_game_setup_validation.py:109` and `:340` | AC5 | Open |
| 4 | `paginate` returns `PageMeta.limit` but callers pass raw `limit` to `.limit()` | Low | `pagination.py:60`, `role_service.py`, `game_service.py` | AC3 | Open |
| 5 | 6 inherited mypy `arg-type` errors relocated into the new module | Low | `game_setup_validation.py:216-241` | — | Open |

### Issue #1 — AC4 ruling (explicit decision required by the orchestrator)

**RULING: ACCEPT 425 lines. AC4 is met in substance; the DTO extraction is deferred to audit 4.3.**

The implementer flagged a genuine, non-manufactured contradiction. I verified it and it is real.

Measured composition of `role_service.py` (425 lines):

| Method | Lines | Nature |
|---|---|---|
| `list_roles` | 74 | almost entirely `RoleListItem(...)` field-by-field construction |
| `get_role` | 71 | almost entirely `RoleRead(...)` field-by-field construction |
| (docstrings, file-wide) | 103 | Google-style, matching codebase convention |

Reaching <400 requires cutting 25 lines. Every available path is blocked:

1. **Extract DTO mapping** (the only real fat, ~145 lines) — the plan explicitly declares this
   a non-goal: *"no DTO-mapping extraction (audit 4.3/cross-cutting #3 — explicitly deferred)"*.
2. **Delete the delegating wrappers** (36 lines) — **blocked by AC4 itself**, which forbids public
   signature changes; `routers/roles.py:151` calls `check_duplicate_name`.
3. **Strip docstrings** (103 lines) — degrades the artifact and breaks codebase convention.

So AC4's line target and the plan's own non-goal cannot both be satisfied. When an
**approximate** quantitative target ("~400") conflicts with an **explicit** scope boundary in
the same document, the explicit boundary governs — the line count is a *proxy* for the real
goal, and the real goal is fully achieved: **every rule has left the service**, which is what
"orchestration + persistence" means. The residual is a different audit item with its own
ticket. Forcing a DTO extraction into a move-only refactor would expand blast radius on
precisely the kind of change that must stay boring, to satisfy a number the plan itself
undermined.

The implementer honored the explicit boundary and flagged the conflict instead of quietly
gold-plating or quietly missing. That is the correct call and I am upholding it.

**Consequence:** `role_service.py` stays >400 until audit 4.3 is scheduled. Recorded in
cross-phase decisions so a future reviewer does not re-litigate it.

### Issue #2 — Fourth fabricated coverage claim in this plan family

Independently confirmed. `test_roles.py` @ `2d0d8f3`: 687 lines, 9 classes
(`TestListRoles`, `TestListOfficialRoles`, `TestGetRoleById`, `TestCreateRole`,
`TestUpdateRole`, `TestListRolesWithDependencies`, `TestDeleteRole`,
`TestCreateRoleOwnership`, `TestUpdateRoleStepsAndConditions`) — all router CRUD, **zero**
references to `validate_role` or `get_warnings`. There was nothing to relocate from it; role
validation tests already lived entirely in `test_role_validation.py`.

The plan's own Discovery Delta says this, so **the plan contradicts itself** — §A's traceability
table was never updated to match. Per `cross-phase-decisions.md`, feature 04 produced the
first such claim and feature 07 the second; this is now the fourth. This is a systemic
planning-stage defect, not an implementation defect, and warrants escalation rather than a
code fix.

The implementer stated it rather than silently "relocating" nonexistent tests, and wrote real
seam coverage instead. Correct handling.

### Issue #3 — Duplicate test name (Low, not fixed)

`tests/test_game_setup_validation.py` defines `test_count_rule_precedes_unknown_role_id_check`
twice: in `TestGameSetupRulePrecedence:109` (new, calls `validate_game_setup` directly) and in
`TestRoleCountMatchesPlayersAndCenter:340` (relocated verbatim from feature 07, calls
`GameService.create_game`).

**Not redundant** — they pin the same precedence at the seam and at the delegation boundary,
which is legitimate defense in depth. Both run and pass (different classes, no pytest
collision). The only cost is navigability: `pytest -k <name>` selects both, and failure output
needs the class prefix to disambiguate. Left as documented per Low-severity policy; renaming
the seam-level one (e.g. `..._at_seam`) would be a safe future cleanup.

### Issue #4 — `meta.offset` / raw `limit` asymmetry (Low, not fixed)

Both call sites use `.offset(meta.offset).limit(limit)` rather than `.limit(meta.limit)`.
`meta.limit` is echoed verbatim from the argument, so the two are provably always equal —
zero behavioral risk. Cosmetic only.

### Issue #5 — Inherited mypy errors (Low, not fixed)

The 6 `wake_order_sequence` `arg-type` errors moved with the code. Verified against an
isolated baseline extract: they existed identically in `game_service.py` at `2d0d8f3` (mypy
cannot narrow `list[UUID] | None` across a function boundary, in either version). **Net count
unchanged at 23/10 despite +3 source files.** Fixing them means passing the narrowed
`sequence`, which is a rewrite — correctly out of scope for a move-only refactor.

## Fixes Applied

**None.** No Blocker, High, or Medium code defects were found. Issue #1 is resolved by ruling
rather than by edit; Issue #2 is a planning defect; Issues #3–#5 are Low and documented per policy.

Mutation testing temporarily modified `app/services/game_setup_validation.py`; it was restored
from a `cp` backup after each mutant and verified byte-identical to commit `4f29691` by SHA-256
(`453ee61d…8c19c7`) and by `git diff --stat 4f29691` returning empty across all nine reviewed
files. **No git working-tree-mutating command was used at any point** — baseline comparison used
`git show` and `git archive` (read-only) only.

## Remaining Concerns

- **Issue #1: `role_service.py` stays at 425 lines until audit 4.3 is scheduled.** Accepted by
  ruling; the DTO-mapping extraction is the only path under 400 and is an explicit non-goal.
- **Issue #2: this plan family has now produced four fabricated/contradictory coverage claims.**
  Escalate to planning. Implementers and reviewers on later features must keep treating every
  "existing tests" claim as unverified until independently checked.
- **Issue #3: duplicate test name** — cosmetic, safe to rename in a future cleanup pass.
- **`limit=0` remains a `ZeroDivisionError`** on a direct service call with rows present.
  Pre-existing, unreachable over HTTP (`ge=1`), now pinned by `TestPaginateLimitZero` so it is
  documented rather than incidental. Sharp edge only if a non-HTTP caller ever appears.

## Test Coverage Assessment

- **Covered:** AC1 (32 tests incl. 5 genuinely order-sensitive precedence tests — mutation-verified
  by this review), AC2 (44 delegation + 12 seam tests), AC3 (17 tests covering all four required
  edges: `limit=0`, empty set, last partial page, out-of-range page, plus a differential check
  recomputing the legacy expression), AC5 (47/47 baseline tests relocated verbatim).
- New-module coverage: `game_setup_validation.py` 100%, `role_validation.py` 100%,
  `pagination.py` 100%. `role_service.py` uncovered lines 2 → 1 (the removed dead branch is
  gone; surviving `:248` is a pre-existing defensive `RuntimeError`).
- **Missing:** nothing material for this feature's scope. The `TestPaginateMatchesLegacyFormula`
  differential asserts against a hand-copied restatement of the legacy formula, so it would not
  catch a simultaneous drift of both — but that gap is closed independently by the direct
  character-level diff against `2d0d8f3` performed in this review.
- Suite: **490 passed / 96.08%** at review start; 492 at close (drift from features 10/11
  reviewers landing concurrently — outside this scope). My scoped set: **170 passed**.

## Risk Summary

- **`app/services/game_setup_validation.py:51-94` — rule precedence is the highest-risk surface,
  and it is now the best-pinned.** Order verified identical to `2d0d8f3` and confirmed
  order-sensitive by three injected mutations (swap card-count/primary-team; hoist wake-sequence
  above dependencies; sink unknown-ID below card-counts), each killed by exactly its own test and
  no others. Not tautological.
- **`role_validation.py:64-79` — the single intentional logic change.** Deleting a *reachable*
  branch would have been a High finding; empirical probing proves the `>50` branch is unreachable
  through every caller (both pass `RoleCreate`; no `model_construct` or `validate_assignment`
  bypass exists), and that the retained `<2` branch is reachable via whitespace. The asymmetry is
  documented in-code and pinned by `TestRoleNameLengthBounds`, including the exact-50 boundary.
  This also discharges the standing instruction in `cross-phase-decisions.md` ("Feature 09 should
  delete or justify it during validator extraction").
- **`role_service.py` at 425 lines** — accepted; carries a known deferral to audit 4.3. Not a
  latent defect, but it will re-surface as an AC miss in any future line-count audit unless 4.3
  is scheduled.
- **Plan reliability, not code reliability, is this feature's dominant risk.** Four false or
  self-contradictory claims across this plan family means the planning stage — not the
  implementation — is the weak link. The implementer caught this one; the process should not rely
  on that.
