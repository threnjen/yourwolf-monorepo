# Context: Win Condition Labels UX Clarity

## Key Files

| File                                                                         | Role                          |
|------------------------------------------------------------------------------|-------------------------------|
| `yourwolf-frontend/src/components/RoleBuilder/steps/WinConditionsStep.tsx`   | Component to modify           |
| `yourwolf-frontend/src/test/WinConditionsStep.test.tsx`                      | Tests to extend               |
| `yourwolf-frontend/src/styles/theme.ts`                                      | Theme tokens (colors, spacing)|
| `yourwolf-frontend/src/test/mocks.ts`                                        | `createMockDraft` helper      |
| `yourwolf-frontend/src/types/role.ts`                                        | `WinConditionDraft` type      |

## Architecture & Patterns

- All RoleBuilder steps use inline `React.CSSProperties` objects referencing `theme` tokens
- No CSS modules, no utility classes, no component library
- Checkbox inputs use `aria-label` for accessibility
- Existing test suite uses Vitest + React Testing Library with `screen.getByRole` / `screen.getByText`

## Constraints

- Follow existing inline-styles-from-theme pattern — do not introduce CSS modules or styled-components
- Follow `AGENTS.md` TDD workflow: write/update tests first, then implement
- Keep the change minimal per `AGENTS.md` principles: no new shared components

## Decisions

- **Inline subtext over tooltips:** Tooltips require hover/focus interaction and a new component; subtext is simpler, always visible, and immediately comprehensible
- **Renamed labels over appended descriptions:** "Primary win condition" is clearer than "Primary" with only subtext doing the work; same for "Independent win" vs "Overrides team"
- **No shared HelpText component:** Only two instances; extracting a component adds indirection without value
