# Review Record: Primary Team Role Toggle

## Summary
Implementation correctly addresses all 7 acceptance criteria. The code is clean, consistent with existing patterns, and introduces no bugs. Three minor test coverage gaps were found and two were fixed during review. Approved.

## Verdict
Approved

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `src/types/role.ts:61` | `is_primary_team_role: boolean` in `RoleDraft` |
| AC2 | Verified | `src/types/role.ts:109` | `is_primary_team_role: boolean` in `RoleListItem` |
| AC3 | Verified | `src/pages/RoleBuilder.tsx:19` | `is_primary_team_role: false` in `createEmptyDraft()` |
| AC4 | Verified | `src/components/RoleBuilder/steps/BasicInfoStep.tsx:191` | Conditional render for non-village/non-neutral |
| AC5 | Verified | `src/components/RoleBuilder/steps/BasicInfoStep.tsx:191` | Same conditional hides for village/neutral |
| AC6 | Verified | `src/components/RoleBuilder/steps/BasicInfoStep.tsx:127-131` | `handleTeamChange` auto-clears for village/neutral |
| AC7 | Verified | `src/api/roles.ts:89` | `draftToPayload()` maps the field |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | No test for vampire/alien toggle visibility | Low | `src/test/BasicInfoStep.test.tsx:143` | AC4 | Fixed |
| 2 | No test for auto-clear on neutral switch | Low | `src/test/BasicInfoStep.test.tsx:168` | AC6 | Fixed |
| 3 | AC7 lacks runtime test for `draftToPayload` | Low | `src/api/roles.ts:84-91` | AC7 | Wont-Fix |
| 4 | Plan listed `test_payload_includes_field` but not implemented | Low | Plan AC table | AC7 | Wont-Fix |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `src/test/BasicInfoStep.test.tsx` | Replaced single werewolf visibility test with `it.each(['werewolf', 'vampire', 'alien'])` | 1 |
| `src/test/BasicInfoStep.test.tsx` | Added test: switching to neutral clears `is_primary_team_role` to false | 2 |

## Remaining Concerns
- Issue #3/#4: `draftToPayload()` has no runtime test — TypeScript's `RoleCreatePayload` interface makes omission a compile error, so the risk is minimal. If the interface is ever loosened to make `is_primary_team_role` optional, this could silently regress. Acceptable for now.

## Test Coverage Assessment
- Covered: AC1 (compile-time), AC2 (compile-time), AC3 (compile-time), AC4 (3 tests — werewolf, vampire, alien), AC5 (2 tests — village, neutral), AC6 (2 tests — village clear, neutral clear)
- Missing: AC7 runtime test (Wont-Fix — compile-time enforcement sufficient)

## Risk Summary
- Auto-clear logic in `handleTeamChange` is straightforward and now fully tested for both village and neutral paths
- Checkbox pattern matches existing `WinConditionsStep.tsx` exactly — no new UI patterns introduced
- All 4 mock factories updated consistently — no stale mock risk
- No backend changes required — field already exists in schema, migration, and seed data
