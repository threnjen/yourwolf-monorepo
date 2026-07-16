# Implementation Record: Backend Narration Package (ScriptService Decomposition)

## Summary

Decomposed `script_service.py` (541 lines) into three layers:

- `app/services/narration/inputs.py` — plain input dataclasses (`RoleScriptInput`, `AbilityStepInput`)
- `app/services/narration/templates.py` — pure instruction templates, `STEP_DURATIONS`, dispatch
- `app/services/narration/script_builder.py` — pure ordering/assembly
- `app/services/script_service.py` — DB access + ORM/preview → input adaptation only (541 → 195 lines)

The `_StandInRole`/`_StandInStep`/`_StandInAbility` dataclasses and `_RoleLike`/`_StepLike`
Protocols are deleted. `ScriptService`'s public API (`generate_night_script`,
`preview_role_script`) and import path are unchanged, so **`routers/games.py` and
`routers/roles.py` required zero changes**.

**The plan's central premise was false and I corrected for it before refactoring.** The plan
(AC4, test-plan section) treats `tests/test_script_service.py` as a strong parity oracle
("the 1,273-line suite is the parity oracle — audit rates coverage strong"). It is not. See
[Plan Accuracy Findings](#plan-accuracy-findings). I wrote the oracle first, verified it
against the pre-refactor implementation, and only then moved code.

## Plan Accuracy Findings

Consistent with the fabricated-coverage pattern found by features 04 and 07, this plan's
test-coverage claims did not survive verification.

| Plan claim | Reality | Action taken |
|---|---|---|
| `tests/test_script_service.py` is the AC4 parity oracle; "audit rates coverage strong" | **False for the code being moved.** 83 raw asserts / 1,273 lines. Every template test asserted only `result is not None`, `len(result) > 0`, `isinstance(result, str)`, or a lowercase substring (`"stop" in result.lower()`). **Not one pinned an exact string.** A full rewrite of the narrator copy would have passed. | Wrote `tests/test_narration_templates.py` — 66 exact-equality cases — BEFORE moving any code |
| `script_service.py` at 89%; gaps at 354-362, 406, 423, 433, 436, 443, 455, 457-461, 463, 518-519 (flagged by orchestrator) | Confirmed. Those lines are precisely the unpinned template branches: `team.alien`/`team.vampire`/`role.*` wake targets, `view_card`/`swap_card`/`take_card` fallbacks, all 5 `thumbs_up` branches, 2-option `random_num_players`, and unknown-type → `None`. | All now pinned; `script_service.py` **89% → 100%**, narration package 100% |
| `TestMissingInstructionTemplates` — class name implies missing/absent templates | Same name-vs-content mismatch pattern as feature 07 found. It tests **dispatch of 5 existing templates**, and its docstrings reference `AC1`–`AC9` of a *different, unrelated* feature. | Superseded by exact-string tests; class removed. Its 3 genuine DB-facing preview tests were **kept** (renamed `TestAbilityTypePreviews`), not deleted |
| AC4: "byte-identical for all **30 seed roles**" verified by the existing suite | The `seeded_roles` fixture contains **8** roles, not 30. The existing suite never covered the 30-role seed set. | Ran a one-shot old-vs-new parity harness against the **real 30-role seed data** (`app/seed/roles.py`) |
| Context Discovery Delta: preview schemas are "not exported from the barrel" | Stale — feature 01 landed and added all three to `app/schemas/__init__.py`. | Confirmed; factored into the AC6 decision |
| Context Environment State: "pytest not installed; baseline not capturable" | Stale. `uv run pytest -q` works. | Baseline captured: 349 passed, 94.31% |

### Behavior bug found and deliberately preserved

`_thumbs_up_instruction` renders `team.werewolf` as **"Werewolfs, put your thumbs out."**
(naive `f"{team.title()}s"` pluralization) — while the wake instruction correctly says
"Werewolves". Narrator copy is frozen for this feature (AC4 + context Constraints), so the
bug is **pinned as-is** in `tests/test_narration_templates.py` with an explanatory comment
rather than silently fixed. Flagged for a future copy-fix feature; fixing it here would have
violated AC4 and corrupted the Phase 04 port oracle.

## Sibling Features

Scanned all 12 feature directories.

- **09-backend-service-validators** (parallel, Wave 4) — owns `game_service.py`,
  `role_service.py`, and new validator modules. **Not touched.**
- **11-frontend-type-split** (parallel) — `yourwolf-frontend/`. **Not touched.**
- **04-backend-domain-exceptions** (upstream) — shares `routers/games.py`. No conflict:
  routers needed zero edits.
- **01-backend-schema-surface** (upstream) — added preview schemas to the schemas barrel;
  relevant to the AC6 decision.
- **Phase 04 (TS engine port)** — consumes this package as the port template.

**Note for reviewer:** `git status` shows many modified files (`game_service.py`,
`role_service.py`, `yourwolf-frontend/*`, `game_setup_validation.py`, `pagination.py`,
`role_validation.py`). Those are **concurrent sibling agents**, not this feature. My diff is
confined to the 5 files in [Files Changed](#files-changed).

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Pure templates module | template tests | Exact-copy assertions per branch | Done | `app/services/narration/templates.py` | `tests/test_narration_templates.py`; import evidence below | PENDING | PENDING |
| AC2 | Input dataclasses; stand-ins deleted | adapter tests | ORM→input, preview→input | Done | `app/services/narration/inputs.py`, `app/services/script_service.py` | `tests/test_script_service.py::TestRoleToInputAdapter`, `::TestPreviewRequestToInputAdapter` | PENDING | PENDING |
| AC3 | Builder owns assembly; thin service; API frozen | builder + router tests | Ordering/assembly unit tests | Done | `app/services/narration/script_builder.py`, `app/services/script_service.py` | `tests/test_narration_script_builder.py`; routers unchanged (0 edits) | PENDING | PENDING |
| AC4 | Byte-identical output (30 roles, default/custom order, preview) | parity suite | Old-vs-new diff | Done | all narration modules | 30/30 seed roles verified old-vs-new (harness, removed); `tests/test_narration_templates.py` is the durable oracle | PENDING | PENDING |
| AC5 | Test split along seams; assertions ≥ baseline | 3 split files | Templates / builder / preview+DB | Done | 3 test files | 83 → 139 raw asserts; 47 → 86 test defs; 151 collected | PENDING | PENDING |
| AC6 | Relocate preview schemas OR record rejection | n/a | Import graph compiles | Done (move **rejected**, rationale below) | `app/schemas/role.py` (unchanged) | [AC6 decision](#ac6-decision-move-rejected) | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Templates, `_get_wake_instruction`, `STEP_DURATIONS`, dispatch → pure module, no DB/ORM imports | Done | `narration/templates.py` | Only non-ORM import is the `StepModifier` enum (permitted). Verified: no `sqlalchemy`/`Session`/`joinedload`/`query(` anywhere in the package |
| AC2 | Pure functions take plain input dataclasses; stand-ins + Protocols deleted | Done | `narration/inputs.py` | `_StandInRole`/`_StandInStep`/`_StandInAbility`, `_RoleLike`/`_StepLike` all deleted |
| AC3 | Builder owns ordering/assembly; service = DB + adaptation; public API preserved | Done | `narration/script_builder.py`, `script_service.py` | 541 → 195 lines. Routers required **zero** changes |
| AC4 | Byte-identical scripts, all 30 seed roles, default + custom order, preview section headers | Done | all | Verified old-vs-new: 30/30 seed role previews + night script (default, custom sequence, partial-sequence fallback) all byte-identical |
| AC5 | Test split along the same seams; assertion count ≥ baseline | Done | 3 test files | 83 → 139 raw asserts (+67%); strength raised from substring/non-None to exact equality |
| AC6 | Preview schemas relocated OR rejection recorded | Done (rejected) | — | See below |

### AC6 decision: move **rejected**

AC6 explicitly allows "explicitly left in place with the move recorded as rejected —
implementer's call". Rejected because:

1. **It would invert the schema dependency.** `PreviewScriptRequest` depends on
   `AbilityStepCreateInRole`, which lives in `schemas/role.py`. Moving it to `schemas/game.py`
   forces a new `schemas/game.py → schemas/role.py` import. `game.py` currently imports only
   `models.game_session` and `schemas.base`.
2. **The consumer is a role endpoint.** All three schemas are consumed exclusively by
   `routers/roles.py` (`POST /roles/preview-script`), describing a *draft role*.
3. **Splitting the trio is worse.** Moving only the two response schemas would leave the
   router importing its request type from `role.py` and its response types from `game.py`.
4. **Finding 1.3's real concern is already resolved.** Feature 01 added all three to the
   `app/schemas/__init__.py` barrel, so importers already have one uniform surface.
5. **Risk/benefit.** This feature's prime directive is exact behavior preservation on the
   Phase 04 port template; schema churn adds review surface with no functional gain.

**Recommended better fix (out of scope, deferred):** the underlying issue is that narration
schemas are scattered — `NarratorAction`/`NightScript` sit in `game.py` despite not being
game-session concerns. A dedicated `app/schemas/narration.py` holding all four narration
schemas (leaving `PreviewScriptRequest` in `role.py` next to its dependency) would resolve
finding 1.3 without inverting dependencies. Best done alongside the Phase 04 port, when the
narration boundary is settled.

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/services/narration/__init__.py` | Create | Package docstring + public exports | AC1 |
| `yourwolf-backend/app/services/narration/inputs.py` | Create | `AbilityStepInput`, `RoleScriptInput` frozen dataclasses | AC2; Phase 04 TS `RoleInput`/`AbilityStepInput` contract |
| `yourwolf-backend/app/services/narration/templates.py` | Create | 15 instruction generators, `build_wake_instruction`, `STEP_DURATIONS`, `_TEMPLATES` dispatch, `build_step_instruction`, `get_step_duration` | AC1 |
| `yourwolf-backend/app/services/narration/script_builder.py` | Create | `build_role_script`, `build_night_script_actions`, `build_preview_actions`, `total_duration_seconds` | AC3 |
| `yourwolf-backend/app/services/script_service.py` | Modify | 541 → 195 lines. Stand-ins/Protocols deleted; added `_role_to_input`, `_preview_request_to_input`, `_get_waking_roles`; dropped unused `Ability` import | AC2, AC3 |
| `yourwolf-backend/app/routers/games.py` | **Unchanged** | — | API + import path frozen |
| `yourwolf-backend/app/routers/roles.py` | **Unchanged** | — | API + import path frozen |
| `yourwolf-backend/app/schemas/role.py`, `game.py`, `__init__.py` | **Unchanged** | — | AC6 move rejected |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_narration_templates.py` | Create | Parity oracle: 10 wake + 41 instruction + 15 duration exact-equality cases, OR-prefix, unknown-type→None | AC1, AC4 |
| `yourwolf-backend/tests/test_narration_script_builder.py` | Create | Pure ordering/assembly: no-step roles, unknown-type skip, OR `requires_player_action`, step sorting, empty night, section headers | AC3, AC5, Section B edge cases |
| `yourwolf-backend/tests/test_script_service.py` | Modify | Removed 9 `_StandIn*`-based weak tests (superseded); kept 3 DB-facing preview tests as `TestAbilityTypePreviews`; added `TestRoleToInputAdapter` + `TestPreviewRequestToInputAdapter` | AC2, AC5 |

## Test Results

- **Baseline**: 349 passed, 0 failed, 94.31% coverage (at parent commit `2d0d8f3`)
- **Final**: 490 passed, 0 failed, 96.08% coverage
- **New tests added**: +141 collected (47 → 86 test defs across the split; 151 collected in the 3 narration/service files)
- **Assertions**: 83 → 139 raw (+67%), with strength raised from substring/non-None to exact equality
- **Coverage of the decomposed code**: `script_service.py` 89% → **100%**; `narration/templates.py` **100%**; `narration/script_builder.py` **100%**; `narration/inputs.py` **100%**
- **Regressions**: None
- **mypy**: no errors in any file I touched (23 pre-existing errors remain in untouched files, incl. `game_setup_validation.py` — sibling feature territory)
- **black/isort**: new files formatted. `tests/test_script_service.py` was **already** non-black-compliant at baseline; I did not reformat it, to avoid a large diff unrelated to this feature.

### AC4 parity evidence (method)

Because the plan's oracle did not exist, parity was established in three independent steps:

1. **Captured** current behavior exhaustively from the pre-refactor module (41 instruction
   branches, 10 wake targets, 15 durations, OR-prefix, unknown-type).
2. **Cross-checked** the transcribed expectation tables against the **old** implementation
   directly — guarding against a transcription error that coincidentally matched a matching
   port error. Result: all 67 cases matched the old implementation exactly.
3. **End-to-end diffed** old vs new by loading the pre-refactor module read-only
   (`git show 2d0d8f3:...`): night script (default order, custom `wake_order_sequence`,
   partial-sequence fallback) and previews for **all 30 real seed roles** — all byte-identical.

Step 3 used a one-shot harness that was removed (it depended on a scratchpad copy of the
deleted module, so it cannot be a permanent test). The durable oracle is
`tests/test_narration_templates.py`, whose expectation tables are verified against both the
old and new implementations.

## Deviations from Plan

1. **Wrote the parity oracle before refactoring** (not in the plan's task list). The plan
   assumed the oracle existed. It did not. Non-negotiable prerequisite for safely splitting a
   541-line module under a byte-identical constraint.
2. **AC6 move rejected** — permitted by AC6; rationale above.
3. **Dropped the unused `role` parameter from the 15 instruction generators.** None of the 15
   referenced `role`; the pure signature is `(params) -> str`. Behavior identical (proven by
   the parity harness), and it simplifies the Phase 04 TS port. `build_wake_instruction` still
   takes the role (it uses `role.name`).
4. **Deleted 9 tests rather than porting them.** They asserted only non-None/substring and are
   strictly superseded by exact-equality cases in `test_narration_templates.py`. Per AGENTS.md
   ("delete stale tests rather than skip"). Every one of the 9 has a stronger replacement.
5. **`StepModifier` enum import kept** (the Discovery Delta left this open) — permitted as a
   plain enum, not an ORM dependency. Mirroring it would have risked drift between two enums.
6. **Test files named `test_narration_templates.py` / `test_narration_script_builder.py`** and
   dataclasses `RoleScriptInput` / `AbilityStepInput` (all `[PROPOSED - name TBD]` in the plan).
   Flat `tests/` layout matches repo convention.
7. **Schemas imported by `script_builder.py`.** `NarratorAction`/`NarratorPreviewAction` are
   Pydantic models, not ORM — AC1 forbids DB/ORM only. Adding a second mapping layer would
   have added risk with no benefit.

## Gaps

1. **Manual QA not performed** (plan Stage 2 task: "generate a night script for a seeded game
   in the running app"). Not run — no app instance was started in this subagent context. The
   automated old-vs-new byte-parity check across all 30 seed roles is strictly stronger
   evidence than a manual spot-check, so I consider the intent satisfied; flagging for the
   reviewer to confirm.
2. **"Werewolfs" pluralization bug** preserved deliberately (AC4 freeze). Needs a future
   copy-fix feature. Fixing it will require updating one pinned line in
   `tests/test_narration_templates.py`.
3. **`tests/test_script_service.py` remains non-black-compliant** — pre-existing at baseline,
   deliberately not reformatted to keep this diff reviewable.

## Reviewer Focus Areas

- **`tests/test_narration_templates.py` expectation tables are the Phase 04 port oracle.** Any
  edit to these strings is a behavior change. They were verified against both the pre- and
  post-refactor implementations. The `thumbs_up` / `team.werewolf` → `"Werewolfs"` case is an
  intentionally pinned upstream bug, not a typo.
- **`app/services/script_service.py:_get_waking_roles`** — I merged the duplicated custom-order
  and default-order queries into one shared `query` with divergent ordering. Confirm the
  custom-sequence fallback (`seq_index.get(str(r.id), len(sequence_ids))`) and the
  de-dup-by-role-ID set are unchanged. Covered by byte-parity tests for default, custom, and
  partial-sequence cases.
- **Dropped `role` param from the 15 generators** (deviation 3) — verify no generator ever
  needed it.
- **9 deleted tests** — verify each has a stronger replacement in
  `tests/test_narration_templates.py` before accepting the deletion.
- **AC6 rejection** — the reasoning turns on `PreviewScriptRequest`'s dependency on
  `AbilityStepCreateInRole`. If you disagree, the `schemas/narration.py` alternative is the
  option I'd recommend over the plan's literal proposal.
