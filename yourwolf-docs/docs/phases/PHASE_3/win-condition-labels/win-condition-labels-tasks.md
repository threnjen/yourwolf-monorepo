# Tasks: Win Condition Labels UX Clarity

## Stage 1: Update Labels and Add Subtext

### Tests (write/update first)

- [ ] Add test: renders "Primary win condition" label text when a condition exists
- [ ] Add test: renders "(Only one allowed per role)" subtext when a condition exists
- [ ] Add test: renders "Independent win" label text when a condition exists
- [ ] Add test: renders "(Wins regardless of team outcome)" subtext when a condition exists
- [ ] Verify all existing tests still pass (primary toggle, add/remove, type change)

### Implementation

- [ ] In `WinConditionsStep.tsx`, add `checkboxGroupStyles` constant (vertical flex wrapper)
- [ ] In `WinConditionsStep.tsx`, add `subtextStyles` constant (`theme.colors.textMuted`, `0.75rem`)
- [ ] Rename "Primary" label to "Primary win condition" and update `aria-label`
- [ ] Add `<span style={subtextStyles}>(Only one allowed per role)</span>` below Primary label
- [ ] Rename "Overrides team" label to "Independent win" and update `aria-label`
- [ ] Add `<span style={subtextStyles}>(Wins regardless of team outcome)</span>` below Independent win label
- [ ] Wrap each checkbox label + subtext in a `<div style={checkboxGroupStyles}>` container

### Verification

- [ ] Run test suite — all tests green
- [ ] Manual visual check: labels and subtext render correctly in the Role Builder
