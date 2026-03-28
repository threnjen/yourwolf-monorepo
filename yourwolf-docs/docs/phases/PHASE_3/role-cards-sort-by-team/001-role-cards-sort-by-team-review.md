# Review Record: Role Cards Sort by Team

## Summary
Implementation correctly addresses all requirements from Issue 001. The shared utility is clean, well-tested, and consistently applied across both pages. Two minor fixes applied during review: fallback color for unknown teams and extracting inline `groupRolesByTeam` call to a const. Approved with minor reservations about style duplication.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `yourwolf-frontend/src/utils/roleSort.ts` | `TEAM_ORDER`, `sortRolesByTeam`, `groupRolesByTeam` — matches spec |
| AC2 | Verified | `yourwolf-frontend/src/pages/Roles.tsx:67-97` | Groups roles by team with `<h2>` headers |
| AC3 | Verified | `yourwolf-frontend/src/pages/GameSetup.tsx:131-205` | Groups roles by team with `<h3>` headers |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `teamHeaderStyles` produces `color: undefined` for unknown teams | Medium | `Roles.tsx:33`, `GameSetup.tsx:81` | — | Fixed |
| 2 | `groupRolesByTeam(roles)` called inline in GameSetup JSX, recalculates every render | Low | `GameSetup.tsx:201` | AC3 | Fixed |
| 3 | Duplicate `teamHeaderStyles` / `teamSectionStyles` across two files | Low | `Roles.tsx:31-40`, `GameSetup.tsx:78-86` | — | Open |
| 4 | Inconsistent spacing: Roles uses `margin: 0` + `marginBottom: xl`; GameSetup uses `margin: md 0 sm` + `marginBottom: lg` | Low | `Roles.tsx:35,39`, `GameSetup.tsx:82,86` | — | Open |
| 5 | Font size differs: `1.4rem` (Roles) vs `1.2rem` (GameSetup) | Low | `Roles.tsx:33`, `GameSetup.tsx:79` | — | Wont-Fix |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/src/pages/Roles.tsx` | Added `?? theme.colors.textMuted` fallback to `TEAM_COLORS[team]` in `teamHeaderStyles` | 1 |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Added `?? theme.colors.textMuted` fallback to `TEAM_COLORS[team]` in `teamHeaderStyles` | 1 |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Extracted `groupRolesByTeam(roles)` to `const teamGroups` before return statement | 2 |

## Remaining Concerns
- Issue #3/#4: Style duplication across Roles.tsx and GameSetup.tsx — low severity, defer to a cleanup pass or when a third consumer appears
- Issue #5: Font size difference is intentional per heading hierarchy (`<h2>` in Roles vs `<h3>` in GameSetup)

## Test Coverage Assessment
- Covered: AC1 (10 unit tests), AC2 (3 integration tests), AC3 (2 integration tests + 3 existing tests updated)
- Missing: No test covers all 5 teams rendered simultaneously in GameSetup (minor gap)

## Risk Summary
- `sortRolesByTeam` relies on stable sort (ES2019 spec guarantee) — verified, safe for all modern browsers
- `TEAM_COLORS` lookup now has fallback for unknown teams — defensive against future team additions
- 3 existing GameSetup tests were refactored to use `data-role-id` selectors instead of heading text — slightly different test approach but functionally equivalent
