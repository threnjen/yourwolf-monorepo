# Tasks: Backend Domain Exceptions & HTTP Mapping

## Stage 1: Exception vocabulary + handlers

- [x] Enumerate and classify every `raise ValueError`/`PermissionError` site in `app/services/game_service.py` (lines 68, 76, 81, 87, 94, 297, 304, 357) and `app/services/role_service.py` (lines 266, 328, 380, 384) as not-found vs validation vs locked; record the per-site classification (AC3 prerequisite)
- [x] Create the exceptions module `yourwolf-backend/app/exceptions.py` [PROPOSED - name TBD] with `NotFoundError`, `DomainValidationError`, `LockedError` [PROPOSED - names TBD]; record final names in implementation notes (AC1)
- [x] Register `app.add_exception_handler` handlers in `app/main.py`: not-found → 404, domain validation → 400, locked → 403 (verified current `PermissionError` mapping); do not register a blanket `Exception` handler (AC2)
- [x] Add must-have automated handler-mapping tests [PROPOSED - name TBD] covering each exception type → expected status code and `detail` body shape (AC1, AC2)
- [x] Run `cd yourwolf-backend && .venv/bin/python -m pytest` — new mapping tests pass, baseline 250 tests still green

## Stage 2: Service raise-sites + router cleanup

- [x] Migrate classified raise sites in `GameService` and `RoleService` to typed exceptions, preserving error message wording verbatim (messages are asserted by tests) and existing `logger.error` calls (AC3)
- [x] Remove the `"not found" in str(e).lower()` substring routing at `app/routers/games.py:129-136` (AC3)
- [x] Remove try/except-to-HTTPException blocks in `app/routers/games.py` (lines ~54, ~129, ~161) now covered by handlers; leave direct `HTTPException` raises for other concerns (e.g., line 42 role-count check, `None`-return 404s) intact (AC4)
- [x] Remove try/except-to-HTTPException blocks in `app/routers/roles.py` (ValueError → 400 at ~207, ~241; PermissionError → 403 at ~236, ~271) now covered by handlers (AC4)
- [x] Decide and record whether `None`-return 404 checks in routers remain as-is or migrate to `NotFoundError`; keep status codes and detail strings unchanged either way
- [x] Run the full suite — 296 passed, unchanged status codes/bodies. NOTE: the referenced `test_games_router.py` start-game 404-vs-400 cases did not exist; written as part of this feature (see implementation record, Gaps #1). Suite run with `--ignore=tests/test_seed.py` (concurrent feature 05 mid-flight; see Gaps #2)
- [x] Verify diff shows try/except removal in both routers (code-review evidence for AC4); `black` + `mypy` clean on touched files. `isort` NOT run — fails repo-wide at baseline (see implementation record, Deviations #5)

## Notes

Final names (AC1): module `app/exceptions.py`; `DomainError` (base), `NotFoundError` (404), `DomainValidationError` (400), `LockedError` (403).

Decision (Stage 2): `None`-return 404 checks in routers remain as-is; only string-matched paths migrated. See implementation record, Gaps #3.
