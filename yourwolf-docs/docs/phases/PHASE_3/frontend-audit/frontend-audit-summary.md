# YourWolf Frontend Audit — Executive Summary

**Date:** 2026-03-27
**Scope:** `yourwolf-frontend/` — full codebase (34 source files, 30 test files, 1 dependency manifest)

---

## Severity Breakdown

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 18 |
| Low | 16 |
| **Total** | **38** |

---

## High-Priority Action Items

### 1. Fix `gameId` non-null assertion — `src/pages/GameFacilitator.tsx` L185
`useParams()` returns `gameId` as `string | undefined`. Using `gameId!` will cause a runtime crash if the param is missing. Add a guard clause or redirect.

### 2. Validate or remove unsafe API URL fallback — `src/api/client.ts` L3
`VITE_API_URL || 'http://localhost:8000'` silently defaults to localhost in production if the env var is unset. This is a security and correctness concern.

### 3. Fix syntax error in legacy dashboard — `dashboard/main.py` L29
A `for` loop has only a comment as its body, causing a Python syntax error. The entire `dashboard/` directory appears to be orphaned code.

### 4. Fix bare `except:` clauses — `dashboard/utils.py` L165, L185
Bare `except:` catches `SystemExit` and `KeyboardInterrupt`. Use `except Exception:` at minimum.

---

## Key Themes

| Theme | Findings | Impact |
|-------|----------|--------|
| **Style duplication** | #2, #25, #26, #27, #28 | ~5 files have near-identical style objects. A shared `styles/shared.ts` would eliminate ~100 lines of duplication. |
| **Fetch hook repetition** | #29 | Three hooks (`useRoles`, `useAbilities`, `useGame`) are structural copies. A generic `useFetch<T>` would reduce ~120 lines to ~40. |
| **Inconsistent error patterns** | #21, #22, #23 | Four different error display approaches, inconsistent return types, and inconsistent API destructuring across the codebase. |
| **Orphaned dashboard code** | #3, #4, #7, #8, #17, #30, #34 | `dashboard/` has 7 findings including syntax errors, bare except clauses, and imports to non-existent modules. |
| **Missing API validation** | #9, #36, #37 | No runtime response validation at the API boundary; pagination metadata is discarded; `draftToPayload` lacks a return type. |

---

## Recommended Action Plan

### Phase 1: Quick Wins (< 1 hour)
- Guard `gameId` param in GameFacilitator
- Fix `games.ts` destructuring inconsistency
- Merge duplicate `stepItemStyles`/`wcItemStyles` in ReviewStep
- Fix no-op `useCallback` in Timer
- Fix `field_requied` typo in dashboard

### Phase 2: Security & Correctness (< 1 hour)
- Validate `VITE_API_URL` at build time or remove fallback
- Sanitize error data logged in API client interceptor
- Fix dashboard syntax error and bare `except:` clauses
- Decide: keep or remove `dashboard/` entirely

### Phase 3: DRY & Consistency (half day)
- Extract shared `TEAM_COLORS`, `errorStyles`, `loadingStyles`, page header styles
- Create shared `ErrorBanner` component
- Unify fetch hooks into generic `useFetch<T>`
- Standardize component return type conventions
- Add explicit return type to `draftToPayload`

### Phase 4: Structural Improvement (half day)
- Decompose `GameSetup.tsx` (~407 lines) into sub-components and a `useGameSetup` hook
- Replace magic numbers with named constants
- Unify or alias `AbilityStep`/`AbilityStepDraft` types
- Consider runtime API response validation (Zod)

---

## File Reference

Full findings with line-level citations: [`frontend-audit-report.md`](frontend-audit-report.md)
