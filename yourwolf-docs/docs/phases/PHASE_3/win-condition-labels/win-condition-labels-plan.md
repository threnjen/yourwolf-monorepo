# Plan: Win Condition Labels UX Clarity

**Issue:** [006-win-conditions-ux-clarity.md](../issues/006-win-conditions-ux-clarity.md)
**Status:** Not Started

## Acceptance Criteria

| ID  | Criteria                                                                                  |
|-----|-------------------------------------------------------------------------------------------|
| AC1 | "Primary" checkbox label is renamed to "Primary win condition"                            |
| AC2 | Subtext "(Only one allowed per role)" appears near the Primary checkbox                   |
| AC3 | "Overrides team" checkbox label is renamed to "Independent win"                           |
| AC4 | Subtext "(Wins regardless of team outcome)" appears near the Independent win checkbox     |
| AC5 | Existing checkbox behavior is unchanged (toggling, primary exclusivity, overrides toggle) |

## Non-Goals

- No tooltip component or hover interaction — inline subtext only
- No shared/reusable help-text component (single usage, not justified)
- No changes to data model, API, or backend
- No changes to `ReviewStep` display of win conditions
- No changes to condition type dropdown or add/remove behavior

## Traceability

| Acceptance Criteria | Code Areas                        | Planned Tests                                  |
|---------------------|-----------------------------------|------------------------------------------------|
| AC1                 | `WinConditionsStep.tsx` label text | `test_ac1_primary_label`                       |
| AC2                 | `WinConditionsStep.tsx` subtext    | `test_ac2_primary_subtext`                     |
| AC3                 | `WinConditionsStep.tsx` label text | `test_ac3_overrides_label`                     |
| AC4                 | `WinConditionsStep.tsx` subtext    | `test_ac4_overrides_subtext`                   |
| AC5                 | No changes needed                 | Existing tests in `WinConditionsStep.test.tsx` |

## Design

### Approach: Inline Subtext Below Labels

Each checkbox gets a wrapper that stacks the label and a small muted subtext line vertically. This is the simplest approach that solves the problem.

### Style Changes in `WinConditionsStep.tsx`

- Add a `checkboxGroupStyles` constant: vertical flex container wrapping each checkbox label + subtext
- Add a `subtextStyles` constant: `theme.colors.textMuted`, `fontSize: '0.75rem'`, no pointer cursor
- Modify `labelStyles` to keep horizontal alignment for the checkbox + label text row
- The outer `conditionItemStyles` flex row remains unchanged

### Label & Aria Changes

- "Primary" → "Primary win condition", `aria-label` updated to match
- "Overrides team" → "Independent win", `aria-label` updated to match

### Backward Compatibility

- Existing test queries use `/primary/i` regex which matches "Primary win condition" — no breakage
- "Overrides team" checkbox is not queried by aria-label in existing tests — safe to rename

## Edge Cases

- None specific to this change — purely presentational labels and subtext

## Stage 1: Update Labels and Add Subtext

**Goal:** Rename checkbox labels and add descriptive subtext to both win condition checkboxes.

**Success Criteria:**
- "Primary win condition" label visible with "(Only one allowed per role)" subtext
- "Independent win" label visible with "(Wins regardless of team outcome)" subtext
- All existing tests pass unchanged
- New tests verify label text and subtext presence

**Files to modify:**
- `yourwolf-frontend/src/components/RoleBuilder/steps/WinConditionsStep.tsx`
- `yourwolf-frontend/src/test/WinConditionsStep.test.tsx`
