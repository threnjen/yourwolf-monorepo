# Plan: Backend Validation Placement Consolidation

## Execution Metadata

- **Wave:** 3
- **Parallel safe:** yes
- **Depends on:** 04-backend-domain-exceptions
- **Key files modified:** `yourwolf-backend/app/routers/games.py`, `yourwolf-backend/app/services/game_service.py`, `yourwolf-backend/app/services/role_service.py`, `yourwolf-backend/app/schemas/role.py`, `yourwolf-backend/tests/test_games_router.py`, `yourwolf-backend/tests/test_game_service.py`, `yourwolf-backend/tests/test_roles.py` (verify)
- **Sequential reason:** shares `routers/games.py`, `game_service.py`, `role_service.py` with upstream 04-backend-domain-exceptions; raises the typed exceptions 04 introduces. Parallel-safe within Wave 3 (disjoint from 08).

Source: refactor audit findings 5.2 (Medium), 5.3 (Medium), cross-cutting observation #2 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Adopted policy (audit cross-cutting #2): **schemas validate shape/bounds; services validate cross-entity rules; routers validate nothing.**

Acceptance criteria:

- **AC1**: The role-count-vs-players rule at `app/routers/games.py:40-49` moves into `GameService.create_game` alongside the other four validators (`game_service.py` L61–L95 area); the router guard is deleted. Calling `GameService.create_game` directly now enforces the full rule set.
- **AC2**: Role-name length bounds are reconciled to a single set of values: schema (`app/schemas/role.py` L61, currently 1–100) and the service dry-run validator (`role_service.py` L426–L429, currently 2–50) agree. Decision rule: the *service's* 2–50 is the stricter, intentional-looking rule — adopt it in the schema unless existing seeded/production role names violate it (check the 30 seed roles first; if any fall outside 2–50, surface the conflict in the implementation record and adopt bounds that fit the seeds). Companion change (expander-verified): `RoleUpdate.name` at `schemas/role.py` L119 carries the same 1–100 bounds and must be reconciled identically.
- **AC3**: `RoleService.create_role` invokes the same validation logic as `validate_role`, so `POST /roles` can never accept a payload that `POST /roles/validate` rejects. Rule violations raise the domain validation exception from feature 04.
- **AC4**: HTTP behavior for previously-covered invalid inputs keeps its status codes (422 for schema-shape, 400 for domain rules — match existing router tests). Known intentional shift (expander-flagged): tightening schema name bounds moves length violations from service-level 400/error-list to pydantic 422 — including on `/roles/validate`, which will 422 on out-of-bounds names instead of returning them in its error list. Record this contract change in the implementation record and update affected tests deliberately.
- **AC5**: Full backend suite passes; tests moved (not deleted) from router-level to service-level where the rule moved.

Non-goals: no extraction of validators into separate modules (feature 09 does that); no new validation rules; no warning-system changes (`get_warnings` untouched).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | `routers/games.py`, `game_service.py` | Existing tests to relocate: card-count cases in `test_games_router.py` → `test_game_service.py`; router-level 400 still asserted once |
| AC2 | `schemas/role.py`, `role_service.py` | Must-have automated test: boundary values at the agreed bounds — scenarios, names [PROPOSED - name TBD]; seed-name audit evidence |
| AC3 | `role_service.py` | Must-have automated test: create rejects what validate rejects (property: same verdict) — scenario, name [PROPOSED - name TBD] |
| AC4–AC5 | routers + suite | Existing tests |

## B. Correctness & Edge Cases

- The count rule's exact arithmetic (players + center vs selected cards) must be transplanted verbatim — copy the expression, don't re-derive it.
- `validate_role` currently serves a dry-run endpoint returning structured results; `create_role` needs the *raising* form — share the rule evaluation, differ only in reporting (list vs raise). Do not duplicate the rules to achieve this.
- Name-bound change is user-visible: names of length 1 or 51–100 previously creatable become rejected. Confirm seeds pass; note the contract change.

## C. Consistency & Architecture Fit

- Uses feature 04's exception types — this dependency is deliberate and recorded in both plans.
- Validation policy line (schema=shape, service=rules, router=nothing) should be stated in the implementation record for future features to follow.

## D. Clean Design & Maintainability

Rule movement and reconciliation only; net LOC should be ~flat or negative.

## E. Observability, Security, Operability

No new logs. Slightly stricter input surface is a hardening win. Rollback: revert.

## F. Test Plan

- Must-have: AC2 boundary tests, AC3 create/validate-agreement test.
- Existing tests to update: card-count router tests relocate to service tests; keep one router-level integration case proving the HTTP mapping.
- Refactor note: `test_game_service.py` (950 lines) and `test_games_router.py` are the anchors; expect edits in both.

## Stage 1: Game-creation rule relocation
**Goal**: AC1, AC4
**Success Criteria**: Router validates nothing; service enforces all five rules; suite green
**Status**: Not Started

## Stage 2: Role-name reconciliation + create-path validation
**Goal**: AC2, AC3, AC5
**Success Criteria**: One bounds definition; create/validate agree; suite green
**Status**: Not Started
