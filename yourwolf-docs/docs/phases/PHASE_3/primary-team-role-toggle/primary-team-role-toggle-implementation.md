# Implementation Record: Primary Team Role Toggle

## Summary
Added `is_primary_team_role` boolean field to frontend types, data layer, and API payload, then implemented a conditional checkbox in `BasicInfoStep` that appears for werewolf/vampire/alien teams and auto-clears when switching to village/neutral. Five new tests cover visibility, interaction, and auto-clear behavior.

## Acceptance Criteria Status

| AC | Description | Status | Implementing Files | Notes |
|----|-------------|--------|--------------------|-------|
| AC1 | `RoleDraft` type includes `is_primary_team_role: boolean` | Done | `src/types/role.ts` | Added after `votes` |
| AC2 | `RoleListItem` type includes `is_primary_team_role: boolean` | Done | `src/types/role.ts` | Added after `max_count` |
| AC3 | `createEmptyDraft()` initializes `is_primary_team_role` to `false` | Done | `src/pages/RoleBuilder.tsx` | |
| AC4 | Checkbox appears when team is werewolf, vampire, or alien | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Conditional render |
| AC5 | Checkbox hidden when team is village or neutral | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Same conditional |
| AC6 | Changing team to village/neutral auto-clears to `false` | Done | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `handleTeamChange` |
| AC7 | `draftToPayload()` includes `is_primary_team_role` in API payload | Done | `src/api/roles.ts` | |

## Files Changed

### Source Files

| File | Change Type | What Changed | Why |
|------|-------------|--------------|-----|
| `src/types/role.ts` | Modified | Added `is_primary_team_role: boolean` to `RoleDraft` and `RoleListItem` | AC1, AC2 |
| `src/pages/RoleBuilder.tsx` | Modified | Added `is_primary_team_role: false` to `createEmptyDraft()` | AC3 |
| `src/api/roles.ts` | Modified | Added `is_primary_team_role` to `RoleCreatePayload` and `draftToPayload()` | AC7 |
| `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Modified | Updated `handleTeamChange` with auto-clear, added `handlePrimaryTeamRoleChange`, added conditional checkbox with helper text | AC4, AC5, AC6 |

### Test Files

| File | Change Type | What Changed | Covers |
|------|-------------|--------------|--------|
| `src/test/BasicInfoStep.test.tsx` | Modified | Added `describe('primary team role toggle')` with 5 test cases | AC4, AC5, AC6 |
| `src/test/mocks.ts` | Modified | Added `is_primary_team_role: false` to `createMockDraft()`, `createMockRole()`, `createMockRoles()`, `createMockOfficialRole()` | AC1, AC2 type compliance |
| `src/test/useDrafts.test.ts` | Modified | Added `is_primary_team_role: false` to inline `makeDraft()` | AC1 type compliance |

## Test Results
- **Baseline**: 258 passed, 0 failed (before implementation)
- **Final**: 263 passed, 0 failed (after implementation)
- **New tests added**: 5
- **Regressions**: None

## Deviations from Plan
None.

## Gaps
None.

## Reviewer Focus Areas
- Auto-clear logic in `BasicInfoStep.tsx` `handleTeamChange` — verify village and neutral both clear the flag
- Conditional rendering uses `draft.team !== 'village' && draft.team !== 'neutral'` — confirm this matches the team list
- `RoleListItem` mock objects across `mocks.ts` all needed the new field — three separate locations were updated
- `useDrafts.test.ts` had an inline `RoleDraft` literal that also needed the field
