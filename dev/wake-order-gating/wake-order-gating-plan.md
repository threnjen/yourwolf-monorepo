# Wake Order Gating — Plan

> Default wake order to 0 ("does not wake"), show label hint, gate ability step editing when wake order is 0.

## Stage 1: Frontend Wake Order UX & Ability Gating

**Goal**: Wake order defaults to 0, label shows range, hint explains 0, AbilitiesStep is disabled when wake order is 0.

**Success Criteria**: All 6 acceptance criteria pass; existing tests updated and green.

**Status**: Not Started

---

## A. Requirements & Traceability

### Acceptance Criteria

| AC  | Description |
|-----|-------------|
| AC1 | Empty draft defaults `wake_order` to `0` (not `null`) |
| AC2 | Wake Order label reads **"Wake Order (0–40)"** |
| AC3 | When `wake_order === 0`, a hint below the input reads "Does not wake up" |
| AC4 | AbilitiesStep shows a disabled state with message when `draft.wake_order === 0` — user cannot add ability steps |
| AC5 | When user changes wake order from 0 to ≥1, AbilitiesStep becomes fully interactive |
| AC6 | When user changes wake order from ≥1 back to 0, any previously-added ability steps remain in the draft (not silently deleted) but the palette is disabled with a warning |

### Non-Goals

- No backend changes — `wake_order: 0` is already valid per the schema (`ge=0, le=40`)
- No change to the "Next" button gating logic — wake order always has a value now, so the original issue ("can't proceed without wake order") is resolved by the default
- No change to backend validation — the existing warning "ability steps but no wake_order" fires on `null`, not on `0`; this is fine since the frontend prevents adding steps when `wake_order=0`

### Traceability Matrix

| AC  | Code Areas / Modules | Planned Tests |
|-----|---------------------|---------------|
| AC1 | `yourwolf-frontend/src/pages/RoleBuilder.tsx` — `createEmptyDraft()` | `test_ac1_default_wake_order` |
| AC2 | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` — label element | `test_ac2_label_range_hint` |
| AC3 | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` — hint element | `test_ac3_does_not_wake_hint`, `test_ac3_hint_hidden_nonzero` |
| AC4 | `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` — disabled overlay | `test_ac4_abilities_disabled_at_zero` |
| AC5 | `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` — enabled state | `test_ac5_abilities_enabled_nonzero` |
| AC6 | `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` — warning + preserve | `test_ac6_steps_preserved_warning` |

---

## B. Correctness & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User types "0" manually in wake order input | Treated same as default; hint shows "Does not wake up" |
| User clears the wake order input entirely | `handleWakeOrderChange('')` should set `0` (not `null`), since `0` is the new "empty" state |
| User has ability steps, then sets wake order back to 0 | Steps remain in draft; palette becomes disabled; warning banner displayed in AbilitiesStep |
| Draft restored from localStorage with `wake_order: null` | Legacy drafts work fine — `null` is still valid in the type; AbilitiesStep treats `null` and `0` the same (both = disabled) |
| Backend receives `wake_order: 0` | Valid — schema allows `ge=0, le=40` |

**Error handling**: No new error paths introduced. This is purely frontend display logic.

---

## C. Consistency & Architecture Fit

### Existing Patterns to Follow

- **Data-down pattern**: `AbilitiesStep` already receives `draft` as a prop; add conditional rendering based on `draft.wake_order`
- **Hint text style**: Matches existing pattern used for the "Primary team role" subtext in BasicInfoStep (small, muted text below input)
- **Disabled state**: Use `opacity: 0.5` + `pointer-events: none` on the palette container, matching `getPrimaryButtonStyles(disabled)` pattern in `Wizard.tsx`

### Deviations

- `createEmptyDraft()` changes default from `null` to `0` — this is intentional; `null` meant "not set" which confused users
- `handleWakeOrderChange('')` behavior changes from producing `null` to producing `0` — aligns with the new semantics

---

## D. Clean Design

- **3 files touched** (plus tests/mocks): `RoleBuilder.tsx`, `BasicInfoStep.tsx`, `AbilitiesStep.tsx`
- No new components, hooks, or abstractions
- No new state — `wake_order` is already in the draft object

### Keep It Clean Checklist

- [ ] No new props introduced on `AbilitiesStep` — reads `draft.wake_order` from existing prop
- [ ] No new hooks or context
- [ ] Hint text is inline, not a separate component
- [ ] Disabled overlay uses existing theme tokens

---

## E. Observability, Security, Operability

- **No backend changes** — no deploy considerations
- **No API calls affected** — wake_order=0 is already valid on all endpoints
- **No security implications**

---

## F. Test Plan

### Test Cases

| # | Test | AC | Given / When / Then |
|---|------|----|---------------------|
| 1 | Default wake order is 0 | AC1 | Given wizard loads / When `createEmptyDraft()` runs / Then `wake_order === 0` |
| 2 | Label shows range hint | AC2 | Given BasicInfoStep renders / When observed / Then label text includes "(0–40)" |
| 3 | Does-not-wake hint at 0 | AC3 | Given `wake_order === 0` / When BasicInfoStep renders / Then "Does not wake up" hint visible |
| 4 | Hint hidden when >0 | AC3 | Given `wake_order === 5` / When BasicInfoStep renders / Then "Does not wake up" hint not in DOM |
| 5 | Abilities disabled at 0 | AC4 | Given `wake_order === 0` / When AbilitiesStep renders / Then disabled message visible; ability buttons not clickable |
| 6 | Abilities enabled at >0 | AC5 | Given `wake_order === 3` / When AbilitiesStep renders / Then palette is fully interactive |

### Fixtures/Mocks to Update

- `createMockDraft()` in `src/test/mocks.ts`: change `wake_order: null` → `wake_order: 0`
- `useDrafts.test.ts`: update initial draft expectation from `wake_order: null` → `wake_order: 0`
