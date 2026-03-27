# Review Record: Frontend Audit Fixes

## Summary
Implementation covers 18 acceptance criteria addressing 30+ audit findings across correctness, security, DRY, type safety, and decomposition. One blocker (duplicate type export) and one high-severity gap (ErrorBanner not adopted) were found and fixed during review. Overall quality is strong — the changes are well-scoped, tests are sound, and the codebase is measurably improved.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `src/types/role.ts:44` | Clean type alias |
| AC2 | Verified | `src/components/RoleBuilder/steps/ReviewStep.tsx:57` | Unified `listItemStyles` |
| AC3 | Verified | `dashboard/` removed | No files remain, no references |
| AC4 | Verified | `src/pages/GameFacilitator.tsx:183-190` | Guard + content split, `gameId: string` guaranteed |
| AC5 | Verified | `src/components/Timer.tsx:22-23` | `useRef` latest-value pattern correct |
| AC6 | Verified | `src/api/roles.ts:57-83` | `RoleCreatePayload` interface + return type |
| AC7 | Verified | `src/hooks/useGameSetup.ts`, `src/pages/GameSetup.tsx` | Page reduced to ~270 lines |
| AC8 | Verified | `src/components/Timer.tsx:10-12`, `src/hooks/useGameSetup.ts:6-12` | Named constants |
| AC9 | Verified | `src/api/client.ts:3-6` | DEV-only fallback + console.error |
| AC10 | Verified | `src/api/client.ts:19-24` | Structured log, no raw response data |
| AC11 | Verified | Multiple files | No `React.ReactElement` return types remain |
| AC12 | Verified | `src/api/games.ts:23` | Consistent `{data: game}` destructuring |
| AC13 | Verified | `src/components/ErrorBanner.tsx` | Created, tested, and now adopted in GameFacilitator, GameSetup, RoleBuilder (fixed during review) |
| AC14 | Verified | `src/styles/theme.ts:52-54` | `capitalize()` used in RoleCard and BasicInfoStep |
| AC15 | Verified | `src/styles/theme.ts:42-50` | `TEAM_COLORS` record; duplicate `TeamColor` removed during review |
| AC16 | Verified | `src/styles/shared.ts` | Shared page/loading/error styles adopted across 4 pages |
| AC17 | Verified | `src/styles/shared.ts:49-56` | `selectStyles` used in AbilitiesStep and WinConditionsStep |
| AC18 | Verified | `src/hooks/useFetch.ts` | useRoles, useAbilities, useGame migrated; useNightScript excluded (documented deviation) |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Duplicate `TeamColor` type export (conflicting) | Blocker | `src/styles/theme.ts:57` | AC15 | Fixed |
| 2 | `ErrorBanner` component created but not adopted by any page | High | `src/components/ErrorBanner.tsx` | AC13 | Fixed |
| 3 | `GameFacilitator` inline error banner duplicates `ErrorBanner` | Medium | `src/pages/GameFacilitator.tsx:258-275` | AC13 | Fixed |
| 4 | `useNightScript` not migrated to `useFetch`, not listed as deviation | Medium | `src/hooks/useGame.ts:23-62` | AC18 | Fixed |
| 5 | `useFetch` no guard/doc for unmemoized fetchers | Low | `src/hooks/useFetch.ts:27` | AC18 | Fixed |
| 6 | Unused `React` import in `GameSetup.tsx` | Low | `src/pages/GameSetup.tsx:1` | — | Fixed |
| 7 | `errorBannerStyles` in `shared.ts` dead code after ErrorBanner adoption | Low | `src/styles/shared.ts:21-28` | AC13/AC16 | Fixed |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `src/styles/theme.ts` | Removed duplicate `export type TeamColor = keyof typeof theme.colors` on line 57 | 1 |
| `src/pages/GameFacilitator.tsx` | Imported `ErrorBanner`; replaced inline error div+button with `<ErrorBanner>` | 2, 3 |
| `src/pages/GameSetup.tsx` | Removed unused `React` import; replaced `errorBannerStyles` div with `<ErrorBanner>` | 2, 6 |
| `src/pages/RoleBuilder.tsx` | Replaced `errorBannerStyles` div with `<ErrorBanner>` | 2 |
| `src/styles/shared.ts` | Removed dead `errorBannerStyles` export | 7 |
| `src/hooks/useFetch.ts` | Added JSDoc warning that `fetcher` must be wrapped in `useCallback` | 5 |
| `frontend-audit-implementation.md` | Added `useNightScript` to Deviations section | 4 |

## Remaining Concerns
- `useGameSetup` hook has no dedicated unit tests — complex cascade removal logic is only covered indirectly through page-level tests. Consider adding focused tests in a follow-up.
- `useFetch` infinite-loop risk remains if future callers forget `useCallback` — doc comment added but no runtime guard.

## Test Coverage Assessment
- Covered: AC4 (gameId guard), AC5 (Timer), AC13 (ErrorBanner 5 tests), AC18 (useFetch 6 tests)
- 12 new tests added (305 total, 0 regressions)
- Missing: No unit tests for `useGameSetup` hook (highest-value missing test coverage)

## Risk Summary
- `src/hooks/useGameSetup.ts` — Complex cascade role removal logic with no dedicated unit tests; verified only through page-level integration
- `src/hooks/useFetch.ts` — Infinite re-render risk if callers don't memoize `fetcher`; mitigated by doc comment
- `src/api/client.ts:3` — Empty string `API_URL` in production will cause all requests to fail; the console.error is correct behavior but could be more visible (e.g., thrown error at module load)
