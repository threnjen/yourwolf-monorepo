# YourWolf Frontend — Full Code Audit Report

**Date:** 2026-03-27
**Scope:** Full codebase audit of `yourwolf-frontend/`
**Auditor:** Code Auditor (automated)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Source files audited** | 34 |
| **Test files audited** | 30 |
| **Critical findings** | 0 |
| **High findings** | 4 |
| **Medium findings** | 18 |
| **Low findings** | 16 |
| **Total findings** | 38 |

### Top 5 Highest-Priority Items

1. **`dashboard/main.py` L29–30** — Syntax error: `for` loop has no body (High)
2. **`dashboard/utils.py` L165, L185** — Bare `except:` clauses swallow all exceptions including `SystemExit`/`KeyboardInterrupt` (High)
3. **`src/api/client.ts` L3** — Unsafe localhost fallback for `API_URL` in production (High)
4. **`src/pages/GameFacilitator.tsx` L185** — Non-null assertion on `useParams().gameId` will crash if undefined (High)
5. **`src/pages/GameSetup.tsx`** — 400+ line file mixing role selection logic, input clamping, game creation, and full-page UI (Medium)

---

## Files Audited

### Source Files (34)

| File | Lines |
|------|-------|
| `src/main.tsx` | 13 |
| `src/App.tsx` | 12 |
| `src/routes.tsx` | 20 |
| `src/vite-env.d.ts` | 9 |
| `src/api/client.ts` | 21 |
| `src/api/roles.ts` | 82 |
| `src/api/abilities.ts` | 9 |
| `src/api/games.ts` | 68 |
| `src/types/role.ts` | 113 |
| `src/types/game.ts` | 61 |
| `src/hooks/useRoles.ts` | 37 |
| `src/hooks/useAbilities.ts` | 31 |
| `src/hooks/useGame.ts` | 70 |
| `src/hooks/useDrafts.ts` | 58 |
| `src/components/Header.tsx` | 47 |
| `src/components/Layout.tsx` | 29 |
| `src/components/RoleCard.tsx` | 147 |
| `src/components/ScriptReader.tsx` | 137 |
| `src/components/Sidebar.tsx` | 68 |
| `src/components/Timer.tsx` | 114 |
| `src/components/RoleBuilder/Wizard.tsx` | 168 |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | 232 |
| `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | 219 |
| `src/components/RoleBuilder/steps/WinConditionsStep.tsx` | 154 |
| `src/components/RoleBuilder/steps/ReviewStep.tsx` | 158 |
| `src/pages/Home.tsx` | 134 |
| `src/pages/Roles.tsx` | 119 |
| `src/pages/GameSetup.tsx` | ~407 |
| `src/pages/GameFacilitator.tsx` | ~310 |
| `src/pages/RoleBuilder.tsx` | 120 |
| `src/styles/theme.ts` | 41 |
| `src/styles/App.css` | 21 |
| `src/styles/index.css` | 27 |
| `dashboard/main.py` | ~58 |
| `dashboard/utils.py` | ~200 |

### Dependency Manifest

| File | Audited |
|------|---------|
| `package.json` | Yes |

### Test Files (30) — reduced audit lens

All files under `src/test/` were audited for categories 2, 5, 8, and 9 only.

---

## Findings by Category

### 1. Cleanup & Condensing

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 1 | `src/types/role.ts` | L5–17, L46–58 | Low | Near-duplicate interfaces | `AbilityStep` and `AbilityStepDraft` are structurally identical. Consider making one extend the other or unifying them. |
| 2 | `src/components/RoleBuilder/steps/ReviewStep.tsx` | L59–73 | Low | Identical style objects | `stepItemStyles` and `wcItemStyles` are identical CSS objects — consolidate into one. |
| 3 | `dashboard/main.py` | L1–58 | Medium | Orphaned/legacy file | Imports (`app.abilities`, `app.card`, `app.definitions`, `app.win`) reference modules that don't exist in this project. This appears to be a legacy Streamlit prototype. |
| 4 | `dashboard/utils.py` | L1–200 | Medium | Orphaned/legacy file | Same as above — references non-existent modules. Contains extensive dead code with debug `print()` statements. |

### 2. Errors & Defects

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 5 | `src/pages/GameFacilitator.tsx` | L185 | High | Non-null assertion on URL param | `useParams<{gameId: string}>()` returns `gameId` as `string | undefined`. The `gameId!` assertion on L185 (and repeated on L189, L230) will crash at runtime if the route is ever reached without a `:gameId` param. Should add a guard clause or redirect. |
| 6 | `src/components/Timer.tsx` | L21 | Medium | No-op `useCallback` | `useCallback(onComplete, [onComplete])` doesn't stabilize the reference — it re-creates whenever `onComplete` changes, which is the same as not wrapping it at all. Use a `useRef` + latest-value pattern or pass `onComplete` directly. |
| 7 | `dashboard/main.py` | L29–30 | High | Syntax error in `for` loop | `for field_name, field in Card.model_fields.items():` has only a comment as its body, followed by an `st.button` call at the same indentation level. This is a Python syntax error that will prevent the file from executing. |
| 8 | `dashboard/utils.py` | L101 | Medium | Typo in parameter name | `field_requied` should be `field_required`. This misspelling affects readability and could cause confusion when calling the function. |

### 3. Type Hints

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 9 | `src/api/roles.ts` | L56 | Medium | Missing return type | `draftToPayload(draft: RoleDraft)` has no return type annotation. Should have an explicit interface or type for the serialization payload to catch contract drift. |
| 10 | `src/styles/theme.ts` | L39 | Low | Misleading type name | `TeamColor` is defined as `keyof typeof theme.colors`, which includes non-team keys (`background`, `primary`, `error`, etc.). The name suggests it refers only to team colors. |
| 11 | `src/components/RoleBuilder/Wizard.tsx` | L96 | Low | Missing return type | `canProceedFromStep` has implicit boolean return — explicit annotation would improve readability. |
| 12 | `dashboard/utils.py` | Multiple | Medium | Missing return type annotations | Most functions (`format_field_name`, `display_enum_field`, `create_single_enum_selector`, `add_single_object`, `handle_iterable`, etc.) lack return type annotations. |

### 4. Documentation (in-source docstrings only)

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 13 | `src/api/client.ts` | L14 | Low | Self-evident comment | `// Response interceptor for error handling` restates what the immediately following code clearly shows. |

### 5. Readability, Brevity & Clarity

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 14 | `src/pages/GameSetup.tsx` | L1–407 | Medium | File too long (~407 lines) | Mixes style constants (~90 lines), complex role selection logic with cascading dependencies (~80 lines), input clamping (~30 lines), game creation (~20 lines), and full-page UI (~180 lines). Should decompose into extracted hooks (e.g., `useGameSetup`) and sub-components. |
| 15 | `src/components/Timer.tsx` | L77 | Low | Magic number | `283` is the circumference of the SVG circle (`2 * π * 45 ≈ 282.7`). Should be a named constant like `CIRCLE_CIRCUMFERENCE`. |
| 16 | `src/pages/GameSetup.tsx` | L268–290 | Low | Magic numbers for input bounds | Min/max values (`3`, `20`, `0`, `5`, `60`, `1800`) for player count, center count, and timer are repeated inline in both the `<input>` attributes and the `onBlur` clamping logic. Extract to named constants. |
| 17 | `dashboard/utils.py` | Multiple | Medium | Excessive debug print statements | Lines ~45, ~84, ~96, ~118, ~152, ~160, ~165 all have `print()` calls for debugging. Should be removed or converted to a proper logger. |

### 6. Security Posture

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 18 | `src/api/client.ts` | L3 | High | Unsafe default API URL | `import.meta.env.VITE_API_URL \|\| 'http://localhost:8000'` — if `VITE_API_URL` is not set in a production build, the app silently hits localhost:8000. Requests from user browsers would fail silently or — if another service runs on that port locally — could send data to the wrong endpoint. Should fail clearly, log a warning, or have no default in production. |
| 19 | `src/api/client.ts` | L17 | Medium | Potential data leak in error logs | `console.error('API Error:', error.response?.data \|\| error.message)` — response data from the backend could contain sensitive information (internal error details, stack traces, PII in validation messages). Consider logging only the status code and a sanitized message. |

### 7. Library & Dependency Simplicity

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 20 | `package.json` | L17 | Low | `axios` could be replaced with native `fetch` | `axios` is used only for basic GET/POST/DELETE with a JSON `Content-Type` header and a single error interceptor. Modern `fetch` with a thin wrapper would eliminate the dependency. Low priority given axios adds some value with interceptors and automatic JSON parsing. |

### 8. Consistency

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 21 | Multiple | — | Medium | Inconsistent component return type annotations | `Timer`, `ScriptReader`, `GameSetupPage`, `GameFacilitatorPage` have explicit `: React.ReactElement` return types. All other components (`Header`, `Layout`, `Sidebar`, `RoleCard`, `Home`, `Roles`, `Wizard`, all step components, `RoleBuilderPage`) omit them. Pick one convention and apply uniformly. |
| 22 | `src/api/games.ts` | L28–30 | Low | Inconsistent destructuring in API layer | `create` uses `const response = await apiClient.post(...)` then `return response.data`, while every other method in `games.ts`, `roles.ts`, and `abilities.ts` uses `const {data} = await apiClient.get/post(...)`. |
| 23 | Multiple pages | — | Medium | Inconsistent error display patterns | `Roles.tsx` shows a styled box with help text; `GameFacilitator.tsx` uses a dismissible `role="alert"` banner; `GameSetup.tsx` uses a plain div; `RoleBuilder.tsx` uses a `<strong>` prefix pattern. Should standardize into a shared `ErrorBanner` component. |

### 9. DRY & Deduplication

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 24 | `src/components/RoleCard.tsx` L21–23, `src/components/RoleBuilder/steps/BasicInfoStep.tsx` L169 | — | Low | Duplicated team capitalization logic | `team.charAt(0).toUpperCase() + team.slice(1)` appears in both `RoleCard.tsx` (`getTeamLabel`) and `BasicInfoStep.tsx` (inline in JSX). Extract to a shared utility function. |
| 25 | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` L14–20, `src/components/RoleBuilder/steps/ReviewStep.tsx` L9–15 | — | Medium | Duplicated `TEAM_COLORS` mapping | `TEAM_COLORS: Record<Team, string>` is defined separately in both `BasicInfoStep.tsx` and `ReviewStep.tsx` with identical values mapping each team to its `theme.colors` value. Extract to a shared constant, perhaps in `theme.ts`. |
| 26 | `GameSetup.tsx` L78–86, `GameFacilitator.tsx` L61–68, `RoleBuilder.tsx` L37–43, `Roles.tsx` L44–51 | — | Medium | Duplicated error/loading style objects | `errorStyles` and `loadingStyles` are defined nearly identically across 4 page files. Extract to shared style constants. |
| 27 | `GameSetup.tsx`, `Roles.tsx`, `RoleBuilder.tsx` | — | Low | Duplicated page header styles | `titleStyles`, `subtitleStyles`, and `headerStyles` are repeated across all page components with identical or near-identical values. |
| 28 | `AbilitiesStep.tsx` L76–83, `WinConditionsStep.tsx` L35–42 | — | Low | Duplicated `selectStyles` | Identical CSS-in-JS object defined in both step components. |
| 29 | `src/hooks/useRoles.ts`, `src/hooks/useAbilities.ts`, `src/hooks/useGame.ts` | — | Medium | Repetitive fetch hook pattern | All three hooks follow the identical pattern: `useState` for data/loading/error, `useCallback` for fetch, `useEffect` to trigger. ~120 lines of duplicated structure could be unified into a generic `useFetch<T>` hook. |

### 10. Error Handling Patterns

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 30 | `dashboard/utils.py` | L165, L185 | High | Bare `except:` clauses | `except:` catches all exceptions including `SystemExit` and `KeyboardInterrupt`. Should use `except Exception:` at minimum. Both instances occur in the `handle_iterable` function. |
| 31 | `src/api/client.ts` | L15–19 | Low | Error interceptor lacks request context | The error handler logs `error.response?.data || error.message` but does not include the request URL or HTTP method. Makes it harder to diagnose which API call failed when multiple requests are in flight. |

### 11. Configuration Hygiene

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 32 | `src/api/client.ts` | L3 | Medium | No build-time validation of `VITE_API_URL` | The app silently falls back to localhost if the env var is missing. Consider failing the build or showing a visible warning when `VITE_API_URL` is not configured. (Related to finding #18.) |

### 12. Logging Quality

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 33 | `src/api/client.ts` | L17 | Low | Unstructured logging | `console.error('API Error:', ...)` uses string concatenation. For a centralized error interceptor, structured logging with `{url, status, message}` would improve debuggability. |
| 34 | `dashboard/utils.py` | Multiple | Medium | Debug print statements throughout | Pervasive `print()` debugging throughout the file. (Overlaps with finding #17.) |

### 13. Performance Anti-Patterns

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 35 | `src/components/RoleCard.tsx` | L101–106 | Low | Inline style objects created every render | `style={{...cardStyles, borderLeft: ...}}` and similar spreads in the event handlers create new objects on each render. In a list of role cards, this creates unnecessary GC pressure. Consider memoizing or using CSS classes. |

### 14. API Contract Adherence

| # | File | Line(s) | Severity | Finding | Detail |
|---|------|---------|----------|---------|--------|
| 36 | `src/api/roles.ts` | L21–24 | Low | Pagination metadata discarded | `list()` and `listOfficial()` extract only `.items` from the paginated response, discarding `total`, `page`, `pages`. If the UI ever needs pagination controls, the API layer will need refactoring. |
| 37 | All API files | — | Low | No runtime response validation | TypeScript generics on axios calls (e.g., `apiClient.get<Role>(...)`) provide compile-time safety only. Malformed backend responses will silently pass through. Runtime validation (e.g., with Zod) at the system boundary would catch contract mismatches early. |

---

## Test File Findings (Reduced Lens)

| # | File | Line(s) | Severity | Category | Finding | Detail |
|---|------|---------|----------|----------|---------|--------|
| 38 | `src/test/mocks.ts` | Throughout | Low | Cat 8: Consistency | Mock factory typing inconsistency | Some factories use `as Team` / `as Visibility` casts while others use literal types. Minor but inconsistent. |

No other issues were identified in the test files under the reduced audit categories (2, 5, 8, 9).

---

## Cross-Cutting Observations

### 1. Style Duplication (DRY)

Style duplication is the single biggest DRY issue in the codebase. `errorStyles`, `loadingStyles`, `titleStyles`, `subtitleStyles`, `TEAM_COLORS`, `selectStyles`, and various button styles are repeated 2–4x across files. A shared `styles/shared.ts` module or component library would eliminate this significantly.

### 2. Repetitive Fetch Hooks

The three fetch hooks (`useRoles`, `useAbilities`, `useGame`) are near-copies of each other, each implementing identical `useState`/`useCallback`/`useEffect` patterns. A generic `useFetch<T>(fetcher: () => Promise<T>)` hook would reduce ~120 lines of duplicated hook code to ~40 lines.

### 3. Orphaned Dashboard Directory

The `dashboard/` directory contains a Streamlit prototype that imports modules (`app.abilities`, `app.card`, `app.definitions`, `app.win`) which don't exist in this project. It has syntax errors (`main.py` L29), bare `except:` clauses (`utils.py`), debug print statements, and doesn't integrate with the React frontend. A decision should be made to either update or remove it.

### 4. Error Display Inconsistency

Four different error display patterns exist across pages. Standardizing on a shared `ErrorBanner` component with consistent behavior (dismissible or not, with/without help text) would improve both UX and code quality.

### 5. No Runtime API Validation

The frontend trusts backend responses match TypeScript interfaces. A Zod schema layer at the API boundary would catch contract mismatches early and prevent hard-to-debug runtime errors from propagating into UI components.

---

## Recommended Priority Order

### 1. Quick Wins (low effort, high impact)

- **#5**: Guard `gameId` in `GameFacilitator.tsx` instead of using `!` assertion
- **#22**: Fix inconsistent destructuring in `games.ts` `create` method
- **#2**: Merge identical `stepItemStyles`/`wcItemStyles` in ReviewStep
- **#6**: Fix the no-op `useCallback` in Timer
- **#8**: Fix `field_requied` typo in `dashboard/utils.py`

### 2. Important Fixes (security & correctness)

- **#18 + #32**: Remove or validate the unsafe localhost fallback for `API_URL`
- **#19**: Sanitize error logging in the API client interceptor
- **#7**: Fix the `for` loop syntax error in `dashboard/main.py`
- **#30**: Replace bare `except:` with `except Exception:` in `dashboard/utils.py`

### 3. Improvement Pass (DRY, type hints, consistency)

- **#25**: Extract shared `TEAM_COLORS` constant
- **#26**: Extract shared `errorStyles`/`loadingStyles` into `styles/shared.ts`
- **#29**: Unify fetch hooks into a generic `useFetch<T>` hook
- **#23**: Standardize error display into a shared `ErrorBanner` component
- **#21**: Pick a convention for component return types and apply uniformly
- **#9**: Add explicit return type to `draftToPayload`
- **#14**: Decompose `GameSetup.tsx` into smaller sub-components and hooks

### 4. Polish

- **#1**: Unify `AbilityStep`/`AbilityStepDraft` types
- **#15, #16**: Replace magic numbers with named constants
- **#24, #27, #28**: Extract remaining duplicated style/utility code
- **#3, #4**: Decide whether to keep or remove the `dashboard/` directory
- **#37**: Consider adding runtime response validation with Zod
