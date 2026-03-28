# Plan: Primary Team Role Toggle (Issue 002)

**Source:** `yourwolf-docs/docs/phases/PHASE_3/issues/002-basic-info-primary-team-role-toggle.md`
**Date:** 2026-03-28

---

## Requirements & Traceability

### Acceptance Criteria

| AC  | Requirement | Code Areas | Planned Tests |
|-----|------------|-----------|---------------|
| AC1 | `RoleDraft` type includes `is_primary_team_role: boolean` | `yourwolf-frontend/src/types/role.ts` | Compile-time (TypeScript) |
| AC2 | `RoleListItem` type includes `is_primary_team_role: boolean` (matches backend) | `yourwolf-frontend/src/types/role.ts` | Compile-time (TypeScript) |
| AC3 | `createEmptyDraft()` initializes `is_primary_team_role` to `false` | `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Existing `RoleBuilder.test.tsx` coverage |
| AC4 | Checkbox appears in `BasicInfoStep` when team is werewolf, vampire, or alien | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `test_toggle_visible_for_werewolf_vampire_alien` |
| AC5 | Checkbox is hidden when team is village or neutral | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `test_toggle_hidden_for_village_neutral` |
| AC6 | Changing team to village/neutral auto-clears `is_primary_team_role` to `false` | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | `test_auto_clear_on_team_change` |
| AC7 | `draftToPayload()` includes `is_primary_team_role` in API create payload | `yourwolf-frontend/src/api/roles.ts` | `test_payload_includes_field` |

### Non-Goals

- No backend changes — `RoleBase` schema and DB column already exist
- No backend validation changes — already enforced server-side
- No changes to `ReviewStep` display (separate concern, separate issue)
- No edit/update flow changes (wizard is create-only)
- No changes to role list/card display of this field (separate concern)

---

## Stage 1: Type & Data Layer

**Goal:** Add `is_primary_team_role` to frontend types, mock factory, draft factory, and API payload so the data flows end-to-end.

**Success Criteria:**
- TypeScript compiles with no errors
- `createEmptyDraft()` returns `is_primary_team_role: false`
- `draftToPayload()` includes `is_primary_team_role` in the POST body
- `createMockDraft()` includes `is_primary_team_role: false`

### Changes

#### `yourwolf-frontend/src/types/role.ts`

1. **`RoleDraft` interface** — Add `is_primary_team_role: boolean` field after `votes`.
2. **`RoleListItem` interface** — Add `is_primary_team_role: boolean` field (aligns with backend `RoleListItem` schema which already returns this field).

#### `yourwolf-frontend/src/pages/RoleBuilder.tsx`

3. **`createEmptyDraft()` function** — Add `is_primary_team_role: false` to the returned object, after `votes: 1`.

#### `yourwolf-frontend/src/api/roles.ts`

4. **`RoleCreatePayload` interface** — Add `is_primary_team_role: boolean` field.
5. **`draftToPayload()` function** — Map `draft.is_primary_team_role` into the payload object.

#### `yourwolf-frontend/src/test/mocks.ts`

6. **`createMockDraft()` function** — Add `is_primary_team_role: false` to the default return object.

---

## Stage 2: UI — Conditional Toggle

**Goal:** Render a checkbox in `BasicInfoStep` that allows setting `is_primary_team_role`, with conditional visibility and auto-clear behavior.

**Success Criteria:**
- Checkbox labeled "Primary team role" visible when `draft.team` is `'werewolf'`, `'vampire'`, or `'alien'`
- Checkbox hidden when `draft.team` is `'village'` or `'neutral'`
- Checking the box calls `onChange` with `is_primary_team_role: true`
- Switching team to village/neutral calls `onChange` with `is_primary_team_role: false`

### Changes

#### `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx`

7. **`handleTeamChange` function** — When the new team is `'village'` or `'neutral'`, spread the draft with both `team` and `is_primary_team_role: false`. Otherwise, spread with just `team`.

8. **New `handlePrimaryTeamRoleChange` function** — Accept a `boolean`, call `onChange({...draft, is_primary_team_role: checked})`.

9. **Conditional checkbox rendering** — After the team selector `<div>` and before the description field, conditionally render a checkbox when `draft.team` is not `'village'` and not `'neutral'`. Follow the existing checkbox pattern from `WinConditionsStep.tsx`:
   ```
   <label>
     <input type="checkbox" aria-label="Primary team role" ... />
     Primary team role
   </label>
   ```
   Include a help text `<div>` below: "Primary team roles are required when any role of this team is included in a game."

### Patterns to Follow

- **Checkbox pattern:** Match `WinConditionsStep.tsx` lines 121–135 — native `<input type="checkbox">` wrapped in `<label>`, using existing `labelStyles`.
- **Inline styles:** Project uses React `CSSProperties` objects, not CSS classes.
- **Handler naming:** `handleXChange` convention already used in this file.
- **Helper text:** Use `theme.colors.textMuted` and `fontSize: '0.8rem'` consistent with name status text styling.

---

## Stage 3: Tests

**Goal:** Add tests to `BasicInfoStep.test.tsx` covering toggle visibility, interaction, and auto-clear.

**Success Criteria:** All 5 new test cases pass.

### Test Cases

#### In `BasicInfoStep.test.tsx`, new `describe('primary team role toggle')` block:

| # | Test | Given | When | Then |
|---|------|-------|------|------|
| 1 | renders toggle for werewolf team | `draft.team = 'werewolf'` | rendered | checkbox "Primary team role" is in DOM |
| 2 | hides toggle for village team | `draft.team = 'village'` | rendered | checkbox "Primary team role" is NOT in DOM |
| 3 | hides toggle for neutral team | `draft.team = 'neutral'` | rendered | checkbox "Primary team role" is NOT in DOM |
| 4 | checking toggle calls onChange | `draft.team = 'werewolf'`, `is_primary_team_role = false` | click checkbox | `onChange` called with `is_primary_team_role: true` |
| 5 | switching to village clears flag | `draft.team = 'werewolf'`, `is_primary_team_role = true` | click Village button | `onChange` called with `team: 'village'` and `is_primary_team_role: false` |

### Mocks/Fixtures

- Use existing `createMockDraft()` with overrides (e.g., `createMockDraft({team: 'werewolf', is_primary_team_role: false})`)
- No additional mocks needed

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| Default state (team=village) | Toggle hidden, field is `false` |
| User selects werewolf team | Toggle appears, unchecked |
| User checks toggle, then switches to village | Toggle disappears, field resets to `false` |
| User checks toggle, then switches to neutral | Toggle disappears, field resets to `false` |
| User switches from werewolf to vampire | Toggle stays visible, checked state preserved |
| User switches from werewolf to alien | Toggle stays visible, checked state preserved |
| Draft submitted with village team | `is_primary_team_role: false` in API payload |
| Draft submitted with werewolf + primary checked | `is_primary_team_role: true` in API payload |

---

## Quality Checklist

- [x] All requirements restated as testable acceptance criteria
- [x] Non-goals explicitly defined
- [x] Traceability matrix complete (AC → code → tests)
- [x] Edge cases and error handling addressed
- [x] Existing patterns identified and followed (checkbox from WinConditionsStep, inline styles, handler naming)
- [x] Test plan covers all acceptance criteria
- [x] Test coverage prerequisite assessed — existing test suite is healthy (>50%)
- [x] Observability and operability considered — no changes needed (simple boolean field)
