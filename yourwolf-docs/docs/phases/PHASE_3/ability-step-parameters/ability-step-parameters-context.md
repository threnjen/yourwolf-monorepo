# Context: Ability Step Parameter Inputs

**Issue:** 004 — Ability Steps Missing Target/Parameter Selectors  
**Date:** 2026-03-28

---

## Key Files

| File | Role |
|------|------|
| [AbilitiesStep.tsx](../../yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx) | Primary implementation target. Add `StepParameterInputs`, `STRING_TARGET_OPTIONS`, `handleParameterChange`, and update `handleAddAbility`. |
| [AbilitiesStep.test.tsx](../../yourwolf-frontend/src/test/AbilitiesStep.test.tsx) | Existing test file with 10+ cases. Add new `describe('parameter inputs')` block here. |
| [role.ts](../../yourwolf-frontend/src/types/role.ts) | `Ability.parameters_schema` typed as `Record<string, unknown>`. `AbilityStepDraft.parameters` typed as `Record<string, unknown>`. No type changes needed. |
| [useAbilities.ts](../../yourwolf-frontend/src/hooks/useAbilities.ts) | Already fetches full `Ability[]` including `parameters_schema`. No changes needed. |
| [mocks.ts](../../yourwolf-frontend/src/test/mocks.ts) | `createMockAbility` defaults `parameters_schema: {}`. No change to default needed; new tests pass schemas via overrides. |
| [shared.ts](../../yourwolf-frontend/src/styles/shared.ts) | `selectStyles` should be reused for all new `<select>` parameter inputs. |
| [theme.ts](../../yourwolf-frontend/src/styles/theme.ts) | Source of truth for spacing, colors, borderRadius. Use for any new style constants. |
| [abilities.py (seed)](../../yourwolf-backend/app/seed/abilities.py) | Defines the canonical `parameters_schema` for all 15 abilities. Reference for schema shapes. |
| [roles.py (seed)](../../yourwolf-backend/app/seed/roles.py) | Contains all real `parameters` values used by the 30 official roles. Source of truth for `STRING_TARGET_OPTIONS`. |

---

## Decisions Made

### 1. Free-text string params → predefined dropdown (not freeform input)
The user confirmed free-text `string` parameters should use a predefined `<select>`. This covers `target`, `target_a`, `target_b`, `who`, `location`.

**`STRING_TARGET_OPTIONS` (ordered by frequency in seed data):**
```
player.self
player.other
center.main
center.bonus
previous
viewed
team.werewolf
team.vampire
team.alien
team.village
role.mason
players.actions
```

Values sourced by grepping all `"parameters"` entries in `roles.py` seed data.

### 2. Integer params always shown, default to 1
`count` (on `view_card`, `rotate_all`) and `options` (on `random_num_players`) — `count` is always visible as a number input initialized to schema `default` or `1`. `options` is array-typed and handled separately.

### 3. `StepParameterInputs` is a private sub-component in `AbilitiesStep.tsx`
Not a separate file. Keep co-located until there's a clear reason to extract (i.e., another component needs it).

### 4. No new TypeScript types added
The `parameters_schema` is typed as `Record<string, unknown>` and the implementer will use local narrowing (type assertions) inside `StepParameterInputs` only.

---

## Schema Shape Reference

All abilities use this JSON Schema subset:

```json
{
  "type": "object",
  "properties": {
    "<paramKey>": {
      "type": "string" | "integer" | "array",
      "enum": ["val1", "val2"],     // only present on some string fields
      "items": { "type": "integer" }, // only present on array fields
      "default": <value>,            // only present on some fields
      "description": "<text>"
    }
  },
  "required": ["<paramKey>", ...]   // may be absent (means no required params)
}
```

**Abilities with no parameters (empty `properties`):**
`copy_role`, `explicit_no_view`, `perform_as`, `perform_immediately`, `stop`

**Abilities with string+enum params:**
- `rotate_all` → `direction` enum `[left, right]`
- `change_to_team` → `team` enum `[village, werewolf, vampire, alien, neutral]`

**Abilities with free-string params:**
`take_card`, `view_card`, `flip_card`, `view_awake`, `thumbs_up`, `swap_card`, `touch`

**Abilities with integer params:**
`view_card` (`count`, default 1), `rotate_all` (`count`, default 1)

**Abilities with array params:**
`random_num_players` (`options`, array of integer)

---

## Constraints

- No new npm dependencies
- No backend changes
- No changes to `Ability` or `AbilityStepDraft` TypeScript interfaces
- The `parameters_schema` from the API is the single source of truth — the component must not hard-code per-ability logic
- Style must follow existing inline object pattern using `theme` tokens

---

## Related Plans / Dependencies

No sibling plans. This feature is self-contained within the frontend Role Builder.
