# Context: Backend Service Validator Extraction & Pagination Helper

## Key Files

### Files being changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/services/game_setup_validation.py` [PROPOSED - name TBD] | New game-setup validation module (AC1) | Create |
| `yourwolf-backend/app/services/role_validation.py` [PROPOSED - name TBD] | New role validation module (AC2) | Create |
| `yourwolf-backend/app/services/game_service.py` (506 lines) | Delegates setup validation; uses pagination helper | Modify |
| `yourwolf-backend/app/services/role_service.py` (518 lines) | Delegates `validate_role`/`get_warnings`; uses pagination helper | Modify |
| Pagination helper module [PROPOSED - name TBD, e.g. next to `app/schemas/base.py`] | Shared `paginate()` helper [PROPOSED - name TBD] | Create |
| `yourwolf-backend/tests/test_game_service.py` (950 lines) | Split: relocate validation tests out of mixed lifecycle/validation file | Modify |
| `yourwolf-backend/tests/test_role_validation.py` | **Already exists** — target for relocated role validation tests | Modify |
| New pagination helper test module [PROPOSED - name TBD] | Must-have helper unit tests (AC3) | Create |

### Read-only reference files

| File | Role |
|------|------|
| `yourwolf-backend/app/schemas/base.py` | `PaginatedResponse` generic — return shape the helper must feed |
| `yourwolf-backend/tests/test_roles.py` (682 lines) | Router-level role tests; verify unchanged behavior |
| `yourwolf-backend/tests/test_role_service.py` | Existing service tests proving delegation still works |
| `yourwolf-backend/tests/conftest.py` | Fixtures for session/TestClient |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| `tests/test_role_validation.py` already exists (classes `TestValidateRole`, `TestCheckDuplicateName`) — the plan marked it `[PROPOSED - name TBD]` | Role validation tests already live in a dedicated file; AC5 relocation for role side is partially done | Reuse the existing file; update imports to the new module rather than creating a new test file |
| All plan symbols verified: `_validate_card_counts` (L128), `_validate_primary_teams` (L155), `_validate_dependencies` (L182), `_validate_wake_sequence` (L221), `validate_role` (L410), `get_warnings` (L487); pagination `math.ceil` blocks at `game_service.py` L411 and `role_service.py` L82 | Plan references are accurate | None |
| Current validators raise plain `ValueError` — no domain exceptions module exists yet. AC1's "feature-04 domain exceptions" and 07's relocated card-total rule refer to upstream features not yet landed on this branch | Expected: this feature is Wave 4, depends on 07 (which depends on 04). Extract whatever exception types exist post-07; do not introduce new ones here | Implementer must extract the post-07 rule set as found at implementation time; preserve raise types exactly |
| No `app/utils/` or existing shared-helper location for pagination; `app/schemas/base.py` holds `PaginatedResponse` | Placement of `paginate()` is genuinely open | Implementer chooses idiomatic location (e.g. `app/services/pagination.py` or alongside `base.py`) and records it in implementation notes |
| Assertion baseline for AC5 comparison: `test_game_service.py` 59 asserts, `test_roles.py` 103, `test_role_validation.py` 45, `test_role_service.py` 31 | Enables equal-or-higher assertion-count check | Compare after split |
| No contradictions requiring Decomposer attention beyond the above refinements | — | — |

## Architectural Decisions

- **Services stay orchestration + DB; pure rules move to dedicated modules** — mirrors the seam feature 10 uses for `ScriptService`. Consistency across the service layer.
- **New modules take plain inputs (session + DTOs as today)** — explicitly do not invent a repository layer.
- **Move-only refactor** — the diff should be dominated by relocation, not rewrites. Preserve validator evaluation ORDER (error precedence is observable via which message a multi-violation payload returns first).
- **Single shared `paginate()` helper** replaces two duplicated `count → math.ceil(total/limit) → offset` blocks; both list endpoints must return identical results to before.

## Constraints

- No rule changes — feature 07 finished those.
- No public service method signature changes (AC4).
- `get_warnings` is advisory (non-raising) — keep the raising/non-raising split intact in the new module.
- No new logs.
- Pagination edge behavior (limit=0, empty result set, last partial page, out-of-range page) must replicate current behavior exactly; if untested, pin current behavior with new tests before switching.
- Line targets: `GameService` and `RoleService` each drop below ~400 lines (currently 506 / 518).
- Full suite must pass with equal-or-higher assertion count (AC5).

## Scope Boundaries

- No DTO-mapping extraction (audit 4.3 / cross-cutting #3) — hand-rolled ORM→DTO mapping standardization is explicitly deferred out of this remediation round.
- No router changes (`app/routers/*` untouched).
- `_to_response` and other DTO mapping stays in services.
- Do not modify `app/schemas/base.py`'s `PaginatedResponse` shape.
- Do not touch `script_service.py` (feature 10's file) or `ability_service.py`.

## Relationships to Sibling Plans

- **Depends on 07-backend-validation-consolidation** (Wave 3 → this is Wave 4): shares `game_service.py`/`role_service.py`; must extract the post-consolidation rule set including the relocated card-total rule and the feature-04 domain exceptions introduced upstream.
- **Parallel-safe within Wave 4** — disjoint files from features 10 (narration package) and 11 (frontend type split).
- Architecturally mirrors feature 10's service-decomposition seam.

## Suggested Implementation Order

Stage 1 (game validators) → Stage 2 (role validators) → Stage 3 (pagination helper + line-count/AC5 verification), as staged in the plan. Do not start until feature 07 has landed on the working branch.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python (requires-python >=3.14) + FastAPI + SQLAlchemy + Pydantic; uv-managed venv |
| Test Runner | `cd yourwolf-backend && uv run --with-requirements requirements-dev.txt --with-requirements requirements.txt pytest -q` |
| Test Baseline | 250 passed, 0 failed, coverage 89.49% (min 80% enforced via `--cov-fail-under=80`) — captured 2026-07-16 |
| Lint | mypy configured in `pyproject.toml` (`disallow_untyped_defs = true`); no ruff |
| Format | black (line-length 88) + isort (black profile), configured in `pyproject.toml` |

## Relevant Learnings

None applicable — no `.github/learnings/` directory exists in this repository.
