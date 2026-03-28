# Context: Primary Team Role Toggle (Issue 002)

## Source Issue

`yourwolf-docs/docs/phases/PHASE_3/issues/002-basic-info-primary-team-role-toggle.md`

## Key Files

| File | Role | Notes |
|------|------|-------|
| `yourwolf-frontend/src/types/role.ts` | Type definitions | `RoleDraft` (line ~53) and `RoleListItem` (line ~96) need `is_primary_team_role` |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | UI component | Main change target — add conditional checkbox + auto-clear in `handleTeamChange` |
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Page component | `createEmptyDraft()` at line ~10 needs new field |
| `yourwolf-frontend/src/api/roles.ts` | API layer | `RoleCreatePayload` (line ~62) and `draftToPayload()` (line ~82) need new field |
| `yourwolf-frontend/src/test/mocks.ts` | Test helpers | `createMockDraft()` at line ~213 needs new field |
| `yourwolf-frontend/src/test/BasicInfoStep.test.tsx` | Tests | Add new `describe` block for primary team role toggle |
| `yourwolf-frontend/src/components/RoleBuilder/steps/WinConditionsStep.tsx` | Reference | Lines 121–135 show existing checkbox pattern to follow |

## Backend State (No Changes Needed)

- `yourwolf-backend/app/schemas/role.py` — `RoleBase.is_primary_team_role: bool = Field(default=False)` already exists (line ~81)
- `yourwolf-backend/app/schemas/role.py` — `RoleListItem.is_primary_team_role: bool = False` already exists (line ~190)
- DB migration `20260326_000000_add_is_primary_team_role_to_roles.py` already applied
- Seed data in `yourwolf-backend/app/seed/roles.py` already uses the field

## Key Decisions

1. **Auto-clear behavior**: When team changes to village/neutral, `is_primary_team_role` is forced to `false` in `handleTeamChange`. This prevents stale `true` values for teams that don't support the concept.

2. **Checkbox placement**: Immediately after the team selector row, before description. This groups related team information together.

3. **Checkbox pattern**: Use native `<input type="checkbox">` wrapped in `<label>`, matching `WinConditionsStep.tsx`. No custom toggle component needed.

4. **Helper text**: Brief explanation below the checkbox using muted text style, matching the name-status text styling pattern.

## Constraints

- Frontend only — no backend changes
- Must follow existing inline-style patterns (no CSS modules)
- Must follow existing `handleXChange` naming convention
- Checkbox `aria-label` must be "Primary team role" for test queryability
- Teams that show the toggle: `'werewolf'`, `'vampire'`, `'alien'`
- Teams that hide the toggle: `'village'`, `'neutral'`
