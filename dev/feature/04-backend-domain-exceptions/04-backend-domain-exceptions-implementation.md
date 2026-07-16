# Implementation Record: Backend Domain Exceptions & HTTP Mapping

## Summary

Added a three-class domain exception vocabulary (`app/exceptions.py`) with FastAPI handlers registered in `app/main.py`, mapping `NotFoundError`→404, `DomainValidationError`→400, `LockedError`→403. Migrated all 12 `raise ValueError`/`raise PermissionError` sites in `GameService`/`RoleService` to typed exceptions, then removed the `"not found" in str(e).lower()` substring routing and all six try/except-to-HTTPException blocks from `routers/games.py` and `routers/roles.py`. All status codes and `detail` strings are unchanged.

Two findings are worth reviewer attention and are detailed under **Deviations** and **Gaps**:

1. The plan's stated AC3 regression anchor (`test_games_router.py` start-game 404/400 cases) **did not exist**. The central change of this feature was uncovered at the HTTP level. I added it (5 tests).
2. `game_service.py:68` (`Unknown role IDs`) reads like a not-found but its contract is **400**. It is classified as `DomainValidationError`, not `NotFoundError`.

## Sibling Features

Scanned all 11 sibling plans (titles/overviews only).

- **Upstream (landed)**: 02-backend-config-database — used `get_settings()` in `main.py`; integrated with the existing CORS wiring rather than replacing it.
- **Downstream consumers of this contract**: 07-backend-validation-consolidation, 09-backend-service-validators, 10-backend-narration-package will raise these types. `app/exceptions.py` is framework-free specifically so those features can import it without dragging in FastAPI.
- **Concurrent (Wave 2), untouched**: 05-backend-seed-data (`app/seed/*`, `tests/test_seed.py`), 06-frontend-game-rules. Shared module: `app/main.py` is also a likely touch point for later features — handler registration is factored into `register_exception_handlers(app)` to keep that merge surface small.

## AC Coverage Matrix

| AC | Criterion ID | Planned Test ID | Planned Test Pattern | Status | Implementing Files | Evidence Paths | Implement Commit SHA | Review Commit SHA |
|----|--------------|-----------------|----------------------|--------|--------------------|----------------|----------------------|-------------------|
| AC1 | AC1 | [PROPOSED - name TBD] | Exception vocabulary exists | Done | `app/exceptions.py` | `tests/test_exceptions.py::TestExceptionVocabulary` | PENDING | PENDING |
| AC2 | AC2 | [PROPOSED - name TBD] | Handler maps each type → status | Done | `app/main.py:15-50` | `tests/test_exceptions.py::TestExceptionHandlerMapping` | PENDING | PENDING |
| AC3 | AC3 | existing 404-vs-400 cases | Substring match removed | Done | `app/routers/games.py`, `app/services/*.py` | `tests/test_games_router.py::TestStartGameEndpoint` (**newly written — planned anchor did not exist**) | PENDING | PENDING |
| AC4 | AC4 | code-review evidence | Diff shows try/except removal | Done | `app/routers/games.py`, `app/routers/roles.py` | `grep -rn "except ValueError\|except PermissionError" app/routers/` → no matches | PENDING | PENDING |
| AC5 | AC5 | full suite | Unchanged status codes/bodies | Done | all | `tests/test_games_router.py` (18 passed), `tests/test_roles.py` (37 passed) | PENDING | PENDING |

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Exception vocabulary module | Done | `app/exceptions.py` | Final names: `DomainError` (base), `NotFoundError`, `DomainValidationError`, `LockedError`. Module path `app/exceptions.py` — matches plan proposal. |
| AC2 | Handlers map to HTTP responses | Done | `app/main.py` | 404/400/**403**. Locked→403 per verified finding, not 409/423. No blanket `Exception` handler. |
| AC3 | Substring match removed; typed exceptions | Done | `app/routers/games.py`, `app/services/game_service.py`, `app/services/role_service.py` | 12 raise sites migrated; classification table below. |
| AC4 | try/except-to-HTTPException removed | Done | both routers | 6 blocks removed. Direct `HTTPException` raises for other concerns left intact. |
| AC5 | Existing tests pass, unchanged codes/bodies | Done | all | Status codes and `detail` wording preserved verbatim. |

### Per-raise-site classification (AC3 prerequisite)

Classified per-site against actual current HTTP behavior and existing tests — not from the plan's line numbers.

| Site | Message | Current HTTP | New type |
|------|---------|--------------|----------|
| `game_service.py:68` | `Unknown role IDs: ...` | **400** (via `games.py:54`) | `DomainValidationError` |
| `game_service.py:76,81,87,94` | card counts / primary teams / deps / wake sequence | 400 | `DomainValidationError` |
| `game_service.py:297` | `Game not found` | **404** (via substring match) | `NotFoundError` |
| `game_service.py:304` | `not in setup phase` | 400 | `DomainValidationError` |
| `game_service.py:357` | `already in complete phase` | 400 | `DomainValidationError` |
| `role_service.py:266` | locked, cannot be modified | **403** | `LockedError` |
| `role_service.py:328` | `Unknown ability type` | 400 | `DomainValidationError` |
| `role_service.py:380` | locked, cannot be deleted | **403** | `LockedError` |
| `role_service.py:384` | `Cannot delete official roles` | **403** | `LockedError` |
| `schemas/role.py:81,87,93` | pydantic model validators | 422 | **unchanged — must stay `ValueError`** (pydantic contract) |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `app/exceptions.py` | Create | `DomainError` base + `NotFoundError`, `DomainValidationError`, `LockedError`. No framework imports. | AC1; upstream contract for 07/09/10 |
| `app/main.py` | Modify | Added `_DOMAIN_ERROR_STATUS` map, `_make_domain_error_handler`, `register_exception_handlers(app)`; called on the real `app`. | AC2 |
| `app/routers/games.py` | Modify | Removed substring routing in `start_game`; removed try/except in `create_game`, `start_game`, `advance_phase`. Docstrings updated. | AC3, AC4 |
| `app/routers/roles.py` | Modify | Removed try/except in `create_role`, `update_role` (×2), `delete_role`. Docstrings updated. | AC4 |
| `app/services/game_service.py` | Modify | 8 raise sites → typed; docstrings updated. `logger.error` calls preserved. | AC3 |
| `app/services/role_service.py` | Modify | 4 raise sites → typed; docstrings updated. | AC3 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `tests/test_exceptions.py` | Create | 11 tests: vocabulary, hierarchy, per-type handler mapping, non-swallowing of unexpected exceptions | AC1, AC2 |
| `tests/test_games_router.py` | Modify | **+5 tests**: start-game 404/400, advance 404/400, unknown-role-ids 400 | AC3, AC5 (anchor the plan assumed existed) |
| `tests/test_game_service.py` | Modify | 15 assertions `ValueError` → `DomainValidationError`/`NotFoundError`; renamed `test_raises_value_error_for_nonexistent_game` → `..._not_found_error_...`. `match=` strings unchanged. | AC3 |
| `tests/test_role_service.py` | Modify | 2 assertions → `DomainValidationError`/`LockedError` | AC3 |

## Test Results

- **Baseline**: 282 passed, 0 failed; 89.83% coverage
- **Final**: 296 passed, 0 failed (run as `uv run pytest -q --ignore=tests/test_seed.py`)
- **New tests added**: 16 (11 handler/vocabulary + 5 router anchors)
- **Regressions**: None

Accounting: 282 baseline − 2 (`test_seed.py`, excluded — see Gaps) + 11 + 5 = 296.

Verification beyond the suite:
- **Runtime wiring proven by mutation check**: commenting out `register_exception_handlers(app)` fails 11 tests (including the new start-game anchors and the roles 403 cases), then restored. The handlers are genuinely reachable on the real app, not only in the throwaway test app.
- `black`: all touched files clean. `main.py` and `game_service.py` were black-clean at baseline and were reformatted back to clean.
- `mypy`: 0 errors in `app/main.py` and `app/exceptions.py`. 23 pre-existing errors remain elsewhere (baseline was 24 including one I introduced and fixed).

## Deviations from Plan

1. **`LockedError` → 403, not 409/423.** Plan AC2 speculated; the verified finding and `tests/test_roles.py` both require 403. Followed the verified behavior.
2. **Exceptions do NOT subclass `ValueError`/`PermissionError`.** `DomainError` derives from `Exception`. Subclassing the builtins would have preserved the 17 existing service-test assertions for free, but would let any stale `except ValueError` silently re-route a `NotFoundError` to 400 — the exact defect class this feature removes. Instead I updated the 17 service-test assertions (mechanical; `match=` strings untouched) and added `test_domain_error_is_not_a_builtin_value_or_permission_error` to pin this. Cost: 17 test-line edits. Benefit: the old failure mode is now unrepresentable.
3. **`Unknown role IDs` classified as validation (400), not not-found (404).** Semantically it reads as not-found, but its contract is 400 (`games.py:54`) and `test_game_service.py:440` pins it. Classifying it `NotFoundError` would have silently changed a live status code to 404 while service tests still passed. Added `TestCreateGameUnknownRoleIds` to pin 400 at the HTTP level.
4. **Added 5 router tests not in the plan.** Required because the plan's stated AC3 anchor does not exist (see Gaps).
5. **`isort` not run.** It fails repo-wide at baseline (verified on unmodified `HEAD` copies of the same files, including files I never touched). Running it would produce large out-of-scope import churn during concurrent Wave-2 work. Pre-existing condition, left alone.
6. **`black` not fully applied to `role_service.py`.** It was already black-dirty at baseline; I hand-applied only the one reformat my rename caused (`raise LockedError(...)` now fits one line) rather than reformat unrelated pre-existing blocks.

## Gaps

1. **The plan's AC3 regression anchor was fictional.** Plan §F and the context both state "`test_games_router.py` start-game 404/400 cases are the regression anchor for AC3". No such test existed — `/start` appeared only as happy-path setup (lines 64, 97), and nothing asserted its 404 or 400. The substring-match removal therefore had **zero** HTTP-level coverage. Closed by `TestStartGameEndpoint` / `TestAdvancePhaseEndpoint`. Flagging because the same claim may be reused by downstream features.
2. **`tests/test_seed.py` cannot be collected** — `ImportError: cannot import name 'SeedDataError' from 'app.seed.roles'`. This is concurrent feature 05 mid-flight in the shared working tree; `app/seed/*` and `tests/test_seed.py` are outside my scope and I did not touch them. My suite runs use `--ignore=tests/test_seed.py`. **Not caused by this feature; should resolve when 05 lands.** The full suite could not be run un-ignored to confirm.
3. **`None`-return 404s left as-is** (decision recorded per tasks.md): `games.py` get/advance/script/delete and `roles.py` get/update/delete still raise `HTTPException` 404 directly on a `None` return. AC3's scope is the string-matched paths; migrating these would require changing service return contracts (`-> X | None` → raise), a behavioral refactor better suited to 07/09. Status codes and detail strings unchanged.
4. **`role_service.py:440`** couples to the string enum via `!= "none"` — known deferred item, deliberately untouched and unbroken.

## Reviewer Focus Areas

- **`app/main.py:15-50`** — handler factory + registration. Closure-per-status via `_make_domain_error_handler`; confirm the `_DOMAIN_ERROR_STATUS` map is the intended contract for features 07/09/10. Note Starlette resolves handlers by walking the MRO, so registering the three leaf types (not `DomainError`) is deliberate.
- **Deviation 2 (no builtin subclassing)** — the one judgment call with real cost (17 test edits). Worth confirming the tradeoff is the one you want, since it sets the contract for three downstream features.
- **Deviation 3 (`Unknown role IDs` → 400)** — the trap in this feature. A reviewer should independently confirm 400 is correct and intended rather than a latent bug being cemented.
- **`tests/test_games_router.py:52-131`** — the 5 new anchors. These are characterization tests written *after* the migration; verify they encode the pre-change contract and not merely current behavior.
- **Gap 2** — `test_seed.py` is excluded from my runs due to concurrent feature 05. Re-run the un-ignored suite once 05 lands.
