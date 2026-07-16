# Context: Backend Validation Placement Consolidation

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/routers/games.py` | Delete the router-level role-count guard (currently at ~L40–L49: `total_cards = game.player_count + game.center_card_count` check) | Modify |
| `yourwolf-backend/app/services/game_service.py` | Add the count rule to `GameService.create_game` alongside the existing four validators (`_validate_card_counts`, `_validate_primary_teams`, `_validate_dependencies`, `_validate_wake_sequence`) | Modify |
| `yourwolf-backend/app/services/role_service.py` | `RoleService.create_role` (L201) currently performs **no validation**; wire it to share rule evaluation with `validate_role` (L410) and raise feature 04's domain validation exception | Modify |
| `yourwolf-backend/app/schemas/role.py` | Reconcile `RoleBase.name` bounds (L61, currently 1–100) and `RoleUpdate.name` (L119, currently 1–100) to the service's 2–50 | Modify |
| `yourwolf-backend/tests/test_games_router.py` | Relocate card-count cases to service tests; keep one HTTP-mapping integration case (e.g., L49 asserts `"Must select exactly 8 roles"`) | Modify |
| `yourwolf-backend/tests/test_game_service.py` | Receive relocated count-rule tests | Modify |
| `yourwolf-backend/tests/test_schemas.py` | `test_name_min_length` / `test_name_max_length` (L56, L65) assert 1/101 boundaries — must move to 2/51 | Modify |
| `yourwolf-backend/tests/test_role_validation.py` | Constructs `RoleCreate(name="a")` at L61 and L372, `name="a" * 51` at L68, `name="a" * 50` at L82 — under tightened schema bounds, `name="a"` and 51-char names now fail at pydantic (422) before reaching the service validator; tests must be updated to reflect the new layer that rejects them | Modify |
| `yourwolf-backend/tests/test_roles.py` | Verify create-path now rejects what validate rejects; add AC3 agreement test | Modify (verify) |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-backend/app/seed/roles.py` | Seed roles; verified all 30 names fall within 2–50 |
| `yourwolf-backend/app/routers/roles.py` | `POST /roles/validate` endpoint (L81) — dry-run behavior unchanged |
| `dev/feature/04-backend-domain-exceptions/04-backend-domain-exceptions-plan.md` | Upstream exception vocabulary this feature raises |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Router guard confirmed at `routers/games.py` ~L40–L49 (`total_cards` expression) — matches plan | Validates AC1 | None |
| `GameService.create_game` currently raises `ValueError` for all five checks; after feature 04 lands these become the typed domain validation exception. `test_game_service.py:500` matches `ValueError` — coordination point with feature 04's test updates | Implementer must raise whatever exception type 04 established, not `ValueError` | Add task |
| `RoleService.create_role` (L201) performs **zero** validation today — plan's AC3 is accurate; no shared-rule refactor exists yet | Validates AC3 | None |
| Seed-name audit complete: all 30 seed role names are within 2–50. Per AC2's decision rule, adopt 2–50 in the schema | Resolves AC2's open decision — no conflict to surface | Update plan assumption: adopt 2–50 |
| Schema bounds appear in **two** places the plan cites only one of: `RoleBase.name` (L61) and `RoleUpdate.name` (L119). Both must move to 2–50 or update-path drifts | Companion change omitted from plan | Add task |
| Exact-assertion tests found: `test_schemas.py` L56/L65 assert min=1/max=100 boundaries; `test_role_validation.py` L61/L68/L82/L372 build payloads at old boundary values. Tightening the schema shifts rejection from service (400/error-list) to pydantic (422) for length violations — the service's own 2–50 check becomes unreachable via API but still guards direct service calls | Layer-shift is user-visible in tests; plan's AC4 (preserve status codes) needs nuance: name-length violations previously reported by `/roles/validate` as error strings will now 422 at request parsing | Warning to Decomposer + add tasks |
| `validate_role` returns `list[str]` for the dry-run endpoint; create path needs a raising form — plan's "share evaluation, differ in reporting" is feasible via a small internal refactor (e.g., create calls `validate_role` and raises if non-empty) | Simplest compliant design | None |
| No phase-scoped test directories (`tests/phase*`) found | No consolidated phase test file required | None |
| No `.github/learnings/` directory exists | No learnings to import | None |

## Architectural Decisions

- **Validation placement policy** (audit cross-cutting #2): schemas validate shape/bounds; services validate cross-entity rules; routers validate nothing. State this policy in the implementation record.
- **Bounds reconciliation direction**: adopt the service's stricter 2–50 in the schema (seed audit confirms no conflicts).
- **Rule sharing over duplication**: `create_role` must invoke the same rule evaluation as `validate_role` — one rule set, two reporting modes (list vs. raise).
- **Verbatim transplant**: the count-rule arithmetic (`player_count + center_card_count` vs `len(role_ids)`) is copied, not re-derived, including the error message format.

## Constraints

- Depends on feature 04 (`04-backend-domain-exceptions`); rule violations raise 04's domain validation exception (name was `[PROPOSED]` in 04's plan — use whatever it landed as, likely `DomainValidationError`).
- HTTP status codes preserved: 422 for schema-shape, 400 for domain rules (per existing router tests), with the layer-shift caveat noted in Discovery Delta.
- Coverage gate: pytest enforces `--cov-fail-under=80` (baseline 89.49%).
- Tests are moved, not deleted, when a rule relocates from router to service.
- Net LOC should be ~flat or negative.

## Scope Boundaries

- Do NOT extract validators into separate modules — feature 09 does that.
- Do NOT add new validation rules; only relocate and reconcile existing ones.
- Do NOT touch the warning system (`_validate_dependencies` warnings path / `get_warnings`).
- Do NOT change the `POST /roles/validate` dry-run endpoint's response shape.
- No new normal-path logging.

## Relationships to Sibling Plans

- **Upstream**: `04-backend-domain-exceptions` (Wave <3) — supplies the typed exceptions raised here; shares `routers/games.py`, `game_service.py`, `role_service.py`.
- **Downstream**: `09-backend-service-validators` extracts the validators this feature consolidates — keep them cohesive within the services to ease that extraction.
- **Parallel-safe within Wave 3**: disjoint from `08-frontend-abilities-step`.

## Suggested Implementation Order

Stage 1 (game-creation rule relocation) before Stage 2 (role-name reconciliation + create-path validation), per the plan. Feature 04 must be complete first.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python (>=3.14 per pyproject; venv currently 3.12/3.14 via uv) + FastAPI + SQLAlchemy + Pydantic v2 |
| Test Runner | `cd yourwolf-backend && uv sync && .venv/bin/python -m pytest -q` |
| Test Baseline | 250 passed, 0 failed, coverage 89.49% (gate: 80%) — captured 2026-07-16 |
| Lint | Not configured (mypy configured in pyproject: `.venv/bin/python -m mypy app` if installed) |
| Format | `black` (line-length 88) + `isort` (black profile) per pyproject |

## Relevant Learnings

None applicable (no `.github/learnings/` directory exists).
