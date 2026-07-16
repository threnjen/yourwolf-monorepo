# Tasks: Backend Domain Exceptions & HTTP Mapping

## Stage 1: Exception vocabulary + handlers

- [ ] Enumerate and classify every `raise ValueError`/`PermissionError` site in `app/services/game_service.py` (lines 68, 76, 81, 87, 94, 297, 304, 357) and `app/services/role_service.py` (lines 266, 328, 380, 384) as not-found vs validation vs locked; record the per-site classification (AC3 prerequisite)
- [ ] Create the exceptions module `yourwolf-backend/app/exceptions.py` [PROPOSED - name TBD] with `NotFoundError`, `DomainValidationError`, `LockedError` [PROPOSED - names TBD]; record final names in implementation notes (AC1)
- [ ] Register `app.add_exception_handler` handlers in `app/main.py`: not-found → 404, domain validation → 400, locked → 403 (verified current `PermissionError` mapping); do not register a blanket `Exception` handler (AC2)
- [ ] Add must-have automated handler-mapping tests [PROPOSED - name TBD] covering each exception type → expected status code and `detail` body shape (AC1, AC2)
- [ ] Run `cd yourwolf-backend && .venv/bin/python -m pytest` — new mapping tests pass, baseline 250 tests still green

## Stage 2: Service raise-sites + router cleanup

- [ ] Migrate classified raise sites in `GameService` and `RoleService` to typed exceptions, preserving error message wording verbatim (messages are asserted by tests) and existing `logger.error` calls (AC3)
- [ ] Remove the `"not found" in str(e).lower()` substring routing at `app/routers/games.py:129-136` (AC3)
- [ ] Remove try/except-to-HTTPException blocks in `app/routers/games.py` (lines ~54, ~129, ~161) now covered by handlers; leave direct `HTTPException` raises for other concerns (e.g., line 42 role-count check, `None`-return 404s) intact (AC4)
- [ ] Remove try/except-to-HTTPException blocks in `app/routers/roles.py` (ValueError → 400 at ~207, ~241; PermissionError → 403 at ~236, ~271) now covered by handlers (AC4)
- [ ] Decide and record whether `None`-return 404 checks in routers remain as-is or migrate to `NotFoundError`; keep status codes and detail strings unchanged either way
- [ ] Run the full suite (`.venv/bin/python -m pytest`) — all 250+ tests pass with unchanged status codes and response bodies, including `test_games_router.py` 404-vs-400 start-game cases and `test_roles.py` 403 locked/official cases (AC5)
- [ ] Verify diff shows try/except removal in both routers (code-review evidence for AC4) and run `black`/`isort`/`mypy` per pyproject config
