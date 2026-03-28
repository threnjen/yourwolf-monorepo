# Issue 006: Win Conditions "Primary" and "Overrides Team" Checkboxes Unclear

**Source:** Phase 3 QA  
**Severity:** Medium  
**Area:** Frontend — Role Builder, WinConditionsStep

## Problem

The "Primary" and "Overrides team" checkboxes on win conditions are presented as bare labels with no explanation. Users don't understand what these options mean or when to use them.

## Current Behavior

In `WinConditionsStep.tsx`, each win condition renders:

```tsx
<label style={labelStyles}>
  <input type="checkbox" ... />
  Primary
</label>

<label style={labelStyles}>
  <input type="checkbox" ... />
  Overrides team
</label>
```

No tooltips, help text, or descriptions are provided.

## Expected Behavior

Each option should include a brief inline description or tooltip:

- **Primary** — "This is the main win condition for this role. Only one win condition can be primary." 
- **Overrides team** — "This condition wins independently of the team's outcome (e.g., Tanner wins if they die, regardless of which team wins)."

## Affected Files

- `yourwolf-frontend/src/components/RoleBuilder/steps/WinConditionsStep.tsx`

## Suggested Approach

1. Add small help text below or beside each checkbox explaining its purpose.
2. Alternatively, use tooltip icons (ℹ️) that show the description on hover.
3. Consider renaming the labels for clarity:
   - "Primary" → "Primary win condition" with subtext "(Only one allowed per role)"
   - "Overrides team" → "Independent win" with subtext "(Wins regardless of team outcome)"
