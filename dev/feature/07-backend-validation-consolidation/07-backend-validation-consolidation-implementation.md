# Implementation Record: Backend Validation Placement Consolidation

## Summary

Applied the audit's validation placement policy (cross-cutting #2) to the backend:

> **Schemas validate shape/bounds; services validate cross-entity rules; routers validate nothing.**

Three changes: (1) the role-count-vs-players rule moved out of `routers/games.py` into `GameService.create_game`; (2) role-name bounds reconciled to a single 2–50 definition across `RoleBase.name` and `RoleUpdate.name`; (3) `RoleService.create_role` now runs the same rule evaluation as `validate_role`, so `POST /roles` can no longer accept a payload `POST /roles/validate` rejects.

All five ACs complete. Suite: 330 → 347 passed, coverage 94.37% → 94.31% (gate 80%). Production diff is +26/−17 (net +9 LOC).

**Two user-visible contract changes are recorded below (AC4 section) — one anticipated by the plan, one not.** The second (win conditions now mandatory on create) is the more significant of the two and warrants explicit sign-off.

## Sibling Features

Scanned all 11 sibling feature directories (titles only). Relevant relationships:

- **Upstream `04-backend-domain-exceptions` (Wave 2, landed)**: supplies `DomainValidationError`, which this feature raises for all relocated/newly-enforced rules. Confirmed live at `app/exceptions.py` (commit `42cd649`). Per the upstream contract, only concrete leaf types are raised — never the `DomainError` base (which has no handler and would yield a 500).
- **Downstream `09-backend-service-validators`**: will extract the validators consolidated here. Rules were deliberately kept cohesive inside the service methods (no new modules) to ease that extraction.
- **Parallel `08-frontend-abilities-step` (Wave 3)**: frontend-only; no file overlap. Backend untouched by it.
- **Shared modules with 04**: `routers/games.py`, `game_service.py`, `role_service.py` — all edits made on top of 04's landed state. No stale `except ValueError` was reintroduced (verified: `app/` has none outside the pre-existing, out-of-scope `seed/roles.py`).

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | Role-count rule moves to service; router guard deleted | [PROPOSED - name TBD] → `TestRoleCountMatchesPlayersAndCenter` | Service raises `DomainValidationError` on count mismatch; router validates nothing | Complete | `app/services/game_service.py:62-70`, `app/routers/games.py:24-41` | `tests/test_game_service.py::TestRoleCountMatchesPlayersAndCenter` (3 tests); `tests/test_games_router.py::TestCreateGameEndpoint::test_rejects_wrong_role_count` | PENDING | PENDING |
| AC2 | Name bounds reconciled to one set of values (2–50) | [PROPOSED - name TBD] → `test_name_accepts_lower_bound` / `test_name_accepts_upper_bound` / `test_update_name_bounds_match_create` | Boundary values 2 and 50 accepted; 1 and 51 rejected, on both create and update paths | Complete | `app/schemas/role.py:63`, `app/schemas/role.py:121` | `tests/test_schemas.py::TestRoleCreateSchema::test_name_{min,max}_length`, `::test_name_accepts_{lower,upper}_bound`, `tests/test_schemas.py::TestRoleUpdateSchema::test_update_name_bounds_match_create` | PENDING | PENDING |
| AC3 | `create_role` shares rule evaluation with `validate_role` | [PROPOSED - name TBD] → `TestCreateValidateAgreement` | Property: create rejects any payload validate rejects (7 parametrized rule classes) | Complete | `app/services/role_service.py:202-221` | `tests/test_role_validation.py::TestCreateValidateAgreement` (9 tests) | PENDING | PENDING |
| AC4 | HTTP status codes preserved (422 shape / 400 domain), with recorded layer shift | Existing tests | Router-level 400 still asserted; `/roles/validate` 422 on out-of-bounds name | Complete | `app/routers/games.py`, `app/routers/roles.py` | `tests/test_games_router.py::TestCreateGameEndpoint::test_rejects_wrong_role_count`; `tests/test_role_validation.py::TestValidateEndpoint::test_validate_endpoint_422s_on_out_of_bounds_name`; `::TestCreateValidateAgreement::test_create_role_endpoint_returns_400_for_invalid_payload` | PENDING | PENDING |
| AC5 | Full suite passes; tests moved not deleted | Existing suite | 347 passed, coverage ≥ 80% | Complete | — | `uv run pytest -q` → 347 passed, 94.31% | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Role-count-vs-players rule relocated into `GameService.create_game`; router guard deleted | Complete | `app/services/game_service.py`, `app/routers/games.py` | Arithmetic and error message transplanted **verbatim**. Placed as the **first** check in `create_game` to preserve the original precedence (the router guard ran before any service rule), so a payload with both a wrong count and unknown IDs still reports the count error as before. |
| AC2 | Name bounds reconciled to 2–50 | Complete | `app/schemas/role.py` | Adopted the service's stricter 2–50 per the verified seed audit (all 30 seed names within bounds; shortest "Cow"=3, longest "Paranormal Investigator"=23). Applied to **both** `RoleBase.name` (L63) and `RoleUpdate.name` (L121). |
| AC3 | `create_role` invokes the same rules as `validate_role`, raising `DomainValidationError` | Complete | `app/services/role_service.py` | Implemented as `errors = self.validate_role(...)` → raise if non-empty. One rule set, two reporting modes. Joined with `"; ".join(errors)`, matching `game_service`'s existing convention. |
| AC4 | HTTP status codes preserved, with recorded contract shifts | Complete | `app/routers/games.py`, `app/routers/roles.py` | 400 for domain rules and 422 for schema shape both preserved. **Two contract changes recorded below.** |
| AC5 | Full suite green; tests moved not deleted | Complete | — | 347 passed. No test deleted; see Deviations re: the plan's inaccurate "relocate" claim. |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-backend/app/routers/games.py` | Modify | Deleted the `total_cards` guard (−12 LOC); removed the `HTTPException` line from the docstring | AC1 — router now validates nothing. `HTTPException`/`status` imports retained (still used by 5 other endpoints). |
| `yourwolf-backend/app/services/game_service.py` | Modify | Added the role-count check as the first validator in `create_game`; docstring updated | AC1 — service is now authoritative; direct service calls enforce the full rule set. |
| `yourwolf-backend/app/schemas/role.py` | Modify | `RoleBase.name` and `RoleUpdate.name`: `min_length=1, max_length=100` → `min_length=2, max_length=50` | AC2 — single bounds definition across create and update paths. |
| `yourwolf-backend/app/services/role_service.py` | Modify | `create_role` now calls `validate_role` and raises `DomainValidationError` on any error; docstring documents the shared rule set | AC3 — create/validate can no longer disagree. |
| `yourwolf-backend/app/routers/roles.py` | Modify | Broadened the `create_role` docstring `Raises:` (was "400 if an ability type is unknown") | AC3 — the endpoint now surfaces the full rule set, not just unknown abilities. |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-backend/tests/test_game_service.py` | Modify | Added `TestRoleCountMatchesPlayersAndCenter` (3 tests: too few, too many, exact) | AC1 — service-level enforcement of the relocated rule |
| `yourwolf-backend/tests/test_games_router.py` | Unchanged | `test_rejects_wrong_role_count` kept as the single router-level HTTP-mapping case (400 + `"Must select exactly 8 roles"`) | AC1/AC4 — proves `DomainValidationError` → 400 mapping end-to-end |
| `yourwolf-backend/tests/test_schemas.py` | Modify | Retargeted `test_name_min_length` (`""`→`"x"`) and `test_name_max_length` (101→51 chars); added `test_name_accepts_lower_bound`, `test_name_accepts_upper_bound`, `test_update_name_bounds_match_create`; added `win_conditions` to one create payload | AC2 — boundary coverage on both schemas |
| `yourwolf-backend/tests/test_role_validation.py` | Modify | Retargeted 2 name tests to the schema layer; added `test_name_short_after_strip_still_fails_in_service`; added `TestCreateValidateAgreement` (9 tests); added `test_validate_endpoint_422s_on_out_of_bounds_name`; adjusted `test_validate_endpoint_invalid_role` | AC2/AC3/AC4 — layer shift + agreement property |
| `yourwolf-backend/tests/test_roles.py` | Modify | Added a minimal `win_conditions` to 5 create payloads | AC3 fallout — payloads were invalid under the shared rule set |
| `yourwolf-backend/tests/test_role_service.py` | Modify | Added `win_conditions=[WinConditionCreate(...)]` to 3 create payloads | AC3 fallout — same |

## Test Results

- **Baseline**: 330 passed, 0 failed, 94.37% coverage (before implementation)
- **Final**: 347 passed, 0 failed, 94.31% coverage (gate: 80%)
- **New tests added**: 17
- **Regressions**: None. 9 pre-existing tests required payload updates (not regressions — their payloads were invalid under AC3's newly-shared rule set; each still tests its original subject).

Formatting/type gates (all pre-existing state preserved):
- `black`: `test_schemas.py` and `test_role_validation.py` were clean at baseline and I regressed them, so I reformatted **only those two**. `role_service.py` and `test_script_service.py` fail black **at baseline** (verified via `git show HEAD:…`) and were left alone — repo does not currently enforce black/isort.
- `mypy`: 23 errors in 10 files, unchanged. The 6 in `game_service.py` are all in `_validate_wake_sequence` (L252–281), untouched by me. My added code contributes zero errors.

## Deviations from Plan

1. **Plan §F / traceability table claim is false — no card-count tests existed to relocate.** The plan states "Existing tests to relocate: card-count cases in `test_games_router.py` → `test_game_service.py`" (plural), and the tasks say to "move, don't delete". **Verified: exactly one such router test exists** (`test_rejects_wrong_role_count`), and the tasks separately require keeping exactly one router-level case. These two instructions are mutually exclusive — the only existing test *is* the one to keep. No service-level test for this rule existed. (`TestCardCountValidation` in `test_game_service.py` covers per-role `min_count`/`max_count`, a **different** rule despite the similar name.) **Action taken:** kept the router test in place and *wrote* `TestRoleCountMatchesPlayersAndCenter` new. Nothing was moved or deleted. This matches the briefing's warning that this plan family contains false coverage claims.

2. **Context file line numbers drifted.** Context claims `test_schemas.py` `test_name_min_length`/`test_name_max_length` at L56/L65; actual L93/L102. Tests existed as described. No impact.

3. **AC2 bounds decision taken without re-litigation**, per the verified upstream fact: adopted 2–50; no seed conflict.

4. **Service-side name checks retained rather than deleted.** With the schema at 2–50, `validate_role`'s `len(name) > 50` branch is unreachable via `RoleCreate` (schema caps at 50 and `.strip()` only shortens). The `< 2` branch **remains reachable** via whitespace padding (`" a "` → `"a"`), and is now covered by `test_name_short_after_strip_still_fails_in_service`. Kept both per the context's explicit intent ("the service's own 2–50 check … still guards direct service calls") and because AC2 asks for the values to *agree*, not for the service check to be removed. Coverage is line-based (not branch), so the unreachable `elif` does not dent the gate. Flagged for feature 09.

## Contract Changes (AC4)

**1. Name-length violations shift from 400/error-list to 422 — anticipated by the plan.**
Names of length 1, or 51–100, were previously creatable; they are now rejected by pydantic at request parsing. `POST /roles/validate` previously returned `200 {is_valid: false, errors: ["Role name must be…"]}` for such names and now returns **422**. Locked in by `test_validate_endpoint_422s_on_out_of_bounds_name`. The `/roles/validate` **response shape is unchanged** for all payloads that still parse.

**2. `POST /roles` now requires at least one win condition, and enforces duplicate-name/ability-step rules — NOT anticipated by the plan. Recommend explicit sign-off.**
This is a direct and intended consequence of AC3 ("`create_role` invokes the same validation logic as `validate_role`"), but the plan only called out the name-bounds shift under AC4. Because `validate_role` enforces `"At least one win condition is required."`, plus duplicate-name and ability-step-order rules, `POST /roles` payloads that previously succeeded now return **400**. This is what made 9 existing tests fail. Newly rejected on create:
- payloads with no `win_conditions` (previously created a role with none)
- payloads with zero or >1 primary win condition
- names duplicating a public/official role (case-insensitive)
- ability steps whose first modifier isn't `none`, whose orders aren't sequential from 1, or referencing an inactive/unknown ability type

The audit's stated goal ("`POST /roles` can never accept a payload `POST /roles/validate` rejects") requires exactly this. Recording it as deliberate; it is a real API tightening that any existing client creating win-condition-less roles will notice.

## Gaps

1. **`validate_role`'s `> 50` name branch is now unreachable through the API** (see Deviation 4). Left in place intentionally; feature 09 should decide whether to keep it as a direct-call guard or drop it during extraction.
2. **No test asserts the count rule fires *before* the unknown-role-ID check.** I preserved that precedence deliberately by placing the check first, but the ordering is only implicitly covered. A dedicated test would pin it; deemed out of scope (no new rules).
3. **Pre-existing `except ValueError` blocks remain in `app/seed/roles.py`** (L168/L182/L249). Outside this feature's declared file scope and unrelated to domain exceptions (they catch enum/pydantic parse errors). Not touched; noted for awareness.
4. **`yourwolf-backend/uv.lock` is newly untracked.** Git status was clean at baseline; running the prescribed `uv run pytest -q` generated it. It is not gitignored. I neither committed nor deleted it — whether to track a lockfile is a repo-level decision outside this feature's scope. Flagging for the orchestrator.

## Reviewer Focus Areas

- **`app/services/game_service.py:62-70` — rule placement/precedence.** Verify the transplant is verbatim (message format and arithmetic) and that placing it *first* is the right call for preserving the old router-guard precedence over the unknown-role-ID check.
- **`app/services/role_service.py:202-221` — the AC3 blast radius.** This is the highest-risk change in the feature. Confirm that tightening `POST /roles` to the full `validate_role` rule set (esp. **mandatory win conditions**) is acceptable, and that fixing 9 existing tests by adding `win_conditions` was correct rather than a signal the rule set is too strict for the create path.
- **`tests/test_roles.py` / `tests/test_role_service.py` payload edits.** Verify I did not weaken any test's original assertion subject when adding `win_conditions` — each should still test what its name claims.
- **Plan §F inaccuracy (Deviation 1).** Confirm that keeping the single router test and writing a new service test satisfies AC1/AC5's "moved, not deleted" intent, given nothing existed to move.
- **Formatting scope.** I reformatted only the two files I regressed and deliberately left baseline black/isort failures alone. Confirm this is the desired scope discipline.
