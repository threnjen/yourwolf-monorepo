# Issue 004: Ability Steps Missing Target/Parameter Selectors

**Source:** Phase 3 QA  
**Severity:** High  
**Area:** Frontend — Role Builder, AbilitiesStep

## Problem

When adding ability steps in the Role Builder, no parameter inputs (target selectors, direction pickers, etc.) are rendered. The user can only add an ability by name and set a modifier, but cannot configure the ability's required parameters. This affects all ability categories:

- **Card Actions:** `view_card`, `swap_card`, `take_card`, `flip_card` all require a `target` parameter
- **Information:** `view_awake`, `thumbs_up` require a `target` parameter
- **Physical:** `rotate_all` requires `direction`; `touch` requires `who` and `target`
- **State Changes:** `change_to_team` requires `team`

## Current Behavior

- `AbilitiesStep.tsx` adds steps with `parameters: {}` (empty object).
- The ability's `parameters_schema` (available from the `/api/abilities` endpoint) is fetched but never used to render parameter inputs.
- Each ability has a JSON Schema defining its required parameters (e.g., `target`, `direction`, `team`), but the wizard ignores them.

## Ability Parameter Schemas (from seed data)

| Ability | Required Parameters |
|---------|-------------------|
| `take_card` | `target` (string) |
| `swap_card` | `target_a` (string), `target_b` (string) |
| `view_card` | `target` (string), optional `count` (int) |
| `flip_card` | `target` (string) |
| `copy_role` | none |
| `view_awake` | `target` (string) |
| `thumbs_up` | `target` (string) |
| `explicit_no_view` | none |
| `rotate_all` | `direction` (enum: left/right), optional `count` (int) |
| `touch` | `who` (string), `target` (string), optional `location` (string) |
| `change_to_team` | `team` (enum: village/werewolf/vampire/alien/neutral) |
| `perform_as` | none |
| `perform_immediately` | none |
| `stop` | none |
| `random_num_players` | `options` (array of int) |

## Expected Behavior

When an ability step is added, the wizard should render appropriate parameter inputs based on the ability's `parameters_schema`:
- **`target` fields** — dropdown/select with options like "self", "other player", "center card", or a free-text input
- **`direction` fields** — toggle between "left" and "right"
- **`team` fields** — reuse the team selector component
- **`options` (array)** — number input or multi-select

Abilities with no required parameters (e.g., `copy_role`, `explicit_no_view`, `stop`) need no additional inputs.

## Affected Files

- `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` — main implementation
- `yourwolf-frontend/src/types/role.ts` — `AbilityStepDraft.parameters` already typed as `Record<string, unknown>`
- `yourwolf-frontend/src/hooks/useAbilities.ts` — already fetches abilities with `parameters_schema`

## Suggested Approach

1. When rendering each step in the step list, look up the ability's `parameters_schema` from the loaded abilities data.
2. For each required property in the schema, render an appropriate input (select, text input, toggle).
3. Store parameter values in `step.parameters`.
4. Define a standard set of target options (e.g., `"player.self"`, `"player.other"`, `"center.main"`) or allow free-text.
5. For enum-typed parameters, render a dropdown with the enum values.
