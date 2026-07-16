# Plan: Backend Service Validator Extraction & Pagination Helper

## Execution Metadata

- **Wave:** 4
- **Parallel safe:** yes
- **Depends on:** 07-backend-validation-consolidation
- **Key files modified:** `yourwolf-backend/app/services/game_setup_validation.py` [PROPOSED - name TBD] (new), `yourwolf-backend/app/services/role_validation.py` [PROPOSED - name TBD] (new), `yourwolf-backend/app/services/game_service.py`, `yourwolf-backend/app/services/role_service.py`, pagination helper module [PROPOSED - name TBD, audit suggests next to `app/schemas/base.py`] (new), `yourwolf-backend/tests/test_game_service.py`, `yourwolf-backend/tests/test_role_validation.py` (exists — expander-verified; extend/relocate into it, do not create), `yourwolf-backend/tests/test_roles.py` (verify)
- **Sequential reason:** shares `game_service.py` and `role_service.py` with upstream 07-backend-validation-consolidation (must extract the post-consolidation rule set, including the relocated card-total rule). Parallel-safe within Wave 4 (disjoint from 10 and 11).

Source: refactor audit findings 3.2 (Medium), 3.3 (Medium), 5.5 (Low), restructuring items 3 and 9 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: The four (post-feature-07: five, including the relocated count rule) private validators in `GameService` (`_validate_card_counts`, `_validate_primary_teams`, `_validate_dependencies`, `_validate_wake_sequence`, `game_service.py` L128–L280) move to a game-setup validation module; `GameService` calls it. Validators raise the feature-04 domain exceptions exactly as before.
- **AC2**: `validate_role` (L410–L485) and `get_warnings` (L487–L518) move from `RoleService` to a role validation module; `RoleService` (including the create-path validation from feature 07) calls it.
- **AC3**: The duplicated pagination block (`count → math.ceil(total/limit) → offset`, `role_service.py` L79–L127 and `game_service.py` L410–L427) is replaced by one shared `paginate()` helper [PROPOSED - name TBD]; both list endpoints return identical results to before.
- **AC4**: `GameService` and `RoleService` each drop below ~400 lines; no public service method signature changes.
- **AC5**: Test files split along the same seams: validation tests move to dedicated test modules; full suite passes with equal-or-higher assertion count.

Non-goals: no rule changes (07 finished those); no DTO-mapping extraction (audit 4.3/cross-cutting #3 — explicitly deferred, record as deferred: hand-rolled ORM→DTO mapping standardization is out of scope for this remediation round); no router changes.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1 | game validation module, `game_service.py` | Existing tests relocated from `test_game_service.py` (950 lines) |
| AC2 | role validation module, `role_service.py` | Existing tests relocated from `test_roles.py`/service tests |
| AC3 | paginate helper + 2 services | Must-have automated test: helper math (page/limit/offset/pages edges) — scenarios, names [PROPOSED - name TBD]; existing list tests |
| AC4 | services | Code-review evidence (line counts, unchanged public API) |
| AC5 | test suite | Existing tests, assertion-count comparison |

## B. Correctness & Edge Cases

- Pagination edges: limit=0 guarded? empty result set, last partial page, out-of-range page — replicate current behavior exactly (derive from existing tests; if untested, pin current behavior with new tests before switching).
- Validator extraction must preserve evaluation ORDER — error precedence is observable through which message a multi-violation payload returns first.
- `get_warnings` is advisory (non-raising) — keep the raising/non-raising split intact in the new module.

## C. Consistency & Architecture Fit

- Mirrors the seam feature 10 uses for `ScriptService` — services become orchestration + DB, rules/pure logic live in dedicated modules.
- New modules take plain inputs (session + DTOs as today); do not invent a repository layer.

## D. Clean Design & Maintainability

Move-only refactor; the diff should be dominated by relocation, not rewrites.

## E. Observability, Security, Operability

No new logs. Rollback: revert.

## F. Test Plan

- Must-have: paginate helper unit tests (AC3).
- Existing tests to update: relocation of validation test classes; keep service-level integration tests proving delegation.
- Refactor note: this feature is primarily test-file surgery risk — `test_game_service.py` mixes lifecycle and validation tests (audit 3.5); split them here.

## Stage 1: Game-setup validator module
**Goal**: AC1 + its test relocation
**Success Criteria**: GameService delegates; suite green
**Status**: Not Started

## Stage 2: Role validator module
**Goal**: AC2 + its test relocation
**Success Criteria**: RoleService delegates; create/validate parity (feature 07) still holds
**Status**: Not Started

## Stage 3: Pagination helper
**Goal**: AC3–AC5
**Success Criteria**: One pagination implementation; line targets met; full suite green
**Status**: Not Started
