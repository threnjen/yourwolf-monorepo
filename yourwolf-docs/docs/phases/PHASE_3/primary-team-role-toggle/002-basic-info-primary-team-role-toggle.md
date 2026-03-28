# Issue 002: Missing "Primary Team Role" Toggle in Basic Info Step

**Source:** Phase 3 QA  
**Severity:** Medium  
**Area:** Frontend — Role Builder, BasicInfoStep

## Problem

For non-Village/non-Neutral teams (Werewolf, Vampire, Alien), roles can be designated as the "primary" role for that team (e.g., Werewolf is the primary Werewolf-team role). The backend schema (`RoleBase`) already has an `is_primary_team_role` boolean field, but the Role Builder wizard does not expose it.

## Current Behavior

- Backend `RoleBase` schema includes `is_primary_team_role: bool = Field(default=False)`.
- Backend `RoleListItem` includes `is_primary_team_role`.
- Frontend `RoleDraft` type in `types/role.ts` does **not** include `is_primary_team_role`.
- `BasicInfoStep.tsx` has no toggle for this field.
- The field is never sent when creating a role via the wizard.

## Expected Behavior

When the user selects a team other than Village or Neutral, a toggle/checkbox should appear asking "Is this the primary role for this team?" (with a brief explanation like "Primary team roles are required when any role of this team is included in a game").

The toggle should be hidden or disabled when team is Village or Neutral.

## Affected Files

- `yourwolf-frontend/src/types/role.ts` — add `is_primary_team_role` to `RoleDraft`
- `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` — add conditional toggle
- `yourwolf-frontend/src/pages/RoleBuilder.tsx` — include field in `createEmptyDraft()`
- `yourwolf-frontend/src/api/roles.ts` — ensure field is included in create payload

## Suggested Approach

1. Add `is_primary_team_role: boolean` to `RoleDraft` (default `false`).
2. In `BasicInfoStep`, conditionally render a checkbox below the Team selector when `draft.team` is not `'village'` or `'neutral'`.
3. Auto-clear the flag to `false` when team changes to Village or Neutral.
