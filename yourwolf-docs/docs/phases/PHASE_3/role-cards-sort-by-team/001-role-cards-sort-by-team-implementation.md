# Implementation Record: Role Cards Sort by Team

## Summary
Added team-based sorting and grouping of role cards on both the Roles page and GameSetup page. A shared utility defines canonical team ordering (Village → Werewolf → Vampire → Alien → Neutral) and groups roles into team sections with colored headers.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | Shared utility with canonical team ordering and sort/group functions | Done | `yourwolf-frontend/src/utils/roleSort.ts` | Exports `TEAM_ORDER`, `sortRolesByTeam`, `groupRolesByTeam` |
| AC2 | Roles.tsx groups roles by team with section headers | Done | `yourwolf-frontend/src/pages/Roles.tsx` | Uses `groupRolesByTeam` and renders `<h2>` team headers |
| AC3 | GameSetup.tsx groups roles by team with section headers | Done | `yourwolf-frontend/src/pages/GameSetup.tsx` | Uses `groupRolesByTeam` and renders `<h3>` team headers |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `yourwolf-frontend/src/utils/roleSort.ts` | Created | `TEAM_ORDER` constant, `sortRolesByTeam()` stable sort, `groupRolesByTeam()` grouping function | AC1: shared utility for consistent team ordering |
| `yourwolf-frontend/src/pages/Roles.tsx` | Modified | Replaced flat grid with team-grouped sections using `groupRolesByTeam`; added team header styles | AC2: roles page grouped by team |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Modified | Replaced flat grid with team-grouped sections using `groupRolesByTeam`; added team header styles | AC3: game setup page grouped by team |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `yourwolf-frontend/src/test/roleSort.test.ts` | Created | 10 tests covering TEAM_ORDER, sortRolesByTeam, groupRolesByTeam (empty, sort order, stability, immutability, unknown teams, grouping) | AC1 |
| `yourwolf-frontend/src/test/Roles.test.tsx` | Modified | Added 3 tests: team headers in canonical order, role cards under correct section, only headers for present teams | AC2 |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | Modified | Added 2 tests: team headers in canonical order, role cards under correct section. Fixed 3 existing tests that broke due to duplicate heading text from new team headers | AC3 |

## Test Results
- **Baseline**: 243 passed, 0 failed (27 test files)
- **Final**: 258 passed, 0 failed (28 test files)
- **New tests added**: 15
- **Regressions**: None

## Deviations from Plan
- Plan mentioned optional backend `sort` parameter — not implemented (frontend-only solution is sufficient and the plan marked it as optional)
- Used `<h2>` for team headers in `Roles.tsx` and `<h3>` in `GameSetup.tsx` to maintain heading hierarchy under each page's existing structure

## Gaps
None

## Reviewer Focus Areas
- Sort stability in `sortRolesByTeam` — uses spread + sort which relies on stable sort (guaranteed in modern engines)
- Team header color integration via existing `TEAM_COLORS` from theme
- Test fixes in `GameSetup.test.tsx` — 3 existing tests updated to scope queries to `[data-role-id]` containers to avoid ambiguity with team header headings
- Unknown team handling — roles with teams not in `TEAM_ORDER` sort to the end
