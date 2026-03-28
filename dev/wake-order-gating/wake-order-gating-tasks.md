# Wake Order Gating — Tasks

## Stage 1: Frontend Wake Order UX & Ability Gating

### Source Changes

- [ ] **RoleBuilder.tsx** — In `createEmptyDraft()`, change `wake_order: null` → `wake_order: 0`
- [ ] **BasicInfoStep.tsx** — Change label from `"Wake Order"` to `"Wake Order (0–40)"`
- [ ] **BasicInfoStep.tsx** — Add conditional hint below wake order input: when `draft.wake_order === 0` (or `null`), render `"Does not wake up"` in muted style (match existing primary-team-role subtext pattern)
- [ ] **BasicInfoStep.tsx** — In `handleWakeOrderChange`, change empty-string behavior: `const parsed = value === '' ? 0 : parseInt(value, 10);` and `onChange({...draft, wake_order: isNaN(parsed) ? 0 : parsed})`
- [ ] **AbilitiesStep.tsx** — At the top of the render, check `draft.wake_order === 0 || draft.wake_order === null`. If true, render a gating banner: "This role does not wake up (Wake Order is 0). Set a Wake Order ≥ 1 in Basic Info to add abilities." and disable the ability palette (wrap in a div with `opacity: 0.5; pointer-events: none`)
- [ ] **AbilitiesStep.tsx** — If steps already exist AND wake_order is 0/null, show additional warning: "This role has ability steps but is set to not wake up. These steps won't execute unless you set a Wake Order ≥ 1."

### Test Changes

- [ ] **mocks.ts** — In `createMockDraft()`, change `wake_order: null` → `wake_order: 0`
- [ ] **useDrafts.test.ts** — Update any assertion that expects `wake_order: null` on a fresh draft → expect `0`
- [ ] **BasicInfoStep.test.tsx** — Add test: "renders wake order label with range hint" — assert label text contains "(0–40)"
- [ ] **BasicInfoStep.test.tsx** — Add test: "shows does-not-wake hint when wake_order is 0" — render with `createMockDraft({wake_order: 0})`, assert "Does not wake up" text visible
- [ ] **BasicInfoStep.test.tsx** — Add test: "hides does-not-wake hint when wake_order > 0" — render with `createMockDraft({wake_order: 5})`, assert "Does not wake up" not in DOM
- [ ] **Add AbilitiesStep disabled tests** — "shows gating message when wake_order is 0"; "palette is interactive when wake_order > 0"

### Validation

- [ ] Run `npm test` — all frontend tests pass
- [ ] Manual QA: navigate to `/roles/new`, confirm wake order defaults to 0 with hint
- [ ] Manual QA: set wake order to 5, go to Abilities step, confirm palette is interactive
- [ ] Manual QA: set wake order back to 0, go to Abilities step, confirm palette is disabled with message
