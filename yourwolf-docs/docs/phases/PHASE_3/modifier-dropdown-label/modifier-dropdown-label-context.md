# Modifier Dropdown Label — Context

## Key Files

| File | Role |
|------|------|
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Primary file — modifier dropdown lives here (~lines 383–393) |
| `yourwolf-frontend/src/components/RoleBuilder/steps/ReviewStep.tsx` | Displays modifier in review summary (~lines 119–121) |
| `yourwolf-frontend/src/types/role.ts` | Defines `StepModifier` type — NOT to be changed |
| `yourwolf-frontend/src/styles/theme.ts` | Theme tokens (`textMuted`, spacing, font sizes) |
| `yourwolf-frontend/src/styles/shared.ts` | Shared `selectStyles` used by the dropdown |
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | Existing tests — need updates for new DOM structure |
| `yourwolf-frontend/src/test/mocks.ts` | `createMockDraft`, `createMockAbility` helpers |

## Existing Patterns

- **Inline styles**: All components use `React.CSSProperties` constants, not CSS modules or styled-components
- **Style naming**: Constants follow `camelCaseStyles` pattern (e.g., `stepItemStyles`, `paramLabelStyles`)
- **Theme usage**: Colors via `theme.colors.*`, spacing via `theme.spacing.*`
- **Labels**: Parameter inputs use `<label>` with `paramLabelStyles` — modifier label should use a similar muted style
- **Select styling**: All dropdowns use the shared `selectStyles` import

## Key Decisions

1. **Hide vs badge for first step**: The issue suggests either hiding the dropdown or showing "First action". Hiding is simpler and avoids adding a non-functional UI element. Plan uses hiding as the default approach.
2. **Label placement**: "Then:" label goes before the `<select>`, inline in the flex row — matches the existing layout flow.
3. **`MODIFIER_LABELS` location**: Defined in `AbilitiesStep.tsx` as a module-level const. Duplicated (or imported) in `ReviewStep.tsx`. A shared utility is overkill for a 4-entry map used in exactly 2 files.
4. **Option filtering**: For index > 0, the `'none'` option is excluded from the dropdown since it's not a valid user choice for chained steps.

## Constraints

- `StepModifier` type (`'none' | 'and' | 'or' | 'if'`) must not change — it's part of the API contract with the backend
- `handleModifierChange` must continue to receive raw values, not display labels
- The `<select>` `value` attribute must use raw modifier values for correct state binding
