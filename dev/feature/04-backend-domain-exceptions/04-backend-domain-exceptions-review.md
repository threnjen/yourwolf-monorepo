# Review Record: Backend Domain Exceptions & HTTP Mapping

## Summary

Reviewed commit `42cd649` against the plan and implementation record. The feature replaces prose-based error routing (`"not found" in str(e).lower()`) with a typed domain exception vocabulary mapped to HTTP statuses by registered FastAPI handlers.

I independently re-derived the raise-site → status-code mapping from the baseline (`19b4520`) rather than accepting the implementer's table. **All 12 domain raise sites map to the same status code they mapped to before this change. Zero drift.** All four load-bearing claims in the implementation record were verified against the baseline and hold, including the two the record flagged as reviewer traps (`Unknown role IDs` → 400, and the fictional AC3 anchor).

The implementation record is accurate and unusually candid — the deviations it self-reports are real, correctly reasoned, and none of them hide a defect. One genuine finding: four test docstrings still name the builtin exceptions the feature removed. Fixed.

## Verdict

**Approved**

## Claim Verification (per review directive)

| # | Claim | Method | Result |
|---|-------|--------|--------|
| 1 | Every raise site enumerated and classified per-site, no status drift | Enumerated all `raise` in `19b4520` services; traced each through baseline router try/except; compared to current typed mapping | **Confirmed.** 12/12 identical. Table below. |
| 2 | `Unknown role IDs` is 400 (validation), not 404 | `git show 19b4520:app/routers/games.py:52-57` — `create_game` wraps service in `except ValueError` → **400 unconditionally**. No substring check on this path. | **Confirmed.** Classifying it `NotFoundError` would have silently changed a live 400 → 404. Implementer's call is correct. |
| 3 | No builtin subclassing; 17 assertions updated, not loosened | `grep -rn "except ValueError\|except PermissionError" app/` → only `app/seed/roles.py` (enum coercion; does not import services). `grep -rn "raises(ValueError\|raises(PermissionError" tests/` → **exit 1, zero matches**. Diff review of all 17. | **Confirmed.** No stale catcher can reach a domain exception. All 17 kept `match=` verbatim and got *stricter* (narrower type). None loosened. |
| 4 | Plan's AC3 anchor did not exist; implementer wrote 5 replacements | `git show 19b4520:tests/test_games_router.py` — `/start` appears only at lines 64, 97 as happy-path setup. `git grep` over baseline `tests/` for start+404/400 → **zero matches**. The one baseline 404 (line 74) is the *script* endpoint. | **Confirmed, both halves.** Anchor genuinely absent — the substring removal had zero HTTP coverage. Replacement pins the distinction correctly (see below). |
| 5 | `role_service.py:440` `!= "none"` deferred, not broken | Diffed current vs baseline at that block | **Confirmed byte-identical.** Untouched, unbroken. (Now line 439.) |

### Re-derived raise-site mapping (independent of implementer's table)

| Site (baseline) | Baseline path → status | New type → status | Drift |
|---|---|---|---|
| `game_service.py:68` Unknown role IDs | `create_game` → `games.py:54 except ValueError` → **400** | `DomainValidationError` → 400 | None |
| `game_service.py:76,81,87,94` | `create_game` → `games.py:54` → **400** | `DomainValidationError` → 400 | None |
| `game_service.py:297` Game not found | `start_game` → `games.py:130` substring hit → **404** | `NotFoundError` → 404 | None |
| `game_service.py:304` not in setup phase | `start_game` → substring miss → **400** | `DomainValidationError` → 400 | None |
| `game_service.py:357` already complete | `advance_phase` → `games.py:161` → **400** | `DomainValidationError` → 400 | None |
| `role_service.py:266` locked (modify) | `update_role` → `roles.py:236` → **403** | `LockedError` → 403 | None |
| `role_service.py:328` Unknown ability type | create_role → `roles.py:207` → 400; update_role → `roles.py:241` → **400** | `DomainValidationError` → 400 | None (both callers agreed) |
| `role_service.py:380,384` locked/official (delete) | `delete_role` → `roles.py:271` → **403** | `LockedError` → 403 | None |
| `role_service.py:244` RuntimeError | unhandled → 500 | unchanged | None (correctly not migrated) |
| `schemas/role.py:81,87,93` | pydantic → 422 | unchanged `ValueError` | None (correct — pydantic contract) |

### AC3 anchor quality

The 5 new tests use the `client` fixture, which is `from app.main import app` (`conftest.py:74`) — the **real** app with real handler registration, not a throwaway. So they genuinely exercise the wiring. `TestStartGameEndpoint` pins 404/"Game not found" vs 400/"not in setup phase" — precisely the distinction the deleted substring match encoded. This is a valid characterization of pre-change behavior, not merely a restatement of post-change behavior: I confirmed both expected values against the baseline independently.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met | `app/exceptions.py:10-23` | `DomainError` base + 3 leaves. Framework-free as required for downstream 07/09/10. 100% covered. |
| AC2 | Met | `app/main.py:19-51`, registered at `:71` | 404/400/403. Verified reachable on the real app via the router anchors, not only the throwaway test app. |
| AC3 | Met | `app/routers/games.py:104-123`; services | Substring match gone. 12/12 sites migrated with zero drift (verified independently). |
| AC4 | Met | `app/routers/games.py`, `app/routers/roles.py` | 6 blocks removed. `grep "except " app/routers/` → only `health.py:39 SQLAlchemyError`. Direct `HTTPException` raises for None-returns correctly left intact. |
| AC5 | Met | all | 324 passed, 94.29%. Status codes and `detail` strings preserved verbatim — confirmed by baseline diff, not just by green tests. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Test docstrings still name `ValueError`/`PermissionError` after migration to domain types — the exact prose-describes-exception coupling this feature removes | Medium | `tests/test_game_service.py:416,434`; `tests/test_role_service.py:283,389` | AC3 | **Fixed** |
| 2 | `DomainError` base is not registered as a handler; a bare `raise DomainError(...)` from downstream 07/09/10 would surface as an unhandled 500 rather than a client error | Low | `app/main.py:19-23` | AC2 | Open (see rationale) |
| 3 | Baseline `except ValueError` in routers also caught `pydantic.ValidationError` (a `ValueError` subclass) raised *inside* services → 400; now surfaces as 500 | Low | `app/routers/games.py`, `roles.py` | AC5 | Wont-Fix (intended) |

### Issue 2 rationale (not fixed)

Registering the base would mean picking a status for an unclassified domain error — every option is worse than the current behavior. An unclassified `DomainError` reaching a router *is* a programming error, and 500 is the honest signal. Starlette resolves handlers by walking `type(exc).__mro__`, so any future subclass of the three leaves resolves correctly without further registration. Registering leaves only is the right call; flagged solely because three downstream features consume this contract and should know to raise a leaf type, never the base.

### Issue 3 rationale (wont-fix)

This is a real behavioral narrowing versus baseline, but it is the plan's explicit intent: §B requires "Handlers must not swallow unexpected exceptions — only registered domain types." A pydantic error escaping `_to_response` is a bug that should be a 500, not a 400 blamed on the client. No reachable path in the current code and no test exercises it. Recording it so the narrowing is a documented decision rather than an accident.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `tests/test_game_service.py` | Docstrings at 416, 434: `ValueError` → `DomainValidationError` | 1 |
| `tests/test_role_service.py` | Docstrings at 283, 389: `ValueError` → `DomainValidationError`, `PermissionError` → `LockedError` | 1 |

Post-fix: **324 passed, 94.29% coverage**, `black --check` clean on both touched files. No regressions.

## Remaining Concerns

- Issue 2: `DomainError` base unregistered — Low. Intentional; downstream 07/09/10 must raise leaf types. Worth one line in the contract handoff to those features.
- Issue 3: pydantic-inside-service now 500 not 400 — Low, unreachable today, plan-endorsed.
- **Not a defect in this feature, but carry forward:** the plan asserted a regression anchor that did not exist (plan §F). The implementer caught it; a less careful one would have shipped the central change of this feature with zero HTTP-level coverage. The same claim may be reused by downstream feature plans — verify anchors exist before relying on them.

## Test Coverage Assessment

- **Covered**: AC1 (`test_exceptions.py::TestExceptionVocabulary`, incl. the negative `test_domain_error_is_not_a_builtin_value_or_permission_error` pinning the no-subclassing decision), AC2 (`TestExceptionHandlerMapping`, incl. non-swallowing of `RuntimeError`), AC3 (`TestStartGameEndpoint` — the 404-vs-400 anchor), AC5 (full suite, 324 passed).
- **Missing**: nothing material. AC4 is diff/grep evidence by design (verified).
- Coverage on new/changed surface: `app/exceptions.py` 100%, `app/routers/roles.py` 100%, `app/main.py` 96% (uncovered line 83 is the pre-existing root endpoint), `app/routers/games.py` 88% (uncovered lines pre-existing None-return 404 paths).
- The implementer's mutation check (commenting out `register_exception_handlers` → 11 failures) is credible and is the right way to prove runtime wiring rather than inferring it; I independently confirmed the `client` fixture binds the real app, which is the property that check depends on.

## Risk Summary

- **Status-code drift risk: retired.** The primary risk of this feature — a missed or misclassified raise site becoming a silently wrong production status code — was checked exhaustively site-by-site against the baseline, not accepted from the record. 12/12 clean.
- **No-builtin-subclassing tradeoff is correct.** Verified there is no surviving `except ValueError`/`except PermissionError` anywhere that could catch a domain exception, and no test still asserts a builtin type. The old failure mode is now structurally unrepresentable, which is worth the 17 mechanical test edits.
- `app/main.py` is a shared merge surface with later features; factoring registration into `register_exception_handlers(app)` keeps that surface small. Good call.
- `app/exceptions.py` is an upstream contract for features 07/09/10 — it is framework-free, so those can import it without pulling in FastAPI. Confirmed.
- Gap 2 in the implementation record (`test_seed.py` uncollectable) has **resolved** — feature 05 has landed and the full un-ignored suite now runs green at 324 passed.
