# Plan: Backend Domain Exceptions & HTTP Mapping

## Execution Metadata

- **Wave:** 2
- **Parallel safe:** yes
- **Depends on:** 02-backend-config-database
- **Key files modified:** `yourwolf-backend/app/exceptions.py` [PROPOSED - name TBD] (new), `yourwolf-backend/app/main.py`, `yourwolf-backend/app/routers/games.py`, `yourwolf-backend/app/routers/roles.py`, `yourwolf-backend/app/services/game_service.py`, `yourwolf-backend/app/services/role_service.py`, `yourwolf-backend/tests/test_games_router.py` (verify), `yourwolf-backend/tests/test_roles.py` (verify)
- **Sequential reason:** shares `app/main.py` with upstream 02-backend-config-database (lifespan wiring); wave-2 slot ensures ordering. Parallel-safe within Wave 2 (disjoint from 05 and 06).

Source: refactor audit findings 5.1 (Medium), cross-cutting observation #4 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: A new exceptions module defines a small domain-exception vocabulary — at minimum `NotFoundError` and a domain validation error [PROPOSED - names TBD; audit suggests `NotFoundError`/`DomainValidationError`/`LockedError`].
- **AC2**: FastAPI exception handlers registered in `app/main.py` map these to HTTP responses (`NotFoundError` → 404, validation → 400/422 per existing router behavior, locked → **403**, expander-verified: `PermissionError` maps to 403 in `routers/roles.py` and tests assert 403 — preserve current status codes for existing scenarios).
- **AC3**: The substring match `"not found" in str(e).lower()` at `app/routers/games.py:130-136` is removed; `GameService`/`RoleService` raise typed exceptions instead of overloading `ValueError`/`PermissionError` with sentence prose.
- **AC4**: Repeated try/except-to-HTTPException blocks in `routers/games.py` and `routers/roles.py` are removed where the handlers now cover them.
- **AC5**: All existing router tests pass with unchanged status codes and response bodies (error `detail` strings may be preserved verbatim to avoid test churn — decide during implementation and record it).

Non-goals: no changes to validation *rules* or their placement (that is `07-backend-validation-consolidation`); no new error scenarios.

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1–AC2 | exceptions module, `app/main.py` | Must-have automated test: handler maps each exception type to expected status — scenarios, names [PROPOSED - name TBD] |
| AC3 | `routers/games.py`, services | Existing tests: `tests/test_games_router.py` 404-vs-400 cases |
| AC4 | both routers | Code-review evidence: diff shows try/except removal |
| AC5 | full suite | Existing tests |

## B. Correctness & Edge Cases

- Enumerate every current `raise ValueError`/`PermissionError` in both services and classify each as not-found vs validation vs locked BEFORE changing routers — the mapping must be per-raise-site, not guessed.
- `HTTPException` raised inside routers for auth or other concerns must be left alone.
- Handlers must not swallow unexpected exceptions — only registered domain types.

## C. Consistency & Architecture Fit

- Standard FastAPI `app.add_exception_handler` pattern; single module, no framework additions.
- Establishes the exception vocabulary that features 07, 09, 10 will raise — this is an upstream API contract for those features.

## D. Clean Design & Maintainability

Three exception classes and two/three handlers; routers shrink. Do not build an error-code taxonomy beyond what current behavior needs.

## E. Observability, Security, Operability

- No new normal-path logs. Optionally, the handler for unexpected 500s stays with framework defaults.
- Error messages must not begin leaking internals they don't already leak.
- Rollback: revert; behavior contract pinned by router tests.

## F. Test Plan

- Must-have: per-exception-type handler mapping tests (scenarios described; names [PROPOSED - name TBD]).
- Existing tests to update: any router test asserting on exact error strings if wording changes (prefer preserving wording).
- Refactor note: `test_games_router.py` start-game 404/400 cases are the regression anchor for AC3.

## Stage 1: Exception vocabulary + handlers
**Goal**: AC1, AC2
**Success Criteria**: Handlers registered; mapping tests pass
**Status**: Not Started

## Stage 2: Service raise-sites + router cleanup
**Goal**: AC3–AC5
**Success Criteria**: No string-matched routing; suite green with unchanged status codes
**Status**: Not Started
