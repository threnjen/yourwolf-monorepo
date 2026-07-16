# Context: Backend Domain Exceptions & HTTP Mapping

## Key Files

### Files Being Changed

| File | Role | Change Type |
|------|------|-------------|
| `yourwolf-backend/app/exceptions.py` [PROPOSED - name TBD] | New domain-exception vocabulary module | Create |
| `yourwolf-backend/app/main.py` | Register FastAPI exception handlers on the `app = FastAPI(...)` instance (line 8) | Modify |
| `yourwolf-backend/app/routers/games.py` | Remove substring-match routing (lines 129–136) and redundant try/except-to-HTTPException blocks | Modify |
| `yourwolf-backend/app/routers/roles.py` | Remove try/except-to-HTTPException blocks (ValueError → 400 at ~line 207; PermissionError → 403 at lines 236, 271) | Modify |
| `yourwolf-backend/app/services/game_service.py` | Replace `raise ValueError` sites (lines 68, 76, 81, 87, 94, 297, 304, 357) with typed exceptions | Modify |
| `yourwolf-backend/app/services/role_service.py` | Replace `raise PermissionError` (lines 266, 380, 384) and `raise ValueError` (line 328) with typed exceptions | Modify |
| `yourwolf-backend/tests/` (new handler-mapping test file) [PROPOSED - name TBD] | Per-exception-type handler mapping tests | Create |

### Read-Only Reference Files

| File | Role |
|------|------|
| `yourwolf-backend/tests/test_games_router.py` | Regression anchor: 404-vs-400 start-game cases (line 74 `test_returns_404_for_nonexistent`); exact `detail` substring assertions (lines 49, 140, 164, 192) |
| `yourwolf-backend/tests/test_roles.py` | Asserts 403 for locked/official roles (lines 374–466) and 404 for missing roles |
| `dev/refactor-audit-backend/refactor-audit-backend-report.md` | Source audit findings 5.1 and cross-cutting observation #4 |

## Discovery Delta

| Finding | Impact | Action |
|---------|--------|--------|
| Plan AC2 speculates locked → "409/423 matching whatever `PermissionError` currently maps to". Verified: `PermissionError` maps to **403 Forbidden** in `routers/roles.py` (lines 236–240, 271–276), and `tests/test_roles.py` asserts 403. | The `LockedError` handler must return 403, not 409/423. | Implementer must map locked → 403 to satisfy AC5 |
| All plan-referenced files exist; `app/exceptions.py` does not yet exist and is correctly marked `[PROPOSED - name TBD]`. | None | None |
| Not-found in both routers is signaled two ways: service returns `None` (router raises 404 directly) AND `raise ValueError("Game not found")` (`game_service.py:297`) routed by substring match at `games.py:130`. Only the latter set becomes `NotFoundError`; the `None`-return 404 checks may remain or be migrated — implementer decision, record it. | Scope of AC3 is the string-matched paths, not every 404 | Accepted; note in implementation record |
| Multiple existing tests assert exact `detail` substrings (`test_games_router.py:49,140,164,192`; `test_roles.py` official-role message at ~line 464). | Exception messages must be preserved verbatim when re-raising as typed exceptions | Constraint for implementer (supports AC5) |
| Services log via `logger.error` at raise sites (e.g., `game_service.py:296, 352, 440`). | Preserve existing logging; add no new normal-path logs | Constraint |
| `.github/learnings/` does not exist. | No learnings to apply | None |
| No contradictions with the stage structure or dependency metadata found. | — | None |

## Architectural Decisions

- **Standard FastAPI pattern**: use `app.add_exception_handler` in `app/main.py`; a single small exceptions module, no framework additions or error-code taxonomy.
- **Three-class vocabulary**: `NotFoundError`, `DomainValidationError`, `LockedError` [PROPOSED - names TBD] — audit-suggested names; implementer chooses final idiomatic names and records them.
- **Behavior preservation over redesign**: existing status codes (404, 400, 403) and error `detail` strings are the contract, pinned by router tests.
- **Upstream API contract**: this exception vocabulary is what features 07, 09, and 10 will raise. Names and module path chosen here become their dependency.

## Constraints

- Preserve all current HTTP status codes: not-found → 404, domain validation → 400 (routers use `HTTP_400_BAD_REQUEST`, not 422), locked/official → **403**.
- Preserve error `detail` wording verbatim where tests assert substrings.
- Handlers handle only registered domain types; never a blanket `Exception` handler that swallows unexpected errors.
- `HTTPException` raised directly in routers for other concerns (e.g., role-count validation at `games.py:42`, `None`-return 404s) must be left alone unless trivially covered by handlers.
- Classify every current `raise ValueError`/`PermissionError` site per-raise before touching routers — the mapping is per-raise-site, not guessed.
- No new normal-path logging.

## Scope Boundaries

- Do NOT change validation rules or their placement — that is feature `07-backend-validation-consolidation`.
- Do NOT add new error scenarios or error-code taxonomies.
- Do NOT touch `app/routers/abilities.py`, `app/services/ability_service.py`, or `app/services/script_service.py` — out of the plan's traceability scope.
- Do NOT modify frontend packages or other backend features' files.
- Preserve existing `logger.error` calls at service raise sites.

## Relationships to Sibling Plans

- **Depends on**: `02-backend-config-database` (shares `app/main.py` lifespan wiring; wave-2 slot ensures ordering).
- **Wave 2, parallel-safe** with `05-backend-seed-data` and `06-frontend-game-rules` (disjoint files).
- **Upstream of**: `07-backend-validation-consolidation`, `09-backend-service-validators`, `10-backend-narration-package` — all will raise this feature's exception types.

## Suggested Implementation Order

Execute after `02-backend-config-database` completes. Within this feature: Stage 1 (vocabulary + handlers) before Stage 2 (raise-site migration + router cleanup), so handler tests exist before router try/except blocks are removed.

## Environment State

| Property | Value |
|----------|-------|
| Tech Stack | Python (venv 3.14 per `requires-python >=3.14`) + FastAPI + SQLAlchemy; deps via `requirements.txt` / `requirements-dev.txt` |
| Test Runner | `cd yourwolf-backend && .venv/bin/python -m pytest` (config in `pyproject.toml [tool.pytest.ini_options]`, coverage gate 80%) |
| Test Baseline | 250 passed, 0 failed; coverage 89.49% — captured 2026-07-16 |
| Lint | `mypy` configured in `pyproject.toml [tool.mypy]`; no ruff |
| Format | `black` + `isort` (profile=black) configured in `pyproject.toml` |

## Relevant Learnings

None applicable (`.github/learnings/` does not exist).
